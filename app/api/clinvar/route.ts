import { type NextRequest, NextResponse } from "next/server"

// Rate limiting for NCBI API (max 3 requests per second)
let lastNcbiRequestTime = 0
const NCBI_MIN_INTERVAL = 350 // milliseconds between requests

// Retry utility with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  retryDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add rate limiting for NCBI API
      const now = Date.now()
      const timeSinceLastRequest = now - lastNcbiRequestTime
      if (timeSinceLastRequest < NCBI_MIN_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, NCBI_MIN_INTERVAL - timeSinceLastRequest))
      }
      lastNcbiRequestTime = Date.now()
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        // Handle rate limiting (429) with retry
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : retryDelay * Math.pow(2, attempt)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          }
        }
        
        // Handle server errors (5xx) with retry
        if (response.status >= 500 && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
          continue
        }
        
        return response
      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        // Retry on network errors (TypeError is common for fetch failures)
        const isNetworkError = 
          fetchError instanceof TypeError ||
          (fetchError instanceof Error && (
            fetchError.message.includes('Failed to fetch') ||
            fetchError.message.includes('NetworkError') ||
            fetchError.message.includes('Network request failed') ||
            fetchError.name === 'AbortError' ||
            fetchError.name === 'TypeError'
          ))
        
        if (isNetworkError && attempt < maxRetries) {
          lastError = fetchError as Error
          // Log retry attempt for debugging
          console.debug(`Retrying fetch (attempt ${attempt + 1}/${maxRetries + 1}): ${url}`)
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
          continue
        }
        
        // If we've exhausted retries or it's not a retryable error, throw
        throw fetchError
      }
    } catch (error) {
      lastError = error as Error
      if (attempt === maxRetries) {
        throw error
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch after retries')
}

interface ClinVarSearchResponse {
  esearchresult?: {
    idlist?: string[]
  }
}

interface ClinVarVariantInfo {
  title: string
  obj_type?: string
  germline_classification?: { description?: string }
  gene_sort?: string
  location_sort?: string
}

interface ClinVarSummaryResponse {
  result?: {
    uids?: string[]
  } & Record<string, ClinVarVariantInfo>
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const chrom = searchParams.get("chrom")
  const minBound = searchParams.get("minBound")
  const maxBound = searchParams.get("maxBound")
  const genomeId = searchParams.get("genomeId")

  if (!chrom || !minBound || !maxBound || !genomeId) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    )
  }

  const chromFormatted = chrom.replace(/^chr/i, "")
  const positionField = genomeId === "hg19" ? "chrpos37" : "chrpos38"
  const searchTerm = `${chromFormatted}[chromosome] AND ${minBound}:${maxBound}[${positionField}]`

  try {
    // Step 1: Search for variant IDs
    const searchUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    const searchParamsObj = new URLSearchParams({
      db: "clinvar",
      term: searchTerm,
      retmode: "json",
      retmax: "20",
    })

    const searchResponse = await fetchWithRetry(`${searchUrl}?${searchParamsObj.toString()}`, {}, 3, 1000)

    if (!searchResponse.ok) {
      if (searchResponse.status === 429) {
        return NextResponse.json(
          { error: "Too Many Requests. Please wait a moment and try again." },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: `ClinVar search failed: ${searchResponse.statusText}` },
        { status: searchResponse.status }
      )
    }

    const searchData = (await searchResponse.json()) as ClinVarSearchResponse

    if (
      !searchData.esearchresult?.idlist ||
      searchData.esearchresult.idlist.length === 0
    ) {
      return NextResponse.json({ variants: [] })
    }

    const variantIds = searchData.esearchresult.idlist

    // Step 2: Fetch variant details
    const summaryUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    const summaryParams = new URLSearchParams({
      db: "clinvar",
      id: variantIds.join(","),
      retmode: "json",
    })

    const summaryResponse = await fetchWithRetry(`${summaryUrl}?${summaryParams.toString()}`, {}, 3, 1000)

    if (!summaryResponse.ok) {
      if (summaryResponse.status === 429) {
        return NextResponse.json(
          { error: "Too Many Requests. Please wait a moment and try again." },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: `Failed to fetch variant details: ${summaryResponse.statusText}` },
        { status: summaryResponse.status }
      )
    }

    const summaryData = (await summaryResponse.json()) as ClinVarSummaryResponse

    const variants = []

    if (summaryData.result?.uids) {
      for (const id of summaryData.result.uids) {
        const variant = summaryData.result[id]
        if (!variant) continue
        variants.push({
          clinvar_id: id,
          title: variant.title,
          variation_type: (variant.obj_type ?? "Unknown")
            .split(" ")
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" "),
          classification:
            variant.germline_classification?.description ?? "Unknown",
          gene_sort: variant.gene_sort ?? "",
          chromosome: chromFormatted,
          location: variant.location_sort
            ? parseInt(variant.location_sort).toLocaleString()
            : "Unknown",
        })
      }
    }

    return NextResponse.json({ variants })
  } catch (error) {
    console.error("ClinVar API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

