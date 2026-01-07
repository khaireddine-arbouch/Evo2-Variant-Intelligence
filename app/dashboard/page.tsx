"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { TourProvider, useTour } from "@/components/tour-provider"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Trash2,
  MoreVertical,
  Edit2,
  Clock,
  Dna,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { AppHeader } from "@/components/app-header"
import { fetchWithAuth, requireUserSession } from "@/lib/auth-client"

interface Session {
  id: string
  name: string
  genome_assembly: string
  created_at: string
  updated_at: string
}

function DashboardContent() {
  const router = useRouter()
  const { startTour } = useTour()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isRenaming, setIsRenaming] = useState<string | null>(null)
  const [newSessionName, setNewSessionName] = useState("")
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let active = true
    const init = async () => {
      setAuthChecking(true)
      const currentUser = await requireUserSession()
      if (!active) return
      if (!currentUser) {
        router.replace("/signin?redirect=/dashboard")
        return
      }
      setUser(currentUser)
      setAuthChecking(false)
      void loadSessions()
    }
    void init()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadSessions = async () => {
    try {
      setIsLoading(true)
      const response = await fetchWithAuth("/api/sessions")
      if (!response.ok) throw new Error("Failed to load sessions")
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return

    try {
      setIsCreating(true)
      const response = await fetchWithAuth("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSessionName.trim(),
          genome_assembly: "hg38",
        }),
      })

      if (!response.ok) throw new Error("Failed to create session")
      const data = await response.json()
      router.push(`/console?session=${data.session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session")
    } finally {
      setIsCreating(false)
      setShowNewDialog(false)
      setNewSessionName("")
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session? All predictions will be lost.")) {
      return
    }

    try {
      setIsDeleting(sessionId)
      const response = await fetchWithAuth(`/api/sessions?id=${sessionId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete session")
      await loadSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete session")
    } finally {
      setIsDeleting(null)
    }
  }

  const handleRenameSession = async (sessionId: string, newName: string) => {
    if (!newName.trim()) return

    try {
      const response = await fetchWithAuth("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sessionId,
          name: newName.trim(),
        }),
      })

      if (!response.ok) throw new Error("Failed to rename session")
      await loadSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename session")
    } finally {
      setIsRenaming(null)
    }
  }

  const handleOpenSession = (sessionId: string) => {
    router.push(`/console?session=${sessionId}`)
  }

  if (authChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Securing your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div data-tour="header-dashboard">
        <AppHeader
          currentAssembly="hg38"
          sessionName="Dashboard"
          onCommandPalette={() => {}}
          onStartTour={startTour}
          userEmail={user?.email}
        />
      </div>

        <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Analysis Sessions</h1>
              <p className="text-sm text-muted-foreground">
                Manage your variant analysis sessions and predictions
              </p>
            </div>
            <Button
              onClick={() => setShowNewDialog(true)}
              className="gap-2"
              data-tour="new-session-button"
            >
              <Plus className="w-4 h-4" />
              New Analysis
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Sessions Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <Dna className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first analysis session to get started
              </p>
              <Button onClick={() => setShowNewDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Analysis
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="group relative p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => handleOpenSession(session.id)}
                  data-tour="session-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      {isRenaming === session.id ? (
                        <Input
                          defaultValue={session.name}
                          onBlur={(e) => {
                            if (e.target.value !== session.name) {
                              handleRenameSession(session.id, e.target.value)
                            } else {
                              setIsRenaming(null)
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleRenameSession(session.id, e.currentTarget.value)
                            } else if (e.key === "Escape") {
                              setIsRenaming(null)
                            }
                          }}
                          className="h-7 text-sm font-medium"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="text-sm font-medium truncate">{session.name}</h3>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsRenaming(session.id)
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSession(session.id)
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Dna className="w-3.5 h-3.5" />
                      <span className="font-mono">{session.genome_assembly}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Updated {format(new Date(session.updated_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-primary">
                    <span>Open session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>

                  {isDeleting === session.id && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Session Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Analysis Session</DialogTitle>
            <DialogDescription>
              Start a new variant analysis session. You can rename it later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Session name"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSessionName.trim()) {
                  handleCreateSession()
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSession} disabled={!newSessionName.trim() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <TourProvider page="dashboard">
      <DashboardContent />
    </TourProvider>
  )
}

