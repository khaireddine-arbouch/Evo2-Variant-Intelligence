"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertCircle,
  Loader2,
  Beaker,
  Shield,
  ShieldAlert,
  ShieldQuestion,
  TrendingDown,
  TrendingUp,
  Upload,
  FileSpreadsheet,
  Info,
} from "lucide-react"
import type { Gene, VariantAnalysisResult, MutationType } from "@/lib/types"
import { analyzeVariant, fetchGeneSequence } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchWithAuth } from "@/lib/auth-client"

interface VariantAnalysisPanelProps {
  gene: Gene | null
  assembly: string
  prefillPosition?: number
  prefillReference?: string
  hoverPosition?: number
  hoverReference?: string
  sessionId?: string | null
}

export function VariantAnalysisPanel({ gene, assembly, prefillPosition, prefillReference, hoverPosition, hoverReference, sessionId }: VariantAnalysisPanelProps) {
  const [position, setPosition] = useState(prefillPosition?.toString() || "")
  const [reference, setReference] = useState(prefillReference || "")
  const [alternative, setAlternative] = useState("")
  const [mutationType, setMutationType] = useState<MutationType>("SNV")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCheckingCache, setIsCheckingCache] = useState(false)
  const [result, setResult] = useState<VariantAnalysisResult | null>(null)
  const [isCachedResult, setIsCachedResult] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingReference, setIsLoadingReference] = useState(false)
  const [isHoverMode, setIsHoverMode] = useState(false)

  // Update position and reference when prefill changes (click)
  useEffect(() => {
    if (prefillPosition !== undefined) {
      setPosition(prefillPosition.toString())
      setIsHoverMode(false)
    }
    if (prefillReference) {
      setReference(prefillReference)
    }
  }, [prefillPosition, prefillReference])

  // Update position and reference when hover changes (real-time) - debounced
  useEffect(() => {
    if (hoverPosition !== undefined && hoverReference) {
      // Use a small delay to batch rapid hover updates
      const timeoutId = setTimeout(() => {
        setPosition(hoverPosition.toString())
        setReference(hoverReference)
        setIsHoverMode(true)
      }, 100) // Small delay to batch updates
      
      return () => clearTimeout(timeoutId)
    } else if (hoverPosition === undefined && hoverReference === undefined) {
      setIsHoverMode(false)
    }
  }, [hoverPosition, hoverReference])

  // Clear result when inputs change
  useEffect(() => {
    setResult(null)
    setIsCachedResult(false)
  }, [position, reference, alternative, mutationType])

  // Reset alternative when mutation type changes
  useEffect(() => {
    if (mutationType === "DELETION") {
      setAlternative("-")
    } else if (mutationType === "SNV" && alternative.length > 1) {
      setAlternative(alternative.slice(0, 1))
    }
  }, [mutationType])

  // Auto-fetch reference nucleotide when position is set and gene is available
  useEffect(() => {
    const fetchReference = async () => {
      if (!gene || !position || reference) return

      const pos = Number.parseInt(position)
      if (isNaN(pos) || pos < gene.start || pos > gene.end) return

      setIsLoadingReference(true)
      try {
        const { sequence } = await fetchGeneSequence(gene.chromosome, pos, pos, assembly)
        if (sequence && sequence.length > 0) {
          setReference(sequence[0]!)
        }
      } catch (err) {
        console.error("Error fetching reference:", err)
      } finally {
        setIsLoadingReference(false)
      }
    }

    void fetchReference()
  }, [position, gene, assembly, reference])

  const handleAnalyze = async () => {
    setError(null)

    // Validation
    if (!gene) {
      setError("Please select a gene first")
      return
    }

    const pos = Number.parseInt(position)
    if (isNaN(pos)) {
      setError("Please enter a valid position")
      return
    }

    if (pos < gene.start || pos > gene.end) {
      setError(`Position must be within gene bounds (${gene.start.toLocaleString()} - ${gene.end.toLocaleString()})`)
      return
    }

    const ref = reference.toUpperCase()
    
    // Validate based on mutation type
    if (mutationType === "SNV") {
      if (!["A", "C", "G", "T"].includes(ref)) {
        setError("Reference must be A, C, G, or T")
        return
      }
      const alt = alternative.toUpperCase()
      if (!["A", "C", "G", "T"].includes(alt)) {
        setError("Alternative must be A, C, G, or T")
        return
      }
      if (ref === alt) {
        setError("Reference and alternative must be different")
        return
      }
    } else if (mutationType === "DELETION") {
      if (!["A", "C", "G", "T"].includes(ref)) {
        setError("Reference must be A, C, G, or T")
        return
      }
      // For deletion, alternative should be "-" or empty
      if (alternative && alternative.toUpperCase() !== "-" && alternative !== "") {
        setError("For deletion, alternative should be '-' or empty")
        return
      }
    } else if (mutationType === "INSERTION") {
      if (!["A", "C", "G", "T"].includes(ref)) {
        setError("Reference must be A, C, G, or T")
        return
      }
      const alt = alternative.toUpperCase()
      if (!alt || alt.length === 0) {
        setError("For insertion, alternative must be a non-empty sequence")
        return
      }
      if (!/^[ACGT]+$/.test(alt)) {
        setError("Alternative must contain only A, C, G, or T")
        return
      }
    }

    const alt = alternative.toUpperCase() === "-" ? "" : alternative.toUpperCase()

    // Check for existing prediction first if we have a session
    if (sessionId) {
      setIsCheckingCache(true)
      try {
        const cacheParams = new URLSearchParams({
          session_id: sessionId,
          position: pos.toString(),
          chromosome: gene.chromosome,
          reference: ref,
          alternative: alt,
          mutation_type: mutationType,
        })
        const cacheResponse = await fetchWithAuth(`/api/predictions?${cacheParams.toString()}`)

        if (cacheResponse.ok) {
          const cacheData = await cacheResponse.json()
          if (cacheData.prediction) {
            // Found cached prediction - use it
            const cached = cacheData.prediction
            const cachedResult: VariantAnalysisResult = {
              position: cached.position,
              chromosome: cached.chromosome,
              reference: cached.reference,
              alternative: cached.alternative,
              deltaScore: cached.delta_score,
              prediction: cached.prediction as "Likely pathogenic" | "Likely benign" | "Uncertain significance",
              confidence: cached.confidence,
              geneSymbol: cached.gene_symbol || gene.symbol,
            }
            setResult(cachedResult)
            setIsCachedResult(true)
            setIsCheckingCache(false)
            return // Exit early - we have the cached result
          }
        }
      } catch (cacheError) {
        console.error("Error checking cache:", cacheError)
        // Continue to run analysis if cache check fails
      } finally {
        setIsCheckingCache(false)
      }
    }

    // No cached result found - run the analysis
    setIsAnalyzing(true)

    try {
      const analysisResult = await analyzeVariant({
        position: pos,
        alternative: alt,
        genomeId: assembly,
        chromosome: gene.chromosome,
        reference: ref,
        mutationType: mutationType,
      })

      // Map API response to component format
      // Normalize alternative so deletions are stored with empty string to align with cache lookups
      let normalizedAlt = (analysisResult.alternative || alt || "").toUpperCase()
      if (mutationType === "DELETION") {
        normalizedAlt = ""
      }

      const mappedResult: VariantAnalysisResult = {
        position: analysisResult.position,
        chromosome: analysisResult.chromosome,
        reference: analysisResult.reference.toUpperCase(),
        alternative: normalizedAlt,
        deltaScore: analysisResult.delta_score,
        prediction: analysisResult.prediction as "Likely pathogenic" | "Likely benign" | "Uncertain significance",
        confidence: analysisResult.classification_confidence,
        geneSymbol: gene.symbol,
        mutationType: analysisResult.mutation_type || mutationType,
      }
      setResult(mappedResult)
      setIsCachedResult(false) // This is a new analysis, not cached

      // Save prediction to Supabase if session exists
      if (sessionId) {
        try {
          await fetchWithAuth("/api/predictions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              result: mappedResult,
            }),
          })
        } catch (saveError) {
          console.error("Error saving prediction:", saveError)
          // Don't show error to user - prediction was successful, just saving failed
        }
      }
    } catch (err) {
      let errorMessage = "Failed to analyze variant"
      if (err instanceof Error) {
        errorMessage = err.message
        // Provide more user-friendly error messages
        if (err.message.includes("API key")) {
          errorMessage = "Authentication failed. Please check API configuration."
        } else if (err.message.includes("endpoint not configured")) {
          errorMessage = "API endpoint not configured. Please set NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL."
        } else if (err.message.includes("outside the fetched window")) {
          errorMessage = "Variant position is outside the valid range. Please check the position."
        } else if (err.message.includes("does not match genome sequence")) {
          errorMessage = "Reference allele doesn't match genome sequence at this position."
        } else if (err.message.includes("must be a single nucleotide")) {
          errorMessage = "For SNV, alternative must be a single nucleotide (A, C, G, or T)."
        } else if (err.message.includes("deletion")) {
          errorMessage = "For deletion, alternative should be '-' or empty."
        } else if (err.message.includes("insertion")) {
          errorMessage = "For insertion, alternative must be a non-empty sequence of nucleotides."
        }
      }
      setError(errorMessage)
      setResult(null)
      console.error("Variant analysis error:", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Beaker className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Variant Analysis</h3>
        </div>
      </div>

      <Tabs defaultValue="single" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 pt-3 shrink-0">
          <TabsList className="grid w-full grid-cols-2 h-8 gap-1 p-1">
            <TabsTrigger 
              value="single" 
              className="text-xs h-full rounded-sm flex items-center justify-center transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:text-foreground"
            >
              Single Variant
            </TabsTrigger>
            <TabsTrigger 
              value="batch" 
              className="text-xs h-full rounded-sm flex items-center justify-center transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:text-foreground"
            >
              Batch Analysis
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="single" className="flex-1 overflow-auto p-4 pt-3 mt-0 min-h-0">
          {/* Gene Context */}
          {gene && (
            <div className="mb-4 p-2.5 bg-secondary rounded border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground">Gene</span>
                  <p className="font-mono text-sm font-medium">{gene.symbol}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground">Chromosome</span>
                  <p className="font-mono text-sm">{gene.chromosome}</p>
                </div>
              </div>
              {isHoverMode && (
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5 text-[10px] text-primary">
                    <Info className="w-3 h-3" />
                    <span>Hovering over sequence - click to lock selection</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Form */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label className="text-xs text-muted-foreground">Mutation Type</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">
                      Supported now: SNV. Deletion/Insertion are experimental. All other mutation types are coming soon.
                    </p>
                  </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={mutationType} onValueChange={(value) => setMutationType(value as MutationType)}>
                <SelectTrigger className="h-8 text-xs font-mono bg-secondary mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SNV">SNV (Substitution)</SelectItem>
                <SelectItem value="DELETION">Deletion (experimental)</SelectItem>
                <SelectItem value="INSERTION">Insertion (experimental)</SelectItem>
                </SelectContent>
              </Select>
            <p className="text-[10px] text-muted-foreground mt-1">Other mutation types are coming soon.</p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label className="text-xs text-muted-foreground">Position</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">Genomic position (1-based) within the selected gene region</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value.replace(/\D/g, ""))}
                placeholder="Genomic position"
                className="h-8 text-xs font-mono bg-secondary mt-1"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label className="text-xs text-muted-foreground">Reference Nucleotide</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">Reference nucleotide (A, C, G, or T) at the specified position</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase().slice(0, 1))}
                  placeholder="Auto-detected"
                  maxLength={1}
                  className="h-8 text-xs font-mono bg-secondary mt-1 uppercase"
                  disabled={isLoadingReference}
                />
                {isLoadingReference && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label className="text-xs text-muted-foreground">
                  {mutationType === "SNV" ? "Alternative Nucleotide" : mutationType === "DELETION" ? "Deletion Marker" : "Inserted Sequence"}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">
                        {mutationType === "SNV" 
                          ? "Alternative nucleotide (A, C, G, or T) to test for pathogenicity"
                          : mutationType === "DELETION"
                          ? "For deletion, use '-' or leave empty"
                          : "Sequence of nucleotides (A, C, G, T) to insert after the reference position"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                value={alternative}
                onChange={(e) => {
                  if (mutationType === "SNV") {
                    setAlternative(e.target.value.toUpperCase().slice(0, 1))
                  } else if (mutationType === "DELETION") {
                    setAlternative("-")
                  } else {
                    setAlternative(e.target.value.toUpperCase().replace(/[^ACGT]/g, ""))
                  }
                }}
                placeholder={
                  mutationType === "SNV" 
                    ? "A, C, G, or T"
                    : mutationType === "DELETION"
                    ? "-"
                    : "ACGT..."
                }
                maxLength={mutationType === "SNV" ? 1 : undefined}
                className="h-8 text-xs font-mono bg-secondary mt-1 uppercase"
                disabled={mutationType === "DELETION"}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || isCheckingCache || !gene || !position || !reference || !alternative}
                      className="w-full h-8 text-xs"
                    >
                      {isCheckingCache ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                          Checking cache...
                        </>
                      ) : isAnalyzing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Beaker className="w-3.5 h-3.5 mr-2" />
                          Analyze with Evo2
                        </>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {(!gene || !position || !reference || !alternative) && (
                  <TooltipContent>
                    <p className="text-xs">Please fill in all fields to analyze variant</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Result Card */}
          {result && (
            <div className="mt-4">
              <VariantResultCard result={result} isCached={isCachedResult} />
            </div>
          )}

          {/* What-if Variants Placeholder */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">What-if Variants</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-accent rounded text-muted-foreground">Coming Soon</span>
            </div>
            <div className="p-4 border border-dashed border-border rounded bg-secondary/30 text-center">
              <p className="text-[10px] text-muted-foreground">Explore alternative variants at nearby positions</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="batch" className="flex-1 overflow-auto p-4 pt-3 mt-0 min-h-0">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
            </div>
            <h4 className="text-sm font-medium mb-1">Batch Analysis (coming soon)</h4>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              Batch uploads are not yet available. Support for VCF/CSV analysis is coming soon.
            </p>
            <Button variant="outline" size="sm" className="text-xs gap-2 bg-transparent" disabled>
              <Upload className="w-3.5 h-3.5" />
              Upload File (coming soon)
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function VariantResultCard({ result, isCached }: { result: VariantAnalysisResult; isCached?: boolean }) {
  const prediction = result.prediction || ""
  const isPathogenic = prediction.toLowerCase().includes("pathogenic") && !prediction.toLowerCase().includes("benign")
  const isBenign = prediction.toLowerCase().includes("benign")
  const isVUS = prediction.toLowerCase().includes("uncertain") || (!isPathogenic && !isBenign)

  return (
    <div className="p-3 bg-secondary rounded border border-border space-y-3">
      {/* Cached indicator */}
      {isCached && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Loaded from cache</span>
        </div>
      )}
      {/* Variant Notation */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-muted-foreground">Variant</span>
          <p className="font-mono text-sm">
            {result.geneSymbol && <span className="text-muted-foreground">{result.geneSymbol} </span>}
            <span className="text-foreground">{result.position.toLocaleString()} </span>
            <span className="text-chart-1">{result.reference}</span>
            <span className="text-muted-foreground">{">"}</span>
            <span className="text-chart-4">{result.alternative}</span>
          </p>
        </div>
        <div
          className={cn(
            "px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1.5",
            isPathogenic && "bg-pathogenic/10 text-pathogenic border border-pathogenic/30",
            isBenign && "bg-benign/10 text-benign border border-benign/30",
            isVUS && "bg-vus/10 text-vus border border-vus/30",
          )}
        >
          {isPathogenic && <ShieldAlert className="w-3 h-3" />}
          {isBenign && <Shield className="w-3 h-3" />}
          {isVUS && <ShieldQuestion className="w-3 h-3" />}
          {prediction}
        </div>
      </div>

      {/* Delta Score */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Delta Likelihood Score</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">
                    Change in log-likelihood score. Negative values indicate potential loss of function (pathogenic),
                    positive values suggest maintained function (benign).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="font-mono text-xs">{result.deltaScore.toFixed(6)}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {result.deltaScore < 0 ? (
            <>
              <TrendingDown className="w-3 h-3 text-pathogenic" />
              <span>Negative score suggests loss of function</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-3 h-3 text-benign" />
              <span>Positive score suggests maintained function</span>
            </>
          )}
        </div>
      </div>

      {/* Confidence */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Confidence</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">Model confidence in the prediction, based on training data and variant context</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="font-mono text-xs">{(result.confidence * 100).toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded overflow-hidden">
          <div
            className={cn(
              "h-full rounded transition-all",
              isPathogenic && "bg-pathogenic",
              isBenign && "bg-benign",
              isVUS && "bg-vus",
            )}
            style={{ width: `${result.confidence * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
