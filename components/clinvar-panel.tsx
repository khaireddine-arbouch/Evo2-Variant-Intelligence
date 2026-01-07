"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ExternalLink,
  RefreshCw,
  Loader2,
  Beaker,
  GitCompare,
  Shield,
  ShieldAlert,
  ShieldQuestion,
  AlertTriangle,
  CheckCircle,
  Search,
  X,
} from "lucide-react"
import type { Gene, ClinVarVariant, VariantAnalysisResult } from "@/lib/types"
import { fetchClinvarVariants, analyzeVariant, fetchGeneSequence } from "@/lib/api"
import { cn } from "@/lib/utils"
import { fetchWithAuth } from "@/lib/auth-client"

interface ClinVarPanelProps {
  gene: Gene | null
  assembly?: string
  sessionId?: string | null
}

export function ClinVarPanel({ gene, assembly = "hg38", sessionId }: ClinVarPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [variants, setVariants] = useState<ClinVarVariant[]>([])
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [isCheckingCache, setIsCheckingCache] = useState(false)
  const [comparisonVariant, setComparisonVariant] = useState<ClinVarVariant | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Helper function to check cache for a single variant
  const checkVariantCache = async (variant: ClinVarVariant): Promise<VariantAnalysisResult | null> => {
    if (!variant.position || variant.position <= 0) return null
    
    try {
      // Detect mutation type
      const variationType = variant.variationType?.toLowerCase() || ""
      let mutationType: "SNV" | "DELETION" | "INSERTION" = "SNV"
      if (variationType.includes("deletion") || variationType.includes("del")) {
        mutationType = "DELETION"
      } else if (variationType.includes("insertion") || variationType.includes("ins")) {
        mutationType = "INSERTION"
      } else if (
        variationType.includes("duplication") ||
        variationType.includes("dup") ||
        variationType.includes("microsatellite") ||
        variationType.includes("repeat") ||
        variationType.includes("indel") ||
        variationType.includes("inversion") ||
        variationType.includes("inv") ||
        variationType.includes("translocation") ||
        variationType.includes("trans")
      ) {
        // Unsupported mutation types for now
        return null
      }

      // Get reference and alternate alleles
      let ref: string | undefined = variant.referenceAllele?.toUpperCase()
      let alt: string | undefined = variant.alternateAllele?.toUpperCase()

      // Try to parse from title if not provided
      if (!ref || !alt) {
        const title = variant.title || ""
        const fullMatch = title.match(/([ACGT])[>]([ACGT]+)/i)
        if (fullMatch && fullMatch[1] && fullMatch[2]) {
          ref = fullMatch[1].toUpperCase()
          alt = fullMatch[2].toUpperCase()
        } else {
          const delMatch = title.match(/del([ACGT]*)/i)
          if (delMatch) {
            mutationType = "DELETION"
            if (delMatch[1]) {
              ref = delMatch[1].toUpperCase()
            }
            alt = ""
          } else {
            const insMatch = title.match(/ins([ACGT]+)/i)
            if (insMatch && insMatch[1]) {
              mutationType = "INSERTION"
              alt = insMatch[1].toUpperCase()
            }
          }
        }
      }

      // For SNVs, fetch reference from genome sequence
      if (mutationType === "SNV" && !ref && variant.position > 0) {
        try {
          const chrom = variant.chromosome.startsWith("chr") 
            ? variant.chromosome 
            : `chr${variant.chromosome}`
          const { sequence } = await fetchGeneSequence(
            chrom,
            variant.position,
            variant.position,
            assembly
          )
          if (sequence && sequence.length > 0) {
            ref = sequence[0].toUpperCase()
          }
        } catch (err) {
          console.error("Error fetching reference sequence for cache check:", err)
          return null
        }
      }

      if (!ref) return null

      // Normalize alternative for DELETION
      if (mutationType === "DELETION") {
        alt = alt === "-" ? "" : (alt || "")
      }

      // Check cache
      const chrom = variant.chromosome.startsWith("chr") 
        ? variant.chromosome 
        : `chr${variant.chromosome}`
      
      const cacheAlt = mutationType === "DELETION" ? "" : (alt || "")
      
      const cacheParams = new URLSearchParams({
        position: variant.position.toString(),
        chromosome: chrom,
        reference: ref.toUpperCase(),
        alternative: cacheAlt.toUpperCase(),
      })
      
      if (sessionId) {
        cacheParams.append("session_id", sessionId)
      }

      const cacheResponse = await fetchWithAuth(`/api/predictions?${cacheParams.toString()}`)

      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json()
        if (cacheData.prediction) {
          const cached = cacheData.prediction
          return {
            position: cached.position,
            chromosome: cached.chromosome,
            reference: cached.reference,
            alternative: cached.alternative || "",
            deltaScore: cached.delta_score,
            prediction: cached.prediction as "Likely pathogenic" | "Likely benign" | "Uncertain significance",
            confidence: cached.confidence,
            geneSymbol: cached.gene_symbol || gene?.symbol,
          }
        }
      }
    } catch (err) {
      console.error("Error checking cache for variant:", err)
    }
    
    return null
  }

  // Check cache for multiple variants
  const checkCacheForVariants = async (variantsToCheck: ClinVarVariant[]) => {
    // Only check variants without existing results
    const variantsNeedingCheck = variantsToCheck.filter(v => !v.evo2Result)
    
    if (variantsNeedingCheck.length === 0) return

    setIsCheckingCache(true)
    try {
      // Check cache for all variants in parallel (but limit concurrency)
      const cachePromises = variantsNeedingCheck.map(variant => checkVariantCache(variant))
      const cacheResults = await Promise.all(cachePromises)
      
      // Update variants with cached results
      setVariants((prev) => {
        return prev.map((v) => {
          const index = variantsNeedingCheck.findIndex(vc => vc.id === v.id)
          if (index >= 0 && cacheResults[index]) {
            return { ...v, evo2Result: cacheResults[index]! }
          }
          return v
        })
      })
    } catch (err) {
      console.error("Error checking cache for variants:", err)
    } finally {
      setIsCheckingCache(false)
    }
  }

  // Fetch ClinVar variants when gene changes
  useEffect(() => {
    const loadVariants = async () => {
      if (!gene || !gene._hasValidCoordinates || !gene.start || !gene.end) {
        setVariants([])
        setError(null)
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const fetchedVariants = await fetchClinvarVariants({
          chrom: gene.chromosome,
          minBound: gene.start,
          maxBound: gene.end,
          genomeId: assembly,
        })
        
        // Map API response to component format
        const mappedVariants: ClinVarVariant[] = fetchedVariants.map((v: any) => {
          // Parse position - handle comma-separated numbers
          const locationStr = (v.location || v.position?.toString() || "0").replace(/,/g, "")
          const position = parseInt(locationStr) || 0
          
          return {
            id: v.clinvar_id || v.id,
            title: v.title,
            variationType: v.variation_type || v.variationType,
            clinicalSignificance: v.classification || v.clinicalSignificance,
            chromosome: v.chromosome,
            position,
            referenceAllele: v.referenceAllele,
            alternateAllele: v.alternateAllele,
            evo2Result: v.evo2Result,
          }
        })
        
        setVariants(mappedVariants)
        
        // Check cache for variants that don't have results yet
        if (mappedVariants.length > 0) {
          checkCacheForVariants(mappedVariants)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ClinVar variants")
        setVariants([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadVariants()
  }, [gene, assembly])

  const handleRefresh = async () => {
    if (!gene || !gene._hasValidCoordinates) return
    setIsLoading(true)
    setError(null)
    try {
      const fetchedVariants = await fetchClinvarVariants({
        chrom: gene.chromosome,
        minBound: gene.start,
        maxBound: gene.end,
        genomeId: assembly,
      })
      const mappedVariants: ClinVarVariant[] = fetchedVariants.map((v: any) => {
        // Parse position - handle comma-separated numbers
        const locationStr = (v.location || v.position?.toString() || "0").replace(/,/g, "")
        const position = parseInt(locationStr) || 0
        
        return {
          id: v.clinvar_id || v.id,
          title: v.title,
          variationType: v.variation_type || v.variationType,
          clinicalSignificance: v.classification || v.clinicalSignificance,
          chromosome: v.chromosome,
          position,
          referenceAllele: v.referenceAllele,
          alternateAllele: v.alternateAllele,
          evo2Result: v.evo2Result,
        }
      })
      setVariants(mappedVariants)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh variants")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeVariant = async (variant: ClinVarVariant) => {
    if (!gene) {
      setError("Please select a gene first")
      return
    }

    setAnalyzingId(variant.id)
    setError(null)

    // Detect mutation type from variant information
    const variationType = variant.variationType?.toLowerCase() || ""
    let mutationType: "SNV" | "DELETION" | "INSERTION" = "SNV"
    
    if (variationType.includes("deletion") || variationType.includes("del")) {
      mutationType = "DELETION"
    } else if (variationType.includes("insertion") || variationType.includes("ins")) {
      mutationType = "INSERTION"
    } else if (
      variationType.includes("duplication") ||
      variationType.includes("dup") ||
      variationType.includes("microsatellite") ||
      variationType.includes("repeat") ||
      variationType.includes("indel") ||
      variationType.includes("inversion") ||
      variationType.includes("inv") ||
      variationType.includes("translocation") ||
      variationType.includes("trans")
    ) {
      setError("Only SNV and experimental Deletion/Insertion are supported right now. Other mutation types are coming soon.")
      setAnalyzingId(null)
      return
    }

    // Try to get reference and alternate alleles
    let ref: string | undefined = variant.referenceAllele?.toUpperCase()
    let alt: string | undefined = variant.alternateAllele?.toUpperCase()

    // If alleles are not provided, try to extract from variant title
    if (!ref || !alt) {
      // Try to parse from title - look for patterns like:
      // "g.123A>G", "c.123A>G", "123A>G", "A>G", etc.
      const title = variant.title || ""
      
      // Pattern 1: Full notation with both alleles (e.g., "A>G", "g.123A>G")
      const fullMatch = title.match(/([ACGT])[>]([ACGT]+)/i)
      if (fullMatch && fullMatch[1] && fullMatch[2]) {
        ref = fullMatch[1].toUpperCase()
        alt = fullMatch[2].toUpperCase()
      } else {
        // Pattern 2: Deletion (e.g., "delA", "del")
        const delMatch = title.match(/del([ACGT]*)/i)
        if (delMatch) {
          mutationType = "DELETION"
          if (delMatch[1]) {
            ref = delMatch[1].toUpperCase()
          }
          alt = "-"
        } else {
          // Pattern 3: Insertion (e.g., "insACGT", "insA")
          const insMatch = title.match(/ins([ACGT]+)/i)
          if (insMatch && insMatch[1]) {
            mutationType = "INSERTION"
            alt = insMatch[1].toUpperCase()
          } else {
            // Pattern 4: Only alternate allele (e.g., ">G")
            const altMatch = title.match(/[>]([ACGT]+)/i)
            if (altMatch && altMatch[1]) {
              alt = altMatch[1].toUpperCase()
            }
          }
        }
      }
    }

    // For SNVs, always fetch reference from genome sequence to ensure accuracy
    // This prevents mismatches between ClinVar reference and actual genome sequence
    if (mutationType === "SNV" && variant.position > 0) {
      try {
        setIsCheckingCache(true) // Show loading while fetching reference
        // Ensure chromosome has 'chr' prefix for fetchGeneSequence
        const chrom = variant.chromosome.startsWith("chr") 
          ? variant.chromosome 
          : `chr${variant.chromosome}`
        const { sequence } = await fetchGeneSequence(
          chrom,
          variant.position,
          variant.position,
          assembly
        )
        if (sequence && sequence.length > 0) {
          ref = sequence[0].toUpperCase()
        }
      } catch (err) {
        console.error("Error fetching reference sequence:", err)
      } finally {
        setIsCheckingCache(false)
      }
    } else if (!ref && variant.position > 0) {
      // For non-SNV mutations, fetch reference if not already determined
      try {
        setIsCheckingCache(true) // Show loading while fetching reference
        // Ensure chromosome has 'chr' prefix for fetchGeneSequence
        const chrom = variant.chromosome.startsWith("chr") 
          ? variant.chromosome 
          : `chr${variant.chromosome}`
        const { sequence } = await fetchGeneSequence(
          chrom,
          variant.position,
          variant.position,
          assembly
        )
        if (sequence && sequence.length > 0) {
          ref = sequence[0].toUpperCase()
        }
      } catch (err) {
        console.error("Error fetching reference sequence:", err)
      } finally {
        setIsCheckingCache(false)
      }
    }

    // Normalize alternative based on mutation type
    if (mutationType === "DELETION") {
      alt = alt === "-" ? "" : (alt || "")
    }

    // Validate we have required information
    if (!ref) {
      setError("Unable to determine reference allele. Please check variant information.")
      setAnalyzingId(null)
      return
    }

    if (mutationType === "SNV" && (!alt || alt.length !== 1)) {
      setError("Unable to determine alternative allele for SNV. Please check variant information.")
      setAnalyzingId(null)
      return
    }

    if (mutationType === "INSERTION" && (!alt || alt.length === 0)) {
      setError("Unable to determine insertion sequence. Please check variant information.")
      setAnalyzingId(null)
      return
    }

    // Validate nucleotides for SNV
    if (mutationType === "SNV") {
      if (!["A", "C", "G", "T"].includes(ref) || !["A", "C", "G", "T"].includes(alt)) {
        setError("Invalid nucleotide values for SNV")
        setAnalyzingId(null)
        return
      }
    } else if (mutationType === "DELETION") {
      if (!["A", "C", "G", "T"].includes(ref)) {
        setError("Invalid reference nucleotide for deletion")
        setAnalyzingId(null)
        return
      }
    } else if (mutationType === "INSERTION") {
      if (!["A", "C", "G", "T"].includes(ref) || !/^[ACGT]+$/.test(alt)) {
        setError("Invalid nucleotides for insertion")
        setAnalyzingId(null)
        return
      }
    }

    // Always check for existing prediction in cache first
    setIsCheckingCache(true)
    try {
      // Ensure chromosome format is consistent
      const chrom = variant.chromosome.startsWith("chr") 
        ? variant.chromosome 
        : `chr${variant.chromosome}`
      
      // Normalize alternative for cache check - DELETION should use "" not "-"
      const cacheAlt = mutationType === "DELETION" ? "" : alt
      
      const cacheParams = new URLSearchParams({
        position: variant.position.toString(),
        chromosome: chrom,
        reference: ref.toUpperCase(),
        alternative: cacheAlt.toUpperCase(),
      })
      
      // Only include session_id if it exists
      if (sessionId) {
        cacheParams.append("session_id", sessionId)
      }

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
            alternative: cached.alternative || "",
            deltaScore: cached.delta_score,
            prediction: cached.prediction as "Likely pathogenic" | "Likely benign" | "Uncertain significance",
            confidence: cached.confidence,
            geneSymbol: cached.gene_symbol || gene.symbol,
          }
          setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, evo2Result: cachedResult } : v)))
          setIsCheckingCache(false)
          setAnalyzingId(null)
          return // Exit early - we have the cached result
        }
      }
    } catch (cacheError) {
      console.error("Error checking cache:", cacheError)
      // Continue to run analysis if cache check fails
    } finally {
      setIsCheckingCache(false)
    }

    // No cached result found - run the analysis
    try {
      // Ensure chromosome format is correct (with 'chr' prefix)
      const chrom = variant.chromosome.startsWith("chr") 
        ? variant.chromosome 
        : `chr${variant.chromosome}`
      
      const analysisResult = await analyzeVariant({
        position: variant.position,
        alternative: alt,
        genomeId: assembly,
        chromosome: chrom,
        reference: ref,
        mutationType: mutationType,
      })

      // Map API response to component format
      // Normalize alternative: DELETION should use "" not "-" for consistency with cache
      let normalizedAlt = analysisResult.alternative || ""
      if (mutationType === "DELETION") {
        normalizedAlt = "" // Always use empty string for DELETION to match cache check
      }
      
      const mappedResult: VariantAnalysisResult = {
        position: analysisResult.position,
        chromosome: analysisResult.chromosome,
        reference: analysisResult.reference,
        alternative: normalizedAlt,
        deltaScore: analysisResult.delta_score,
        prediction: analysisResult.prediction as "Likely pathogenic" | "Likely benign" | "Uncertain significance",
        confidence: analysisResult.classification_confidence,
        geneSymbol: gene.symbol,
        mutationType: analysisResult.mutation_type || mutationType,
      }
      
      setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, evo2Result: mappedResult } : v)))

      // Save prediction to database if session exists
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
          errorMessage = "Variant position is outside the valid range."
        } else if (err.message.includes("does not match genome sequence")) {
          errorMessage = "Reference allele doesn't match genome sequence."
        } else if (err.message.includes("Unable to determine")) {
          errorMessage = err.message // Keep original message for allele detection errors
        }
      }
      setError(errorMessage)
      setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, evo2Result: undefined } : v)))
      console.error("ClinVar variant analysis error:", err)
    } finally {
      setAnalyzingId(null)
    }
  }

  const isSNV = (variant: ClinVarVariant) => {
    const type = variant.variationType?.toLowerCase() || ""
    return type.includes("single nucleotide") || 
           (!type.includes("deletion") && !type.includes("insertion") && !type.includes("del") && !type.includes("ins"))
  }

  // Filter variants based on search query
  const filteredVariants = useMemo(() => {
    if (!searchQuery.trim()) {
      return variants
    }

    const query = searchQuery.toLowerCase().trim()
    return variants.filter((variant) => {
      // Search in title
      if (variant.title?.toLowerCase().includes(query)) return true
      
      // Search in position (handle both number and formatted string)
      const positionStr = variant.position.toString()
      if (positionStr.includes(query) || positionStr.replace(/,/g, "").includes(query)) return true
      
      // Search in variation type
      if (variant.variationType?.toLowerCase().includes(query)) return true
      
      // Search in clinical significance
      if (variant.clinicalSignificance?.toLowerCase().includes(query)) return true
      
      // Search in chromosome
      if (variant.chromosome?.toLowerCase().includes(query)) return true
      
      // Search in variant ID
      if (variant.id?.toLowerCase().includes(query)) return true
      
      // Search in alleles if available
      if (variant.referenceAllele?.toLowerCase().includes(query)) return true
      if (variant.alternateAllele?.toLowerCase().includes(query)) return true
      
      return false
    })
  }, [variants, searchQuery])

  if (!gene) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">Select a gene to view ClinVar variants</p>
      </div>
    )
  }

  return (
    <div className="border-t border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Known Variants</span>
          <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px] text-muted-foreground">ClinVar</span>
          <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px] text-muted-foreground">
            Supported: SNV; Deletion/Insertion experimental. Others coming soon.
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading} className="h-6 px-2 text-xs">
          <RefreshCw className={cn("w-3 h-3 mr-1.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5" />
            {error}
          </div>
        </div>
      )}

      {/* Search Bar */}
      {variants.length > 0 && (
        <div className="px-4 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search variants by title, position, type, or significance..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 pr-7 text-xs bg-secondary border-border"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-transparent"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {filteredVariants.length} of {variants.length} variant{filteredVariants.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
      )}

      {/* Variants Table */}
      <div className="max-h-80 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : filteredVariants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">
              {searchQuery ? "No variants match your search" : "No variants found"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredVariants.map((variant) => (
              <VariantRow
                key={variant.id}
                variant={variant}
                isAnalyzing={analyzingId === variant.id}
                isCheckingCache={isCheckingCache && analyzingId === variant.id}
                onAnalyze={() => handleAnalyzeVariant(variant)}
                onCompare={() => setComparisonVariant(variant)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {comparisonVariant && comparisonVariant.evo2Result && (
        <ComparisonDialog
          variant={comparisonVariant}
          open={!!comparisonVariant}
          onClose={() => setComparisonVariant(null)}
        />
      )}
    </div>
  )
}

function VariantRow({
  variant,
  isAnalyzing,
  isCheckingCache,
  onAnalyze,
  onCompare,
}: {
  variant: ClinVarVariant
  isAnalyzing: boolean
  isCheckingCache?: boolean
  onAnalyze: () => void
  onCompare: () => void
}) {
  const isSNV = variant.variationType.toLowerCase().includes("single nucleotide")
  const hasEvo2Result = !!variant.evo2Result

  return (
    <div className="px-4 py-3 hover:bg-secondary/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{variant.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground font-mono">{variant.position.toLocaleString()}</span>
            <a
              href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.id.replace("VCV", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              ClinVar
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <SignificanceBadge significance={variant.clinicalSignificance} label="ClinVar" />
          {hasEvo2Result && variant.evo2Result && (
            <SignificanceBadge significance={variant.evo2Result.prediction} label="Evo2" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">
          {variant.variationType}
        </span>

        {!hasEvo2Result && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAnalyze}
            disabled={isAnalyzing || isCheckingCache}
            className="h-6 px-2 text-[10px] ml-auto bg-transparent"
          >
            {isCheckingCache ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Checking cache...
              </>
            ) : isAnalyzing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Analyzing...
              </>
            ) : (
              <>
                <Beaker className="w-3 h-3 mr-1" />
                Analyze
              </>
            )}
          </Button>
        )}

        {hasEvo2Result && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCompare}
            className="h-6 px-2 text-[10px] ml-auto bg-transparent"
          >
            <GitCompare className="w-3 h-3 mr-1" />
            Compare
          </Button>
        )}
      </div>
    </div>
  )
}

