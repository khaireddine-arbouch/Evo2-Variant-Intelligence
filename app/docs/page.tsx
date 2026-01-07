"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  BookOpen, 
  Code, 
  Zap, 
  Shield, 
  Database,
  ArrowRight,
  Copy,
  Check,
  FileText,
  Layers,
  Cpu
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DocSection {
  id: string
  title: string
  content: React.ReactNode
}

export default function DocsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [scrollTarget, setScrollTarget] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const CodeBlock = ({ code, language = "bash", id }: { code: string; language?: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-lg overflow-x-auto text-sm font-mono border border-border">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-background/80 hover:bg-background border border-border"
      >
        {copiedCode === id ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </div>
  )

  const sections: DocSection[] = useMemo(() => [
    {
      id: "overview",
      title: "Overview",
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Evo2 Variant Intelligence API</h2>
            <p className="text-muted-foreground leading-relaxed">
              A production-grade API for predicting pathogenicity of genetic variants using the Evo2 deep learning model. 
              The API supports Single Nucleotide Variants (SNVs), deletions, and insertions across multiple genome assemblies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <Zap className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Fast Inference</h3>
              <p className="text-sm text-muted-foreground">Powered by NVIDIA H100 GPUs for rapid variant analysis</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <Shield className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Secure</h3>
              <p className="text-sm text-muted-foreground">API key authentication and production-grade security</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <Database className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Multiple Genomes</h3>
              <p className="text-sm text-muted-foreground">Support for hg38, hg19, and other UCSC genome assemblies</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "quickstart",
      title: "Quick Start",
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
            <p className="text-muted-foreground mb-4">
              Get started with the API in minutes. First, obtain your API key, then make your first request.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">1. Get Your API Key</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Contact support to obtain your API key. Include it in the <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">X-API-Key</code> header.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">2. Analyze a Variant</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Make a POST request to analyze a single nucleotide variant:
              </p>
              <CodeBlock
                id="quickstart-curl"
                code={`curl -X POST https://your-api-url.modal.run/analyze_single_variant \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key-here" \\
  -d '{
    "variant_position": 43119628,
    "alternative": "G",
    "genome": "hg38",
    "chromosome": "chr17",
    "mutation_type": "SNV"
  }'`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">3. Response</h3>
              <CodeBlock
                id="quickstart-response"
                language="json"
                code={`{
  "position": 43119628,
  "chromosome": "chr17",
  "genome": "hg38",
  "reference": "A",
  "alternative": "G",
  "delta_score": -0.001234,
  "prediction": "Likely pathogenic",
  "classification_confidence": 0.85,
  "mutation_type": "SNV"
}`}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: "api-reference",
      title: "API Reference",
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">API Reference</h2>
            <p className="text-muted-foreground">
              Complete reference for all API endpoints and parameters.
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-l-4 border-primary pl-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-mono rounded">POST</span>
                <code className="text-sm font-mono">/analyze_single_variant</code>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Analyze a single genetic variant for pathogenicity prediction.
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Body</h4>
                  <div className="bg-secondary rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-semibold">Parameter</th>
                          <th className="text-left py-2 font-semibold">Type</th>
                          <th className="text-left py-2 font-semibold">Required</th>
                          <th className="text-left py-2 font-semibold">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 font-mono text-xs">variant_position</td>
                          <td className="py-2">integer</td>
                          <td className="py-2">Yes</td>
                          <td className="py-2">1-based genomic position</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 font-mono text-xs">alternative</td>
                          <td className="py-2">string</td>
                          <td className="py-2">Yes</td>
                          <td className="py-2">Alternative allele (nucleotide(s) or "-" for deletion)</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 font-mono text-xs">genome</td>
                          <td className="py-2">string</td>
                          <td className="py-2">Yes</td>
                          <td className="py-2">Genome assembly (e.g., "hg38", "hg19")</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 font-mono text-xs">chromosome</td>
                          <td className="py-2">string</td>
                          <td className="py-2">Yes</td>
                          <td className="py-2">Chromosome (e.g., "chr17", "chr1")</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 font-mono text-xs">mutation_type</td>
                          <td className="py-2">enum</td>
                          <td className="py-2">No</td>
                          <td className="py-2">"SNV", "DELETION", "INSERTION", "DUPLICATION", "MICROSATELLITE", "INDEL", "INVERSION", or "TRANSLOCATION" (default: "SNV")</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-xs">reference</td>
                          <td className="py-2">string</td>
                          <td className="py-2">No</td>
                          <td className="py-2">Reference allele (auto-detected if not provided)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Response</h4>
                  <CodeBlock
                    id="api-response"
                    language="json"
                    code={`{
  "position": 43119628,
  "chromosome": "chr17",
  "genome": "hg38",
  "reference": "A",
  "alternative": "G",
  "delta_score": -0.001234,
  "prediction": "Likely pathogenic" | "Likely benign",
  "classification_confidence": 0.85,
  "mutation_type": "SNV"
}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "mutation-types",
      title: "Mutation Types",
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Mutation Types</h2>
            <p className="text-muted-foreground">
              The API supports multiple types of genetic mutations. Each type has specific requirements for the request parameters.
            </p>
          </div>

          <div className="space-y-6">
            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-lg font-semibold">SNV (Single Nucleotide Variant)</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                A substitution of a single nucleotide. This is the default mutation type.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Example Request:</p>
                <CodeBlock
                  id="snv-example"
                  language="json"
                  code={`{
  "variant_position": 43119628,
  "alternative": "G",
  "genome": "hg38",
  "chromosome": "chr17",
  "mutation_type": "SNV"
}`}
                />
                <p className="text-xs text-muted-foreground">
                  • <code className="px-1 py-0.5 bg-secondary rounded">alternative</code> must be a single nucleotide (A, C, G, or T)
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-lg font-semibold">Deletion</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Removal of one or more nucleotides from the reference sequence.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Example Request:</p>
                <CodeBlock
                  id="deletion-example"
                  language="json"
                  code={`{
  "variant_position": 43119628,
  "alternative": "-",
  "genome": "hg38",
  "chromosome": "chr17",
  "mutation_type": "DELETION",
  "reference": "A"
}`}
                />
                <p className="text-xs text-muted-foreground">
                  • <code className="px-1 py-0.5 bg-secondary rounded">alternative</code> should be "-" or empty string
                  <br />
                  • <code className="px-1 py-0.5 bg-secondary rounded">reference</code> specifies the nucleotide(s) to delete
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-lg font-semibold">Insertion</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Addition of one or more nucleotides after the reference position.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Example Request:</p>
                <CodeBlock
                  id="insertion-example"
                  language="json"
                  code={`{
  "variant_position": 43119628,
  "alternative": "ACGT",
  "genome": "hg38",
  "chromosome": "chr17",
  "mutation_type": "INSERTION",
  "reference": "A"
}`}
                />
                <p className="text-xs text-muted-foreground">
                  • <code className="px-1 py-0.5 bg-secondary rounded">alternative</code> is the sequence to insert (non-empty, A/C/G/T only)
                  <br />
                  • <code className="px-1 py-0.5 bg-secondary rounded">reference</code> is the nucleotide before the insertion point
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-lg font-semibold">Duplication</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Duplication of a sequence segment. The reference sequence is duplicated one or more times.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Example Request:</p>
                <CodeBlock
                  id="duplication-example"
                  language="json"
                  code={`{
  "variant_position": 43119628,
  "alternative": "2",
  "genome": "hg38",
  "chromosome": "chr17",
  "mutation_type": "DUPLICATION",
  "reference": "ATCG"
}`}
                />
                <p className="text-xs text-muted-foreground">
                  • <code className="px-1 py-0.5 bg-secondary rounded">alternative</code> can be a number of copies (e.g., "2", "3") or the duplicated sequence itself
                  <br />
                  • <code className="px-1 py-0.5 bg-secondary rounded">reference</code> specifies the sequence to duplicate
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-lg font-semibold">Microsatellite</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Short tandem repeat expansion or contraction. Used for analyzing microsatellite instability.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Example Request:</p>
                <CodeBlock
                  id="microsatellite-example"
                  language="json"
                  code={`{
  "variant_position": 43119628,
  "alternative": "CAGCAGCAG",
  "genome": "hg38",
  "chromosome": "chr17",
  "mutation_type": "MICROSATELLITE",
  "reference": "CAG"
}`}
                />
                <p className="text-xs text-muted-foreground">
                  • <code className="px-1 py-0.5 bg-secondary rounded">alternative</code> is the expanded/contracted repeat sequence
                  <br />
                  • <code className="px-1 py-0.5 bg-secondary rounded">reference</code> is the repeat unit (e.g., "CAG")
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-lg font-semibold">INDEL</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Combined insertion and deletion. The reference sequence is deleted and replaced with the alternative sequence.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Example Request:</p>
                <CodeBlock
                  id="indel-example"
                  language="json"
                  code={`{
  "variant_position": 43119628,
  "alternative": "ACGT",
  "genome": "hg38",
  "chromosome": "chr17",
  "mutation_type": "INDEL",
  "reference": "AT"
}`}
                />
                <p className="text-xs text-muted-foreground">
                  • <code className="px-1 py-0.5 bg-secondary rounded">alternative</code> is the sequence to insert
                  <br />
                  • <code className="px-1 py-0.5 bg-secondary rounded">reference</code> is the sequence to delete
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-lg font-semibold">Inversion</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Reversal of a sequence segment. The reference sequence is reversed in place.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Example Request:</p>
                <CodeBlock
                  id="inversion-example"
                  language="json"
                  code={`{
  "variant_position": 43119628,
  "genome": "hg38",
  "chromosome": "chr17",
  "mutation_type": "INVERSION",
  "reference": "ATCG"
}`}
                />
                <p className="text-xs text-muted-foreground">
                  • <code className="px-1 py-0.5 bg-secondary rounded">alternative</code> is optional (sequence will be automatically reversed)
                  <br />
                  • <code className="px-1 py-0.5 bg-secondary rounded">reference</code> is the sequence to reverse
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-lg font-semibold">Translocation</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Movement of a sequence to a different location. The reference sequence is removed and the alternative is inserted.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Example Request:</p>
                <CodeBlock
                  id="translocation-example"
                  language="json"
                  code={`{
  "variant_position": 43119628,
  "alternative": "ATCG",
  "genome": "hg38",
  "chromosome": "chr17",
  "mutation_type": "TRANSLOCATION",
  "reference": "GCAT"
}`}
                />
                <p className="text-xs text-muted-foreground">
                  • <code className="px-1 py-0.5 bg-secondary rounded">alternative</code> is the sequence to insert at new location
                  <br />
                  • <code className="px-1 py-0.5 bg-secondary rounded">reference</code> is the sequence to remove from original location
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "authentication",
      title: "Authentication",
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Authentication</h2>
            <p className="text-muted-foreground">
              The API uses API key authentication for secure access. Include your API key in the request headers.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">API Key Header</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Include your API key in the <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">X-API-Key</code> header:
              </p>
              <CodeBlock
                id="auth-example"
                code={`curl -X POST https://your-api-url.modal.run/analyze_single_variant \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key-here" \\
  -d '{...}'`}
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Note:</strong> If no API key is configured in the environment, the API operates in development mode 
                and accepts requests without authentication. Always use API keys in production.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "code-examples",
      title: "Code Examples",
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Code Examples</h2>
            <p className="text-muted-foreground">
              Examples in various programming languages to help you get started quickly.
            </p>
          </div>

          <Tabs defaultValue="python" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="r">R</TabsTrigger>
            </TabsList>

            <TabsContent value="python" className="space-y-4">
              <CodeBlock
                id="python-example"
                language="python"
                code={`import requests

url = "https://your-api-url.modal.run/analyze_single_variant"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "your-api-key-here"
}
payload = {
    "variant_position": 43119628,
    "alternative": "G",
    "genome": "hg38",
    "chromosome": "chr17",
    "mutation_type": "SNV"
}

response = requests.post(url, json=payload, headers=headers)
result = response.json()

print(f"Prediction: {result['prediction']}")
print(f"Delta Score: {result['delta_score']}")
print(f"Confidence: {result['classification_confidence']:.2%}")`}
              />
            </TabsContent>

            <TabsContent value="javascript" className="space-y-4">
              <CodeBlock
                id="javascript-example"
                language="javascript"
                code={`const url = "https://your-api-url.modal.run/analyze_single_variant";

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "your-api-key-here"
  },
  body: JSON.stringify({
    variant_position: 43119628,
    alternative: "G",
    genome: "hg38",
    chromosome: "chr17",
    mutation_type: "SNV"
  })
});

const result = await response.json();

console.log(\`Prediction: \${result.prediction}\`);
console.log(\`Delta Score: \${result.delta_score}\`);
console.log(\`Confidence: \${(result.classification_confidence * 100).toFixed(1)}%\`);`}
              />
            </TabsContent>

            <TabsContent value="curl" className="space-y-4">
              <CodeBlock
                id="curl-example"
                code={`curl -X POST https://your-api-url.modal.run/analyze_single_variant \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key-here" \\
  -d '{
    "variant_position": 43119628,
    "alternative": "G",
    "genome": "hg38",
    "chromosome": "chr17",
    "mutation_type": "SNV"
  }'`}
              />
            </TabsContent>

            <TabsContent value="r" className="space-y-4">
              <CodeBlock
                id="r-example"
                language="r"
                code={`library(httr)

url <- "https://your-api-url.modal.run/analyze_single_variant"
headers <- add_headers(
  "Content-Type" = "application/json",
  "X-API-Key" = "your-api-key-here"
)
body <- list(
  variant_position = 43119628,
  alternative = "G",
  genome = "hg38",
  chromosome = "chr17",
  mutation_type = "SNV"
)

response <- POST(url, headers = headers, body = body, encode = "json")
result <- content(response, "parsed")

cat("Prediction:", result$prediction, "\\n")
cat("Delta Score:", result$delta_score, "\\n")
cat("Confidence:", sprintf("%.1f%%", result$classification_confidence * 100), "\\n")`}
              />
            </TabsContent>
          </Tabs>
        </div>
      )
    },
    {
      id: "architecture",
      title: "Architecture",
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Architecture</h2>
            <p className="text-muted-foreground">
              Understanding how the API works under the hood.
            </p>
          </div>

          <div className="space-y-6">
            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">System Architecture</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold">1</span>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Request Reception</p>
                    <p className="text-muted-foreground">API receives variant analysis request via FastAPI endpoint</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Genome Sequence Fetching</p>
                    <p className="text-muted-foreground">Fetches 8kb window around variant position from UCSC Genome Browser API</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold">3</span>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Variant Sequence Construction</p>
                    <p className="text-muted-foreground">Constructs variant sequence based on mutation type (SNV/deletion/insertion)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold">4</span>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Evo2 Model Inference</p>
                    <p className="text-muted-foreground">Runs Evo2 7B model on NVIDIA H100 GPU to score reference and variant sequences</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold">5</span>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Pathogenicity Prediction</p>
                    <p className="text-muted-foreground">Calculates delta score and classifies variant as pathogenic or benign with confidence</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Model Details</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-mono">Evo2 7B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hardware:</span>
                  <span className="font-mono">NVIDIA H100 GPU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sequence Window:</span>
                  <span className="font-mono">8,192 bp</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scoring Method:</span>
                  <span className="font-mono">Delta log-likelihood</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "error-handling",
      title: "Error Handling",
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Error Handling</h2>
            <p className="text-muted-foreground">
              The API returns standard HTTP status codes and error messages.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold mb-2">400 Bad Request</h3>
              <p className="text-sm text-muted-foreground mb-2">Invalid request parameters</p>
              <CodeBlock
                id="error-400"
                language="json"
                code={`{
  "detail": "For SNV, alternative must be a single nucleotide (A, C, G, or T)"
}`}
              />
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold mb-2">401 Unauthorized</h3>
              <p className="text-sm text-muted-foreground mb-2">Missing API key</p>
              <CodeBlock
                id="error-401"
                language="json"
                code={`{
  "detail": "API key required. Please provide X-API-Key header."
}`}
              />
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold mb-2">403 Forbidden</h3>
              <p className="text-sm text-muted-foreground mb-2">Invalid API key</p>
              <CodeBlock
                id="error-403"
                language="json"
                code={`{
  "detail": "Invalid API key."
}`}
              />
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold mb-2">500 Internal Server Error</h3>
              <p className="text-sm text-muted-foreground mb-2">Server-side error</p>
              <CodeBlock
                id="error-500"
                language="json"
                code={`{
  "detail": "Internal server error"
}`}
              />
            </div>
          </div>
        </div>
      )
    }
  ], [])

  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections
    const query = searchQuery.toLowerCase()
    return sections.filter(section => 
      section.title.toLowerCase().includes(query) ||
      section.content?.toString().toLowerCase().includes(query)
    )
  }, [searchQuery, sections])

  const navItems = [
    { id: "overview", label: "Overview", icon: BookOpen },
    { id: "quickstart", label: "Quick Start", icon: Zap },
    { id: "api-reference", label: "API Reference", icon: Code },
    { id: "mutation-types", label: "Mutation Types", icon: FileText },
    { id: "authentication", label: "Authentication", icon: Shield },
    { id: "code-examples", label: "Code Examples", icon: Code },
    { id: "architecture", label: "Architecture", icon: Layers },
    { id: "error-handling", label: "Error Handling", icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        currentAssembly="hg38"
        sessionName="Documentation"
        onAssemblyChange={() => {}}
        onSessionRename={() => {}}
        onCommandPalette={() => {}}
      />
      
      <div className="flex h-[calc(100vh-3rem)]">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-border bg-card overflow-y-auto shrink-0">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
          <nav className="p-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setScrollTarget(item.id)
                    setTimeout(() => {
                      document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }, 100)
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors mb-1",
                    activeTab === item.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {searchQuery ? (
              filteredSections.length > 0 ? (
                filteredSections.map((section) => (
                  <div
                    key={section.id}
                    id={section.id}
                    className="mb-12"
                  >
                    {section.content}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                </div>
              )
            ) : (
              sections.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className={cn(
                    "mb-12",
                    activeTab === section.id ? "block" : "hidden"
                  )}
                >
                  {section.content}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

