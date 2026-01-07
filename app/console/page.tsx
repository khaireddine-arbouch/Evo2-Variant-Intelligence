"use client"

import { useState, useCallback, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { AppHeader } from "@/components/app-header"
import { DiscoveryPanel } from "@/components/discovery-panel"
import { GeneContextPanel } from "@/components/gene-context-panel"
import { SequenceViewer } from "@/components/sequence-viewer"
import { VariantAnalysisPanel } from "@/components/variant-analysis-panel"
import { ClinVarPanel } from "@/components/clinvar-panel"
import { ResizablePanelGroup, ResizablePanel, ResizeHandle } from "@/components/resizable-panels"
import { CollapsibleSection } from "@/components/collapsible-section"
import { StructureSelector } from "@/components/structure-selector"
import type { Gene } from "@/lib/types"
import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import { fetchWithAuth, requireUserSession } from "@/lib/auth-client"
import { getStructureForGene, type GeneStructureMapping } from "@/lib/structure-map"
import type { MolstarViewerProps } from "@/components/molstar-viewer"
import { TourProvider, useTour } from "@/components/tour-provider"

const MolstarViewer = dynamic<MolstarViewerProps>(
  () => import("@/components/molstar-viewer").then((mod) => mod.MolstarViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
        Loading 3D structure...
      </div>
    ),
  },
)

function ConsoleContentInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")
  const { startTour } = useTour()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [selectedAssembly, setSelectedAssembly] = useState("hg38")
  const [selectedGene, setSelectedGene] = useState<Gene | null>(null)
  const [sessionName, setSessionName] = useState("Untitled Analysis")
  const [sessionIdState, setSessionIdState] = useState<string | null>(sessionId)
  const [selectedPosition, setSelectedPosition] = useState<number | undefined>()
  const [selectedBase, setSelectedBase] = useState<string | undefined>()
  const [hoveredPosition, setHoveredPosition] = useState<number | undefined>()
  const [hoveredBase, setHoveredBase] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(!!sessionId)
  const [selectedStructure, setSelectedStructure] = useState<GeneStructureMapping | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Auto-select structure when gene changes, but allow manual override
  useEffect(() => {
    if (!selectedStructure) {
      const geneStructure = getStructureForGene(selectedGene)
      if (geneStructure) {
        setSelectedStructure(geneStructure)
      }
    }
  }, [selectedGene, selectedStructure])

  // Use manually selected structure, fallback to gene-based structure
  const structureMapping = selectedStructure || getStructureForGene(selectedGene)

  useEffect(() => {
    let active = true
    const init = async () => {
      setAuthChecking(true)
      const user = await requireUserSession()
      if (!active) return
      if (!user) {
        const redirect = `/console${sessionId ? `?session=${sessionId}` : ""}`
        router.replace(`/signin?redirect=${encodeURIComponent(redirect)}`)
        return
      }
      setCurrentUser(user)
      setAuthChecking(false)

      if (sessionId) {
        loadSession(sessionId)
      } else {
        router.replace("/dashboard")
      }
    }
    void init()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, router])

  const loadSession = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetchWithAuth(`/api/sessions?id=${id}`)
      if (!response.ok) throw new Error("Failed to load session")
      const data = await response.json()
      const session = data.session

      if (session) {
        setSessionName(session.name)
        setSelectedAssembly(session.genome_assembly || "hg38")
        if (session.selected_gene) {
          setSelectedGene(session.selected_gene)
        }
        setSessionIdState(id)
      }
    } catch (error) {
      console.error("Error loading session:", error)
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const saveSessionState = useCallback(() => {
    if (!sessionIdState) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetchWithAuth("/api/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: sessionIdState,
            genome_assembly: selectedAssembly,
            selected_gene: selectedGene,
          }),
        })
      } catch (error) {
        console.error("Error saving session state:", error)
      }
    }, 1000)
  }, [sessionIdState, selectedAssembly, selectedGene])

  useEffect(() => {
    saveSessionState()
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [saveSessionState])

  const handleGeneSelect = useCallback((gene: Gene) => {
    setSelectedGene(gene)
    setSelectedPosition(undefined)
    setSelectedBase(undefined)
  }, [])

  const handleBaseClick = useCallback((position: number, base: string) => {
    setSelectedPosition(position)
    setSelectedBase(base)
    setHoveredPosition(undefined)
    setHoveredBase(undefined)
  }, [])

  const handleBaseHover = useCallback((position: number | null, base: string | null) => {
    if (position !== null && base !== null) {
      setHoveredPosition(position)
      setHoveredBase(base)
    } else {
      setHoveredPosition(undefined)
      setHoveredBase(undefined)
    }
  }, [])

  const handleCommandPalette = useCallback(() => {
    console.log("Opening command palette...")
  }, [])

  const handleSessionRename = useCallback(
    async (newName: string) => {
      setSessionName(newName)
      if (sessionIdState) {
        try {
          await fetchWithAuth("/api/sessions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: sessionIdState,
              name: newName,
            }),
          })
        } catch (error) {
          console.error("Error renaming session:", error)
        }
      }
    },
    [sessionIdState],
  )

  const handleAssemblyChange = useCallback((assembly: string) => {
    setSelectedAssembly(assembly)
  }, [])

  if (authChecking || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {authChecking ? "Checking your session..." : "Loading session..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div data-tour="header-console">
        <AppHeader
          currentAssembly={selectedAssembly}
          sessionName={sessionName}
          onAssemblyChange={handleAssemblyChange}
          onSessionRename={handleSessionRename}
          onCommandPalette={handleCommandPalette}
          onStartTour={startTour}
          userEmail={currentUser?.email}
        />
      </div>

        <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div data-tour="discovery-panel" className="h-full">
              <DiscoveryPanel
                selectedAssembly={selectedAssembly}
                onAssemblyChange={handleAssemblyChange}
                onGeneSelect={handleGeneSelect}
                selectedGene={selectedGene}
              />
            </div>
          </ResizablePanel>

          <ResizeHandle direction="horizontal" />

          <ResizablePanel defaultSize={50} minSize={30} maxSize={60}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <CollapsibleSection
                title="Gene Context"
                defaultSize={40}
                minSize={15}
                maxSize={70}
                showResize={true}
              >
                <div data-tour="gene-context-panel" className="h-full">
                  <GeneContextPanel gene={selectedGene} assembly={selectedAssembly} />
                </div>
              </CollapsibleSection>

              <ResizeHandle direction="vertical" />

              <CollapsibleSection
                title="3D Structure (Mol*)"
                defaultSize={35}
                minSize={15}
                maxSize={60}
                showResize={true}
              >
                <div data-tour="structure-panel" className="h-full flex flex-col p-3 space-y-2">
                  <StructureSelector value={selectedStructure} onChange={setSelectedStructure} />
                  {structureMapping ? (
                    <div className="flex-1 min-h-0">
                      <MolstarViewer
                        pdbId={structureMapping.pdbId}
                        pdbUrl={structureMapping.pdbUrl}
                        height={300}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-md">
                      Select a structure from the dropdown above or enter a custom PDB ID.
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              <ResizeHandle direction="vertical" />

              <CollapsibleSection
                title="Sequence Viewer"
                defaultSize={25}
                minSize={15}
                maxSize={50}
                showResize={true}
              >
                <div data-tour="sequence-viewer" className="h-full">
                  <SequenceViewer
                    gene={selectedGene}
                    assembly={selectedAssembly}
                    onBaseClick={handleBaseClick}
                    onBaseHover={handleBaseHover}
                  />
                </div>
              </CollapsibleSection>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizeHandle direction="horizontal" />

          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <CollapsibleSection
                title="Variant Analysis"
                defaultSize={50}
                minSize={20}
                maxSize={80}
                showResize={true}
              >
                <div data-tour="variant-analysis-panel" className="h-full">
                  <VariantAnalysisPanel
                    gene={selectedGene}
                    assembly={selectedAssembly}
                    prefillPosition={selectedPosition}
                    prefillReference={selectedBase}
                    hoverPosition={hoveredPosition}
                    hoverReference={hoveredBase}
                    sessionId={sessionIdState}
                  />
                </div>
              </CollapsibleSection>

              <ResizeHandle direction="vertical" />

              <CollapsibleSection
                title="ClinVar Data"
                defaultSize={50}
                minSize={20}
                maxSize={80}
                showResize={true}
              >
                <div data-tour="clinvar-panel" className="h-full">
                  <ClinVarPanel gene={selectedGene} assembly={selectedAssembly} sessionId={sessionIdState} />
                </div>
              </CollapsibleSection>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  )
}

function ConsoleContent() {
  return (
    <TourProvider page="console">
      <ConsoleContentInner />
    </TourProvider>
  )
}

export default function Evo2Console() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading console...</p>
          </div>
        </div>
      }
    >
      <ConsoleContent />
    </Suspense>
  )
}

