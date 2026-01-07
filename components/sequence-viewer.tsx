"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, Loader2, ArrowRight, ArrowLeft, ZoomIn, ZoomOut, Info } from "lucide-react"
import type { Gene } from "@/lib/types"
import { fetchGeneSequence } from "@/lib/api"
import { sequenceCache } from "@/lib/sequence-cache"
import { cn } from "@/lib/utils"

const MAX_VIEW_RANGE = 10000
const BASES_PER_LINE = 60

interface SequenceViewerProps {
  gene: Gene | null
  assembly: string
  onBaseClick?: (position: number, base: string) => void
  onBaseHover?: (position: number | null, base: string | null) => void
}

export function SequenceViewer({ gene, assembly, onBaseClick, onBaseHover }: SequenceViewerProps) {
  const [viewStart, setViewStart] = useState(0)
  const [viewEnd, setViewEnd] = useState(0)
  const [inputStart, setInputStart] = useState("")
  const [inputEnd, setInputEnd] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sequence, setSequence] = useState("")
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [startSliderValue, setStartSliderValue] = useState([0])
  const [endSliderValue, setEndSliderValue] = useState([MAX_VIEW_RANGE])
  const [isDragging, setIsDragging] = useState(false)
  const loadTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const rafRef = useRef<number | undefined>(undefined)
  const pendingLoadRef = useRef<{ start: number; end: number } | null>(null)

  // Initialize view when gene changes
  useEffect(() => {
    if (gene) {
      // Validate gene coordinates
      const hasValidCoords = gene._hasValidCoordinates !== false && gene.start && gene.end && gene.start > 0 && gene.end > gene.start
      if (!hasValidCoords) {
        setError(`Genomic coordinates not available for ${gene.symbol}. This gene may not be mapped to the reference genome, or detailed information could not be retrieved.`)
        setSequence("")
        setViewStart(0)
        setViewEnd(0)
      setInputStart("")
      setInputEnd("")
      setStartSliderValue([0])
      setEndSliderValue([MAX_VIEW_RANGE])
      return
      }
      
      const geneLength = gene.end - gene.start
      const initialLength = Math.min(geneLength, MAX_VIEW_RANGE)
      const initialEnd = Math.min(gene.start + initialLength, gene.end)
      setViewStart(gene.start)
      setViewEnd(initialEnd)
      setInputStart(gene.start.toString())
      setInputEnd(initialEnd.toString())
      setStartSliderValue([0])
      setEndSliderValue([initialLength])
      setError(null)
      loadSequence(gene.start, initialEnd)
    }
  }, [gene])

  const loadSequence = useCallback(async (start: number, end: number) => {
    if (!gene) return

    // Check cache first
    const cached = sequenceCache.get(gene.chromosome, start, end, assembly)
    if (cached) {
      setSequence(cached)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const { sequence, error: apiError } = await fetchGeneSequence(gene.chromosome, start, end, assembly)
      if (apiError) {
        setError(apiError)
        setSequence("")
      } else {
        setSequence(sequence)
        // Cache the sequence
        sequenceCache.set(gene.chromosome, start, end, assembly, sequence)
      }
    } catch (err) {
      setError("Failed to load sequence")
      setSequence("")
      console.error("Error loading sequence:", err)
    } finally {
      setIsLoading(false)
    }
  }, [gene, assembly])

  const handleLoadSequence = () => {
    if (!gene) return

    const start = Number.parseInt(inputStart)
    const end = Number.parseInt(inputEnd)

    // Validation
    if (isNaN(start) || isNaN(end)) {
      setError("Please enter valid numeric positions")
      return
    }
    if (start >= end) {
      setError("Start position must be less than end position")
      return
    }
    if (start < gene.start || end > gene.end) {
      setError(`Positions must be within gene bounds (${gene.start.toLocaleString()} - ${gene.end.toLocaleString()})`)
      return
    }
    if (end - start > MAX_VIEW_RANGE) {
      setError(`Maximum view range is ${MAX_VIEW_RANGE.toLocaleString()} bp`)
      return
    }

    setViewStart(start)
    setViewEnd(end)
    setStartSliderValue([start - gene.start])
    setEndSliderValue([end - start])
    loadSequence(start, end)
  }

  // Update UI immediately without fetching sequence
  const updateViewRange = useCallback((newStart: number, newEnd: number) => {
    setViewStart(newStart)
    setViewEnd(newEnd)
    setInputStart(newStart.toString())
    setInputEnd(newEnd.toString())
  }, [])

  // Schedule sequence load using requestAnimationFrame for smooth updates
  const scheduleSequenceLoad = useCallback((start: number, end: number) => {
    pendingLoadRef.current = { start, end }
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    
    rafRef.current = requestAnimationFrame(() => {
      if (pendingLoadRef.current && !isDragging) {
        const { start: s, end: e } = pendingLoadRef.current
        loadSequence(s, e)
        pendingLoadRef.current = null
      }
    })
  }, [isDragging, loadSequence])

  const handleStartSliderChange = useCallback(
    (value: number[]) => {
      if (!gene) return

      const [sliderStart] = value
      setStartSliderValue(value)
      setIsDragging(true)
      
      const newStart = gene.start + sliderStart
      const currentEnd = viewEnd
      const newEnd = Math.min(Math.max(newStart + 100, currentEnd), gene.end)

      updateViewRange(newStart, newEnd)
      setEndSliderValue([newEnd - newStart])

      // Only schedule load if not dragging (will be triggered on release)
      if (!isDragging) {
        scheduleSequenceLoad(newStart, newEnd)
      }
    },
    [gene, viewEnd, updateViewRange, isDragging, scheduleSequenceLoad],
  )

  const handleEndSliderChange = useCallback(
    (value: number[]) => {
      if (!gene) return

      const [sliderLength] = value
      setEndSliderValue(value)
      setIsDragging(true)
      
      const currentStart = viewStart
      const newEnd = Math.min(currentStart + sliderLength, gene.end)
      const newStart = Math.max(gene.start, newEnd - MAX_VIEW_RANGE)

      updateViewRange(newStart, newEnd)
      setStartSliderValue([newStart - gene.start])

      // Only schedule load if not dragging
      if (!isDragging) {
        scheduleSequenceLoad(newStart, newEnd)
      }
    },
    [gene, viewStart, updateViewRange, isDragging, scheduleSequenceLoad],
  )

  // Handle slider release - actually load the sequence
  const handleSliderRelease = useCallback(() => {
    setIsDragging(false)
    
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    
    // Load sequence immediately on release
    if (pendingLoadRef.current) {
      const { start, end } = pendingLoadRef.current
      loadSequence(start, end)
      pendingLoadRef.current = null
    } else {
      // Load current view range
      loadSequence(viewStart, viewEnd)
    }
  }, [viewStart, viewEnd, loadSequence])

  // Cleanup timeouts and animation frames on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const handleBaseClick = useCallback(
    (position: number, base: string) => {
      setSelectedPosition(position)
      setHoveredPosition(null) // Clear hover on click
      onBaseClick?.(position, base)
      onBaseHover?.(null, null) // Clear hover callback
    },
    [onBaseClick, onBaseHover],
  )

  const handleBaseHover = useCallback(
    (position: number | null, base: string | null) => {
      setHoveredPosition(position)
      
      // Aggressive throttling - only update every 150ms
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      
      hoverTimeoutRef.current = setTimeout(() => {
        onBaseHover?.(position, base)
      }, 150) // Increased delay for better performance
    },
    [onBaseHover],
  )

  const startSliderMax = useMemo(() => {
    if (!gene) return 100
    const geneLength = gene.end - gene.start
    const currentLength = viewEnd - viewStart
    return Math.max(0, geneLength - currentLength)
  }, [gene, viewEnd, viewStart])

  const endSliderMax = useMemo(() => {
    if (!gene) return MAX_VIEW_RANGE
    const geneLength = gene.end - gene.start
    const currentStart = viewStart - gene.start
    return Math.min(MAX_VIEW_RANGE, geneLength - currentStart)
  }, [gene, viewStart])

  if (!gene) {
    return (
      <div className="h-full flex items-center justify-center bg-card border-t border-border">
        <p className="text-xs text-muted-foreground">Select a gene to view sequence</p>
      </div>
    )
  }

  const geneLength = gene.end - gene.start
  const viewLength = viewEnd - viewStart

  return (
    <div className="h-full flex flex-col bg-card border-t border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sequence Viewer</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">
                      View and navigate the DNA sequence. Click on any nucleotide to analyze variants at that position.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {gene.strand === "+" ? (
                <ArrowRight className="w-3 h-3 text-chart-1" />
              ) : (
                <ArrowLeft className="w-3 h-3 text-chart-2" />
              )}
              <span>{gene.strand === "+" ? "Forward" : "Reverse"} strand</span>
            </div>
          </div>
          <NucleotideLegend />
        </div>

        {/* Range Summary */}
        <div className="grid grid-cols-4 gap-4 text-xs mb-3">
          <div>
            <span className="text-muted-foreground">Gene span: </span>
            <span className="font-mono">{geneLength.toLocaleString()} bp</span>
          </div>
          <div>
            <span className="text-muted-foreground">View: </span>
            <span className="font-mono">{viewLength.toLocaleString()} bp</span>
          </div>
          <div className="col-span-2 text-right">
            <span className="text-muted-foreground">Max window: </span>
            <span className="font-mono">{MAX_VIEW_RANGE.toLocaleString()} bp</span>
          </div>
        </div>

        {/* Range Sliders */}
        <div className="space-y-3">
          {/* Start Position Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Start Position</span>
              <span className="font-mono text-primary">{viewStart.toLocaleString()}</span>
            </div>
            <Slider
              value={startSliderValue}
              onValueChange={handleStartSliderChange}
              onValueCommit={handleSliderRelease}
              max={startSliderMax}
              step={Math.max(1, Math.floor(startSliderMax / 500))}
              className="w-full"
            />
            <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
              <span>{gene.start.toLocaleString()}</span>
              <span>{gene.end.toLocaleString()}</span>
            </div>
          </div>

          {/* End Position Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>View Range</span>
              <span className="font-mono text-primary">{viewLength.toLocaleString()} bp</span>
            </div>
            <Slider
              value={endSliderValue}
              onValueChange={handleEndSliderChange}
              onValueCommit={handleSliderRelease}
              max={endSliderMax}
              min={100}
              step={Math.max(10, Math.floor(endSliderMax / 500))}
              className="w-full"
            />
            <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
              <span>100 bp</span>
              <span>{MAX_VIEW_RANGE.toLocaleString()} bp</span>
            </div>
          </div>
        </div>

        {/* Manual Input */}
        <div className="flex items-center gap-2 mt-3">
          <Input
            value={inputStart}
            onChange={(e) => setInputStart(e.target.value)}
            placeholder="Start"
            className="h-7 w-28 text-xs font-mono bg-secondary"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            value={inputEnd}
            onChange={(e) => setInputEnd(e.target.value)}
            placeholder="End"
            className="h-7 w-28 text-xs font-mono bg-secondary"
          />
          <Button onClick={handleLoadSequence} disabled={isLoading} size="sm" className="h-7 text-xs">
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Load"}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-2 text-xs text-destructive">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
      </div>

      {/* Sequence Display */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm scroll-smooth">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <SequenceDisplay
            sequence={sequence}
            startPosition={viewStart}
            selectedPosition={selectedPosition}
            hoveredPosition={hoveredPosition}
            onBaseClick={handleBaseClick}
            onBaseHover={handleBaseHover}
          />
        )}
      </div>
    </div>
  )
}

