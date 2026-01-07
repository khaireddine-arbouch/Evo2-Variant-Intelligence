// API utilities for Evo2 Variant Intelligence
// Connects to deployed API and external services (UCSC, NCBI)

// Rate limiting for NCBI API (max 3 requests per second)
let lastNcbiRequestTime = 0
const NCBI_MIN_INTERVAL = 350 // milliseconds between requests (allows ~3/sec)

// Retry utility with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  retryDelay = 1000
): Promise<Response> {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/61df093b-06c4-4c0b-b2c8-3d6c69d812ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:9',message:'fetchWithRetry entry',data:{url,hasSignal:!!options.signal,maxRetries,retryDelay},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/61df093b-06c4-4c0b-b2c8-3d6c69d812ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:18',message:'fetchWithRetry attempt start',data:{attempt,maxRetries,url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // For NCBI API calls, add rate limiting
      if (url.includes('eutils.ncbi.nlm.nih.gov') || url.includes('clinicaltables.nlm.nih.gov')) {
        const now = Date.now()
        const timeSinceLastRequest = now - lastNcbiRequestTime
        if (timeSinceLastRequest < NCBI_MIN_INTERVAL) {
          await new Promise(resolve => setTimeout(resolve, NCBI_MIN_INTERVAL - timeSinceLastRequest))
        }
        lastNcbiRequestTime = Date.now()
      }
      
      // Only create our own controller if one isn't provided
      let controller: AbortController | null = null
      let timeoutId: NodeJS.Timeout | null = null
      
      if (!options.signal) {
        controller = new AbortController()
        timeoutId = setTimeout(() => controller!.abort(), 15000) // 15 second timeout
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/61df093b-06c4-4c0b-b2c8-3d6c69d812ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:35',message:'AbortController created',data:{hasController:!!controller,hasTimeout:!!timeoutId,timeoutMs:15000},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/61df093b-06c4-4c0b-b2c8-3d6c69d812ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:37',message:'Using provided signal',data:{signalAborted:options.signal?.aborted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
      
      try {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/61df093b-06c4-4c0b-b2c8-3d6c69d812ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:39',message:'Before fetch call',data:{url,attempt,hasSignal:!!(options.signal || controller?.signal),signalAborted:options.signal?.aborted || controller?.signal?.aborted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Wrap fetch to catch errors immediately and prevent browser console logging
        // for errors that will be retried
        const fetchPromise = fetch(url, {
          ...options,
          signal: options.signal || controller?.signal,
        })
        // Add immediate catch to prevent unhandled rejection logging
        // The error will be properly handled in the outer catch block
        fetchPromise.catch(() => {
          // Silently catch to prevent browser console logging
          // The error will be handled in the outer catch block
        })
        const response = await fetchPromise
        
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/61df093b-06c4-4c0b-b2c8-3d6c69d812ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:44',message:'Fetch succeeded',data:{url,status:response.status,statusText:response.statusText,ok:response.ok,attempt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
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
        // #region agent log
        const errorDetails = fetchError instanceof Error ? {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack?.substring(0, 200)
        } : { type: typeof fetchError, value: String(fetchError) };
        fetch('http://127.0.0.1:7245/ingest/61df093b-06c4-4c0b-b2c8-3d6c69d812ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:66',message:'Fetch error caught',data:{url,attempt,errorDetails,hasTimeout:!!timeoutId,controllerAborted:controller?.signal?.aborted,providedSignalAborted:options.signal?.aborted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        // Don't retry on abort errors if it's a user-initiated abort
        if (fetchError instanceof Error && fetchError.name === 'AbortError' && options.signal?.aborted) {
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/61df093b-06c4-4c0b-b2c8-3d6c69d812ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:72',message:'User-initiated abort, throwing',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          throw fetchError
        }
        
        // Retry on network errors (TypeError is common for fetch failures)
        // Check if it's a network-related error that we should retry
        const isNetworkError = 
          fetchError instanceof TypeError ||
          (fetchError instanceof Error && (
            fetchError.message.includes('Failed to fetch') ||
            fetchError.message.includes('NetworkError') ||
            fetchError.message.includes('Network request failed') ||
            fetchError.name === 'AbortError' ||
            fetchError.name === 'TypeError'
          ))
        
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/61df093b-06c4-4c0b-b2c8-3d6c69d812ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:87',message:'Network error check',data:{url,attempt,isNetworkError,willRetry:isNetworkError && attempt < maxRetries,errorName:fetchError instanceof Error ? fetchError.name : 'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        if (isNetworkError && attempt < maxRetries) {
          lastError = fetchError as Error
          // Suppress console error for retried network failures
          // The error will be retried, so we don't want to log it to console
          // Only log in development mode for debugging
          if (process.env.NODE_ENV === 'development') {
            console.debug(`Retrying fetch (attempt ${attempt + 1}/${maxRetries + 1}): ${url}`)
          }
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
          continue
        }
        
        // If we've exhausted retries or it's not a retryable error, throw
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/61df093b-06c4-4c0b-b2c8-3d6c69d812ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:96',message:'Throwing fetch error',data:{url,attempt,maxRetries,isNetworkError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        throw fetchError
      }
    } catch (error) {
      lastError = error as Error
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/61df093b-06c4-4c0b-b2c8-3d6c69d812ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:99',message:'Outer catch block',data:{url,attempt,maxRetries,isLastAttempt:attempt === maxRetries},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (attempt === maxRetries) {
        throw error
      }
    }
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/61df093b-06c4-4c0b-b2c8-3d6c69d812ea',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api.ts:106',message:'All retries exhausted',data:{url,lastError:lastError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  throw lastError || new Error('Failed to fetch after retries')
}

export interface GenomeAssembly {
  id: string
  name: string
  sourceName: string
  active: boolean
  organism?: string
  description?: string
  scientificName?: string
}

export interface Chromosome {
  chrom: string
  size: number
}

export interface Gene {
  id: string
  symbol: string
  name: string
  chromosome: string
  start: number
  end: number
  strand: "+" | "-"
  description?: string
  organism?: {
    scientificName: string
    commonName: string
  }
  summary?: string
  ncbiGeneId?: string
}

export interface SequenceData {
  sequence: string
  start: number
  end: number
  chromosome: string
}

export type MutationType = "SNV" | "DELETION" | "INSERTION" | "DUPLICATION" | "MICROSATELLITE" | "INDEL" | "INVERSION" | "TRANSLOCATION"

export interface VariantAnalysisResult {
  position: number
  chromosome: string
  reference: string
  alternative: string
  delta_score: number
  prediction: string
  classification_confidence: number
  pathogenicity_probability?: number  // Raw probability estimate (0-1)
  geneSymbol?: string
  mutation_type?: MutationType
}

export interface ClinVarVariant {
  id: string
  title: string
  variationType: string
  clinicalSignificance: string
  chromosome: string
  position: number
  referenceAllele?: string
  alternateAllele?: string
  evo2Result?: VariantAnalysisResult
}

// Get deployed API base URL from environment
const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // Access environment variable from Next.js
    const envUrl = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL ||
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL)
    if (envUrl) return envUrl
  }
  // Fallback to relative path for Next.js API routes
  return ""
}

// UCSC API: Get available genomes
export async function getAvailableGenomes(): Promise<{ genomes: Record<string, GenomeAssembly[]> }> {
  try {
    const apiUrl = "https://api.genome.ucsc.edu/list/ucscGenomes"
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error("Failed to fetch genome list from UCSC API")
    }

    const genomeData = (await response.json()) as {
      ucscGenomes?: Record<
        string,
        {
          organism?: string
          description?: string
          sourceName?: string
          active?: boolean
        }
      >
    }

    if (!genomeData.ucscGenomes) {
      throw new Error("UCSC API error: missing ucscGenomes")
    }

    const genomes = genomeData.ucscGenomes
    const structuredGenomes: Record<string, GenomeAssembly[]> = {}

    for (const genomeId in genomes) {
      const genomeInfo = genomes[genomeId]
      if (!genomeInfo) continue
      const organism = genomeInfo.organism ?? "Other"

      structuredGenomes[organism] ??= []
      structuredGenomes[organism].push({
        id: genomeId,
        name: genomeInfo.description ?? genomeId,
        sourceName: genomeInfo.sourceName ?? genomeId,
        active: !!genomeInfo.active,
        organism,
        description: genomeInfo.description,
      })
    }

    return { genomes: structuredGenomes }
  } catch (error) {
    console.error("Error fetching genomes:", error)
    throw error
  }
}

