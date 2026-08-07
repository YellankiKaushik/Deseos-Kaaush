# Project Structure Report

## 1. Project Overview

- Project name: AspireList
- Project description: A personal acquisition dashboard for saving desired products, planning purchases, tracking savings, and keeping a record of completed goals.
- Primary language(s): TypeScript, TSX, SQL
- Framework(s): React 19, TanStack Start, TanStack Router, TanStack Query
- Build tool(s): Vite, TypeScript, ESLint, Prettier, Vitest
- Package manager: Bun (primary, as shown in README and bunfig.toml). A package-lock.json file is also present.
- Database: PostgreSQL via Supabase
- Backend framework: TanStack Start server functions with Nitro
- Frontend framework: React 19 with TanStack Router and React Query
- Authentication method: Supabase Auth with email/password and Google OAuth via Lovable cloud auth integration
- State management: React Query for async server state; local component state for forms and UI interactions
- Testing framework: Vitest
- Deployment configuration: TanStack Start/Nitro app configured for a Node/edge-friendly deployment target, with Supabase and Lovable integrations. No Dockerfile or docker-compose configuration is present.

## 2. Directory Tree

```text
.
├── .env
├── .env.example
├── .gitignore
├── .lovable/
│   └── project.json
├── .output/
│   ├── nitro.json
│   ├── package.json
│   ├── package-lock.json
│   ├── public/
│   │   ├── _headers
│   │   ├── assets/
│   │   ├── favicon.ico
│   │   └── robots.txt
│   └── server/
│       ├── _chunks/
│       ├── _libs/
│       ├── _ssr/
│       ├── index.mjs
│       └── wrangler.json
├── .prettierignore
├── .prettierrc
├── .tanstack/
│   └── tmp/
├── .wrangler/
│   └── deploy/
│       └── config.json
├── AGENTS.md
├── bun.lock
├── bunfig.toml
├── components.json
├── docs/
│   └── lovable project .md
├── eslint.config.js
├── package.json
├── package-lock.json
├── project-tree.txt
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── README.md
├── src/
│   ├── components/
│   │   ├── app-shell.tsx
│   │   ├── image-field.tsx
│   │   │   └── item-card.tsx
│   │   ├── item-form.tsx
│   │   ├── item-image.tsx
│   │   └── ui/
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input.tsx
│   │       ├── input-otp.tsx
│   │       ├── label.tsx
│   │       ├── menubar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toggle.tsx
│   │       ├── toggle-group.tsx
│   │       └── tooltip.tsx
│   ├── hooks/
│   │   └── use-mobile.tsx
│   ├── integrations/
│   │   ├── lovable/
│   │   │   └── index.ts
│   │   └── supabase/
│   │       ├── auth-attacher.ts
│   │       ├── auth-middleware.ts
│   │       ├── client.server.ts
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/
│   │   ├── __tests__/
│   │   │   └── aspire.test.ts
│   │   ├── aspire.ts
│   │   ├── backup.ts
│   │   ├── error-capture.ts
│   │   ├── error-page.ts
│   │   ├── extract.functions.ts
│   │   ├── extract.server.ts
│   │   ├── extraction-ui.ts
│   │   ├── images.ts
│   │   ├── item-payload.ts
│   │   ├── lovable-error-reporting.ts
│   │   ├── queries.ts
│   │   └── utils.ts
│   ├── router.tsx
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── auth.tsx
│   │   ├── index.tsx
│   │   ├── README.md
│   │   └── _authenticated/
│   │       ├── archived.tsx
│   │       ├── categories.tsx
│   │       ├── collections.$id.tsx
│   │       ├── collections.index.tsx
│   │       ├── dashboard.tsx
│   │       ├── items.$id.tsx
│   │       ├── items.new.tsx
│   │       ├── purchased.tsx
│   │       ├── route.tsx
│   │       └── settings.tsx
│   ├── routeTree.gen.ts
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 20260804160750_4c0ec702-2112-41eb-8df8-e867ae458d24.sql
│       ├── 20260804160812_b1a63b3d-a4d5-4035-9e88-57fdd7529e80.sql
│       └── 20260805063400_03d85098-ed2c-4de7-966c-4c3e54d652a1.sql
├── tsconfig.json
└── vite.config.ts
```

## 3. Important Files