function NucleotideLegend() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <span className="w-4 h-4 rounded-sm bg-nucleotide-a flex items-center justify-center text-[10px] font-bold text-background">
          A
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-4 h-4 rounded-sm bg-nucleotide-t flex items-center justify-center text-[10px] font-bold text-background">
          T
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-4 h-4 rounded-sm bg-nucleotide-g flex items-center justify-center text-[10px] font-bold text-background">
          G
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-4 h-4 rounded-sm bg-nucleotide-c flex items-center justify-center text-[10px] font-bold text-background">
          C
        </span>
      </div>
    </div>
  )
}

// Memoized nucleotide button to prevent unnecessary re-renders
const NucleotideButton = React.memo(function NucleotideButton({
  base,
  position,
  isSelected,
  isHovered,
  onClick,
  onHover,
  getStyle,
}: {
  base: string
  position: number
  isSelected: boolean
  isHovered: boolean
  onClick: (position: number, base: string) => void
  onHover: (position: number | null, base: string | null) => void
  getStyle: (base: string, position: number, isSelected: boolean, isHovered: boolean) => string
}) {
  const handleClick = useCallback(() => {
    onClick(position, base)
  }, [onClick, position, base])

  const handleMouseEnter = useCallback(() => {
    onHover(position, base)
  }, [onHover, position, base])

  const handleMouseLeave = useCallback(() => {
    onHover(null, null)
  }, [onHover])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={getStyle(base, position, isSelected, isHovered)}
          aria-label={`Nucleotide ${base} at position ${position.toLocaleString()}`}
        >
          {base}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs font-mono">
        Position: {position.toLocaleString()} ({base})
      </TooltipContent>
    </Tooltip>
  )
})

