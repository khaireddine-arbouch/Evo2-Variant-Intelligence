"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Command, Save, User, Settings, LogOut, Dna, LayoutDashboard, BookOpen } from "lucide-react"

interface AppHeaderProps {
  currentAssembly: string
  sessionName: string
  userEmail?: string | null
  onAssemblyChange?: (assembly: string) => void
  onSessionRename?: (name: string) => void
  onCommandPalette?: () => void
}

export function AppHeader({ currentAssembly, sessionName, userEmail, onSessionRename, onCommandPalette }: AppHeaderProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(sessionName)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    setEditedName(sessionName)
  }, [sessionName])

  const handleSaveSession = () => {
    // Auto-save is handled by the parent component
    console.log("Session auto-saved")
  }

  const handleRenameComplete = () => {
    if (editedName !== sessionName && editedName.trim()) {
      onSessionRename?.(editedName.trim())
    } else {
      setEditedName(sessionName)
    }
    setIsEditing(false)
  }

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      await supabase.auth.signOut()
      router.replace("/signin")
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center">
            <Dna className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-sm tracking-tight">EVO2</span>
            <span className="text-xs text-muted-foreground">Variant Intelligence</span>
          </div>
        </div>
      </div>

      {/* Center: Assembly & Session */}
      <div className="flex items-center gap-4">
        {/* Assembly Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-secondary rounded border border-border">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Assembly</span>
          <span className="font-mono text-xs text-foreground">{currentAssembly}</span>
        </div>

        {/* Session */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Session:</span>
          {isEditing ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleRenameComplete}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameComplete()
                if (e.key === "Escape") {
                  setEditedName(sessionName)
                  setIsEditing(false)
                }
              }}
              className="bg-transparent border-b border-primary text-xs font-medium focus:outline-none w-32"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium hover:text-primary transition-colors"
            >
              {sessionName}
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/docs")}
          className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Docs</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onCommandPalette}
          className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Command className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Command</span>
          <kbd className="hidden sm:inline-flex h-4 px-1 items-center rounded bg-muted text-[10px] font-mono">⌘K</kbd>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveSession}
          className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <User className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {userEmail && (
              <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                {userEmail}
              </DropdownMenuItem>
            )}
            {userEmail && <DropdownMenuSeparator />}
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
              <LogOut className="w-4 h-4 mr-2" />
              {signingOut ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
