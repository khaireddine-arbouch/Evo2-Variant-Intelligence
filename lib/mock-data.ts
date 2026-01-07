// Mock data for development and demonstration

import type { GenomeAssembly, Chromosome, Gene, ClinVarVariant } from "./types"

export const mockGenomeAssemblies: GenomeAssembly[] = [
  {
    name: "hg38",
    organism: "Human",
    description: "Genome Reference Consortium Human Build 38",
    scientificName: "Homo sapiens",
    sourceName: "GRCh38",
    active: true,
  },
  {
    name: "hg19",
    organism: "Human",
    description: "Genome Reference Consortium Human Build 37",
    scientificName: "Homo sapiens",
    sourceName: "GRCh37",
    active: true,
  },
  {
    name: "mm39",
    organism: "Mouse",
    description: "Genome Reference Consortium Mouse Build 39",
    scientificName: "Mus musculus",
    sourceName: "GRCm39",
    active: true,
  },
  {
    name: "mm10",
    organism: "Mouse",
    description: "Genome Reference Consortium Mouse Build 38",
    scientificName: "Mus musculus",
    sourceName: "GRCm38",
    active: true,
  },
]

export const mockChromosomes: Chromosome[] = [
  { chrom: "chr1", size: 248956422 },
  { chrom: "chr2", size: 242193529 },
  { chrom: "chr3", size: 198295559 },
  { chrom: "chr4", size: 190214555 },
  { chrom: "chr5", size: 181538259 },
  { chrom: "chr6", size: 170805979 },
  { chrom: "chr7", size: 159345973 },
  { chrom: "chr8", size: 145138636 },
  { chrom: "chr9", size: 138394717 },
  { chrom: "chr10", size: 133797422 },
  { chrom: "chr11", size: 135086622 },
  { chrom: "chr12", size: 133275309 },
  { chrom: "chr13", size: 114364328 },
  { chrom: "chr14", size: 107043718 },
  { chrom: "chr15", size: 101991189 },
  { chrom: "chr16", size: 90338345 },
  { chrom: "chr17", size: 83257441 },
  { chrom: "chr18", size: 80373285 },
  { chrom: "chr19", size: 58617616 },
  { chrom: "chr20", size: 64444167 },
  { chrom: "chr21", size: 46709983 },
  { chrom: "chr22", size: 50818468 },
  { chrom: "chrX", size: 156040895 },
  { chrom: "chrY", size: 57227415 },
]

export const mockGenes: Gene[] = [
  {
    id: "1",
    symbol: "BRCA1",
    name: "BRCA1 DNA repair associated",
    chromosome: "chr17",
    start: 43044295,
    end: 43170245,
    strand: "-",
    description: "This gene encodes a nuclear phosphoprotein that plays a role in maintaining genomic stability.",
    organism: { scientificName: "Homo sapiens", commonName: "Human" },
    summary:
      "This gene encodes a nuclear phosphoprotein that plays a role in maintaining genomic stability, and it also acts as a tumor suppressor. The BRCA1 protein combines with other tumor suppressors, DNA damage sensors, and signal transducers to form a large multi-subunit protein complex known as the BRCA1-associated genome surveillance complex (BASC). This gene product associates with RNA polymerase II, and through the C-terminal domain, also interacts with histone deacetylase complex.",
    ncbiGeneId: "672",
  },
  {
    id: "2",
    symbol: "BRCA2",
    name: "BRCA2 DNA repair associated",
    chromosome: "chr13",
    start: 32315086,
    end: 32400266,
    strand: "+",
    description: "Involved in double-strand break repair and/or homologous recombination.",
    organism: { scientificName: "Homo sapiens", commonName: "Human" },
    summary:
      "This gene encodes a protein which plays a central role in DNA repair by homologous recombination. It is involved in double-strand break repair and maintains genome stability.",
    ncbiGeneId: "675",
  },
  {
    id: "3",
    symbol: "TP53",
    name: "Tumor protein p53",
    chromosome: "chr17",
    start: 7668421,
    end: 7687490,
    strand: "-",
    description: "Acts as a tumor suppressor in many tumor types.",
    organism: { scientificName: "Homo sapiens", commonName: "Human" },
    summary:
      "This gene encodes a tumor suppressor protein containing transcriptional activation, DNA binding, and oligomerization domains. The encoded protein responds to diverse cellular stresses to regulate expression of target genes, thereby inducing cell cycle arrest, apoptosis, senescence, DNA repair, or changes in metabolism.",
    ncbiGeneId: "7157",
  },
]

export const mockClinVarVariants: ClinVarVariant[] = [
  {
    id: "VCV000017661",
    title: "NM_007294.4(BRCA1):c.5266dupC (p.Gln1756fs)",
    variationType: "Duplication",
    clinicalSignificance: "Pathogenic",
    chromosome: "chr17",
    position: 43057051,
    referenceAllele: "C",
    alternateAllele: "CC",
  },
  {
    id: "VCV000017662",
    title: "NM_007294.4(BRCA1):c.68_69delAG (p.Glu23fs)",
    variationType: "Deletion",
    clinicalSignificance: "Pathogenic",
    chromosome: "chr17",
    position: 43124027,
    referenceAllele: "AG",
    alternateAllele: "A",
  },
  {
    id: "VCV000037476",
    title: "NM_007294.4(BRCA1):c.181T>G (p.Cys61Gly)",
    variationType: "Single nucleotide variant",
    clinicalSignificance: "Pathogenic",
    chromosome: "chr17",
    position: 43115725,
    referenceAllele: "T",
    alternateAllele: "G",
  },
  {
    id: "VCV000055324",
    title: "NM_007294.4(BRCA1):c.5123C>A (p.Ala1708Glu)",
    variationType: "Single nucleotide variant",
    clinicalSignificance: "Pathogenic",
    chromosome: "chr17",
    position: 43063368,
    referenceAllele: "C",
    alternateAllele: "A",
  },
  {
    id: "VCV000125846",
    title: "NM_007294.4(BRCA1):c.4837A>G (p.Ser1613Gly)",
    variationType: "Single nucleotide variant",
    clinicalSignificance: "Benign",
    chromosome: "chr17",
    position: 43067607,
    referenceAllele: "A",
    alternateAllele: "G",
  },
  {
    id: "VCV000038064",
    title: "NM_007294.4(BRCA1):c.2612C>T (p.Pro871Leu)",
    variationType: "Single nucleotide variant",
    clinicalSignificance: "Benign",
    chromosome: "chr17",
    position: 43091983,
    referenceAllele: "C",
    alternateAllele: "T",
  },
  {
    id: "VCV000052153",
    title: "NM_007294.4(BRCA1):c.3113A>G (p.Glu1038Gly)",
    variationType: "Single nucleotide variant",
    clinicalSignificance: "Uncertain significance",
    chromosome: "chr17",
    position: 43082403,
    referenceAllele: "A",
    alternateAllele: "G",
  },
]

// Generate a mock DNA sequence
export function generateMockSequence(length: number): string {
  const bases = ["A", "T", "G", "C"]
  return Array.from({ length }, () => bases[Math.floor(Math.random() * 4)]).join("")
}
