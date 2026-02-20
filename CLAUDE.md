# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered claims review assistant for healthcare billing specialists at Joyful Health. Helps review denied/unpaid insurance claims with AI assistance while keeping humans in control of final decisions.

## Commands

```bash
# Development (runs both frontend and backend concurrently)
npm run dev

# Run only frontend (Vite dev server on port 5173)
npm run dev:client

# Run only backend (Express server on port 3001)
npm run dev:server

# Production build
npm run build

# Start production server (serves both API and static frontend)
npm start

# Lint
npm run lint
```

## Architecture

### Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express 5, Vercel AI SDK with Anthropic Claude
- **State**: Zustand stores (claims, chat, UI)
- **Deployment**: Digital Ocean App Platform (single service serving both API and static files)

### Three-Column Desktop Layout (App.tsx)
1. **Claims List** (`md:w-[280px] lg:w-[350px]`) - Filterable/sortable claim queue
2. **Claim Detail View** (`md:w-[320px] lg:w-[380px]`) - Selected claim details (desktop only)
3. **Chat Panel** (`flex-1`) - AI assistant conversation

Mobile uses a Sheet component for claim details and an overlay for chat.

### Server Tools (server/index.ts)
Four AI tools with streaming responses:
- `lookupClaim` - Retrieves claim details, emits `SELECT_CLAIM` action
- `suggestAction` - Analyzes claim, returns recommendation with confirmation card
- `draftAppeal` - Generates appeal letter with editable confirmation card
- `updateClaimStatus` - Returns confirmation (does NOT auto-execute)

Tools emit markers in the stream:
- `[[ACTION:{"type":"SELECT_CLAIM","claimId":"..."}]]` - Processed immediately for instant UI updates
- `[[CONFIRMATION:{...}]]` - Parsed at end, renders confirmation cards

### Human-in-the-Loop Flow
1. AI suggests action via tool call → returns `__confirmation` marker
2. Server streams confirmation to client
3. `ChatContainer` parses markers, creates `PendingConfirmation` objects
4. `ChatMessage` renders appropriate confirmation card (ActionConfirmation, StatusUpdateConfirmation, AppealDraftConfirmation)
5. User approves/modifies/dismisses → `POST /api/execute-action` executes if approved
6. For `suggestAction` approval, automatically sends follow-up chat message to proceed

### Data Flow
- `claims.json` - Immutable source of truth
- `data.json` - Mutable working copy (created on server start, reset via `/api/reset`)
- Claims loaded via `/api/claims`, updates via `/api/execute-action`

### Key Stores (Zustand)
- `useClaimsStore` - Claims data, selection, filtering, sorting
- `useUIStore` - Detail panel open state
- `useChatStore` - Chat state (currently unused, chat state is local to ChatContainer)

## Express 5 Notes
- Wildcard routes use `{*splat}` syntax, not `*`
- SPA fallback uses `app.use((req, res) => res.sendFile(...))` middleware

## Environment Variables
- `ANTHROPIC_API_KEY` - Required for AI functionality
- `PORT` - Server port (defaults to 3001 locally, 8080 on DO)
