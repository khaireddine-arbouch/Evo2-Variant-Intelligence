"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Lock, LogIn, Mail, ShieldCheck } from "lucide-react"

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  const queryMode = searchParams.get("mode")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (queryMode === "signup") {
      setMode("signup")
    } else if (queryMode === "signin") {
      setMode("signin")
    }
  }, [queryMode])

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace(redirect)
      }
    }
    void checkSession()
  }, [router, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        
        // Check if this is a new user (first login after signup)
        // The flag might have been set during signup, or check if user has no sessions
        const isNewUser = sessionStorage.getItem("evo2-new-user") === "true"
        if (isNewUser) {
          // Keep the flag for when they reach dashboard/console
          // Don't clear it here, let the tour provider handle it
        }
        
        router.replace(redirect)
        return
      }

      // Get the site URL for email redirect
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const redirectUrl = `${siteUrl}/signin?redirect=${encodeURIComponent(redirect)}`
      
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      })
      if (signUpError) throw signUpError
      
      // Set flag to trigger tour for new users
      if (typeof window !== "undefined") {
        sessionStorage.setItem("evo2-new-user", "true")
      }
      
      setMessage("Account created. Please check your email if confirmation is required.")
      setMode("signin")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#05070a] via-[#05090f] to-[#020305] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.08),_transparent_35%),radial-gradient(circle_at_70%_40%,_rgba(56,189,248,0.08),_transparent_35%)]" />
      <div className="relative grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card/60 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden h-full flex-col justify-between border-r border-border/70 bg-gradient-to-b from-primary/15 via-transparent to-emerald-500/10 p-8 md:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Evo2</p>
              <p className="text-base font-semibold">Pathogenicity Operations</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Enterprise-grade</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight">Auth, audit, and session integrity by default</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Every session, prediction, and ClinVar pull is signed to your user. The console locks down critical routes and keeps an immutable trail for compliance.
              </p>
            </div>
            <div className="space-y-4 rounded-xl border border-border bg-background/40 p-4 shadow-inner shadow-primary/10">
              {[
                "Role-aware console and dashboard access",
                "Signed session mutations and prediction writes",
                "Recoverable timelines for every analysis",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">●</span>
                  <span className="text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Identity</p>
              <h2 className="text-2xl font-semibold">Sign {mode === "signin" ? "in" : "up"}</h2>
              <p className="text-sm text-muted-foreground">Secure entry to the Evo2 console.</p>
            </div>
            <div className="hidden rounded-full border border-border px-3 py-1 text-xs text-muted-foreground md:inline-flex">
              SOC2-ready posture
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Password-based auth; magic links can be enabled in Supabase.</p>
              </div>
              <button
                type="button"
                className="w-full rounded-md border border-border bg-background/50 px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-background/80 transition-colors"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "Create new account" : "Sign in with existing account"}
              </button>
            </div>

            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            {message && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">{message}</div>}

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">Security posture</p>
            <ul className="space-y-2">
              <li>• All API routes expect bearer tokens from the signed-in user.</li>
              <li>• Sessions are scoped to the authenticated account.</li>
              <li>• Predictions and session mutations are auditable.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#05070a] via-[#05090f] to-[#020305]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}

