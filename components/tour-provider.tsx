"use client"

import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react"
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { dashboardTourSteps, consoleTourSteps, TOUR_STORAGE_KEY } from "@/lib/tour-config"

interface TourProviderProps {
  children: React.ReactNode
  page: "dashboard" | "console"
}

const tourSteps: Record<"dashboard" | "console", Step[]> = {
  dashboard: dashboardTourSteps,
  console: consoleTourSteps,
}

// Context to expose startTour function and mini tour support
interface TourContextValue {
  startTour: () => void
  startMiniTour?: (sectionId: string, steps: Array<{ target: string; content: React.ReactNode; placement?: string }>) => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error("useTour must be used within TourProvider")
  }
  return context
}

export function TourProvider({ children, page }: TourProviderProps) {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [miniTourRun, setMiniTourRun] = useState(false)
  const [miniTourSteps, setMiniTourSteps] = useState<Step[]>([])
  const [miniTourStepIndex, setMiniTourStepIndex] = useState(0)

  // Check if all target elements exist before starting tour
  const checkTargetsExist = useCallback(() => {
    const steps = tourSteps[page]
    if (!steps) return false

    for (const step of steps) {
      if (step.target === "body" || step.target === "header") {
        continue // These are always available
      }
      const element = document.querySelector(step.target as string)
      if (!element) {
        console.warn(`Tour target not found: ${step.target}`)
        return false
      }
    }
    return true
  }, [page])

  // Check if tour was completed and if new user flag exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for new user flag (set after account creation)
      const isNewUser = sessionStorage.getItem("evo2-new-user") === "true"
      const completed = localStorage.getItem(`${TOUR_STORAGE_KEY}-${page}`)
      
      // Auto-start tour for new users or first-time users
      if (isNewUser || !completed) {
        // Clear new user flag
        if (isNewUser) {
          sessionStorage.removeItem("evo2-new-user")
        }
        
        // Wait for DOM to be ready and check targets
        const checkAndStart = () => {
          if (checkTargetsExist()) {
            setIsReady(true)
            setTimeout(() => setRun(true), 300)
          } else {
            // Retry after a short delay
            setTimeout(checkAndStart, 200)
          }
        }
        
        // Initial delay to ensure DOM is ready
        setTimeout(checkAndStart, 800)
      } else {
        setIsReady(true)
      }
    }
  }, [page, checkTargetsExist])

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index, step, action } = data

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        // Mark tour as completed
        if (typeof window !== "undefined") {
          localStorage.setItem(`${TOUR_STORAGE_KEY}-${page}`, "true")
        }
        setRun(false)
        setStepIndex(0)
      } else if (type === "step:after") {
        // Joyride reports both Next and Back as "step:after" with action "next"/"prev"
        if (action === "next" || action === "skip") {
          setStepIndex(index + 1)
        } else if (action === "prev") {
          setStepIndex(Math.max(0, index - 1))
        }
      } else if (type === "error:target_not_found") {
        // Skip to next step if target not found
        console.warn(`Tour target not found: ${step.target}`)
        if (index < tourSteps[page].length - 1) {
          setStepIndex(index + 1)
        } else {
          // If last step, finish tour
          setRun(false)
          if (typeof window !== "undefined") {
            localStorage.setItem(`${TOUR_STORAGE_KEY}-${page}`, "true")
          }
        }
      }
    },
    [page],
  )

  const startTour = useCallback(() => {
    // Enable guide mode to show explain buttons
    if (typeof window !== "undefined") {
      sessionStorage.setItem("evo2-guide-mode", "true")
      // Trigger a custom event to notify explain buttons
      window.dispatchEvent(new CustomEvent("evo2-guide-mode-changed", { detail: { active: true } }))
    }
    
    // Ensure targets exist before starting
    if (!checkTargetsExist()) {
      console.warn("Some tour targets are not available. Tour may not work correctly.")
    }
    setStepIndex(0)
    setRun(true)
    // Reset completion status when manually starting
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${TOUR_STORAGE_KEY}-${page}`)
    }
  }, [page, checkTargetsExist])

  const startMiniTour = useCallback((sectionId: string, steps: Array<{ target: string; content: React.ReactNode; placement?: string }>) => {
    const joyrideSteps: Step[] = steps.map(step => ({
      target: step.target,
      content: step.content,
      placement: (step.placement as "top" | "bottom" | "left" | "right" | "center") || "right",
      disableBeacon: false,
    }))
    
    setMiniTourSteps(joyrideSteps)
    setMiniTourStepIndex(0)
    setMiniTourRun(true)
  }, [])

  const handleMiniTourCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setMiniTourRun(false)
      setMiniTourStepIndex(0)
      setMiniTourSteps([])
    } else if (type === "step:after") {
      // Joyride reports both Next and Back as "step:after" with action "next"/"prev"
      if (action === "next" || action === "skip") {
        setMiniTourStepIndex(index + 1)
      } else if (action === "prev") {
        setMiniTourStepIndex(Math.max(0, index - 1))
      }
    }
  }, [])

  return (
    <TourContext.Provider value={{ startTour, startMiniTour }}>
      {children}
      {isReady && (
        <>
          <Joyride
            steps={tourSteps[page]}
            run={run}
            stepIndex={stepIndex}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            disableScrolling={false}
            disableOverlayClose={false}
            styles={{
            options: {
              primaryColor: "hsl(var(--primary))",
              textColor: "hsl(var(--foreground))",
              backgroundColor: "hsl(var(--card))",
              overlayColor: "rgba(0, 0, 0, 0.7)",
              arrowColor: "hsl(var(--card))",
              zIndex: 10000,
              spotlightShadow: "0 0 0 4px rgba(59, 130, 246, 0.5)",
            },
            tooltip: {
              borderRadius: "12px",
              padding: "20px",
              backgroundColor: "hsl(var(--card))",
              border: "3px solid white",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px hsl(var(--primary)), 0 0 20px rgba(255, 255, 255, 0.1)",
              color: "hsl(var(--foreground))",
              fontSize: "14px",
              maxWidth: "400px",
            },
            tooltipContainer: {
              textAlign: "left",
            },
            tooltipTitle: {
              color: "hsl(var(--foreground))",
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "8px",
            },
            tooltipContent: {
              color: "hsl(var(--foreground))",
              fontSize: "14px",
              lineHeight: "1.5",
            },
            buttonNext: {
              backgroundColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              borderRadius: "6px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            },
            buttonBack: {
              color: "hsl(var(--foreground))",
              marginRight: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              padding: "10px 16px",
            },
            buttonSkip: {
              color: "hsl(var(--muted-foreground))",
              fontSize: "14px",
              cursor: "pointer",
              padding: "10px 16px",
            },
            overlay: {
              mixBlendMode: "normal",
            },
            spotlight: {
              borderRadius: "8px",
            },
          }}
          spotlightClicks={false}
          spotlightPadding={4}
          floaterProps={{
            styles: {
              arrow: {
                color: "hsl(var(--card))",
              },
            },
          }}
          disableOverlay={false}
          locale={{
            back: "Back",
            close: "Close",
            last: "Finish",
            next: "Next",
            skip: "Skip tour",
          }}
          />
          {miniTourSteps.length > 0 && (
            <Joyride
              steps={miniTourSteps}
              run={miniTourRun}
              stepIndex={miniTourStepIndex}
              continuous
              showProgress
              showSkipButton
              callback={handleMiniTourCallback}
              disableScrolling={false}
              disableOverlayClose={false}
              styles={{
                options: {
                  primaryColor: "hsl(var(--primary))",
                  textColor: "hsl(var(--foreground))",
                  backgroundColor: "hsl(var(--card))",
                  overlayColor: "rgba(0, 0, 0, 0.7)",
                  arrowColor: "hsl(var(--card))",
                  zIndex: 10000,
                  spotlightShadow: "0 0 0 4px rgba(59, 130, 246, 0.5)",
                },
                tooltip: {
                  borderRadius: "12px",
                  padding: "20px",
                  backgroundColor: "hsl(var(--card))",
                  border: "3px solid white",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px hsl(var(--primary)), 0 0 20px rgba(255, 255, 255, 0.1)",
                  color: "hsl(var(--foreground))",
                  fontSize: "14px",
                  maxWidth: "400px",
                },
                tooltipContainer: {
                  textAlign: "left",
                },
                tooltipTitle: {
                  color: "hsl(var(--foreground))",
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "8px",
                },
                tooltipContent: {
                  color: "hsl(var(--foreground))",
                  fontSize: "14px",
                  lineHeight: "1.5",
                },
                buttonNext: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                },
                buttonBack: {
                  color: "hsl(var(--foreground))",
                  marginRight: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  padding: "10px 16px",
                },
                buttonSkip: {
                  color: "hsl(var(--muted-foreground))",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "10px 16px",
                },
                overlay: {
                  mixBlendMode: "normal",
                },
                spotlight: {
                  borderRadius: "8px",
                },
              }}
              spotlightClicks={false}
              spotlightPadding={4}
              floaterProps={{
                styles: {
                  arrow: {
                    color: "hsl(var(--card))",
                  },
                },
              }}
              disableOverlay={false}
              locale={{
                back: "Back",
                close: "Close",
                last: "Finish",
                next: "Next",
                skip: "Skip",
              }}
            />
          )}
        </>
      )}
      {!run && isReady && <TourButton onClick={startTour} />}
    </TourContext.Provider>
  )
}

function TourButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 shadow-lg"
      title="Start guided tour"
    >
      <HelpCircle className="w-5 h-5 text-primary" />
    </Button>
  )
}

