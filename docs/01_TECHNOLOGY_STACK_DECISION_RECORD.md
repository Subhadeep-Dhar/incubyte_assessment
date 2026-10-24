# Phase 00: Technology Stack Evaluation & Architecture Decision Record (ADR)

**Document ID:** ADR-001  
**Status:** PROPOSED & EVALUATED  
**Author:** Senior Software Architect & Engineering Lead  
**Assessment:** Incubyte Car Dealership Inventory System

---

## 1. Context & Objectives

The Incubyte assessment demands a professional, enterprise-grade, and maintainable full-stack application demonstrating Test-Driven Development (TDD), clean architecture, strict security boundaries, robust data persistence, and high-fidelity UX.

This ADR evaluates the proposed technology stack for technical compatibility, developer ergonomics, testability, runtime risk, and maintenance overhead.

---

## 2. Technology Stack Evaluation

### 2.1 Frontend Architecture

| Proposed Technology       | Evaluated Version              | Purpose & Rationale                                                               | Compatibility & Risk Analysis                                                                                                                                                                                                                                                                                                            | Verdict                     |
| :------------------------ | :----------------------------- | :-------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------- |
| **React**                 | `^18.3.1` (or stable `19.0.0`) | View library for component-based SPA.                                             | **Risk Note:** While React 19 is available, some component ecosystem packages (certain Radix UI primitives and third-party UI helpers) still emit peer dependency warnings or compatibility quirks with React 19. Selecting React 18.3.x guarantees 100% stability with Radix UI, TanStack Query v5, and shadcn/ui without forced flags. | **APPROVED (React 18.3.1)** |
| **TypeScript**            | `^5.6.x`                       | Static typing across components, models, and API clients.                         | Enables end-to-end type safety between backend DTOs and frontend components. High maintainability.                                                                                                                                                                                                                                       | **APPROVED**                |
| **Vite**                  | `^6.x`                         | Build tool and fast HMR development server.                                       | Sub-second cold starts, native ESM support, direct Vitest integration, zero Webpack config bloat.                                                                                                                                                                                                                                        | **APPROVED**                |
| **HTML5 & CSS3**          | Standard                       | Semantic markup and native CSS capabilities.                                      | High accessibility, modern CSS variables, responsive viewport design.                                                                                                                                                                                                                                                                    | **APPROVED**                |
| **Tailwind CSS**          | `^3.4.17`                      | Utility-first styling framework.                                                  | **Risk Note:** Tailwind v4 introduced breaking configuration changes with `@tailwindcss/vite` and certain shadcn/ui color token conventions. Tailwind v3.4.x is mature, rock-solid, and the official baseline for shadcn/ui component generation.                                                                                        | **APPROVED (v3.4.x)**       |
| **Radix UI & shadcn/ui**  | `@radix-ui/*`                  | Unstyled, fully accessible UI primitives (Dialog, Dropdown, Label, Select, Slot). | Guarantees WAI-ARIA compliance, keyboard navigation, focus management, and screen-reader accessibility without bloated monolithic UI libraries.                                                                                                                                                                                          | **APPROVED**                |
| **Lucide Icons**          | `^0.475.x`                     | Consistent, lightweight SVG iconography (`lucide-react`).                         | Tree-shakeable, visually refined, consistent stroke-width fitting the editorial dealership aesthetic.                                                                                                                                                                                                                                    | **APPROVED**                |
| **React Router**          | `^6.28.x`                      | Client-side routing, protected routes, and navigation guards.                     | Standard client routing. Clean nested route layout for Public Catalog vs Authenticated Admin portal.                                                                                                                                                                                                                                     | **APPROVED (v6)**           |
| **TanStack Query**        | `^5.62.x`                      | Server-state caching, optimistic updates, and background refetching.              | Decouples server state from client state. Provides built-in loading/error states, auto-invalidation on purchase/restock, eliminating manual `useEffect` fetching boilerplate.                                                                                                                                                            | **APPROVED**                |
| **React Hook Form + Zod** | `RHF ^7.54.x` + `zod ^3.24.x`  | High-performance form state management with runtime schema validation.            | Shares validation schemas between frontend forms and backend controllers. Zero re-render form inputs.                                                                                                                                                                                                                                    | **APPROVED**                |

---

### 2.2 Backend Architecture

