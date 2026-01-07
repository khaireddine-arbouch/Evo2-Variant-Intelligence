import React from "react"
import type { Step } from "react-joyride"

export const dashboardTourSteps: Step[] = [
  {
    target: "body",
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Welcome to Evo2 Variant Intelligence!"),
      React.createElement(
        "p",
        { className: "text-sm" },
        "This guided tour will walk you through all the features of the platform. You can skip at any time or restart the tour later."
      )
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="new-session-button"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Create Analysis Sessions"),
      React.createElement(
        "p",
        { className: "text-sm" },
        'Click "New Analysis" to create a new variant analysis session. Each session is isolated and saves your work automatically.'
      )
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="session-card"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Session Management"),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Each session card shows the genome assembly and last updated time. Click a session to open it, or use the menu (⋮) to rename or delete."
      )
    ),
    placement: "right",
  },
  {
    target: '[data-tour="header-dashboard"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Navigation"),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Use the header to navigate between Dashboard, Console, and Docs. The Guide button is always available to restart this tour."
      )
    ),
    placement: "bottom",
  },
]

export const consoleTourSteps: Step[] = [
  {
    target: "body",
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Welcome to the Console!"),
      React.createElement(
        "p",
        { className: "text-sm" },
        "The console is your main workspace for variant analysis. This tour will show you all the panels and features."
      )
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="discovery-panel"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Discovery Panel"),
      React.createElement(
        "p",
        { className: "text-sm" },
        "This is where you start your analysis. Use this panel to find and select genes to analyze. You can search by gene name or browse by chromosome."
      )
    ),
    placement: "right",
  },
  {
    target: '[data-tour="genome-assembly-selector"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Step 1: Select Genome Assembly"),
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement(React.Fragment, null,
          "First, choose your reference genome. ",
          React.createElement("strong", null, "hg38"),
          " is the current standard (recommended). ",
          React.createElement("strong", null, "hg19"),
          " is the older reference. This choice affects all coordinates and variant positions in your analysis."
        )
      )
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="gene-search-input"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Step 2: Search for a Gene"),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Type a gene symbol (like 'BRCA1' or 'TP53') in the search box. You can press Enter or click the Search button. Try the 'BRCA1' button for a quick example!"
      )
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="gene-results"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Step 3: Select a Gene"),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Click any gene from the search results to load it. Once selected, the gene will appear in the Gene Context panel, and you can start analyzing variants."
      )
    ),
    placement: "left",
  },
  {
    target: '[data-tour="gene-context-panel"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Gene Context Panel"),
      React.createElement(
        "p",
        { className: "text-sm" },
        "View detailed information about the selected gene including coordinates, transcripts, and functional annotations. This helps you understand the gene's structure."
      )
    ),
    placement: "left",
  },
  {
    target: '[data-tour="structure-panel"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "3D Structure Viewer"),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Visualize the protein's 3D structure using Mol*. Select different structures from the dropdown or enter a custom PDB ID. This helps understand variant impact on protein structure."
      )
    ),
    placement: "left",
  },
  {
    target: '[data-tour="sequence-viewer"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Sequence Viewer"),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Navigate the genomic sequence visually. Hover over nucleotides to see positions in real-time, or click to lock a position for variant analysis. Use the zoom controls to explore different regions."
      )
    ),
    placement: "left",
  },
  {
    target: '[data-tour="variant-analysis-panel"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Variant Analysis Panel"),
      React.createElement(
        "p",
        { className: "text-sm" },
        'This is where the magic happens! Enter a position, reference, and alternative nucleotide, then click "Analyze with Evo2" to get pathogenicity predictions. Results show delta scores, confidence, and predictions (pathogenic/benign/VUS).'
      )
    ),
    placement: "left",
  },
  {
    target: '[data-tour="variant-inputs"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Variant Input Fields"),
      React.createElement(
        "p",
        { className: "text-sm" },
        "Enter the variant details you want to analyze. You can click positions in the Sequence Viewer to auto-fill these fields. Fill in the mutation type, position, reference nucleotide, and alternative nucleotide, then click 'Analyze with Evo2'."
      )
    ),
    placement: "left",
  },
  {
    target: '[data-tour="clinvar-panel"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "ClinVar Data Panel"),
      React.createElement(
        "p",
        { className: "text-sm" },
        "View ClinVar annotations for variants in your selected gene. This provides clinical evidence and pathogenicity classifications from the ClinVar database, helping validate your predictions."
      )
    ),
    placement: "left",
  },
  {
    target: '[data-tour="header-console"]',
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "Header Controls"),
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement(React.Fragment, null,
          React.createElement("strong", null, "Assembly:"), " Switch between hg19 and hg38",
          React.createElement("br"),
          React.createElement("strong", null, "Session Name:"), " Click to rename your session",
          React.createElement("br"),
          React.createElement("strong", null, "Guide:"), " Click to restart this tour anytime",
          React.createElement("br"),
          React.createElement("strong", null, "Save:"), " Sessions auto-save, but you can manually save",
          React.createElement("br"),
          React.createElement("strong", null, "Dashboard:"), " Return to session management"
        )
      )
    ),
    placement: "bottom",
  },
  {
    target: "body",
    content: React.createElement(
      "div",
      null,
      React.createElement("h3", { className: "font-semibold mb-2" }, "You're All Set! 🎉"),
      React.createElement(
        "p",
        { className: "text-sm" },
        React.createElement(React.Fragment, null,
          "You've learned all the main features! Remember:",
          React.createElement("ul", { className: "list-disc list-inside mt-2 space-y-1" },
            React.createElement("li", null, "Panels are resizable - drag the handles to customize your layout"),
            React.createElement("li", null, "Click sequence positions to auto-fill variant inputs"),
            React.createElement("li", null, "All predictions are cached and saved to your session"),
            React.createElement("li", null, "You can restart this tour anytime using the Guide button in the header")
          )
        )
      )
    ),
    placement: "center",
  },
]

export const TOUR_STORAGE_KEY = "evo2-tour-completed"

