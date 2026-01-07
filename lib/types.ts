// Core types for Evo2 Variant Intelligence

export interface GenomeAssembly {
  id: string
  name: string
  sourceName: string
  active: boolean
  organism?: string
  description?: string
  scientificName?: string
}

export interface Chromosome {
  chrom: string
  size: number
}

export interface Gene {
  id: string
  symbol: string
  name: string
  chromosome: string
  start: number
  end: number
  strand: "+" | "-"
  description?: string
  organism?: {
    scientificName: string
    commonName: string
  }
  summary?: string
  ncbiGeneId?: string
  _hasValidCoordinates?: boolean // Internal flag to track if coordinates are valid
}

export interface SequenceData {
  sequence: string
  start: number
  end: number
  chromosome: string
}

export type MutationType = "SNV" | "DELETION" | "INSERTION" | "DUPLICATION" | "MICROSATELLITE" | "INDEL" | "INVERSION" | "TRANSLOCATION"

export interface VariantAnalysisResult {
  position: number
  chromosome: string
  reference: string
  alternative: string
  deltaScore: number
  prediction: "Likely pathogenic" | "Likely benign" | "Uncertain significance"
  confidence: number
  pathogenicityProbability?: number  // Raw probability estimate (0-1)
  geneSymbol?: string
  mutationType?: MutationType
}

export interface ClinVarVariant {
  id: string
  title: string
  variationType: string
  clinicalSignificance: string
  chromosome: string
  position: number
  referenceAllele?: string
  alternateAllele?: string
  evo2Result?: VariantAnalysisResult
}

export interface Session {
  id: string
  name: string
  createdAt: Date
  genomeAssembly: string
  pinnedGenes: Gene[]
  analyzedVariants: VariantAnalysisResult[]
}
