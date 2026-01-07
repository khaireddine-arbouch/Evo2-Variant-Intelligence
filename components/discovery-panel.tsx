"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, Database, ChevronRight, Loader2, Star, Clock, Info, Sparkles, AlertCircle } from "lucide-react"
import type { Gene, Chromosome, GenomeAssembly } from "@/lib/types"
import { getAvailableGenomes, getGenomeChromosomes, searchGenes } from "@/lib/api"

interface DiscoveryPanelProps {
  selectedAssembly: string
  onAssemblyChange: (assembly: string) => void
  onGeneSelect: (gene: Gene) => void
  selectedGene?: Gene | null
}

export function DiscoveryPanel({
  selectedAssembly,
  onAssemblyChange,
  onGeneSelect,
  selectedGene,
}: DiscoveryPanelProps) {
  const [activeTab, setActiveTab] = useState<"search" | "browse">("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Gene[]>([])
  const [recentGenes, setRecentGenes] = useState<Gene[]>([])
  const [pinnedGenes] = useState<Gene[]>([])
  const [genomes, setGenomes] = useState<GenomeAssembly[]>([])
  const [chromosomes, setChromosomes] = useState<Chromosome[]>([])
  const [isLoadingGenomes, setIsLoadingGenomes] = useState(true)
  const [isLoadingChromosomes, setIsLoadingChromosomes] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load genomes on mount
  useEffect(() => {
    const loadGenomes = async () => {
      try {
        setIsLoadingGenomes(true)
        const data = await getAvailableGenomes()
        const humanGenomes = data.genomes.Human || []
        setGenomes(humanGenomes)
        if (humanGenomes.length > 0 && !humanGenomes.find((g) => g.id === selectedAssembly)) {
          onAssemblyChange(humanGenomes[0]!.id)
        }
      } catch (err) {
        setError("Failed to load genome assemblies")
        console.error("Error loading genomes:", err)
      } finally {
        setIsLoadingGenomes(false)
      }
    }
    void loadGenomes()
  }, [])

  // Load chromosomes when assembly changes
  useEffect(() => {
    const loadChromosomes = async () => {
      try {
        setIsLoadingChromosomes(true)
        const data = await getGenomeChromosomes(selectedAssembly)
        setChromosomes(data.chromosomes)
      } catch (err) {
        setError("Failed to load chromosomes")
        console.error("Error loading chromosomes:", err)
      } finally {
        setIsLoadingChromosomes(false)
      }
    }
    void loadChromosomes()
  }, [selectedAssembly])

  const currentAssembly = genomes.find((a) => a.id === selectedAssembly)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)
    try {
      const data = await searchGenes(searchQuery, selectedAssembly)
      setSearchResults(data.results)
      // Add to recent genes (keep last 5)
      if (data.results.length > 0) {
        setRecentGenes((prev) => {
          const newGenes = [...data.results.slice(0, 3), ...prev]
          return newGenes.slice(0, 5)
        })
      }
    } catch (err) {
      setError("Failed to search genes. Please try again.")
      console.error("Error searching genes:", err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleExampleSearch = async () => {
    setSearchQuery("BRCA1")
    setIsSearching(true)
    setError(null)
    try {
      const data = await searchGenes("BRCA1", selectedAssembly)
      setSearchResults(data.results)
    } catch (err) {
      setError("Failed to search genes. Please try again.")
      console.error("Error searching genes:", err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleChromosomeClick = async (chrom: Chromosome) => {
    setIsSearching(true)
    setError(null)
    try {
      // Search for genes on this chromosome by searching the chromosome name
      const data = await searchGenes(chrom.chrom, selectedAssembly)
      const filtered = data.results.filter((g) => g.chromosome === chrom.chrom)
      setSearchResults(filtered)
    } catch (err) {
      setError("Failed to load genes for chromosome")
      console.error("Error loading chromosome genes:", err)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-card border-r border-border" data-tour="discovery-panel">
      {/* Genome Assembly Selector */}
      <div className="p-3 border-b border-border" data-tour="genome-assembly-selector">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Genome Assembly
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                  <Info className="w-3 h-3 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">
                  Select a genome assembly to set the context for gene search, sequence viewing, and variant analysis.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Select value={selectedAssembly} onValueChange={onAssemblyChange} disabled={isLoadingGenomes}>
          <SelectTrigger className="h-8 w-full text-xs bg-secondary border-border [&>span]:truncate [&>span]:font-mono">
            <SelectValue placeholder="Select assembly" />
          </SelectTrigger>
          <SelectContent>
            {genomes.map((assembly) => (
              <SelectItem key={assembly.id} value={assembly.id} className="text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-medium truncate">{assembly.id}</span>
                  <span className="text-muted-foreground truncate">({assembly.sourceName})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentAssembly && (
          <div className="mt-2 space-y-1 min-w-0">
            <p className="text-[10px] text-muted-foreground leading-relaxed break-words">
              {currentAssembly.description || currentAssembly.name}
            </p>
            <p className="text-[9px] text-muted-foreground/70 break-words">
              Source: {currentAssembly.sourceName}
            </p>
          </div>
        )}
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-destructive">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Discovery Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("search")}
          data-tour={activeTab === "search" ? "gene-search-tab" : undefined}
          className={cn(
            "flex-1 px-3 py-2 text-xs font-medium transition-colors",
            activeTab === "search"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Search Genes
        </button>
        <button
          onClick={() => setActiveTab("browse")}
          data-tour={activeTab === "browse" ? "browse-tab" : undefined}
          className={cn(
            "flex-1 px-3 py-2 text-xs font-medium transition-colors",
            activeTab === "browse"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Chromosomes
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "search" ? (
          <div className="flex flex-col h-full">
            {/* Search Input */}
            <div className="p-3 space-y-2">
              <div className="relative" data-tour="gene-search-input">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search gene symbol or name..."
                  className="h-8 pl-8 text-xs bg-secondary border-border"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  size="sm"
                  className="h-7 text-xs flex-1"
                >
                  {isSearching ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                  ) : (
                    <Search className="w-3 h-3 mr-1.5" />
                  )}
                  Search
                </Button>
                <Button
                  onClick={handleExampleSearch}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 bg-transparent"
                >
                  <Sparkles className="w-3 h-3" />
                  BRCA1
                </Button>
              </div>
            </div>

            {/* Results or Recent/Pinned */}
            <div className="flex-1 overflow-auto" data-tour="gene-results">
              {searchResults.length > 0 ? (
                <div className="p-3 pt-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Results ({searchResults.length})
                  </div>
                  <div className="space-y-1">
                    {searchResults.map((gene) => (
                      <GeneRow
                        key={gene.id}
                        gene={gene}
                        isSelected={selectedGene?.id === gene.id}
                        onClick={() => {
                          onGeneSelect(gene)
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 space-y-4">
                  {/* Pinned Genes */}
                  {pinnedGenes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Star className="w-3 h-3 text-primary" />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Pinned</span>
                      </div>
                      <div className="space-y-1">
                        {pinnedGenes.map((gene) => (
                          <GeneRow
                            key={gene.id}
                            gene={gene}
                            isSelected={selectedGene?.id === gene.id}
                            onClick={() => onGeneSelect(gene)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Genes */}
                  {recentGenes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Recent</span>
                      </div>
                      <div className="space-y-1">
                        {recentGenes.map((gene) => (
                          <GeneRow
                            key={gene.id}
                            gene={gene}
                            isSelected={selectedGene?.id === gene.id}
                            onClick={() => onGeneSelect(gene)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {searchQuery && !isSearching && searchResults.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-muted-foreground">No genes found</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Chromosome Browse */
          <div className="p-3 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Select Chromosome</div>
              {isLoadingChromosomes && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            </div>
            {chromosomes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {chromosomes.map((chrom) => (
                  <TooltipProvider key={chrom.chrom}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleChromosomeClick(chrom)}
                          className={cn(
                            "px-2 py-1 rounded text-xs font-mono transition-colors",
                            "bg-secondary hover:bg-accent border border-border hover:border-primary/50",
                          )}
                        >
                          {chrom.chrom.replace("chr", "")}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        <p>{chrom.chrom}</p>
                        <p className="text-[10px] text-muted-foreground">{chrom.size.toLocaleString()} bp</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">No chromosomes available</p>
              </div>
            )}

            {/* Results from chromosome selection */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Genes ({searchResults.length})
                </div>
                <div className="space-y-1">
                  {searchResults.map((gene) => (
                    <GeneRow
                      key={gene.id}
                      gene={gene}
                      isSelected={selectedGene?.id === gene.id}
                      onClick={() => onGeneSelect(gene)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function GeneRow({
  gene,
  isSelected,
  onClick,
}: {
  gene: Gene
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-2.5 py-2 rounded transition-colors group",
        isSelected
          ? "bg-primary/10 border border-primary/30"
          : "bg-secondary/50 hover:bg-accent border border-transparent",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-medium text-foreground">{gene.symbol}</span>
        <ChevronRight
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform",
            isSelected && "text-primary",
            "group-hover:translate-x-0.5",
          )}
        />
      </div>
      <div className="text-[10px] text-muted-foreground truncate mt-0.5">{gene.name}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] font-mono text-muted-foreground">{gene.chromosome}</span>
      </div>
    </button>
  )
}
