import type { Gene } from "./types"

export interface GeneStructureMapping {
  pdbId?: string
  pdbUrl?: string
}

const GENE_TO_STRUCTURE: Record<string, GeneStructureMapping> = {
  // Tumor suppressors
  BRCA1: { pdbId: "1T15" }, // BRCT domains of BRCA1
  BRCA2: { pdbId: "1MIU" },
  TP53: { pdbId: "1TUP" }, // p53 core domain

  // Receptor tyrosine kinases
  EGFR: { pdbId: "2ITN" },
  ERBB2: { pdbId: "3PP0" },

  // Other clinically relevant examples
  CFTR: { pdbId: "5UAK" },
  KRAS: { pdbId: "4OBE" },
  BRAF: { pdbId: "1UWH" },
}

export interface AvailableStructure {
  gene: string
  pdbId: string
  description?: string
}

export const AVAILABLE_STRUCTURES: AvailableStructure[] = [
  { gene: "BRCA1", pdbId: "1T15", description: "BRCT domains of BRCA1" },
  { gene: "BRCA2", pdbId: "1MIU", description: "BRCA2" },
  { gene: "TP53", pdbId: "1TUP", description: "p53 core domain" },
  { gene: "EGFR", pdbId: "2ITN", description: "Epidermal Growth Factor Receptor" },
  { gene: "ERBB2", pdbId: "3PP0", description: "ERBB2/HER2" },
  { gene: "CFTR", pdbId: "5UAK", description: "Cystic Fibrosis Transmembrane Conductance Regulator" },
  { gene: "KRAS", pdbId: "4OBE", description: "KRAS oncogene" },
  { gene: "BRAF", pdbId: "1UWH", description: "BRAF kinase" },
]

export function getStructureForGene(gene: Gene | null): GeneStructureMapping | null {
  if (!gene?.symbol) return null

  const symbolUpper = gene.symbol.toUpperCase()

  // Direct exact match
  const direct = GENE_TO_STRUCTURE[symbolUpper]
  if (direct) return direct

  // Heuristic prefix/contains matches to handle verbose symbols like
  // "BRCA1 associated deubiquitinase 1" while still mapping to BRCA1.
  if (symbolUpper.startsWith("BRCA1")) return GENE_TO_STRUCTURE.BRCA1
  if (symbolUpper.startsWith("BRCA2")) return GENE_TO_STRUCTURE.BRCA2
  if (symbolUpper.startsWith("TP53")) return GENE_TO_STRUCTURE.TP53
  if (symbolUpper.startsWith("EGFR")) return GENE_TO_STRUCTURE.EGFR
  if (symbolUpper.startsWith("ERBB2")) return GENE_TO_STRUCTURE.ERBB2
  if (symbolUpper.startsWith("CFTR")) return GENE_TO_STRUCTURE.CFTR
  if (symbolUpper.startsWith("KRAS")) return GENE_TO_STRUCTURE.KRAS
  if (symbolUpper.startsWith("BRAF")) return GENE_TO_STRUCTURE.BRAF

  // Fallback: try substring contains for key names
  const heuristicKey = Object.keys(GENE_TO_STRUCTURE).find((key) => symbolUpper.includes(key))
  if (heuristicKey) {
    return GENE_TO_STRUCTURE[heuristicKey]
  }

  return null
}