- package.json: Main manifest for scripts, dependencies, and dev dependencies. It defines the development, build, lint, test, and formatting commands.
- package-lock.json: Lockfile generated for npm-compatible dependency resolution. The repository also includes bun.lock and bunfig.toml for Bun-based development.
- tsconfig.json: TypeScript compiler settings, path aliases, strict mode, bundler module resolution, and JSX configuration.
- vite.config.ts: Vite/TanStack Start configuration. It redirects the TanStack Start server entry to src/server.ts.
- next.config.*: Not present.
- webpack.config.*: Not present.
- docker-compose.yml: Not present.
- Dockerfile: Not present.
- README.md: Project overview, stack summary, environment setup, data model, and extraction description.
- .env.example: Template for required Supabase environment variables.
- .github workflows: No .github directory or workflow files were found.
- components.json: shadcn/ui configuration and alias mapping for UI component generation.
- eslint.config.js: ESLint rules and Prettier integration.
- bunfig.toml: Bun installation guardrails and package age restrictions.
- supabase/config.toml: Supabase project configuration.

## 4. Source Code Organization

- Frontend folders: src/components, src/routes, src/styles.css, src/hooks
- Backend folders: src/server.ts, src/start.ts, src/integrations/supabase, src/lib/extract.server.ts, src/lib/extract.functions.ts
- API routes: The app uses TanStack Start server functions rather than a conventional Express or Next API layer. Server-side logic is exposed through files such as src/lib/extract.functions.ts and middleware under src/integrations/supabase.
- Components: Reusable UI primitives live in src/components/ui, while feature components like app-shell.tsx, item-form.tsx, item-card.tsx, item-image.tsx, and image-field.tsx implement the app-specific experience.
- Pages: Route modules under src/routes define pages such as the landing page, authentication page, dashboard, collection views, item detail/new item pages, settings, purchased items, and archived items.
- Services: Data access and domain logic are centralized in src/lib/queries.ts, src/lib/backup.ts, src/lib/images.ts, src/lib/item-payload.ts, src/lib/aspire.ts, and src/lib/extract.server.ts.
- Hooks: src/hooks/use-mobile.tsx contains a small responsive hook for mobile detection.
- Utilities: src/lib/utils.ts and helper modules under src/lib provide formatting, URL normalization, error handling, and backup/import utilities.
- Database models: Supabase migrations define profiles, categories, collections, items, item_collections, item_images, price_history, extraction_logs, and a bootstrap trigger for new users.
- Middleware: src/integrations/supabase/auth-middleware.ts and src/integrations/supabase/auth-attacher.ts manage Supabase authentication flow and server-side protection.
- Context providers: The router context is defined in src/router.tsx and src/routes/__root.tsx. There is no separate global state store like Redux or Zustand.
- Assets: Static assets live in public/ and images are handled through Supabase storage and the item image component.
- Public folder: public/ contains favicon.ico and robots.txt, which are served directly by the app.

## 5. Feature Breakdown

### 1. Authentication and account lifecycle
- Main files involved: src/routes/auth.tsx, src/integrations/supabase/client.ts, src/integrations/lovable/index.ts, src/integrations/supabase/auth-attacher.ts
- Purpose: Sign in, sign up, sign out, and support Google OAuth.
- Dependencies: Supabase Auth, Lovable cloud auth integration, TanStack Router navigation.

### 2. Dashboard and wishlist management
- Main files involved: src/routes/_authenticated/dashboard.tsx, src/components/item-card.tsx, src/lib/queries.ts, src/lib/aspire.ts
- Purpose: Display wishlist items with search, filters, sorting, progress, and summary totals.
- Dependencies: React Query, Supabase items table, shared Aspire helpers.

### 3. Item creation and editing
- Main files involved: src/routes/_authenticated/items.new.tsx, src/routes/_authenticated/items.$id.tsx, src/components/item-form.tsx, src/components/image-field.tsx
- Purpose: Add new items, edit existing items, attach images, assign categories/collections, and save progress.
- Dependencies: Supabase items table, item payload helpers, image storage helpers, TanStack Router.

### 4. Product link extraction
- Main files involved: src/lib/extract.server.ts, src/lib/extract.functions.ts, src/lib/extraction-ui.ts, src/routes/_authenticated/items.new.tsx
- Purpose: Fetch product metadata from web pages, extract structured fields, and fall back to manual entry when extraction fails.
- Dependencies: Server-side fetch logic, Supabase logging, UI extraction feedback.

