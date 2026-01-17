# Copilot / AI Agent Instructions — EduGalaxy Parent Dashboard

Short, concrete guidance to help an AI coding agent become productive in this repository.

## Big picture
- Frontend: Vite + React app at the repository root `src/` (dev server: `npm run dev`). See [src/App.jsx](src/App.jsx) and the shell at [src/layout/AppShell.jsx].
- Backend: Express + Prisma in `backend/` (API runs on port 5050). See [backend/src/server.js](backend/src/server.js).
- Data: Prisma with a local SQLite driver (`better-sqlite3`). Schema lives at `backend/prisma/schema.prisma` and migrations at `backend/prisma/migrations/`.
- 3D scenes: reusable three.js components under `src/three/` (used in subject pages).

Why this structure: small single-page React frontend that talks to a lightweight Express API. The backend holds auth, data models (Prisma), and simple protected routes used by the UI.

## How to run / developer workflows
- Install root frontend deps: run in repo root:

```bash
npm install
npm run dev
```

- Backend (separate):

```bash
cd backend
npm install
npm run dev   # nodemon src/server.js
```

- Database / Prisma:

```bash
cd backend
npm run db:migrate   # runs `prisma migrate dev`
npm run db:studio    # open Prisma Studio
```

Order note: start the backend first (port 5050) then the frontend (Vite default 5173). Backend CORS is configured for `http://localhost:5173` in [backend/src/server.js](backend/src/server.js).

## Environment & common failure modes
- The backend expects a `JWT_SECRET` env var (used in `backend/src/auth/utils.js`). If absent the code falls back to a `dev_secret`, but tests or production flows need a real secret.
- Prisma uses SQLite locally; migration errors usually come from an out-of-sync schema — run `npm run db:migrate` in `backend/` to update.
- If frontend cannot reach API, confirm backend is listening on `5050` and CORS matches `http://localhost:5173`.

## Authentication patterns & API surface
- Routes:
  - `POST /api/auth/register` — creates parent and returns `{ token }` (see [backend/src/auth/auth.routes.js](backend/src/auth/auth.routes.js)).
  - `POST /api/auth/login` — returns `{ token }` on success.
  - `GET /api/me` — protected; server uses middleware to validate Bearer token and attach `req.auth`/`req.user`.
- Token format: JWT Bearer in `Authorization` header. The token payload includes `{ parentId, role }` (see [backend/src/auth/utils.js](backend/src/auth/utils.js)).
- Client-side: `src/lib/api.js` uses `http://localhost:5050` as `API_URL` and expects a Bearer token for protected endpoints.

## Project-specific conventions and patterns
- ES modules everywhere (`"type": "module"` in package.json). Use `import`/`export` not `require`.
- Error responses are JSON with an `error` field (e.g. `{ error: "Invalid credentials" }`). Follow this shape in new API handlers.
- Auth middleware expects `Authorization: Bearer <token>` and returns 401 JSON on failures. See [backend/src/auth/auth.middleware.js](backend/src/auth/auth.middleware.js) and [backend/src/auth/authMiddleware.js](backend/src/auth/authMiddleware.js) for examples.
- Small, focused API routes under `backend/src/` — prefer adding new routes to `backend/src/` and mount under `/api/*` in `server.js`.

## Integration points / external deps
- Frontend ↔ Backend: HTTP (fetch) to `http://localhost:5050`. See `src/lib/api.js` for client helpers.
- DB: Prisma + `@prisma/client` with SQLite. Migrations live in `backend/prisma/migrations/`.
- 3D: `three`, `@react-three/fiber`, `@react-three/drei` are used for subject scenes. Look under `src/three/subjects/` for patterns.

## Files to inspect when working on a change
- Backend entry and auth: [backend/src/server.js](backend/src/server.js), [backend/src/auth/auth.routes.js](backend/src/auth/auth.routes.js), [backend/src/auth/utils.js](backend/src/auth/utils.js), [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- Frontend entry and API usage: [src/main.jsx](src/main.jsx), [src/lib/api.js](src/lib/api.js), [src/layout/AppShell.jsx](src/layout/AppShell.jsx)
- UI and 3D: [src/three/subjects/SubjectScene.jsx](src/three/subjects/SubjectScene.jsx) and related components in `src/ui/`.

## Example PR guidance for agents
- Keep backend changes minimal and preserve existing response shapes (JSON `{ error }` on failure). Update Prisma schema + run `npm run db:migrate` in `backend/` when altering models.
- For frontend changes, follow existing component patterns (functional components, hooks, `AppShell` layout). Use `src/lib/api.js` for network calls.

## What I merged / replaced
- No repository-level Copilot instructions were present; this file was added to centralize agent knowledge. If you have an existing internal AGENT.md, copy project-specific rules into this file.

---
If any section is unclear or you'd like more examples (e.g. a runnable dev checklist, sample `.env` contents, or more file links), tell me which area to expand. 
