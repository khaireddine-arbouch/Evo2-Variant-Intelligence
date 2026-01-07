import { type NextRequest, NextResponse } from "next/server"

interface AnalysisResult {
  position: number
  reference: string
  alternative: string
  delta_score: number
  prediction: string
  classification_confidence: number
  pathogenicity_probability?: number
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const variantPosition = searchParams.get("variant_position")
  const alternative = searchParams.get("alternative")
  const genome = searchParams.get("genome")
  const chromosome = searchParams.get("chromosome")
  const reference = searchParams.get("reference")
  const mutationType = searchParams.get("mutation_type") || "SNV"

  // Validate required parameters
  // For DELETION, alternative can be empty string or "-"
  if (!variantPosition || !genome || !chromosome) {
    return NextResponse.json(
      { error: "Missing required parameters: variant_position, genome, chromosome" },
      { status: 400 }
    )
  }

  // For DELETION, alternative can be empty or "-", otherwise it's required
  if (mutationType !== "DELETION" && (!alternative || alternative.trim() === "")) {
    return NextResponse.json(
      { error: "Missing required parameter: alternative" },
      { status: 400 }
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL
  const apiKey = process.env.MODAL_API_KEY
  
  if (!baseUrl) {
    console.error("NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL is not configured")
    return NextResponse.json(
      { error: "Analysis endpoint not configured" },
      { status: 500 }
    )
  }

  try {
    // Send parameters as JSON body (Modal API expects body, not query params)
    // Normalize alternative for DELETION: convert "-" to empty string
    let normalizedAlternative = alternative || ""
    if (mutationType === "DELETION" && normalizedAlternative === "-") {
      normalizedAlternative = ""
    }

    const requestBody: {
      variant_position: number
      alternative: string
      genome: string
      chromosome: string
      mutation_type?: string
      reference?: string
    } = {
      variant_position: parseInt(variantPosition),
      alternative: normalizedAlternative,
      genome: genome,
      chromosome: chromosome,
      mutation_type: mutationType,
    }

    if (reference) {
      requestBody.reference = reference
    }
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add API key if configured
    if (apiKey) {
      headers["X-API-Key"] = apiKey
    }
    
    const response = await fetch(baseUrl, { 
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      let errorMessage = `Analysis failed: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch {
        // If JSON parsing fails, use the text response
        const errorText = await response.text()
        if (errorText) {
          try {
            const parsed = JSON.parse(errorText)
            errorMessage = parsed.detail || parsed.error || errorMessage
          } catch {
            // If it's not JSON, use the text as error message
            if (errorText.length < 200) {
              errorMessage = errorText
            }
          }
        }
      }
      console.error("Evo2 API error:", errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status >= 400 && response.status < 500 ? response.status : 500 }
      )
    }

    const data = (await response.json()) as AnalysisResult & { mutation_type?: string }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Analysis API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

