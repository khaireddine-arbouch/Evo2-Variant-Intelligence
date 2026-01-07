"use client"

import React, { useState, useRef, useCallback, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResizablePanelGroupProps {
  children: ReactNode
  direction: "horizontal" | "vertical"
  className?: string
}

interface ResizablePanelProps {
  children: ReactNode
  defaultSize?: number
  minSize?: number
  maxSize?: number
  className?: string
  id?: string
}

interface ResizeHandleProps {
  direction: "horizontal" | "vertical"
  onResize?: (delta: number) => void
}

export function ResizablePanelGroup({ children, direction, className }: ResizablePanelGroupProps) {
  return (
    <div className={cn("flex h-full w-full", direction === "horizontal" ? "flex-row" : "flex-col", className)}>
      {children}
    </div>
  )
}

export function ResizablePanel({
  children,
  defaultSize = 33,
  minSize = 10,
  maxSize = 80,
  className,
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize)
  const panelRef = useRef<HTMLDivElement>(null)

  // Store resize handler in ref for ResizeHandle to access
  const handleResize = useCallback(
    (delta: number) => {
      setSize((prev) => {
        const newSize = prev + delta
        const clampedSize = Math.min(Math.max(newSize, minSize), maxSize)
        // Store current size for resize handle to track
        if (panelRef.current) {
          ;(panelRef.current as any).__currentSize = clampedSize
        }
        return clampedSize
      })
    },
    [minSize, maxSize],
  )

  // Store handler and initial size in ref so ResizeHandle can access it
  React.useEffect(() => {
    if (panelRef.current) {
      ;(panelRef.current as any).__resizeHandler = handleResize
      ;(panelRef.current as any).__currentSize = size
      ;(panelRef.current as any).__minSize = minSize
      ;(panelRef.current as any).__maxSize = maxSize
    }
  }, [handleResize, size, minSize, maxSize])

  return (
    <div
      ref={panelRef}
      className={cn("overflow-hidden", className)}
      style={{ flexBasis: `${size}%`, flexGrow: 0, flexShrink: 0, minWidth: 0 }}
    >
      {children}
    </div>
  )
}

export function ResizeHandle({ direction, onResize }: ResizeHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const startPosRef = useRef<number>(0)
  const containerRef = useRef<HTMLElement | null>(null)
  const prevSizeRef = useRef<number>(0)
  const nextSizeRef = useRef<number>(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)

      const handle = handleRef.current
      if (!handle) return

      // Find the container (ResizablePanelGroup) - look for the flex container
      let container = handle.parentElement
      while (container) {
        const styles = window.getComputedStyle(container)
        if (styles.display === "flex" && (direction === "horizontal" ? styles.flexDirection === "row" : styles.flexDirection === "column")) {
          break
        }
        container = container.parentElement
        if (!container || container === document.body) {
          container = null
          break
        }
      }
      containerRef.current = container

      // Get initial mouse position
      startPosRef.current = direction === "horizontal" ? e.clientX : e.clientY

      // Get adjacent panels
      const prevPanel = handle.previousElementSibling as HTMLElement & { __resizeHandler?: (delta: number) => void; __currentSize?: number }
      const nextPanel = handle.nextElementSibling as HTMLElement & { __resizeHandler?: (delta: number) => void; __currentSize?: number }

      if (!prevPanel || !nextPanel) return

      const prevHandler = prevPanel.__resizeHandler
      const nextHandler = nextPanel.__resizeHandler

      if (!prevHandler || !nextHandler) return

      // Store initial sizes - prefer stored value, fallback to computed style
      const prevStoredSize = (prevPanel as any).__currentSize
      const nextStoredSize = (nextPanel as any).__currentSize
      
      if (prevStoredSize !== undefined && nextStoredSize !== undefined) {
        // Use stored sizes if available (more accurate)
        prevSizeRef.current = prevStoredSize
        nextSizeRef.current = nextStoredSize
      } else {
        // Fallback to reading from computed styles
        const prevStyle = window.getComputedStyle(prevPanel)
        const nextStyle = window.getComputedStyle(nextPanel)
        
        // Get current flexBasis values
        const prevFlexBasis = prevStyle.flexBasis
        const nextFlexBasis = nextStyle.flexBasis
        
        // Parse percentage values
        prevSizeRef.current = parseFloat(prevFlexBasis) || 0
        nextSizeRef.current = parseFloat(nextFlexBasis) || 0
      }

      // Get container dimensions
      const getContainerSize = () => {
        if (!containerRef.current) return { width: window.innerWidth, height: window.innerHeight }
        const rect = containerRef.current.getBoundingClientRect()
        return {
          width: rect.width,
          height: rect.height,
        }
      }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault()
        moveEvent.stopPropagation()

        const currentPos = direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY
        const deltaPixels = currentPos - startPosRef.current

        // Small threshold to prevent jittery resizing from tiny movements
        if (Math.abs(deltaPixels) < 0.5) return

        // Get container size for percentage calculation
        const containerSize = getContainerSize()
        const containerDimension = direction === "horizontal" ? containerSize.width : containerSize.height

        if (containerDimension === 0) return

        // Calculate delta as percentage of container
        const deltaPercent = (deltaPixels / containerDimension) * 100

        // Get current actual sizes from the panels (they might have been clamped)
        const prevCurrentSize = (prevPanel as any).__currentSize ?? prevSizeRef.current
        const nextCurrentSize = (nextPanel as any).__currentSize ?? nextSizeRef.current

        // Calculate desired new sizes
        const desiredPrevSize = prevCurrentSize + deltaPercent
        const desiredNextSize = nextCurrentSize - deltaPercent

        // Get min/max constraints from panel styles or refs
        const prevMinSize = parseFloat((prevPanel as any).__minSize) || 0
        const prevMaxSize = parseFloat((prevPanel as any).__maxSize) || 100
        const nextMinSize = parseFloat((nextPanel as any).__minSize) || 0
        const nextMaxSize = parseFloat((nextPanel as any).__maxSize) || 100

        // Clamp sizes
        const clampedPrevSize = Math.min(Math.max(desiredPrevSize, prevMinSize), prevMaxSize)
        const clampedNextSize = Math.min(Math.max(desiredNextSize, nextMinSize), nextMaxSize)

        // Calculate actual deltas after clamping
        const actualPrevDelta = clampedPrevSize - prevCurrentSize
        const actualNextDelta = clampedNextSize - nextCurrentSize

        // Only apply resize if there's an actual change
        if (Math.abs(actualPrevDelta) > 0.01 || Math.abs(actualNextDelta) > 0.01) {
          // Apply resize - only to the two adjacent panels
          if (Math.abs(actualPrevDelta) > 0.01) {
            prevHandler(actualPrevDelta)
          }
          if (Math.abs(actualNextDelta) > 0.01) {
            nextHandler(actualNextDelta)
          }

          // Update stored sizes to actual clamped values
          prevSizeRef.current = clampedPrevSize
          nextSizeRef.current = clampedNextSize
        }

        // Update start position for next move to prevent accumulation errors
        startPosRef.current = currentPos
      }

      const handleMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault()
        upEvent.stopPropagation()
        setIsDragging(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        // Prevent text selection
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
      }

      // Prevent text selection during drag
      document.body.style.userSelect = "none"
      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize"

      document.addEventListener("mousemove", handleMouseMove, { passive: false })
      document.addEventListener("mouseup", handleMouseUp, { passive: false })
    },
    [direction, onResize],
  )

  return (
    <div
      ref={handleRef}
      className={cn(
        "resize-handle flex-shrink-0 transition-colors select-none",
        direction === "horizontal"
          ? "w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary"
          : "h-1 cursor-row-resize hover:bg-primary/50 active:bg-primary",
        isDragging && "bg-primary",
      )}
      onMouseDown={handleMouseDown}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
      }}
    />
  )
}