| Proposed Technology             | Evaluated Version                      | Purpose & Rationale                                                                             | Compatibility & Risk Analysis                                                                                                                              | Verdict                   |
| :------------------------------ | :------------------------------------- | :---------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------ |
| **Node.js**                     | `v24.11.1` (Local runtime)             | Execution environment.                                                                          | Native ESM, built-in crypto, fetch, high I/O throughput.                                                                                                   | **APPROVED**              |
| **TypeScript**                  | `^5.6.x`                               | Strict typing for backend entities, services, and controllers.                                  | Eliminates runtime type errors, enforces strict null checks, enables clean interface contracts.                                                            | **APPROVED**              |
| **Express**                     | `^4.21.x`                              | HTTP application framework.                                                                     | Minimalist, unopinionated, battle-tested middleware pipeline. Avoids framework lock-in.                                                                    | **APPROVED**              |
| **MongoDB Atlas / Local Mongo** | MongoDB 7.0+                           | Persistent document database.                                                                   | Matches dealership domain: polymorphic vehicle attributes, nested specifications, atomic inventory decrement (`$inc` with `$gte` guard).                   | **APPROVED**              |
| **Mongoose**                    | `^8.8.x`                               | ODM for schema validation, indexing, and query building.                                        | Strong schema definition, hooks, pre-save validations, and typed model interfaces.                                                                         | **APPROVED**              |
| **JWT (`jsonwebtoken`)**        | `^9.0.x`                               | Stateless, signed bearer token authentication.                                                  | Secure claims packaging (`userId`, `role`, `email`). Works seamlessly across REST endpoints.                                                               | **APPROVED**              |
| **Password Hashing**            | `bcryptjs ^2.4.3` (or `bcrypt`)        | One-way cryptographic password hashing.                                                         | `bcryptjs` provides pure JS implementation with zero native C++ build toolchain vulnerabilities on Windows, while supporting recommended salt rounds (12). | **APPROVED (`bcryptjs`)** |
| **Zod**                         | `^3.24.x`                              | Runtime request body, query, and parameter validation.                                          | Fail-fast validation with automatic TypeScript type inference. Catches malformed requests before hitting controllers.                                      | **APPROVED**              |
| **Security Middleware**         | `cors`, `helmet`, `express-rate-limit` | Essential HTTP security headers, CORS protection, and brute-force mitigation on auth endpoints. | Standard production hardening. Minimal overhead, maximum baseline security.                                                                                | **APPROVED**              |

---

### 2.3 Testing Architecture

| Proposed Technology        | Evaluated Version                                  | Purpose & Rationale                                                   | Compatibility & Risk Analysis                                                                                                                                                                                                                                                                                                                                                | Verdict                        |
| :------------------------- | :------------------------------------------------- | :-------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------- |
| **Vitest**                 | `^2.1.x`                                           | Fast unit and integration test runner for backend and frontend.       | Uses Vite transform pipeline, native ESM/TS support, instant execution, drop-in Jest-compatible API. Eliminates `ts-jest` compilation lag.                                                                                                                                                                                                                                   | **APPROVED**                   |
| **Supertest**              | `^7.0.x`                                           | HTTP assertion library for backend route/integration tests.           | Tests entire Express middleware and controller pipeline against real HTTP calls without binding to a physical external port.                                                                                                                                                                                                                                                 | **APPROVED**                   |
| **React Testing Library**  | `^16.0.x`                                          | DOM testing centered on user interactions and accessibility.          | Enforces accessibility testing (queries by role, label, text) rather than implementation details.                                                                                                                                                                                                                                                                            | **APPROVED**                   |
| **Isolated Test Database** | Real MongoDB (`127.0.0.1:27017/dealership_test_*`) | Concrete integration testing against authentic MongoDB wire protocol. | **MANDATORY POLICY:** An in-memory substitute (like mock-mongoose or sqlite-in-memory) will **never** be used for the application database. Integration tests connect to a dedicated, isolated test database on the local MongoDB instance (and Mongo service container in CI). Every test suite runs collection purges or isolated database names to ensure 100% isolation. | **APPROVED (Real Mongo Only)** |
| **Playwright (E2E)**       | Optional / Phase 05                                | End-to-end browser testing.                                           | Feasible and justified for final smoke tests of critical customer purchase flow and admin restocking flow. Deferred to late phase so as not to slow down fast unit/integration TDD feedback loops.                                                                                                                                                                           | **APPROVED (Targeted Scope)**  |

---

### 2.4 Code Quality & Developer Tooling

| Tool                       | Purpose                         | Configuration Strategy                                                                                                                                           | Verdict      |
| :------------------------- | :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| **ESLint**                 | Static code analysis & linting. | Modern flat configuration (`eslint.config.js`) with `@typescript-eslint/recommended` and `eslint-plugin-react-hooks`.                                            | **APPROVED** |
| **Prettier**               | Opinionated code formatting.    | Standard formatting (single quotes, 2-space indentation, trailing commas). Run via script and CI check.                                                          | **APPROVED** |
| **TypeScript Strict Mode** | Maximum type rigor.             | Backend and frontend `tsconfig.json` enforce: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, `"noUnusedLocals": true`.                   | **APPROVED** |
| **GitHub Actions**         | Automated CI pipeline.          | Runs on every push/PR: Checkout -> Node setup -> Install -> Lint -> Typecheck -> Backend Vitest (with real Mongo service container) -> Frontend Vitest -> Build. | **APPROVED** |

---

## 3. Dependency Minimization & Risk Mitigations

1. **Rejected / Avoided Dependencies:**
   - _Tailwind CSS v4:_ Rejected due to immature shadcn/ui tooling integration. Tailwind v3.4.17 locked.
   - _Redux / Zustand:_ Rejected as unnecessary state overhead. Server state is managed cleanly by TanStack Query; local state is handled via standard React state and hooks.
   - _Mock In-Memory Databases:_ Strictly forbidden. All persistence testing runs against real MongoDB instances to prevent impedance mismatch bugs.
   - _Monorepo Tooling (Turborepo/Nx):_ Rejected as unnecessary overhead for a focused 2-package project. Standard npm workspaces or clean root scripts provide full control with zero lock-in.

2. **Single Consistent Configuration:**
   - Single package manager: `npm` (matching installed version `11.6.2`).
   - Unified test runner: `vitest` across both `backend` and `frontend`.
   - Unified validation library: `zod` shared across client and server.