function SignificanceBadge({ significance, label }: { significance: string | undefined; label: string }) {
  if (!significance) {
    return (
      <div className="px-1.5 py-0.5 rounded text-[9px] font-medium flex items-center gap-1 bg-secondary text-muted-foreground">
        {label}: <span className="truncate max-w-20">Unknown</span>
      </div>
    )
  }
  
  const sigLower = significance.toLowerCase()
  const isPathogenic =
    sigLower.includes("pathogenic") && !sigLower.includes("benign")
  const isBenign = sigLower.includes("benign")
  const isVUS = sigLower.includes("uncertain")

  return (
    <div
      className={cn(
        "px-1.5 py-0.5 rounded text-[9px] font-medium flex items-center gap-1",
        isPathogenic && "bg-pathogenic/10 text-pathogenic",
        isBenign && "bg-benign/10 text-benign",
        isVUS && "bg-vus/10 text-vus",
        !isPathogenic && !isBenign && !isVUS && "bg-secondary text-muted-foreground",
      )}
    >
      {label}:{isPathogenic && <ShieldAlert className="w-2.5 h-2.5" />}
      {isBenign && <Shield className="w-2.5 h-2.5" />}
      {isVUS && <ShieldQuestion className="w-2.5 h-2.5" />}
      <span className="truncate max-w-20">{significance}</span>
    </div>
  )
}