### 5. Collections and categorization
- Main files involved: src/routes/_authenticated/collections.index.tsx, src/routes/_authenticated/collections.$id.tsx, src/routes/_authenticated/categories.tsx
- Purpose: Organize wishlisted items into collections and categories.
- Dependencies: Supabase collections, categories, and item_collections tables.

### 6. Purchase tracking and status lifecycle
- Main files involved: src/routes/_authenticated/purchased.tsx, src/routes/_authenticated/archived.tsx, src/lib/aspire.ts
- Purpose: Separate purchased, archived, and active items while preserving historical metadata.
- Dependencies: item status and archived flags in the database.

### 7. User settings and backup/restore
- Main files involved: src/routes/_authenticated/settings.tsx, src/lib/backup.ts, src/lib/queries.ts
- Purpose: Manage theme and display preferences, export user data, and restore from a backup file.
- Dependencies: Supabase profiles and user-owned tables.

### 8. Image storage and media handling
- Main files involved: src/components/item-image.tsx, src/lib/images.ts, src/integrations/supabase/client.ts
- Purpose: Upload item photos and display them from Supabase storage.
- Dependencies: Supabase storage bucket and signed URL handling.

### 9. Error handling and observability
- Main files involved: src/lib/error-page.ts, src/lib/error-capture.ts, src/lib/lovable-error-reporting.ts, src/server.ts, src/start.ts
- Purpose: Render friendly error pages and capture runtime problems for investigation.
- Dependencies: TanStack Start middleware, Lovable error reporting hooks.

## 6. Git Commit Plan

The following is a logical development sequence based on the current codebase. It is a proposed milestone plan, not a fabricated commit history.

### Phase 1 — Project foundation
- Establish the app shell, routing, and shared UI foundation.
- Configure TypeScript, Vite, TanStack Start, styling, and lint/test tooling.
- Add the initial documentation and environment configuration.

### Phase 2 — Authentication and user model
- Implement Supabase client setup and auth flows.
- Add protected routes and user profile bootstrap logic.
- Connect account sign-in/sign-out and OAuth entry points.

### Phase 3 — Database and data access layer
- Create and refine the Supabase migrations for profiles, categories, collections, items, and related tables.
- Add query helpers and shared type definitions for app entities.

### Phase 4 — Core wishlist workflow
- Implement the dashboard, item listing, filters, sorting, and card UI.
- Add item creation and editing flows, including validation and saving logic.

### Phase 5 — Rich item features
- Add price tracking, reason/status fields, savings progress, and purchase/archived states.
- Add image upload and storage integration.

### Phase 6 — Link extraction and enrichment
- Build and refine the server-side product extraction pipeline.
- Surface extraction feedback and manual correction in the item form.

### Phase 7 — Organization and productivity features
- Implement collections, categories, duplicate detection, and backup/export utilities.
- Add settings for preferences and restore/import workflows.

### Phase 8 — Testing, documentation, and refinement
- Add and expand automated tests.
- Improve developer documentation and cleanup shared helpers.
- Refactor the app structure for maintainability and future expansion.

## 7. Dependency Summary

### Frontend
- react
- react-dom
- @tanstack/react-router
- @tanstack/react-query
- @tanstack/react-start
- lucide-react
- sonner
- recharts
- react-hook-form
- react-day-picker
- react-resizable-panels
- embla-carousel-react

### Backend
- nitro
- @supabase/supabase-js
- @tanstack/react-start

### Database
- PostgreSQL (via Supabase)
- Supabase SQL migrations

### Authentication
- @supabase/supabase-js
- @lovable.dev/cloud-auth-js

### Styling
- tailwindcss
- @tailwindcss/vite
- tw-animate-css
- class-variance-authority
- clsx
- tailwind-merge

### Utilities
- zod
- date-fns
- input-otp
- cmdk
- vaul
- @hookform/resolvers

### Dev dependencies
- vite
- vitest
- typescript
- eslint
- prettier
- @vitejs/plugin-react
- @types/react
- @types/react-dom
- @types/node
- eslint-plugin-react-hooks
- eslint-plugin-react-refresh
- globals
- typescript-eslint

## 8. Entry Points

- Application entry point: src/routes/__root.tsx (router shell) and src/start.ts (TanStack Start bootstrap)
- Backend entry point: src/server.ts and src/start.ts
- Frontend entry point: src/routes/index.tsx and the route tree generated in src/routeTree.gen.ts
- Build command: npm run build or bun run build
- Development command: npm run dev or bun run dev
- Production command: npm run build followed by npm run preview or bun run preview
