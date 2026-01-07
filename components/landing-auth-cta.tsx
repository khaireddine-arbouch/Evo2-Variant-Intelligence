"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Variant = "header" | "hero" | "section"

function buildSigninHref(redirect: string, mode: "signin" | "signup") {
  const params = new URLSearchParams()
  params.set("redirect", redirect)
  params.set("mode", mode)
  return `/signin?${params.toString()}`
}

export function LandingAuthCta({ variant }: { variant: Variant }) {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      setIsAuthed(Boolean(data.session?.user))
    }

    void load()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user))
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const redirect = "/dashboard"

  const classes = {
    headerPrimary:
      "flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition",
    headerSecondary:
      "rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors",
    heroPrimary:
      "flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35 transition",
    heroSecondary:
      "flex items-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:border-primary/40 transition",
    sectionPrimary:
      "flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35 transition",
    sectionSecondary:
      "rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:border-primary/40 transition",
  } as const

  // While we don't know yet, keep existing behavior (it will redirect to /dashboard if already authed).
  if (isAuthed === null) {
    const href = `/signin?redirect=${encodeURIComponent(redirect)}`
    const className =
      variant === "header" ? classes.headerPrimary : variant === "hero" ? classes.heroPrimary : classes.sectionPrimary
    const label = variant === "header" ? "Launch console" : variant === "hero" ? "Enter workspace" : "Start with auth-enabled console"

    return (
      <Link href={href} className={className}>
        {label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    )
  }

  if (isAuthed) {
    const href = "/dashboard"
    const className =
      variant === "header" ? classes.headerPrimary : variant === "hero" ? classes.heroPrimary : classes.sectionPrimary
    const label = variant === "header" ? "Launch console" : variant === "hero" ? "Enter workspace" : "Open your console"

    return (
      <Link href={href} className={className}>
        {label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    )
  }

  // Logged out: show login + signup
  if (variant === "header") {
    return (
      <>
        <Link href={buildSigninHref(redirect, "signin")} className={classes.headerSecondary}>
          Log in
        </Link>
        <Link href={buildSigninHref(redirect, "signup")} className={classes.headerPrimary}>
          Sign up
          <ArrowRight className="h-4 w-4" />
        </Link>
      </>
    )
  }

  if (variant === "hero") {
    return (
      <>
        <Link href={buildSigninHref(redirect, "signin")} className={classes.heroPrimary}>
          Log in
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href={buildSigninHref(redirect, "signup")} className={classes.heroSecondary}>
          Create account
        </Link>
      </>
    )
  }

  return (
    <>
      <Link href={buildSigninHref(redirect, "signin")} className={classes.sectionPrimary}>
        Log in to start
        <ArrowRight className="h-4 w-4" />
      </Link>
      <Link href={buildSigninHref(redirect, "signup")} className={classes.sectionSecondary}>
        Create account
      </Link>
    </>
  )
}