function ComparisonDialog({
  variant,
  open,
  onClose,
}: {
  variant: ClinVarVariant
  open: boolean
  onClose: () => void
}) {
  const evo2Result = variant.evo2Result!

  const clinicalSig = variant.clinicalSignificance || ""
  const clinvarIsPathogenic =
    clinicalSig.toLowerCase().includes("pathogenic") &&
    !clinicalSig.toLowerCase().includes("benign")
  const clinvarIsBenign = clinicalSig.toLowerCase().includes("benign")

  const evo2IsPathogenic = evo2Result.prediction === "Likely pathogenic"
  const evo2IsBenign = evo2Result.prediction === "Likely benign"

  const isAgreement = (clinvarIsPathogenic && evo2IsPathogenic) || (clinvarIsBenign && evo2IsBenign)

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">Classification Comparison</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Variant Info */}
          <div className="p-3 bg-secondary rounded border border-border">
            <p className="text-xs font-medium">{variant.title}</p>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="font-mono">
                {variant.chromosome}:{variant.position.toLocaleString()}
              </span>
              <span>{variant.variationType}</span>
              {variant.referenceAllele && variant.alternateAllele && (
                <span className="font-mono">
                  <span className="text-chart-1">{variant.referenceAllele}</span>
                  {">"}
                  <span className="text-chart-4">{variant.alternateAllele}</span>
                </span>
              )}
            </div>
            <a
              href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.id.replace("VCV", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-2"
            >
              View in ClinVar
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Side by Side Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* ClinVar */}
            <div className="p-3 bg-secondary/50 rounded border border-border">
              <div className="text-[10px] text-muted-foreground mb-2">ClinVar Classification</div>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
                  clinvarIsPathogenic && "bg-pathogenic/10 text-pathogenic",
                  clinvarIsBenign && "bg-benign/10 text-benign",
                  !clinvarIsPathogenic && !clinvarIsBenign && "bg-vus/10 text-vus",
                )}
              >
                {clinvarIsPathogenic && <ShieldAlert className="w-3.5 h-3.5" />}
                {clinvarIsBenign && <Shield className="w-3.5 h-3.5" />}
                {!clinvarIsPathogenic && !clinvarIsBenign && <ShieldQuestion className="w-3.5 h-3.5" />}
                {clinicalSig || "Unknown"}
              </div>
            </div>

            {/* Evo2 */}
            <div className="p-3 bg-secondary/50 rounded border border-border">
              <div className="text-[10px] text-muted-foreground mb-2">Evo2 Prediction</div>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
                  evo2IsPathogenic && "bg-pathogenic/10 text-pathogenic",
                  evo2IsBenign && "bg-benign/10 text-benign",
                  !evo2IsPathogenic && !evo2IsBenign && "bg-vus/10 text-vus",
                )}
              >
                {evo2IsPathogenic && <ShieldAlert className="w-3.5 h-3.5" />}
                {evo2IsBenign && <Shield className="w-3.5 h-3.5" />}
                {!evo2IsPathogenic && !evo2IsBenign && <ShieldQuestion className="w-3.5 h-3.5" />}
                {evo2Result.prediction}
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <div className="text-[10px] text-muted-foreground">Delta Score</div>
                  <div className="font-mono text-xs">{evo2Result.deltaScore.toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Confidence</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded",
                          evo2IsPathogenic && "bg-pathogenic",
                          evo2IsBenign && "bg-benign",
                          !evo2IsPathogenic && !evo2IsBenign && "bg-vus",
                        )}
                        style={{ width: `${evo2Result.confidence * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs">{(evo2Result.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agreement Indicator */}
          <div
            className={cn(
              "p-3 rounded border flex items-center gap-3",
              isAgreement ? "bg-benign/5 border-benign/30" : "bg-vus/5 border-vus/30",
            )}
          >
            {isAgreement ? (
              <>
                <CheckCircle className="w-5 h-5 text-benign" />
                <div>
                  <p className="text-xs font-medium text-benign">Classifications Agree</p>
                  <p className="text-[10px] text-muted-foreground">ClinVar and Evo2 predictions are consistent</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-vus" />
                <div>
                  <p className="text-xs font-medium text-vus">Classifications Disagree</p>
                  <p className="text-[10px] text-muted-foreground">
                    ClinVar and Evo2 predictions differ — review recommended
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