// UCSC API: Get chromosomes for a genome
export async function getGenomeChromosomes(genomeId: string): Promise<{ chromosomes: Chromosome[] }> {
  try {
    const apiUrl = `https://api.genome.ucsc.edu/list/chromosomes?genome=${genomeId}`
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error("Failed to fetch chromosome list from UCSC API")
    }

    const chromosomeData = (await response.json()) as {
      chromosomes?: Record<string, number>
    }

    if (!chromosomeData.chromosomes) {
      throw new Error("UCSC API error: missing chromosomes")
    }

    const chromosomes: Chromosome[] = []
    for (const chromId in chromosomeData.chromosomes) {
      // Filter out unplaced, random, and alt contigs
      if (chromId.includes("_") || chromId.includes("Un") || chromId.includes("random")) continue
      chromosomes.push({
        chrom: chromId,
        size: chromosomeData.chromosomes[chromId] ?? 0,
      })
    }

    // Sort: chr1, chr2, ... chrX, chrY
    chromosomes.sort((a, b) => {
      const anum = a.chrom.replace("chr", "")
      const bnum = b.chrom.replace("chr", "")
      const isNumA = /^\d+$/.test(anum)
      const isNumB = /^\d+$/.test(bnum)
      if (isNumA && isNumB) return Number(anum) - Number(bnum)
      if (isNumA) return -1
      if (isNumB) return 1
      return anum.localeCompare(bnum)
    })

    return { chromosomes }
  } catch (error) {
    console.error("Error fetching chromosomes:", error)
    throw error
  }
}