const SequenceDisplay = React.memo(function SequenceDisplay({
  sequence,
  startPosition,
  selectedPosition,
  hoveredPosition,
  onBaseClick,
  onBaseHover,
}: {
  sequence: string
  startPosition: number
  selectedPosition: number | null
  hoveredPosition: number | null
  onBaseClick: (position: number, base: string) => void
  onBaseHover: (position: number | null, base: string | null) => void
}) {
  const lines = useMemo(() => {
    const result: { position: number; bases: string }[] = []
    for (let i = 0; i < sequence.length; i += BASES_PER_LINE) {
      result.push({
        position: startPosition + i,
        bases: sequence.slice(i, i + BASES_PER_LINE),
      })
    }
    return result
  }, [sequence, startPosition])

  // Memoize style function to prevent recreation on every render
  const getNucleotideStyle = useCallback((base: string, position: number, isSelected: boolean, isHovered: boolean) => {
    const baseStyles = {
      A: "bg-nucleotide-a/90 text-background hover:bg-nucleotide-a",
      T: "bg-nucleotide-t/90 text-background hover:bg-nucleotide-t",
      G: "bg-nucleotide-g/90 text-background hover:bg-nucleotide-g",
      C: "bg-nucleotide-c/90 text-background hover:bg-nucleotide-c",
    }
    
    return cn(
      "w-5 h-6 text-xs font-bold rounded-sm transition-all duration-75",
      "flex items-center justify-center",
      "hover:scale-110 hover:shadow-md",
      "active:scale-95",
      baseStyles[base as keyof typeof baseStyles] || "bg-muted text-foreground",
      isHovered && "ring-1 ring-primary/50 ring-offset-1 ring-offset-background scale-105",
      isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 shadow-lg z-10",
    )
  }, [])

  return (
    <TooltipProvider>
      <div className="space-y-1">
        {lines.map((line, lineIdx) => (
          <div key={`${line.position}-${lineIdx}`} className="flex items-center gap-3">
            <span className="w-24 text-right text-[10px] text-muted-foreground tabular-nums select-none">
              {line.position.toLocaleString()}
            </span>
            <div className="flex flex-wrap gap-0.5">
              {line.bases.split("").map((base, idx) => {
                const position = line.position + idx
                const isSelected = position === selectedPosition
                const isHovered = position === hoveredPosition

                return (
                  <NucleotideButton
                    key={`${position}-${idx}`}
                    base={base}
                    position={position}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    onClick={onBaseClick}
                    onHover={onBaseHover}
                    getStyle={getNucleotideStyle}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
})
