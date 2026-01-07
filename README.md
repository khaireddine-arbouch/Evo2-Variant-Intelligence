# Evo2 Variant Pathogenicity Prediction Platform

A comprehensive full-stack application for predicting the pathogenicity of genetic variants using the Evo2 deep learning model. This platform provides researchers and clinicians with an advanced interface for analyzing single nucleotide variants (SNVs), deletions, insertions, and other mutation types across multiple genome assemblies.

**Researcher:** Khaireddine Arbouch

**Acknowledgments:** Special thanks to Andreas Trolle for the idea inspiration that led to the development of this platform.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Installation and Setup](#installation-and-setup)
9. [Deployment](#deployment)
10. [Code Structure](#code-structure)
11. [Key Features](#key-features)
12. [Configuration](#configuration)
13. [Development Guidelines](#development-guidelines)

---

## Project Overview

This platform integrates the Evo2 foundation model for genomic sequence analysis with a modern web interface, enabling real-time variant pathogenicity predictions. The system supports multiple genome assemblies (hg38, hg19, etc.), provides comprehensive gene context, integrates with ClinVar for clinical variant data, and offers session management for collaborative research workflows.

### Core Capabilities

- **Variant Analysis**: Predict pathogenicity for SNVs, deletions, insertions, and complex mutations
- **Gene Context**: Search and visualize genes with genomic coordinates and sequence data
- **ClinVar Integration**: Query and compare variants against ClinVar clinical significance database
- **Session Management**: Save and manage analysis sessions with persistent storage
- **3D Structure Visualization**: View protein structures using Molstar molecular viewer
- **Real-time Analysis**: Interactive sequence viewer with hover-based variant exploration

---

## System Architecture

The application follows a three-tier architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  API Routes  │  │  Auth Client  │      │
│  │  Components  │  │  (Next.js)   │  │  (Supabase)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │
┌─────────────────────────────────────────────────────────────┐
│              Backend Layer (Modal + FastAPI)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Evo2 Model  │  │  UCSC API    │  │  NCBI API    │      │
│  │  (GPU H100)  │  │  Integration │  │  Integration │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ PostgreSQL
                            │
┌─────────────────────────────────────────────────────────────┐
│              Data Layer (Supabase PostgreSQL)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Sessions   │  │ Predictions  │  │   Auth Users │      │
│  │    Table     │  │    Table     │  │     Table    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

- **Separation of Concerns**: Clear boundaries between presentation, business logic, and data layers
- **API-First Design**: RESTful APIs with consistent error handling and response formats
- **Stateless Backend**: Modal-based serverless functions for scalable compute
- **Client-Side State Management**: React hooks and context for UI state
- **Database Normalization**: Relational schema with proper indexing and foreign keys
- **Security**: Row-level security policies, API key authentication, and JWT-based user sessions

---

## Technology Stack

### Backend

- **Python 3.12**: Core language for backend services
- **Modal**: Serverless compute platform for GPU-accelerated model inference
- **FastAPI**: High-performance async web framework for API endpoints
- **Evo2**: Foundation model for genomic sequence analysis (7B parameter variant)
- **CUDA 12.4**: GPU acceleration runtime
- **PyTorch**: Deep learning framework
- **Transformer Engine**: Optimized transformer inference
- **Flash Attention**: Memory-efficient attention mechanism

### Frontend

- **Next.js 16**: React framework with App Router
- **React 19**: UI library with latest concurrent features
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS 4**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **React Resizable Panels**: Resizable layout components
- **Molstar**: 3D molecular structure viewer
- **Recharts**: Data visualization library
- **React Joyride**: Interactive tour system

### Database and Authentication

- **Supabase**: PostgreSQL database with real-time capabilities
- **PostgreSQL**: Relational database with JSONB support
- **Supabase Auth**: JWT-based authentication system
- **Row Level Security (RLS)**: Database-level access control

### External APIs

- **UCSC Genome Browser API**: Genome sequence and annotation data
- **NCBI E-utilities**: Gene search and metadata
- **NCBI ClinVar API**: Clinical variant significance data
- **PDB (Protein Data Bank)**: 3D protein structure data

### Development Tools

- **pnpm**: Fast, disk-efficient package manager
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

---

## Backend Architecture

### Modal Deployment

The backend is deployed on Modal, a serverless compute platform that provides GPU resources on-demand. The architecture consists of:

#### Container Configuration

```python
@app.cls(
    gpu="H100",                    # NVIDIA H100 GPU (80GB VRAM)
    volumes={mount_path: volume},   # Persistent HuggingFace model cache
    max_containers=3,              # Maximum parallel instances
    retries=2,                     # Automatic retry on failure
    scaledown_window=120           # Keep containers warm for 2 minutes
)
```

#### Docker Image Build

The Modal image is built from a CUDA base image with the following layers:

1. **Base Image**: `nvidia/cuda:12.4.0-devel-ubuntu22.04` with Python 3.12
2. **System Dependencies**: Build tools, CUDA libraries, Git
3. **Python Packages**: Evo2, Transformer Engine, Flash Attention, FastAPI
4. **Application Code**: Local evo2 notebooks and requirements

#### Model Loading

The Evo2 model is loaded once per container using the `@modal.enter()` lifecycle hook:

```python
@modal.enter()
def load_evo2_model(self):
    from evo2 import Evo2
    self.model = Evo2('evo2_7b')
```

The model is cached in a persistent volume (`hf_cache`) to avoid re-downloading on container restarts.

### API Endpoint Structure

The backend exposes a single FastAPI endpoint:

#### POST `/analyze_single_variant`

**Purpose**: Analyze a genetic variant for pathogenicity prediction

**Authentication**: Optional API key via `X-API-Key` header (required if `MODAL_API_KEY` environment variable is set)

**Request Body**:
```json
{
  "variant_position": 43119628,
  "alternative": "G",
  "genome": "hg38",
  "chromosome": "chr17",
  "mutation_type": "SNV",
  "reference": "A"
}
```

**Response**:
```json
{
  "position": 43119628,
  "chromosome": "chr17",
  "genome": "hg38",
  "reference": "A",
  "alternative": "G",
  "delta_score": -0.001234,
  "prediction": "Likely pathogenic",
  "classification_confidence": 0.85,
  "mutation_type": "SNV"
}
```

**Processing Pipeline**:

1. **Genome Sequence Fetching**: Retrieves 8192bp window around variant position from UCSC API
2. **Reference Validation**: Validates or auto-detects reference allele from genome sequence
3. **Variant Sequence Construction**: Builds variant sequence based on mutation type:
   - **SNV**: Single base substitution
   - **DELETION**: Removes reference nucleotides
   - **INSERTION**: Inserts alternative sequence after reference position
4. **Model Scoring**: Scores both reference and variant sequences using Evo2
5. **Pathogenicity Classification**: Calculates delta score and classifies using BRCA1-derived thresholds

**Classification Algorithm**:

The system uses empirically determined thresholds from BRCA1 training data:

- **Threshold**: -0.0009178519 (delta score cutoff)
- **Loss of Function Std**: 0.0015140239
- **Functional Std**: 0.0009016589

Variants with delta_score < threshold are classified as "Likely pathogenic", otherwise "Likely benign". Confidence is calculated as the distance from threshold normalized by the appropriate standard deviation.

### Error Handling

The backend implements comprehensive error handling:

- **400 Bad Request**: Invalid input parameters, position out of bounds, reference mismatch
- **401 Unauthorized**: Missing API key (when required)
- **403 Forbidden**: Invalid API key
- **500 Internal Server Error**: UCSC API failures, model errors, sequence fetch failures

All errors return JSON with a `detail` field containing a human-readable error message.

---

## Frontend Architecture

### Next.js App Router Structure

The frontend uses Next.js 16 with the App Router pattern:

```
prototype/
├── app/
│   ├── api/              # Next.js API routes (server-side)
│   │   ├── analyze/      # Variant analysis proxy
│   │   ├── clinvar/      # ClinVar data fetching
│   │   ├── predictions/  # Prediction persistence
│   │   └── sessions/     # Session management
│   ├── console/          # Main analysis interface
│   ├── dashboard/        # Session dashboard
│   ├── signin/           # Authentication page
│   └── layout.tsx        # Root layout
├── components/           # React components
├── lib/                  # Utility functions and types
└── public/              # Static assets
```

### Component Architecture

The UI is built with a component-based architecture using React Server Components and Client Components:

#### Core Components

1. **AppHeader**: Navigation, user menu, session controls
2. **DiscoveryPanel**: Gene search and selection interface
3. **GeneContextPanel**: Gene information display with NCBI metadata
4. **SequenceViewer**: Interactive genomic sequence visualization
5. **VariantAnalysisPanel**: Variant input form and results display
6. **ClinVarPanel**: ClinVar variant search and comparison
7. **MolstarViewer**: 3D protein structure visualization
8. **ResizablePanels**: Layout management with drag-to-resize

#### State Management

State is managed using React hooks and context:

- **Local State**: `useState` for component-specific data
- **URL State**: `useSearchParams` for shareable session URLs
- **Server State**: Direct API calls with caching via Supabase
- **Auth State**: Supabase client-side auth with session persistence

### API Route Architecture

Next.js API routes act as a proxy layer between the frontend and external services:

#### `/api/analyze` (POST)

Proxies variant analysis requests to the Modal-deployed Evo2 API. Handles:
- Parameter validation and normalization
- API key injection from environment variables
- Error handling and response formatting
- Mutation type normalization (DELETION "-" to empty string)

#### `/api/clinvar` (GET)

Fetches ClinVar variants for a genomic region:
- Constructs NCBI E-utilities search queries
- Implements rate limiting (3 requests/second)
- Retries with exponential backoff
- Formats response for frontend consumption

#### `/api/predictions` (GET, POST)

Manages prediction persistence:
- **GET**: Retrieves cached predictions for a session or specific variant
- **POST**: Saves new predictions with normalization
- Implements global cache sharing (predictions shared across users for same variant)

#### `/api/sessions` (GET, POST, PATCH, DELETE)

Full CRUD operations for analysis sessions:
- **GET**: List user sessions or fetch specific session
- **POST**: Create new session
- **PATCH**: Update session metadata
- **DELETE**: Remove session and associated predictions

### Client-Side API Client

The `lib/api.ts` module provides a unified interface for external API calls:

- **UCSC Genome Browser API**: Genome and chromosome data
- **NCBI Gene Search**: Gene lookup with metadata
- **NCBI ClinVar**: Variant clinical significance
- **Evo2 Analysis**: Variant pathogenicity prediction

Features:
- Automatic retry with exponential backoff
- Rate limiting for NCBI APIs
- Request timeout handling (15-20 seconds)
- Error message normalization
- Type-safe interfaces with TypeScript

---

## Database Schema

### Supabase PostgreSQL Schema

#### Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  genome_assembly TEXT NOT NULL DEFAULT 'hg38',
  selected_gene JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
```

**Indexes**:
- `idx_sessions_user_id`: Fast user session lookups
- `idx_sessions_updated_at`: Sorted session lists

**Triggers**:
- `update_sessions_updated_at`: Auto-updates `updated_at` on modification

#### Predictions Table

```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  chromosome TEXT NOT NULL,
  reference TEXT NOT NULL,
  alternative TEXT NOT NULL,
  delta_score DOUBLE PRECISION NOT NULL,
  prediction TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  gene_symbol TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes**:
- `idx_predictions_session_id`: Fast session prediction queries
- `idx_predictions_created_at`: Sorted prediction lists

**Normalization**:
- Reference and alternative alleles are stored in uppercase
- Deletions are normalized to empty string alternative
- Predictions can be shared globally (same variant = same prediction)

### Row Level Security (RLS)

RLS policies ensure users can only access their own data:

- **Sessions**: Users can only view/modify sessions where `user_id` matches their auth ID
- **Predictions**: Predictions are scoped to sessions, which are user-scoped
- **Global Cache**: Predictions can be read globally but only written by authenticated users

---

## API Endpoints

### Backend Endpoints (Modal)

#### POST `https://{workspace}--evo2-snv-pathogenicity-evo2model-analyze-single-variant.modal.run`

**Description**: Analyze a single genetic variant for pathogenicity

**Authentication**: Optional (API key in `X-API-Key` header)

**Request**:
```json
{
  "variant_position": 43119628,
  "alternative": "G",
  "genome": "hg38",
  "chromosome": "chr17",
  "mutation_type": "SNV",
  "reference": "A"
}
```

**Response**:
```json
{
  "position": 43119628,
  "chromosome": "chr17",
  "genome": "hg38",
  "reference": "A",
  "alternative": "G",
  "delta_score": -0.001234,
  "prediction": "Likely pathogenic",
  "classification_confidence": 0.85,
  "mutation_type": "SNV"
}
```

**Mutation Types**:
- `SNV`: Single nucleotide variant (alternative: single base)
- `DELETION`: Deletion mutation (alternative: "-" or "")
- `INSERTION`: Insertion mutation (alternative: sequence to insert)

### Frontend API Routes (Next.js)

#### POST `/api/analyze`

**Description**: Proxy endpoint for variant analysis

**Query Parameters**:
- `variant_position` (required): Genomic position (1-based)
- `alternative` (required): Alternative allele
- `genome` (required): Genome assembly (e.g., "hg38")
- `chromosome` (required): Chromosome (e.g., "chr17")
- `mutation_type` (optional): Mutation type (default: "SNV")
- `reference` (optional): Reference allele (auto-detected if omitted)

**Response**: Same as backend endpoint

#### GET `/api/clinvar`

**Description**: Fetch ClinVar variants for a genomic region

**Query Parameters**:
- `chrom` (required): Chromosome (e.g., "chr17")
- `minBound` (required): Start position
- `maxBound` (required): End position
- `genomeId` (required): Genome assembly ("hg19" or "hg38")

**Response**:
```json
{
  "variants": [
    {
      "clinvar_id": "12345",
      "title": "NM_000059.3(BRCA1):c.5266dupC",
      "variation_type": "Single Nucleotide Variant",
      "classification": "Pathogenic",
      "gene_sort": "BRCA1",
      "chromosome": "17",
      "location": "43,119,628"
    }
  ]
}
```

#### GET `/api/predictions`

**Description**: Retrieve cached predictions

**Query Parameters**:
- `session_id` (required for list): Session ID
- `position` (optional): Variant position
- `chromosome` (optional): Chromosome
- `reference` (optional): Reference allele
- `alternative` (optional): Alternative allele

**Response**:
```json
{
  "predictions": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "position": 43119628,
      "chromosome": "chr17",
      "reference": "A",
      "alternative": "G",
      "delta_score": -0.001234,
      "prediction": "Likely pathogenic",
      "confidence": 0.85,
      "gene_symbol": "BRCA1",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/predictions`

**Description**: Save a prediction to cache

**Request Body**:
```json
{
  "session_id": "uuid",
  "result": {
    "position": 43119628,
    "chromosome": "chr17",
    "reference": "A",
    "alternative": "G",
    "deltaScore": -0.001234,
    "prediction": "Likely pathogenic",
    "confidence": 0.85,
    "geneSymbol": "BRCA1"
  }
}
```

**Response**:
```json
{
  "prediction": {
    "id": "uuid",
    ...
  }
}
```

#### GET `/api/sessions`

**Description**: List user sessions or fetch specific session

**Query Parameters**:
- `id` (optional): Session ID for specific session

**Response** (list):
```json
{
  "sessions": [
    {
      "id": "uuid",
      "name": "BRCA1 Analysis",
      "genome_assembly": "hg38",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Response** (single):
```json
{
  "session": {
    "id": "uuid",
    "name": "BRCA1 Analysis",
    "genome_assembly": "hg38",
    "selected_gene": {...},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "predictions": [...]
  }
}
```

#### POST `/api/sessions`

**Description**: Create a new analysis session

**Request Body**:
```json
{
  "name": "BRCA1 Analysis",
  "genome_assembly": "hg38",
  "selected_gene": {...}
}
```

**Response**: Session object

#### PATCH `/api/sessions`

**Description**: Update session metadata

**Request Body**:
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "genome_assembly": "hg38",
  "selected_gene": {...}
}
```

**Response**: Updated session object

#### DELETE `/api/sessions`

**Description**: Delete a session and all associated predictions

**Query Parameters**:
- `id` (required): Session ID

**Response**:
```json
{
  "success": true
}
```

---

## Installation and Setup

### Prerequisites

- **Node.js**: 20.x or later
- **pnpm**: 9.x or later
- **Python**: 3.12 or later
- **Modal Account**: For backend deployment
- **Supabase Account**: For database and authentication

### Backend Setup

1. **Install Modal CLI**:
```bash
pip install modal
```

2. **Authenticate with Modal**:
```bash
modal token new
```

3. **Navigate to backend directory**:
```bash
cd backend
```

4. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

5. **Deploy to Modal**:
```bash
modal deploy main.py
```

6. **Configure API Key** (optional, for production):
```bash
modal secret create evo2-api-key MODAL_API_KEY=your-secret-key-here
```

Update `main.py` to include the secret:
```python
@app.cls(
    ...
    secrets=[modal.Secret.from_name("evo2-api-key")]
)
```

7. **Save the endpoint URL** from the deployment output for frontend configuration.

### Frontend Setup

1. **Navigate to prototype directory**:
```bash
cd prototype
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Set up environment variables**:

Create `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Modal API Configuration
NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL=https://your-workspace--evo2-snv-pathogenicity-evo2model-analyze-single-variant.modal.run
MODAL_API_KEY=your-modal-api-key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Set up Supabase database**:

Run the migration script in Supabase SQL Editor:
```bash
# Copy contents of prototype/supabase-migration.sql
# Paste into Supabase SQL Editor and execute
```

5. **Configure Supabase Authentication**:

- Enable Email authentication in Supabase Dashboard
- Configure email templates (see `SUPABASE_EMAIL_SETUP.md`)
- Set up redirect URLs for production

6. **Start development server**:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Database Migration

The database schema is defined in `prototype/supabase-migration.sql`. Key components:

1. **Sessions Table**: Stores user analysis sessions
2. **Predictions Table**: Caches variant analysis results
3. **Indexes**: Optimize query performance
4. **Triggers**: Auto-update timestamps
5. **RLS Policies**: Enforce user data isolation

Execute the migration in the Supabase SQL Editor after creating your project.

---

## Deployment

### Backend Deployment (Modal)

The backend is deployed as a serverless function on Modal:

1. **Deploy**:
```bash
cd backend
modal deploy main.py
```

2. **Monitor**:
```bash
modal app logs extended-evo2-snv-pathogenicity --follow
```

3. **Update**:
```bash
modal deploy main.py --force-build  # Force rebuild image
```

### Frontend Deployment (Vercel)

The frontend is optimized for Vercel deployment:

1. **Connect Repository** to Vercel
2. **Configure Environment Variables** in Vercel dashboard
3. **Deploy** automatically on git push

**Required Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL`
- `MODAL_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

### Production Considerations

1. **API Key Security**: Always use API keys in production
2. **CORS Configuration**: Configure allowed origins in Modal
3. **Rate Limiting**: Implement rate limiting for public endpoints
4. **Error Monitoring**: Set up error tracking (Sentry, etc.)
5. **Database Backups**: Configure Supabase automated backups
6. **CDN**: Use Vercel Edge Network for static assets
7. **Analytics**: Configure Vercel Analytics for performance monitoring

---

## Code Structure

### Backend Structure

```
backend/
├── main.py                 # Modal app definition and API endpoints
├── requirements.txt        # Python dependencies
├── README.md              # Backend deployment guide
└── evo2/                  # Evo2 model package (submodule or local)
    ├── evo2/
    │   ├── models.py      # Model definitions
    │   ├── scoring.py      # Sequence scoring functions
    │   └── utils.py        # Utility functions
    └── notebooks/          # Analysis notebooks
```

### Frontend Structure

```
prototype/
├── app/
│   ├── api/               # Next.js API routes
│   │   ├── analyze/      # Variant analysis proxy
│   │   ├── clinvar/      # ClinVar integration
│   │   ├── predictions/  # Prediction persistence
│   │   └── sessions/      # Session management
│   ├── console/          # Main analysis interface
│   ├── dashboard/        # Session dashboard
│   ├── signin/           # Authentication
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI primitives
│   ├── variant-analysis-panel.tsx
│   ├── gene-context-panel.tsx
│   ├── sequence-viewer.tsx
│   └── ...
├── lib/                  # Utilities and types
│   ├── api.ts            # External API client
│   ├── types.ts          # TypeScript interfaces
│   ├── supabase.ts       # Supabase client
│   ├── auth-client.ts    # Authentication utilities
│   └── utils.ts          # Helper functions
├── public/               # Static assets
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

### Key Files

**Backend**:
- `main.py`: Core API logic, model loading, variant analysis
- `requirements.txt`: Python dependencies

**Frontend**:
- `app/console/page.tsx`: Main application interface
- `lib/api.ts`: External API integration layer
- `components/variant-analysis-panel.tsx`: Variant input and results
- `components/sequence-viewer.tsx`: Genomic sequence visualization
- `lib/types.ts`: TypeScript type definitions

---

## Key Features

### Variant Analysis

- **Multiple Mutation Types**: SNV, deletion, insertion support
- **Real-time Prediction**: Instant pathogenicity classification
- **Confidence Scores**: Statistical confidence based on training data
- **Delta Score Calculation**: Log-likelihood difference between reference and variant

### Gene Discovery

- **NCBI Gene Search**: Search by symbol, name, or ID
- **Genomic Coordinates**: Automatic coordinate fetching
- **Gene Metadata**: Summary, organism, and description
- **Sequence Fetching**: UCSC API integration for sequence data

### ClinVar Integration

- **Region-based Search**: Query variants in genomic regions
- **Clinical Significance**: Pathogenic, benign, VUS classifications
- **Variant Comparison**: Compare Evo2 predictions with ClinVar
- **Rate Limiting**: Respects NCBI API rate limits

### Session Management

- **Persistent Sessions**: Save analysis state
- **Session Sharing**: Shareable URLs with session IDs
- **Prediction Caching**: Avoid redundant API calls
- **Multi-session Support**: Manage multiple analysis sessions

### Visualization

- **Sequence Viewer**: Interactive genomic sequence display
- **3D Structure**: Molstar integration for protein structures
- **Resizable Panels**: Customizable layout
- **Interactive Tours**: Onboarding with React Joyride

### User Experience

- **Responsive Design**: Mobile and desktop optimized
- **Dark Mode**: Theme support via next-themes
- **Error Handling**: Comprehensive error messages
- **Loading States**: Clear feedback during async operations
- **Keyboard Navigation**: Accessible keyboard shortcuts

---

## Configuration

### Environment Variables

#### Backend (Modal)

- `MODAL_API_KEY`: API key for endpoint authentication (optional)

#### Frontend (Next.js)

**Required**:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-side only)
- `NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL`: Modal endpoint URL

**Optional**:
- `MODAL_API_KEY`: Modal API key for authenticated requests
- `NEXT_PUBLIC_SITE_URL`: Site URL for auth redirects

### Modal Configuration

Key configuration parameters in `main.py`:

- **GPU Type**: `gpu="H100"` (can use `A10G` or `T4` for development)
- **Max Containers**: `max_containers=3` (concurrent request limit)
- **Scaledown Window**: `scaledown_window=120` (keep warm for 2 minutes)
- **Retries**: `retries=2` (automatic retry on failure)

### Supabase Configuration

1. **Authentication**: Enable email provider
2. **Database**: Run migration script
3. **RLS Policies**: Configure based on access requirements
4. **Storage**: Optional file storage for exports

---

## Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Follow Next.js recommended rules
- **Prettier**: Automatic code formatting
- **Python**: Follow PEP 8, use type hints

### Component Patterns

- **Server Components**: Default to server components for data fetching
- **Client Components**: Use `"use client"` only when necessary
- **Error Boundaries**: Wrap error-prone components
- **Loading States**: Always show loading indicators

### API Design

- **RESTful**: Follow REST conventions
- **Error Responses**: Consistent error format with `error` field
- **Status Codes**: Use appropriate HTTP status codes
- **Validation**: Validate all inputs server-side

### Testing

- **Unit Tests**: Test utility functions
- **Integration Tests**: Test API routes
- **E2E Tests**: Test critical user flows
- **Type Safety**: Leverage TypeScript for compile-time checks

### Performance

- **Caching**: Cache predictions and gene data
- **Lazy Loading**: Code-split large components
- **Image Optimization**: Use Next.js Image component
- **API Optimization**: Batch requests when possible

### Security

- **API Keys**: Never expose in client-side code
- **Input Validation**: Validate and sanitize all inputs
- **SQL Injection**: Use parameterized queries (Supabase handles this)
- **XSS Prevention**: React automatically escapes content
- **CORS**: Configure allowed origins

---

## Troubleshooting

### Backend Issues

**Cold Start Delays**: First request after inactivity takes 30-60 seconds for model loading. Use `scaledown_window` to keep containers warm.

**CUDA Out of Memory**: Ensure using H100 GPU. The 7B model requires significant VRAM.

**UCSC API Errors**: Verify chromosome format (must include "chr" prefix, e.g., "chr17").

### Frontend Issues

**Supabase Connection**: Verify environment variables are set correctly.

**API Route Errors**: Check browser console and server logs for detailed error messages.

**Build Errors**: Clear `.next` directory and `node_modules`, then reinstall:
```bash
rm -rf .next node_modules
pnpm install
pnpm build
```

### Database Issues

**RLS Policy Errors**: Ensure user is authenticated and policies are correctly configured.

**Migration Errors**: Run migration script in Supabase SQL Editor, not via CLI.

---

## License

This project is provided for research and educational purposes. Please refer to the Evo2 model license for usage restrictions on the underlying model.

---

## Contact and Support

For questions, issues, or contributions, please refer to the project repository or contact the research team.

**Researcher**: Khaireddine Arbouch

**Acknowledgments**: Special thanks to Andreas Trolle for the idea inspiration.

---

*Last Updated: 2026*