// NCBI API: Search for genes
export async function searchGenes(
  query: string,
  genome: string,
): Promise<{ query: string; genome: string; results: Gene[] }> {
  try {
    const url = "https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search"
    const params = new URLSearchParams({
      terms: query,
      df: "chromosome,Symbol,description,map_location,type_of_gene",
      ef: "chromosome,Symbol,description,map_location,type_of_gene,GenomicInfo,GeneID",
    })
    
    const response = await fetchWithRetry(`${url}?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    }, 3, 1000) // 3 retries with 1s initial delay
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Too many requests. Please wait a moment and try again.")
      }
      throw new Error(`NCBI API Error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as [
      number,
      unknown,
      { GeneID?: string[] },
      string[][],
    ]

    const results: Gene[] = []

    if (data[0] > 0) {
      const fieldMap = data[2]
      const geneIds = fieldMap.GeneID ?? []
      for (let i = 0; i < Math.min(50, data[0]); ++i) {
        if (i < data[3].length) {
          try {
            const display = data[3][i]
            if (!display) continue
            let chrom = display[0] ?? ""
            if (chrom && !chrom.startsWith("chr")) {
              chrom = `chr${chrom}`
            }

            const geneId = geneIds[i] ?? ""
            let start: number | undefined = undefined
            let end: number | undefined = undefined
            let strand: "+" | "-" = "+"
            let summary: string | undefined = undefined
            let organism: { scientificName: string; commonName: string } | undefined = undefined

            // Try to get genomic info if available (non-blocking, fails gracefully)
            if (geneId) {
              try {
                const detailUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`
                
                let detailsResponse: Response | null = null
                try {
                  // Use retry utility with fewer retries for optional data
                  detailsResponse = await fetchWithRetry(detailUrl, {
                    headers: {
                      'Accept': 'application/json',
                    },
                  }, 2, 500) // 2 retries with 500ms initial delay for optional data
                } catch (err) {
                  // Silently handle fetch errors (CORS, network, timeout)
                  // Continue without genomic info - don't skip the gene
                  detailsResponse = null
                }
                
                if (detailsResponse && detailsResponse.ok) {
                  try {
                    const detailData = (await detailsResponse.json()) as {
                      result?: Record<
                        string,
                        {
                          genomicinfo?: { chrstart: number; chrstop: number; strand?: string }[]
                          summary?: string
                          organism?: { scientificname: string; commonname: string }
                        }
                      >
                    }
                    
                    const geneDetail = detailData?.result?.[geneId]
                    if (geneDetail) {
                      // Extract summary
                      if (geneDetail.summary) {
                        summary = geneDetail.summary
                      }
                      
                      // Extract organism info
                      if (geneDetail.organism) {
                        organism = {
                          scientificName: geneDetail.organism.scientificname || "",
                          commonName: geneDetail.organism.commonname || "",
                        }
                      }
                      
                      // Extract genomic coordinates
                      if (geneDetail.genomicinfo?.[0]) {
                        const info = geneDetail.genomicinfo[0]
                        if (info.chrstart && info.chrstop && info.chrstart > 0 && info.chrstop > 0) {
                          start = Math.min(info.chrstart, info.chrstop)
                          end = Math.max(info.chrstart, info.chrstop)
                          strand = info.strand === "-" ? "-" : "+"
                        }
                      }
                    }
                  } catch (parseError) {
                    // JSON parse error - continue without genomic info
                    // Don't skip the gene, just continue without detailed info
                  }
                }
              } catch (error) {
                // Silently continue without genomic info - this is optional data
                // The gene search will still work with basic info from the search API
                // Don't log CORS/network errors as they're expected in browser environments
                if (error instanceof Error && !error.name.includes('AbortError')) {
                  console.debug(`Could not fetch detailed info for gene ${geneId}: ${error.message}`)
                }
              }
            }

            // Add gene - we'll handle invalid coordinates in the UI
            // Use placeholder coordinates if missing, but mark them as invalid
            const hasValidCoords = start !== undefined && end !== undefined && start > 0 && end > start
            
            results.push({
              id: geneId || `gene-${i}`,
              symbol: display[2] ?? "",
              name: display[3] ?? "",
              chromosome: chrom,
              start: hasValidCoords ? start! : 1, // Use 1 instead of 0 to avoid -1,0 error
              end: hasValidCoords ? end! : 2, // Use 2 to ensure end > start
              strand,
              description: display[3] ?? "", // This is the gene name from search results
              summary, // This is the detailed summary from NCBI
              organism, // Organism info from NCBI
              ncbiGeneId: geneId,
              _hasValidCoordinates: hasValidCoords,
            } as Gene)
          } catch {
            continue
          }
        }
      }
    }

    return { query, genome, results }
  } catch (error) {
    console.error("Error searching genes:", error)
    // Provide more helpful error message
    if (error instanceof Error) {
      if (error.message.includes('Too many requests')) {
        throw new Error("Too many requests. Please wait a moment and try again.")
      }
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        throw new Error("Request timed out. Please try again.")
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error("Network error. Please check your internet connection and try again.")
      }
    }
    throw error
  }
}

// UCSC API: Fetch gene sequence
export async function fetchGeneDetails(geneId: string): Promise<{
  summary?: string
  organism?: { scientificName: string; commonName: string }
  start?: number
  end?: number
  strand?: "+" | "-"
}> {
  try {
    const detailUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`
    
    try {
      const response = await fetchWithRetry(detailUrl, {
        headers: {
          'Accept': 'application/json',
        },
      }, 2, 500) // 2 retries for optional data
      
      if (!response.ok) {
        return {}
      }
      
      const detailData = (await response.json()) as {
        result?: Record<
          string,
          {
            genomicinfo?: { chrstart: number; chrstop: number; strand?: string }[]
            summary?: string
            organism?: { scientificname: string; commonname: string }
          }
        >
      }
      
      const geneDetail = detailData?.result?.[geneId]
      if (!geneDetail) {
        return {}
      }
      
      const result: {
        summary?: string
        organism?: { scientificName: string; commonName: string }
        start?: number
        end?: number
        strand?: "+" | "-"
      } = {}
      
      if (geneDetail.summary) {
        result.summary = geneDetail.summary
      }
      
      if (geneDetail.organism) {
        result.organism = {
          scientificName: geneDetail.organism.scientificname || "",
          commonName: geneDetail.organism.commonname || "",
        }
      }
      
      if (geneDetail.genomicinfo?.[0]) {
        const info = geneDetail.genomicinfo[0]
        if (info.chrstart && info.chrstop && info.chrstart > 0 && info.chrstop > 0) {
          result.start = Math.min(info.chrstart, info.chrstop)
          result.end = Math.max(info.chrstart, info.chrstop)
          result.strand = info.strand === "-" ? "-" : "+"
        }
      }
      
      return result
    } catch (err) {
      // Silently fail for optional data
      return {}
    }
  } catch (error) {
    return {}
  }
}

export async function fetchGeneSequence(
  chrom: string,
  start: number,
  end: number,
  genomeId: string,
): Promise<{ sequence: string; actualRange: { start: number; end: number }; error?: string }> {
  try {
    const chromosome = chrom.startsWith("chr") ? chrom : `chr${chrom}`
    const apiStart = start - 1
    const apiEnd = end

    const apiUrl = `https://api.genome.ucsc.edu/getData/sequence?genome=${genomeId};chrom=${chromosome};start=${apiStart};end=${apiEnd}`
    const response = await fetch(apiUrl)
    const data = (await response.json()) as { dna?: string; error?: string }

    const actualRange = { start, end }

    if (data.error || !data.dna) {
      return { sequence: "", actualRange, error: data.error }
    }

    const sequence = data.dna.toUpperCase()
    return { sequence, actualRange }
  } catch (error) {
    console.error("Error fetching sequence:", error)
    return {
      sequence: "",
      actualRange: { start, end },
      error: "Internal error in fetch gene sequence",
    }
  }
}

// Deployed API: Analyze variant with Evo2
export async function analyzeVariant(params: {
  position: number
  alternative: string
  genomeId: string
  chromosome: string
  reference?: string
  mutationType?: MutationType
}): Promise<VariantAnalysisResult> {
  try {
    // Always use Next.js API route (like frontend does) - it handles the Modal API call server-side
    // For DELETION, alternative can be empty string - ensure it's included in query params
    const queryParams = new URLSearchParams({
      variant_position: params.position.toString(),
      genome: params.genomeId,
      chromosome: params.chromosome,
    })

    // Always include alternative, even if empty (for DELETION)
    queryParams.append("alternative", params.alternative || "")

    if (params.reference) {
      queryParams.append("reference", params.reference)
    }

    if (params.mutationType) {
      queryParams.append("mutation_type", params.mutationType)
    }

    const url = `/api/analyze?${queryParams.toString()}`

    const response = await fetch(url, {
      method: "POST",
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(errorData.error ?? `Analysis failed: ${response.statusText}`)
    }

    const data = (await response.json()) as {
      position: number
      reference: string
      alternative: string
      delta_score: number
      prediction: string
      classification_confidence: number
      pathogenicity_probability?: number
      mutation_type?: MutationType
    }

    return {
      position: data.position,
      chromosome: params.chromosome,
      reference: data.reference,
      alternative: data.alternative,
      delta_score: data.delta_score,
      prediction: data.prediction,
      classification_confidence: data.classification_confidence,
      pathogenicity_probability: data.pathogenicity_probability,
      geneSymbol: undefined,
      mutation_type: data.mutation_type,
    }
  } catch (error) {
    console.error("Error analyzing variant:", error)
    throw error
  }
}

// Fetch ClinVar variants (using internal API route)
export async function fetchClinvarVariants(params: {
  chrom: string
  minBound: number
  maxBound: number
  genomeId: string
}): Promise<any[]> {
  try {
    const queryParams = new URLSearchParams({
      chrom: params.chrom,
      minBound: params.minBound.toString(),
      maxBound: params.maxBound.toString(),
      genomeId: params.genomeId,
    })

    const response = await fetchWithRetry(`/api/clinvar?${queryParams.toString()}`, {
      method: 'GET',
    }, 3, 1000) // 3 retries with 1s initial delay

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { error?: string }
      if (response.status === 429) {
        throw new Error("Too many requests. Please wait a moment and try again.")
      }
      throw new Error(errorData.error ?? `ClinVar fetch failed: ${response.statusText}`)
    }

    const data = (await response.json()) as { variants: any[] }
    // Map API response format to our internal format
    return data.variants.map((v: any) => ({
      clinvar_id: v.clinvar_id || v.id,
      title: v.title,
      variation_type: v.variation_type || v.variationType,
      classification: v.classification || v.clinicalSignificance,
      gene_sort: v.gene_sort || v.geneSymbol || "",
      chromosome: v.chromosome,
      location: v.location || v.position?.toString() || "0",
      evo2Result: v.evo2Result,
    }))
  } catch (error) {
    console.error("Error fetching ClinVar variants:", error)
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('Too many requests') || error.message.includes('429')) {
        throw new Error("Too many requests. Please wait a moment and try again.")
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error("Network error. Please check your internet connection and try again.")
      }
      if (error.message.includes('aborted') || error.name === 'AbortError') {
        throw new Error("Request timed out. Please try again.")
      }
    }
    throw error
  }
}

