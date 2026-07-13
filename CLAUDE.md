# PO Workbench — Claude Code Documentation

## Project Overview

**PO Workbench** is a Product Owner-focused web application built with Next.js 16 and React 19. It provides tools for managing product strategy, requirements, and delivery pipelines with AI-powered insights.

### Core Architecture

**Tech Stack:**
- Framework: Next.js 16.2.9 with React 19.2.4
- Language: TypeScript 5
- Styling: Tailwind CSS 4
- AI Integration: OpenAI API (gpt-4o/gpt-3.5-turbo models)
- PDF Generation: jsPDF
- Linting: ESLint 9 with Next.js config

**Project Structure:**
```
src/
├── app/               # Next.js app router (page.tsx, layout.tsx, globals.css)
├── components/        # React components organized by feature
│   ├── Workbench.tsx  # Main app container and state management
│   ├── Inspector/     # Detail view for selected items
│   ├── Pipeline/      # Stage/workflow renderer and display
│   ├── TopBar/        # Header with controls and navigation
│   ├── CommandPalette/# Quick action palette
│   ├── Copilot/       # AI assistant panel
│   └── Shared/        # Reusable UI components (Badge, Tooltip, Icons, etc.)
└── lib/               # Business logic and utilities
    ├── types.ts       # TypeScript interfaces for domain models
    ├── prompts.ts     # AI prompt templates
    ├── stages.ts      # Pipeline/stage management logic
    ├── normalizers.ts # Data normalization and transformation
    ├── builders/      # Export format builders
    │   ├── markdown-builder.ts
    │   ├── pdf-builder.ts
    │   ├── jira-export.ts
    │   └── csv-export.ts
    ├── merge.ts       # Data merging/reconciliation
    ├── save-load.ts   # Persistence layer
    ├── mocks.ts       # Mock data for development
    └── context-builder.ts # AI context construction

```

### Key Features

1. **Pipeline Management** — Create, edit, and visualize product development stages
2. **AI-Powered Analysis** — Auto-calculate confidence scores and improvement tips via OpenAI
3. **Multi-Format Export** — Export to Markdown, PDF, JIRA, CSV
4. **Inspector** — Detailed editing interface for pipeline items
5. **Data Persistence** — Save/load workbench state
6. **Command Palette** — Quick navigation and actions

### State Management

Uses React hooks and context via `useWorkbench` custom hook in `src/hooks/useWorkbench.ts`. Main state lives in `Workbench.tsx` component.

### AI Integration Points

- OpenAI API for confidence scoring and tip generation
- Prompts defined in `src/lib/prompts.ts`
- Context built dynamically in `src/lib/context-builder.ts`

### Known Prototype Characteristics

- In-memory state only (no persistent backend); save/load via browser storage
- Multi-person approval tracking (Sign-off feature supports multiple named reviewers/approvers with timestamps)
- Server-side AI-powered file extraction for the Requirement Inbox (supports contextual insights from uploaded documents)
- Client-side pipeline editing and management with optional live AI analysis
- OpenAI API key stored securely server-side via `process.env.OPENAI_API_KEY` (never exposed to browser)
- No built-in authentication; all routes are open (network-level restrictions required for deployment)
- Basic error handling (room for improvement — see `/product-readiness` audit for details)
- No analytics or observability (Sentry integration ready but not configured)

### For Claude Code Sessions

**Pre-commit checks:** This repo enforces code quality at commit time via Husky hooks:
- **Secrets scan** — Blocks commits containing `.env.local` or API key patterns (OpenAI, Stripe)
- **ESLint** — Runs `npm run lint` and blocks commits with linting errors/warnings

Before proposing a commit, run `npm run lint` locally and fix any issues so they don't block the hook. This mirrors the CI lint gate (`.github/workflows/deploy.yml`), so anything that passes the hook will also pass CI/deploy.

Use the `/product-readiness` skill to audit the codebase for production-readiness before scaling to commercial users.

