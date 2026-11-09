# Creator Hub — Production Web Platform

A personal-first creator management platform designed to scale into a multi-user SaaS product. Creator Hub empowers creators to generate high-CTR metadata locally using **Ollama**, stage source videos temporarily in **Google Drive** (zero permanent storage), schedule and publish to **YouTube**, and monitor analytics—all within a single unified workspace.

---

## 🏛 Technical Architecture & Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | Full-stack production React framework with Partial Prerendering & Turbopack. |
| **Language** | **TypeScript 5 (Strict mode)** | End-to-end typed domain models and API contracts. |
| **Styling** | **Tailwind CSS v4** | Modern dark-mode creator interface with micro-interactions. |
| **Icons & Primitives** | **Lucide Icons** | Design system iconography and components. |
| **Local AI Engine** | **Ollama (`llama3.2`)** | Local LLM inference for YouTube titles, descriptions, and tags without sending prompts to cloud providers. |
| **Temporary Media** | **Google Drive API** | Ephemeral staging for video files with verified post-upload deletion safeguards. |
| **Publishing Platform** | **YouTube Data API v3** | Google OAuth authentication, resumable video uploads, and metadata sync. |
| **Database & Auth** | **Supabase Cloud PostgreSQL** | Relational application metadata with Row Level Security (RLS) policies. |
| **Validation** | **Zod** | Strict schema validation for AI structured outputs and API payloads. |

---

## 📁 Professional Production-Grade Folder Structure

```text
creator-hub/
├── .env.example                         # Documented environment configuration template
├── package.json                         # Dependencies and build scripts
├── tsconfig.json                        # Strict TypeScript compilation settings
├── next.config.ts                       # Next.js 16 build and runtime configurations
├── supabase/
│   └── schema.sql                       # Complete PostgreSQL schema (12 entities + RLS policies)
│
└── src/
    ├── app/                             # Next.js App Router
    │   ├── (auth)/                      # Authentication route group
    │   │   ├── login/page.tsx           # Supabase sign-in & workspace access
    │   │   └── callback/route.ts        # Supabase OAuth token exchange callback
    │   │
    │   ├── (dashboard)/                 # Authenticated application shell
    │   │   ├── layout.tsx               # Dashboard shell (Sidebar, System Status Bar, Header)
    │   │   ├── page.tsx                 # Overview dashboard (Metrics, pipeline, quick actions)
    │   │   ├── studio/page.tsx          # Content Studio (Composer, Ollama AI drawer, Drive stager)
    │   │   ├── calendar/page.tsx        # Content Calendar (Daily, weekly, monthly views)
    │   │   ├── media/page.tsx           # Google Drive temporary media staging monitor
    │   │   ├── history/page.tsx         # Upload history, error audit logs & YouTube video IDs
    │   │   ├── analytics/page.tsx       # YouTube performance snapshots & view counts
    │   │   ├── accounts/page.tsx        # Connected platforms & Google OAuth channel management
    │   │   └── settings/page.tsx        # Ollama local runtime & retention policy configuration
    │   │
    │   ├── api/                         # Production REST API Route Handlers
    │   │   ├── accounts/
    │   │   │   ├── route.ts             # List connected social accounts
    │   │   │   └── youtube/connect/     # Initiate Google OAuth flow
    │   │   ├── ai/
    │   │   │   ├── youtube-metadata/    # Local Ollama structured metadata generation
    │   │   │   └── health/              # Ollama runtime health & latency check
    │   │   ├── content/
    │   │   │   ├── route.ts             # CRUD drafts & post concepts
    │   │   │   └── [id]/route.ts        # Fetch / update / delete draft
    │   │   ├── media/
    │   │   │   └── drive-stage/         # Register temporary Google Drive file references
    │   │   ├── schedules/
    │   │   │   ├── route.ts             # List and create scheduled posts
    │   │   │   └── [id]/cancel/         # Cancellation with media dependency safeguards
    │   │   ├── publishing/
    │   │   │   ├── [targetId]/publish-now/ # Trigger manual publish
    │   │   │   └── history/             # Publishing audit logs & failure reconciliation
    │   │   └── analytics/overview/      # YouTube channel & video analytics snapshots
    │   │
    │   ├── globals.css                  # Tailwind CSS v4 variables & base styles
    │   └── layout.tsx                   # Root HTML document & metadata
    │
    ├── components/
    │   ├── ui/                          # Reusable UI Design Primitives
    │   │   ├── button.tsx               # Button with loading states and variants
    │   │   ├── card.tsx                 # Card, Header, Title, Description, Content
    │   │   ├── badge.tsx                # Status badges (success, info, warning, danger)
    │   │   ├── input.tsx                # Accessible text & number inputs
    │   │   ├── textarea.tsx             # Multiline text areas
    │   │   ├── select.tsx               # Dropdown selectors
    │   │   ├── status-indicator.tsx     # Real-time pulse indicator (online/offline)
    │   │   └── icons.tsx                # Custom SVGs (YouTube, etc.)
    │   │
    │   ├── layout/                      # Global App Shell Components
    │   │   ├── sidebar.tsx              # Navigation sidebar with status badges
    │   │   ├── header.tsx               # Top header with quick action triggers
    │   │   └── system-status-bar.tsx    # Live Ollama, Drive & YouTube health monitor
    │   │
    │   └── modules/                     # Feature-Driven Business Modules
    │       ├── studio/
    │       │   ├── content-composer.tsx # Unified post editor (metadata, media, schedule)
    │       │   ├── ai-metadata-assistant.tsx # Ollama prompt generator with candidate titles
    │       │   └── media-stager.tsx     # Google Drive file ID link & staging helper
    │       ├── calendar/
    │       │   └── calendar-grid.tsx    # Schedule grid with status & platform filters
    │       ├── media/
    │       │   └── staged-media-table.tsx # Ephemeral assets table & retention countdown
    │       ├── history/
    │       │   └── history-table.tsx    # Publishing attempts and error recovery
    │       ├── analytics/
    │       │   └── channel-overview.tsx # Stat cards and recent video performance
    │       └── accounts/
    │           └── youtube-channel-card.tsx # Channel card with OAuth connection status
    │
    ├── lib/                             # Core Integration Clients & Utilities
    │   ├── ollama/
    │   │   ├── client.ts                # Local Ollama client (generation, health check)
    │   │   ├── prompts.ts               # Structured YouTube metadata prompt templates
    │   │   └── schema.ts                # Zod schemas for validated LLM outputs
    │   ├── drive/
    │   │   ├── client.ts                # Google Drive staging client
    │   │   └── retention.ts             # Safe deletion safeguards (Section 5.1/5.2)
    │   ├── youtube/
    │   │   ├── client.ts                # YouTube Data API v3 OAuth & channels client
    │   │   └── types.ts                 # Scopes, channel profiles, upload payloads
    │   ├── supabase/
    │   │   ├── client.ts                # Browser Supabase client
    │   │   └── server.ts                # Server-side Supabase client
    │   └── utils/
    │       ├── cn.ts                    # Class name merger (clsx + tailwind-merge)
    │       ├── formatters.ts            # Date, bytes, and compact numbers formatting
    │       └── timezone.ts              # Timezone normalization to UTC
    │
    ├── services/                        # Isolated Business Logic Layer
    │   ├── content.service.ts           # Draft persistence and post lifecycle
    │   ├── ai.service.ts                # Ollama local AI orchestrator
    │   ├── media.service.ts             # Media reference management
    │   ├── schedule.service.ts          # Schedule calculations & publishing jobs
    │   ├── publishing.service.ts        # Safe upload sequence & Drive cleanup
    │   └── accounts.service.ts          # YouTube account & token management
    │
    ├── constants/                       # Central Application Constants
    │   ├── navigation.ts                # Sidebar routes and metadata
    │   ├── youtube.ts                   # Video categories, privacy states, length limits
    │   └── config.ts                    # Recommended models, default retention hours
    │
    ├── types/                           # TypeScript Domain Models
    │   ├── database.ts                  # 12 PostgreSQL entities matching Section 8
    │   ├── content.ts                   # Draft and composer types
    │   ├── ai.ts                        # Ollama request/response & health status
    │   ├── media.ts                     # Media assets & retention types
    │   ├── schedule.ts                  # Calendar event & schedule requests
    │   ├── analytics.ts                 # YouTube performance snapshot metrics
    │   └── api.ts                       # Standard API response wrappers
    │
    └── config/
        └── env.ts                       # Type-safe environment validation using Zod
```

