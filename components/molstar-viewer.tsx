"use client"

import { useEffect, useRef, useState } from "react"
import { createRoot, type Root } from "react-dom/client"
import { createPortal } from "react-dom"

// Import Mol* only in this client component to avoid SSR issues
import { createPluginUI } from "molstar/lib/mol-plugin-ui"
import { Asset } from "molstar/lib/mol-util/assets"

import "molstar/build/viewer/molstar.css"

export interface MolstarViewerProps {
  pdbUrl?: string
  pdbId?: string
  height?: number
  /**
   * Allow toggling the viewer into a full-screen overlay.
   * Defaults to true.
   */
  allowFullscreen?: boolean
  /**
   * Show Molstar controls in embedded mode.
   * Defaults to false (thumbnail view).
   */
  showControls?: boolean
}

export function MolstarViewer({
  pdbUrl,
  pdbId,
  height = 360,
  allowFullscreen = true,
  showControls = false,
}: MolstarViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null)

  // Separate plugin instances for embedded and fullscreen modes
  const embeddedPluginRef = useRef<any>(null)
  const fullscreenPluginRef = useRef<any>(null)

  const [isFullscreen, setIsFullscreen] = useState(false)

  const loadStructure = async (plugin: any, urlOverride?: string, idOverride?: string) => {
    const url = urlOverride ?? pdbUrl ?? (idOverride ?? pdbId ? `https://files.rcsb.org/download/${idOverride ?? pdbId}.cif` : undefined)
    if (!url) return

    const data = await plugin.builders.data.download(
      { url: Asset.Url(url), label: idOverride ?? pdbId ?? "Structure" },
      { state: { isGhost: true } },
    )

    const trajectory = await plugin.builders.structure.parseTrajectory(data, "mmcif")

    await plugin.builders.structure.hierarchy.applyPreset(trajectory, "default")
  }

  // Embedded thumbnail viewer (no visible UI)
  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    let root: Root | null = null

    const init = async () => {
      try {
        const plugin = await createPluginUI({
          target: containerRef.current as HTMLDivElement,
          render: (component, container) => {
            root = createRoot(container as HTMLElement)
            root.render(component)
            return root
          },
        })
        if (cancelled) {
          plugin.dispose()
          root?.unmount()
          return
        }

        embeddedPluginRef.current = { plugin, root }

        await loadStructure(plugin, pdbUrl, pdbId)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load structure in MolstarViewer (embedded)", error)
      }
    }

    void init()

    return () => {
      cancelled = true
      embeddedPluginRef.current?.plugin?.dispose()
      embeddedPluginRef.current?.root?.unmount()
      embeddedPluginRef.current = null
    }
    // Recreate the viewer when the target structure changes
  }, [pdbUrl, pdbId])

  // Fullscreen viewer with full Mol* UI, rendered via portal
  useEffect(() => {
    if (!isFullscreen || !fullscreenContainerRef.current) return

    let cancelled = false
    let root: Root | null = null

    const init = async () => {
      // Wait for the container to be fully mounted and sized
      // Use requestAnimationFrame to ensure DOM is ready
      await new Promise((resolve) => requestAnimationFrame(() => {
        requestAnimationFrame(resolve)
      }))

      if (cancelled || !fullscreenContainerRef.current) return

      // Ensure container has proper dimensions
      const container = fullscreenContainerRef.current
      if (container) {
        // Force fullscreen dimensions - ensure parent also has proper sizing
        const parent = container.parentElement
        if (parent) {
          parent.style.width = "100vw"
          parent.style.height = "100vh"
          parent.style.position = "fixed"
          parent.style.top = "0"
          parent.style.left = "0"
        }
        container.style.width = "100vw"
        container.style.height = "100vh"
        container.style.position = "relative"
        container.style.display = "block"
      }

      try {
        const plugin = await createPluginUI({
          target: container as HTMLDivElement,
          render: (component, container) => {
            root = createRoot(container as HTMLElement)
            root.render(component)
            return root
          },
        })
        if (cancelled) {
          plugin.dispose()
          root?.unmount()
          return
        }

        fullscreenPluginRef.current = { plugin, root }

        await loadStructure(plugin, pdbUrl, pdbId)

        // Ensure layout is visible and properly sized
        // Wait a bit for the structure to load before resizing
        setTimeout(() => {
          if (plugin.canvas3d) {
            plugin.canvas3d.handleResize()
          }
          // Force layout update
          window.dispatchEvent(new Event("resize"))
          // Additional resize after a short delay to ensure everything is rendered
          setTimeout(() => {
            if (plugin.canvas3d) {
              plugin.canvas3d.handleResize()
            }
          }, 200)
        }, 100)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load structure in MolstarViewer (fullscreen)", error)
      }
    }

    void init()

    return () => {
      cancelled = true
      fullscreenPluginRef.current?.plugin?.dispose()
      fullscreenPluginRef.current?.root?.unmount()
      fullscreenPluginRef.current = null
    }
    // Recreate the viewer when the target structure changes
  }, [isFullscreen, pdbUrl, pdbId])

  // Ensure Mol*'s global CSS (which forces full-screen body) does not
  // break the surrounding Next.js layout.
  // We override the problematic bits here in a very targeted way.
  const containerClasses =
    "molstar-shell molstar-shell--embedded relative w-full rounded-md border border-border bg-card/60 overflow-hidden"

  const openFullscreen = () => {
    setIsFullscreen(true)
    window.dispatchEvent(new Event("resize"))
  }

  const closeFullscreen = () => {
    setIsFullscreen(false)
    window.dispatchEvent(new Event("resize"))
  }

  return (
    <>
      <div className={containerClasses}>
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ height }}
        />

        {allowFullscreen && (
          <button
            type="button"
            onClick={openFullscreen}
            className="absolute right-3 top-3 z-10 rounded bg-black/60 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white hover:bg-black/80"
          >
            Fullscreen
          </button>
        )}
      </div>

      {allowFullscreen && isFullscreen && typeof document !== "undefined"
        ? createPortal(
            <div className="molstar-shell--fullscreen fixed inset-0 bg-background" style={{ width: "100vw", height: "100vh", zIndex: 9999 }}>
              <div
                ref={fullscreenContainerRef}
                className="w-full h-full"
                style={{ width: "100vw", height: "100vh" }}
              />
              <button
                type="button"
                onClick={closeFullscreen}
                className="absolute right-4 top-4 rounded bg-black/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white hover:bg-black/90"
                style={{ zIndex: 10000 }}
              >
                Exit Fullscreen
              </button>
            </div>,
            document.body,
          )
        : null}

      {/* Global overrides to keep Mol* from hijacking the whole app layout */}
      <style jsx global>{`
        html,
        body {
          height: auto !important;
        }
        body {
          overflow: ${isFullscreen ? "hidden" : "auto"} !important;
        }

        /* Embedded Mol* thumbnail: conditionally hide chrome but keep interactions */
        ${showControls
          ? `
        .molstar-shell--embedded .msp-layout-left,
        .molstar-shell--embedded .msp-layout-right,
        .molstar-shell--embedded .msp-layout-bottom,
        .molstar-shell--embedded .msp-layout-top {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        `
          : `
        .molstar-shell--embedded .msp-layout-left,
        .molstar-shell--embedded .msp-layout-right,
        .molstar-shell--embedded .msp-layout-bottom,
        .molstar-shell--embedded .msp-layout-top {
          display: none !important;
        }
        `}

        .molstar-shell--embedded .msp-plugin {
          background: transparent !important;
        }

        .molstar-shell--embedded canvas {
          max-height: 100%;
        }

        /* Fullscreen mode: ensure all controls are visible and properly sized */
        .molstar-shell--fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 9999 !important;
          overflow: hidden !important;
        }

        /* Use actual Molstar DOM structure - .msp-plugin is the root, not .msp-layout-root */
        .molstar-shell--fullscreen .msp-plugin {
          width: 100vw !important;
          height: 100vh !important;
          position: relative !important;
          display: block !important;
        }

        .molstar-shell--fullscreen .msp-plugin-content {
          width: 100% !important;
          height: 100% !important;
        }

        /* Ensure layout regions are visible - these are the actual control panels */
        .molstar-shell--fullscreen .msp-layout-left,
        .molstar-shell--fullscreen .msp-layout-right,
        .molstar-shell--fullscreen .msp-layout-bottom,
        .molstar-shell--fullscreen .msp-layout-top {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* Ensure main layout region takes full space */
        .molstar-shell--fullscreen .msp-layout-main {
          width: 100% !important;
          height: 100% !important;
        }

        .molstar-shell--fullscreen .msp-viewport {
          width: 100% !important;
          height: 100% !important;
        }

        .molstar-shell--fullscreen canvas {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </>
  )
}


