import Link from "next/link"
import { ArrowRight, BarChart3, Lock, Cpu, Shield, Sparkles, Activity, Globe2, Users, Layers } from "lucide-react"

const featurePillars = [
  {
    title: "Command lattice",
    description: "Keyboard-first workflows, saved sessions, and context-aware prompts keep experts in flow while navigating millions of bases.",
    icon: Sparkles,
  },
  {
    title: "Risk radar",
    description: "Pathogenicity scoring, variant clustering, and ClinVar overlays surface the highest-signal changes instantly.",
    icon: Shield,
  },
  {
    title: "Live intelligence",
    description: "Streaming inference, auto-saved state, and audit-ready timelines so every decision is reproducible.",
    icon: Activity,
  },
]

const valueBlocks = [
  {
    label: "Molecular cockpit",
    body: "Multi-panel workspace with gene context, sequence navigation, variant triage, and ClinVar evidence side by side.",
    icon: Layers,
  },
  {
    label: "Inference fabric",
    body: "Evo2-backed pathogenicity predictions with caching, reproducible requests, and structured outputs for downstream tools.",
    icon: Cpu,
  },
  {
    label: "Enterprise trust",
    body: "Role-based access, session isolation, and signed API calls so research and clinical teams can ship safely.",
    icon: Lock,
  },
  {
    label: "Global awareness",
    body: "UCSC assemblies, phenotype metadata, and variant concordance views to keep analysts aligned on context.",
    icon: Globe2,
  },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#05070a] via-[#05090f] to-[#030508] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.08),_transparent_35%),radial-gradient(circle_at_30%_40%,_rgba(56,189,248,0.08),_transparent_35%)]" />

      <div className="relative">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Evo2 Variant Intelligence</p>
              <p className="text-sm text-muted-foreground">Pathogenicity operations cockpit</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/signin?redirect=/dashboard"
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition"
            >
              Launch console
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20 pt-6">
          <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-green-500/80 shadow-[0_0_0_6px_rgba(34,197,94,0.2)]" />
                Live inference on Evo2 · Secure by default
              </div>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                A Palantir-grade console for variant intelligence
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Bloomberg Terminal–style depth for genomics: explore assemblies, stage hypotheses, and ship decisions with a cockpit that keeps your models, evidence, and audit trail in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signin?redirect=/dashboard"
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35 transition"
                >
                  Enter workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/docs"
                  className="flex items-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:border-primary/40 transition"
                >
                  Review API
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  { label: "Inference latency", value: "< 500 ms", note: "cached variants" },
                  { label: "Coverage", value: "hg19 / hg38", note: "UCSC assemblies" },
                  { label: "Auditability", value: "Session timeline", note: "immutably stored" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-card/40 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <p className="text-xl font-semibold mt-1">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border bg-black/40 shadow-2xl backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5" />
              <div className="relative flex h-full flex-col divide-y divide-border/60">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Cpu className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Session</p>
                      <p className="text-base font-semibold">BRCA1: chr17 · hg38</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Streaming</div>
                </div>
                <div className="grid gap-6 px-4 py-5 sm:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Variant Triage</p>
                    <div className="rounded-lg border border-border/80 bg-card/30 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">chr17:43119628 A→G</span>
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">Likely pathogenic</span>
                      </div>
                      <div className="mt-3 h-16 rounded-md bg-gradient-to-r from-primary/20 via-emerald-400/20 to-transparent" />
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/30 p-3 text-sm text-muted-foreground">
                      ClinVar concordance · Confidence 0.85 · Cached in session timeline
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Console Signals</p>
                    <div className="rounded-lg border border-border/70 bg-card/30 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Model delta score</span>
                        <span className="font-semibold text-foreground">-0.0012</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-1 w-10 rounded-full bg-primary/50" />
                        <div className="h-1 w-6 rounded-full bg-emerald-400/60" />
                        <div className="h-1 w-14 rounded-full bg-primary/40" />
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/30 p-3 text-sm">
                      <div className="flex items-center gap-2 text-emerald-300">
                        <Lock className="h-4 w-4" />
                        <span>Audit-ready. Every query is signed and persisted.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 rounded-2xl border border-border bg-card/40 p-8 backdrop-blur">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Operations stack</p>
              <h2 className="text-2xl font-semibold">Every surface you need, one workspace</h2>
              <p className="text-sm text-muted-foreground max-w-3xl">
                The console mirrors how genomics teams actually work: command palette, session management, live inference, evidence capture, and downstream API hooks.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {featurePillars.map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-background/30 p-5 shadow-inner shadow-primary/5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 mb-3">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 p-8 backdrop-blur">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Capabilities</p>
              <h2 className="text-2xl font-semibold">Landing zone for research and clinical teams</h2>
              <p className="text-sm text-muted-foreground max-w-3xl">
                A palantir-like lens for variant intelligence. Built-in governance keeps analysts, bioinformaticians, and leadership aligned.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {valueBlocks.map((block) => (
                <div key={block.label} className="rounded-xl border border-border bg-background/50 p-5 shadow-inner shadow-emerald-500/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <block.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-base font-semibold">{block.label}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{block.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card/40 p-8 backdrop-blur">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Security & Identity</p>
              <h2 className="text-2xl font-semibold">Full-fidelity auth and audit</h2>
              <p className="text-sm text-muted-foreground max-w-3xl">
                Sessions are bound to authenticated users, API calls are signed, and every prediction is attached to a timeline entry you can cite.
              </p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { title: "Role-aware access", desc: "Lock down dashboards and console routes to authenticated users." },
                { title: "Signed mutations", desc: "Every session mutation and prediction write requires a bearer token." },
                { title: "Traceability", desc: "Session timeline and cached predictions make decisions reproducible." },
              ].map((card) => (
                <div key={card.title} className="rounded-xl border border-border bg-background/30 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signin?redirect=/dashboard"
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35 transition"
              >
                Start with auth-enabled console
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:border-primary/40 transition"
              >
                Explore the API surface
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