---

## 🔒 Key Blueprint Safeguards Implemented

### 1. Local AI Privacy Guarantee (Section 4)
- Ollama is configured to run on `http://127.0.0.1:11434`.
- Video topics, summaries, and transcripts remain on the local machine and are not sent to any cloud AI provider.
- Model output is treated as untrusted input and strictly parsed and validated using Zod schemas (`src/lib/ollama/schema.ts`).
- Human approval is required: generated metadata fills editable fields and is never published without creator review.

### 2. Ephemeral Media Retention & Safe Deletion Sequence (Section 5)
- Video files are never permanently stored in the application database.
- Google Drive acts as a temporary staging location.
- **Critical safeguard (`src/lib/drive/retention.ts`):** A staged file is deleted from Google Drive **only after** YouTube upload success is confirmed and a valid YouTube video ID is recorded.
- If an upload fails, the staged file is retained for retry and reconciliation.
- Cancelling a scheduled post checks whether any other active draft or schedule references the file before deletion.

### 3. PostgreSQL Database & Row Level Security (Section 8 & 10)
- `supabase/schema.sql` provides the complete database definition for all 12 core tables:
  `user_profiles`, `social_media_platforms`, `social_media_accounts`, `social_media_account_tokens`, `media_assets`, `content_posts`, `content_post_platforms`, `content_schedules`, `publishing_jobs`, `publishing_history`, `post_analytics`, `content_tags`.
- OAuth tokens are encrypted server-side and protected with strict Row Level Security (RLS) policies.

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your local Ollama URL (defaults to `http://127.0.0.1:11434`) and your Supabase credentials.

### 2. Run Local Ollama Instance
Ensure Ollama is running with your preferred local model:
```bash
ollama run llama3.2
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
```
Runs full TypeScript verification and optimizes all 22 static and dynamic routes.
