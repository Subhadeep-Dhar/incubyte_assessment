# Incubyte Car Dealership Inventory System

[![Continuous Integration](https://github.com/Subhadeep-Dhar/incubyte_assessment/actions/workflows/ci.yml/badge.svg)](https://github.com/Subhadeep-Dhar/incubyte_assessment/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v24.11.1-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.16-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1.8-6E9F18?logo=vitest)](https://vitest.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb)](https://www.mongodb.com/)

An enterprise-grade, accessible, and test-driven automotive dealership inventory system engineered for the **Incubyte Software Craftsmanship Assessment**.

---

## 1. Project Overview & Architectural Principles

The application is structured as a decoupled full-stack architecture adhering strictly to:

- **Test-Driven Development (TDD):** Every feature, validation, and endpoint follows the strict **Red-Green-Refactor** development cycle.
- **Persistent Data Integrity:** Concrete database operations using MongoDB wire protocol. No in-memory fake databases substitute for persistent application storage.
- **Atomic Concurrency Protection:** Race-condition-free inventory decrementing using conditional atomic updates to prevent overselling.
- **Strict Role-Based Access Control (RBAC):** High security separation between customer interactions and administrative operations, with zero risk of privilege escalation.
- **Editorial Automotive Craftsmanship:** Clean, accessible UI (WCAG AA compliant) with restrained typography, warm neutral surfaces, and signature Forest Green accents.

---

## 2. Technology Stack

### Frontend SPA (`/frontend`)

- **Core:** React 18 (`18.3.1`), TypeScript (`5.6.3`), Vite 6
- **Styling:** Tailwind CSS (`3.4.16`) with curated editorial automotive tokens
- **Components & Icons:** Radix UI accessible headless primitives, Lucide Icons
- **State & Routing:** React Router v6, TanStack Query v5 (server-state cache and background invalidation)
- **Forms & Validation:** React Hook Form + Zod runtime schema validation
- **Testing:** Vitest, React Testing Library, `@testing-library/jest-dom`, `jsdom`

### Backend REST API (`/backend`)

- **Runtime:** Node.js (`v24.11.1`), TypeScript (`5.6.3`), Express 4 (`4.21.2`)
- **Database & ODM:** MongoDB Atlas / Local MongoDB 7.0+, Mongoose 8 (`8.8.4`)
- **Authentication & Security:** JWT (`jsonwebtoken`), Bcrypt password hashing (`bcryptjs` with 12 salt rounds), Helmet security headers, CORS, Zod request validation
- **Testing:** Vitest, Supertest, isolated real MongoDB test database

### CI/CD Pipeline

- **GitHub Actions:** Automated workflow running linting, typechecking, frontend tests, and backend integration tests against a standalone `mongo:7.0` service container.

---

## 3. Getting Started & Local Installation

### Prerequisites

- **Node.js:** `>= 20.0.0` (Verified on `v24.11.1`)
- **npm:** `>= 10.0.0` (Verified on `11.6.2`)
- **MongoDB:** Local MongoDB Server running on `localhost:27017` or Docker

### Installation

Clone the repository and install all workspace dependencies from the root directory:

```bash
git clone https://github.com/Subhadeep-Dhar/incubyte_assessment.git
cd incubyte_assessment
npm install
```

### Environment Configuration

1. **Backend Environment:**
   Copy the example environment file and configure variables:

   ```bash
   cp backend/.env.example backend/.env
   ```

   _Key variables in `backend/.env`:_
   - `PORT`: Server port (default: `5000`)
   - `MONGODB_URI`: Primary database connection string (default: `mongodb://localhost:27017/dealership_dev`)
   - `MONGODB_TEST_URI`: Isolated test database (default: `mongodb://localhost:27017/dealership_test`)
   - `JWT_SECRET`: Secret key for signing authentication tokens

2. **Frontend Environment:**
   Copy the example frontend environment file:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   _Key variable in `frontend/.env`:_
   - `VITE_API_URL`: Points to backend API (default: `http://localhost:5000/api`)

---

## 4. Running the Application Locally

Run both frontend and backend concurrently or independently:

```bash
# Start backend API server (with hot reload via tsx)
npm run dev:backend

# Start frontend Vite dev server (on http://localhost:5173)
npm run dev:frontend
```

---

## 5. Running Tests & Quality Verification

All tests run locally using Vitest and verify authentic integration behavior:

```bash
# Run all tests across the repository
npm run test

# Run backend tests only (verifies health and database connectivity)
npm run test:backend

# Run frontend tests only (verifies React DOM rendering and accessibility)
npm run test:frontend

# Run strict TypeScript typecheck
npm run typecheck

# Run ESLint across all files
npm run lint

# Check code formatting with Prettier
npm run format:check
```

---

## 6. Project Architecture & Traceability

Detailed engineering contracts and architectural specifications are maintained in the [`docs/`](./docs) directory:

- [`docs/00_REPOSITORY_AUDIT.md`](./docs/00_REPOSITORY_AUDIT.md): Initial workspace and toolchain audit.
- [`docs/01_TECHNOLOGY_STACK_DECISION_RECORD.md`](./docs/01_TECHNOLOGY_STACK_DECISION_RECORD.md): Architecture Decision Record (ADR-001).
- [`docs/02_REQUIREMENTS_TRACEABILITY_MATRIX.md`](./docs/02_REQUIREMENTS_TRACEABILITY_MATRIX.md): 22-item requirements matrix mapping tests and exit criteria.
- [`docs/03_SYSTEM_ARCHITECTURE_AND_API_CONTRACT.md`](./docs/03_SYSTEM_ARCHITECTURE_AND_API_CONTRACT.md): REST API contracts and data models.
- [`docs/04_AMBIGUITIES_AND_ENGINEERING_DECISIONS.md`](./docs/04_AMBIGUITIES_AND_ENGINEERING_DECISIONS.md): Resolution of domain and concurrency design choices.
- [`docs/05_TDD_TESTING_AND_GIT_WORKFLOW.md`](./docs/05_TDD_TESTING_AND_GIT_WORKFLOW.md): Red-Green-Refactor protocol and Git trailers.
- [`docs/06_UI_UX_DESIGN_BRIEF.md`](./docs/06_UI_UX_DESIGN_BRIEF.md): Design tokens, editorial vehicle card specs, and accessibility.
- [`docs/07_PHASED_IMPLEMENTATION_PLAN.md`](./docs/07_PHASED_IMPLEMENTATION_PLAN.md): Implementation roadmap and risk register.

---

## 7. Authentication, Security & Role-Based Access Control (Phase 02)

The system implements a zero-trust, stateless JWT authentication architecture with server-enforced Role-Based Access Control (RBAC).

### Supported Roles

- **`customer`**: Self-registered users. Permitted to browse inventory, purchase vehicles (Phase 04), and view their own profile.
- **`admin`**: System administrators. Privileged access to restock vehicles, add/edit/delete inventory listings (Phase 03). Cannot be self-registered via public endpoints.

### Authentication REST Endpoints

| Method | Endpoint             | Access        | Description                                                            |
| ------ | -------------------- | ------------- | ---------------------------------------------------------------------- |
| `POST` | `/api/auth/register` | Public        | Registers a new account. Always assigns `customer` role server-side.   |
| `POST` | `/api/auth/login`    | Public        | Authenticates credentials and returns a signed HS256 JWT (24h expiry). |
| `GET`  | `/api/auth/me`       | Authenticated | Returns safe user profile for the verified Bearer token.               |

#### Password & Security Policy

- **Complexity Requirement:** Minimum 8 characters, at least one uppercase letter, one lowercase letter, and one number.
- **Hashing Work Factor:** Passwords are never stored in plaintext; hashed with `bcryptjs` using **12 salt rounds**.
- **Safe Serialization:** Mongoose schema transforms and Express controllers guarantee `passwordHash` is never exposed via JSON serialization or logs.
- **Anti-Enumeration:** Login authentication failures emit identical `401 Unauthorized` responses with generic error messages (`INVALID_CREDENTIALS`) for both non-existent emails and invalid passwords.

### Initial Administrator Provisioning

To prevent public privilege escalation vulnerabilities, administrator accounts cannot be registered through public web endpoints. Administrators are provisioned strictly via the idempotent CLI seed command:

```bash
# Provision initial administrator from backend/.env configuration
npm run seed:admin
```

_Configuration variables in `backend/.env`:_

- `ADMIN_INITIAL_NAME`: Administrator full name (e.g., `System Administrator`)
- `ADMIN_INITIAL_EMAIL`: Administrator login email (e.g., `admin@dealership.com`)
- `ADMIN_INITIAL_PASSWORD`: Secure initial password conforming to password policy

**Idempotency & Safety:**

- If an account with `ADMIN_INITIAL_EMAIL` already exists, the script safely exits without modifying existing passwords or data.
- Initial passwords are never hardcoded and never logged to stdout or persistent files.

---

## 8. Vehicle Domain, Inventory API & Transaction Safety (Phase 03)

The vehicle inventory domain is engineered with strict type safety, input validation via Zod, atomic concurrency control in MongoDB, and persistent purchase audit logs.

### Inventory REST Endpoints

| Method   | Endpoint                     | Access                           | Description                                                                              |
| -------- | ---------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| `GET`    | `/api/vehicles`              | Public                           | Browse vehicle catalog with pagination (`page`, `limit`) and sorting. Zero-stock shown.  |
| `GET`    | `/api/vehicles/search`       | Public                           | Search by `make`, `model`, `category`, and inclusive `minPrice` / `maxPrice` boundaries. |
| `GET`    | `/api/vehicles/:id`          | Public                           | Retrieve detailed vehicle record by MongoDB ID.                                          |
| `POST`   | `/api/vehicles`              | Admin Only                       | Add a new vehicle to inventory with validated pricing and non-negative stock.            |
| `PUT`    | `/api/vehicles/:id`          | Admin Only                       | Update vehicle attributes (make, model, category, price, quantityInStock, etc.).         |
| `DELETE` | `/api/vehicles/:id`          | Admin Only                       | Delete vehicle from catalog (retains historical purchase audit records).                 |
| `POST`   | `/api/vehicles/:id/purchase` | Authenticated (Customer / Admin) | Atomically purchase 1 unit; prevents race-condition overselling and logs audit record.   |
| `POST`   | `/api/vehicles/:id/restock`  | Admin Only                       | Atomically increment vehicle stock by positive integer quantity.                         |

### Concurrency Control & Anti-Overselling Strategy

- **Atomic Conditional Decrement:** Purchases execute via MongoDB `findOneAndUpdate` targeting `{ _id: vehicleId, quantityInStock: { $gte: 1 } }` with `$inc: { quantityInStock: -1 }`.
- **Race Condition Immunity:** When multiple parallel requests compete for the last remaining vehicle (`quantityInStock = 1`), the database lock ensures exactly one request satisfies the `$gte: 1` condition.
- **HTTP 409 Conflict:** Competing requests that find 0 stock receive an immediate `409 Conflict` (`INSUFFICIENT_STOCK`) without modifying database state or driving stock below zero.
- **Audit Logging with Compensation Rollback:** Successful purchases record an immutable `Purchase` audit log with purchaser ID, vehicle ID, purchase-time price snapshot, and timestamp. If audit logging fails on standalone MongoDB instances, a compensation rollback increments stock back to its original state.

---

## 9. My AI Usage & Transparency Disclosure

In accordance with Incubyte's assessment guidelines and commitment to transparent software craftsmanship:

1. **AI Assistance Tool:** Google Antigravity (Powered by Gemini 3.8).
2. **Co-Authorship Attribution:** Every AI-assisted commit in this repository carries the verified trailer:
   ```text
   Co-authored-by: Google Antigravity <noreply@google.com>
   ```
3. **Raw Prompts Log:** Complete, unedited transcripts of all AI interactions are preserved chronologically in [`PROMPTS.md`](./PROMPTS.md).
4. **Human Ownership & Craftsmanship:** While AI was utilized for scaffolding, boilerplate generation, and rapid feedback loops, all architectural decisions, database models, test assertions, and security boundaries are governed by rigorous human judgment and verified through executable test suites.
