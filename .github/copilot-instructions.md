# Copilot Instructions for AI Agents

## Project Overview
This is a modern TypeScript/React web application for managing a boxing gym, with features for bookings, scheduling, dashboards, Stripe payments, and Supabase integration. The codebase is organized for modularity and clarity, with distinct service, context, and component layers.

## Architecture & Key Patterns
- **Frontend:**
  - Built with React (see `App.tsx`, `components/`, `context/`).
  - UI is split into feature-based folders (e.g., `components/bookings/`, `components/dashboard/`, `components/auth/`).
  - Shared UI elements are in `components/ui/`.
- **Backend/Server:**
  - Minimal backend logic in `server.js` and `api/` (for Stripe and session management).
  - Supabase is used for database and authentication (`services/supabaseClient.ts`).
- **State Management:**
  - Context API is used for global state (`context/AuthContext.tsx`, `context/DataContext.tsx`).
- **Configuration:**
  - Environment variables (e.g., `GEMINI_API_KEY`) are set in `.env.local`.
  - Supabase config in `supabase/config.toml`.

## Developer Workflows
- **Install dependencies:** `npm install`
- **Run locally:** `npm run dev`
- **Build for production:** `npm run build`
- **Debugging:** Use Vite's hot-reload and browser dev tools. Most logic is in React components and context files.
- **Stripe integration:** Test payments via `api/create-checkout-session.ts` and `services/stripeService.ts`.
- **Supabase integration:** All DB/auth logic is in `services/supabaseClient.ts` and referenced in context files.

## Project-Specific Conventions
- **Component Structure:**
  - Feature folders group related modals, dashboards, and managers (e.g., `dashboard/`, `bookings/`).
  - UI primitives (Button, Modal, Input) are in `components/ui/`.
- **Type Definitions:**
  - Shared types in `types.ts` and `constants.ts`.
- **Helpers:**
  - Utility functions in `utils/` (e.g., `helpers.ts`, `time.ts`).
- **No custom test setup detected.**

## Integration Points
- **Stripe:** Payment logic in `api/` and `services/stripeService.ts`.
- **Supabase:** DB/auth in `services/supabaseClient.ts` and `supabase/` config.
- **Vite:** Build config in `vite.config.ts`.

## Examples
- To add a new booking feature, create a component in `components/bookings/` and update context in `context/DataContext.tsx`.
- For new UI elements, add to `components/ui/` and reuse across features.
- To extend authentication, modify `context/AuthContext.tsx` and update Supabase logic in `services/supabaseClient.ts`.

---

**For questions or unclear conventions, review `README.md` or ask for clarification.**
