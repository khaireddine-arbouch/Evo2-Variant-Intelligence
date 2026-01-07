"use client"

import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { useTour } from "./tour-provider"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ExplainButtonProps {
  sectionId: string
  miniTourSteps: Array<{
    target: string
    content: React.ReactNode
    placement?: "top" | "bottom" | "left" | "right" | "center"
  }>
  className?: string
}

export function ExplainButton({ sectionId, miniTourSteps, className }: ExplainButtonProps) {
  const [showButton, setShowButton] = useState(false)
  const { startMiniTour } = useTour()

  useEffect(() => {
    // Check if guide mode is active (set when Guide button is clicked)
    const checkGuideMode = () => {
      const guideMode = sessionStorage.getItem("evo2-guide-mode") === "true"
      setShowButton(guideMode)
    }
    
    checkGuideMode()
    
    // Listen for guide mode changes
    const handleGuideModeChange = (event: CustomEvent) => {
      setShowButton(event.detail.active)
    }
    
    window.addEventListener("evo2-guide-mode-changed", handleGuideModeChange as EventListener)
    
    return () => {
      window.removeEventListener("evo2-guide-mode-changed", handleGuideModeChange as EventListener)
    }
  }, [])

  if (!showButton) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => startMiniTour?.(sectionId, miniTourSteps)}
      className={cn(
        "h-7 px-2 gap-1.5 text-xs bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary",
        className
      )}
      title="Learn about this section"
    >
      <HelpCircle className="w-3.5 h-3.5" />
      <span>Explain</span>
    </Button>
  )
}

