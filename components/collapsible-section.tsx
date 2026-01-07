"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { ResizablePanel } from "@/components/resizable-panels"

export interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultCollapsed?: boolean
  defaultSize?: number
  minSize?: number
  maxSize?: number
  className?: string
  headerClassName?: string
  showResize?: boolean
}

export function CollapsibleSection({
  title,
  children,
  defaultCollapsed = false,
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  className,
  headerClassName,
  showResize = true,
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev)
  }

  const content = (
    <div className="flex flex-col h-full">
      <button
        type="button"
        onClick={toggleCollapse}
        className={cn(
          "flex items-center justify-between px-3 py-2 border-b border-border bg-card hover:bg-accent/50 transition-colors flex-shrink-0",
          headerClassName,
        )}
      >
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
        {isCollapsed ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
      {!isCollapsed && <div className="flex-1 min-h-0 overflow-auto">{children}</div>}
    </div>
  )

  if (showResize) {
    return (
      <ResizablePanel
        defaultSize={defaultSize}
        minSize={minSize}
        maxSize={maxSize}
        className={cn("flex flex-col overflow-hidden", className)}
      >
        {content}
      </ResizablePanel>
    )
  }

  return (
    <div className={cn("flex flex-col border border-border rounded-md overflow-hidden h-full", className)}>
      {content}
    </div>
  )
}

