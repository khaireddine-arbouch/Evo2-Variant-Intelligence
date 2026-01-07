"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AVAILABLE_STRUCTURES, type GeneStructureMapping } from "@/lib/structure-map"
import { cn } from "@/lib/utils"

export interface StructureSelectorProps {
  value?: GeneStructureMapping | null
  onChange: (structure: GeneStructureMapping | null) => void
  className?: string
}

export function StructureSelector({ value, onChange, className }: StructureSelectorProps) {
  const [customPdbId, setCustomPdbId] = useState("")
  const [useCustom, setUseCustom] = useState(false)

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "custom") {
      setUseCustom(true)
      if (customPdbId.trim()) {
        onChange({ pdbId: customPdbId.trim() })
      } else {
        onChange(null)
      }
    } else if (selectedValue === "none") {
      setUseCustom(false)
      onChange(null)
    } else {
      setUseCustom(false)
      const structure = AVAILABLE_STRUCTURES.find((s) => s.pdbId === selectedValue)
      if (structure) {
        onChange({ pdbId: structure.pdbId })
      }
    }
  }

  const handleCustomPdbIdChange = (newPdbId: string) => {
    setCustomPdbId(newPdbId)
    if (newPdbId.trim()) {
      onChange({ pdbId: newPdbId.trim() })
    } else {
      onChange(null)
    }
  }

  const currentValue = value?.pdbId || (useCustom && customPdbId ? "custom" : "none")

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Structure Selection
      </Label>
      <Select value={currentValue} onValueChange={handleSelectChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Select structure..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No structure</SelectItem>
          <SelectItem value="custom">Custom PDB ID...</SelectItem>
          {AVAILABLE_STRUCTURES.map((structure) => (
            <SelectItem key={structure.pdbId} value={structure.pdbId}>
              {structure.gene} ({structure.pdbId})
              {structure.description && ` - ${structure.description}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {useCustom && (
        <div className="space-y-1">
          <Label htmlFor="custom-pdb" className="text-[10px] text-muted-foreground">
            Enter PDB ID
          </Label>
          <Input
            id="custom-pdb"
            type="text"
            placeholder="e.g., 1T15"
            value={customPdbId}
            onChange={(e) => handleCustomPdbIdChange(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      )}
    </div>
  )
}

