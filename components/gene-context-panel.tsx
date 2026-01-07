"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ExternalLink, ArrowRight, ArrowLeft, Copy, Check, FileText, Info } from "lucide-react"
import { useState, useEffect } from "react"
import type { Gene } from "@/lib/types"
import { fetchGeneDetails } from "@/lib/api"
import { cn } from "@/lib/utils"

interface GeneContextPanelProps {
  gene: Gene | null
  assembly: string
}

export function GeneContextPanel({ gene, assembly }: GeneContextPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [geneDetails, setGeneDetails] = useState<{
    summary?: string
    organism?: { scientificName: string; commonName: string }
  } | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Fetch gene details when gene changes
  useEffect(() => {
    const loadGeneDetails = async () => {
      if (!gene?.ncbiGeneId) {
        setGeneDetails(null)
        return
      }

      setIsLoadingDetails(true)
      try {
        const details = await fetchGeneDetails(gene.ncbiGeneId)
        setGeneDetails({
          summary: details.summary,
          organism: details.organism,
        })
      } catch (error) {
        console.error("Failed to fetch gene details:", error)
        setGeneDetails(null)
      } finally {
        setIsLoadingDetails(false)
      }
    }

    void loadGeneDetails()
  }, [gene?.ncbiGeneId])

  if (!gene) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center px-8">
          <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">No Gene Selected</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Search for a gene or browse chromosomes in the left panel to view detailed information.
          </p>
        </div>
      </div>
    )
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Validate gene has coordinates
  const hasValidCoordinates = gene._hasValidCoordinates !== false && gene.start && gene.end && gene.start > 0 && gene.end > gene.start
  const geneLength = hasValidCoordinates ? gene.end - gene.start : 0
  const formattedLength = geneLength.toLocaleString()

  return (
    <div className="h-full overflow-auto bg-background" data-tour="gene-context-panel">
      {/* Gene Header */}
      <div className="sticky top-0 bg-card border-b border-border px-4 py-3 z-10" data-tour="gene-header">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold font-mono">{gene.symbol}</h2>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
                  "bg-primary/10 text-primary border border-primary/20",
                )}
              >
                {assembly}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{gene.name}</p>
          </div>
          {gene.ncbiGeneId && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 bg-transparent ml-2"
              onClick={() => window.open(`https://www.ncbi.nlm.nih.gov/gene/${gene.ncbiGeneId}`, "_blank")}
            >
              NCBI
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Genomic Location */}
        <section data-tour="gene-coordinates">
          <SectionHeader
            title="Genomic Location"
            tooltip="Chromosomal coordinates and genomic span of the selected gene"
          />
          {hasValidCoordinates ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <DataField
                  label="Chromosome"
                  value={gene.chromosome}
                  mono
                  onCopy={() => copyToClipboard(gene.chromosome, "chromosome")}
                  copied={copiedField === "chromosome"}
                />
                <DataField
                  label="Strand"
                  value={
                    <span className="flex items-center gap-1.5">
                      {gene.strand === "+" ? (
                        <>
                          <ArrowRight className="w-3.5 h-3.5 text-chart-1" />
                          <span>Forward (+)</span>
                        </>
                      ) : (
                        <>
                          <ArrowLeft className="w-3.5 h-3.5 text-chart-2" />
                          <span>Reverse (−)</span>
                        </>
                      )}
                    </span>
                  }
                />
                <DataField
                  label="Start"
                  value={gene.start.toLocaleString()}
                  mono
                  onCopy={() => copyToClipboard(gene.start.toString(), "start")}
                  copied={copiedField === "start"}
                />
                <DataField
                  label="End"
                  value={gene.end.toLocaleString()}
                  mono
                  onCopy={() => copyToClipboard(gene.end.toString(), "end")}
                  copied={copiedField === "end"}
                />
                <DataField label="Length" value={`${formattedLength} bp`} mono className="col-span-2" />
              </div>

              {/* Visual genomic span */}
              <div className="mt-3 p-2 bg-secondary rounded border border-border">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
                  <span>{gene.start.toLocaleString()}</span>
                  <span>{gene.end.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded" />
                </div>
                <div className="text-center text-[10px] text-muted-foreground mt-2.5">
                  {gene.chromosome}:{gene.start.toLocaleString()}-{gene.end.toLocaleString()}
                </div>
              </div>
            </>
          ) : (
            <div className="p-3 bg-secondary/50 rounded border border-border border-dashed">
              <p className="text-xs text-muted-foreground">
                Genomic coordinates not available for this gene. This may be due to:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 ml-4 list-disc space-y-1">
                <li>Gene details API unavailable</li>
                <li>Gene not mapped to reference genome</li>
                <li>Network connectivity issues</li>
              </ul>
              {gene.chromosome && (
                <p className="text-xs text-muted-foreground mt-2">
                  Chromosome: <span className="font-mono">{gene.chromosome}</span>
                </p>
              )}
            </div>
          )}
        </section>

        {/* Organism */}
        {(gene.organism || geneDetails?.organism || gene.name) && (
          <section>
            <SectionHeader title="Organism" />
            <div className="grid grid-cols-2 gap-3">
              <DataField 
                label="Scientific Name" 
                value={<em>{(geneDetails?.organism || gene.organism)?.scientificName || "Unknown"}</em>} 
              />
              <DataField 
                label="Common Name" 
                value={
                  <span>
                    {(geneDetails?.organism || gene.organism)?.commonName || "Unknown"}
                    {gene.name && (
                      <span className="text-muted-foreground"> ({gene.name})</span>
                    )}
                  </span>
                } 
              />
            </div>
          </section>
        )}

        {/* Description */}
        {gene.description && gene.description !== gene.name && (
          <section>
            <SectionHeader title="Description" />
            <p className="text-xs text-muted-foreground leading-relaxed">{gene.description}</p>
          </section>
        )}

        {/* Summary */}
        {(gene.summary || geneDetails?.summary) && (
          <section>
            <SectionHeader title="NCBI Summary" />
            <div className="max-h-48 overflow-auto">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {geneDetails?.summary || gene.summary}
              </p>
            </div>
          </section>
        )}

        {/* Context Metrics Placeholder */}
        <section>
          <SectionHeader title="Context Metrics" badge="Coming Soon" />
          <div className="grid grid-cols-2 gap-3">
            <PlaceholderMetric label="pLI Score" />
            <PlaceholderMetric label="LOEUF" />
            <PlaceholderMetric label="gnomAD Freq" />
            <PlaceholderMetric label="Constraint" />
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionHeader({
  title,
  badge,
  tooltip,
}: {
  title: string
  badge?: string
  tooltip?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex items-center gap-1.5">
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{title}</h3>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {badge && <span className="px-1.5 py-0.5 rounded text-[9px] bg-accent text-muted-foreground">{badge}</span>}
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function DataField({
  label,
  value,
  mono,
  className,
  onCopy,
  copied,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  className?: string
  onCopy?: () => void
  copied?: boolean
}) {
  return (
    <div className={cn("group", className)}>
      <dt className="text-[10px] text-muted-foreground mb-0.5">{label}</dt>
      <dd className={cn("text-xs text-foreground flex items-center gap-1.5", mono && "font-mono")}>
        {value}
        {onCopy && (
          <button onClick={onCopy} className="opacity-0 group-hover:opacity-100 transition-opacity">
            {copied ? (
              <Check className="w-3 h-3 text-chart-1" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        )}
      </dd>
    </div>
  )
}

function PlaceholderMetric({ label }: { label: string }) {
  return (
    <div className="p-2 bg-secondary/50 rounded border border-border border-dashed">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xs text-muted-foreground/50 mt-0.5">—</div>
    </div>
  )
}
