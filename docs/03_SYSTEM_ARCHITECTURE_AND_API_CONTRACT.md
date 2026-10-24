# Phase 00: System Architecture & API Contract Specification

**Project:** Incubyte Car Dealership Inventory System  
**Document Status:** Baseline Architecture Contract (Phase 00)  
**Architecture Pattern:** Layered Modular Monolith (Clean Service Layer)

---

## 1. High-Level System Architecture

The application is architected as a clean, decoupled two-tier system consisting of a client Single-Page Application (SPA) and a RESTful backend API service backed by persistent MongoDB storage.

```mermaid
graph TD
    Client["Client Browser (React 18 SPA)"]
    ViteServer["Vite Dev Server / Static Hosting"]
    API["Express REST API (Node.js + TypeScript)"]
    DB[(MongoDB Atlas / Local MongoDB:27017)]

    Client -->|HTTP / JSON (REST)| API
    Client -->|Static Assets| ViteServer
    API -->|Mongoose ODM| DB

    subgraph Backend Pipeline
        Router["Express Routers"]
        AuthMid["Auth & RBAC Middleware"]
        Validator["Zod Schema Validation"]
        Controller["HTTP Controllers"]
        Service["Business Logic Services"]
        Model["Mongoose Models & Schemas"]

        Router --> AuthMid
        AuthMid --> Validator
        Validator --> Controller
        Controller --> Service
        Service --> Model
    end
```

---

## 2. Repository Directory Structure

```text
incubyte_assessment/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions automated lint, test, and typecheck
├── docs/                          # Architectural specs, RTM, ADRs, test reports
│   ├── 00_REPOSITORY_AUDIT.md
│   ├── 01_TECHNOLOGY_STACK_DECISION_RECORD.md
│   ├── 02_REQUIREMENTS_TRACEABILITY_MATRIX.md
│   ├── 03_SYSTEM_ARCHITECTURE_AND_API_CONTRACT.md
│   ├── 04_AMBIGUITIES_AND_ENGINEERING_DECISIONS.md
│   ├── 05_TDD_TESTING_AND_GIT_WORKFLOW.md
│   ├── 06_UI_UX_DESIGN_BRIEF.md
│   └── 07_PHASED_IMPLEMENTATION_PLAN.md
├── backend/                       # Express + TypeScript + Mongoose Backend
│   ├── src/
│   │   ├── config/                # Environment variables, DB connection config
│   │   ├── middleware/            # Auth, RBAC, error handler, Zod validator
│   │   ├── models/                # Mongoose models (User, Vehicle, PurchaseLog)
│   │   ├── modules/
│   │   │   ├── auth/              # Auth router, controller, service, schemas
│   │   │   ├── vehicles/          # Vehicle CRUD & search router, controller, service
│   │   │   └── inventory/         # Purchase & restock router, controller, service
│   │   ├── utils/                 # Password hashing, JWT utils, logger
│   │   ├── app.ts                 # Express app initialization (middleware & routes)
│   │   └── server.ts              # Server listener & DB lifecycle
│   ├── tests/
│   │   ├── setup.ts               # Test DB lifecycle hooks (beforeAll, afterEach, afterAll)
│   │   ├── unit/                  # Unit tests (models, utils, services)
│   │   └── integration/           # Supertest API endpoint test suites
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/                      # React 18 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── api/                   # Typed API client functions (Fetch/Axios wrapper)
│   │   ├── components/            # Reusable UI primitives (Button, Input, Modal, Badge)
│   │   ├── features/
│   │   │   ├── auth/              # Login & Register forms, AuthContext, ProtectedRoute
│   │   │   ├── catalog/           # VehicleCard, VehicleGrid, SearchFilterBar
│   │   │   └── admin/             # AdminVehicleTable, RestockModal, CreateVehicleModal
│   │   ├── hooks/                 # Custom React hooks (useVehicles, useAuth)
│   │   ├── layouts/               # Header, Footer, MainLayout
│   │   ├── pages/                 # HomePage, LoginPage, RegisterPage, AdminPage, NotFound
│   │   ├── types/                 # Shared TypeScript interfaces & DTOs
│   │   ├── App.tsx                # App routing & React Query Provider setup
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Tailwind base, components, and design tokens
│   ├── tests/
│   │   ├── setup.ts               # RTL setup & jest-dom matchers
│   │   └── components/            # Component and integration tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── tailwind.config.js
├── PROMPTS.md                     # Raw, unedited AI logs as required by specification
├── .gitignore                     # Monorepo-wide ignore rules
└── README.md                      # Comprehensive project guide and My AI Usage section
```

---

## 3. Backend Architectural Responsibilities

1. **Routes (`*.router.ts`):**  
   Pure HTTP route definitions mapping URLs to middleware pipelines and controller actions. No business logic or database queries reside in routes.
2. **Middleware (`middleware/`):**
   - `authenticateJwt`: Extracts Bearer token from `Authorization` header, verifies signature, and populates `req.user`.
   - `requireRole(allowedRoles)`: Enforces RBAC; returns `403 Forbidden` if `req.user.role` does not match.
   - `validateRequest({ body, query, params })`: Runs incoming data through Zod schemas. If validation fails, immediately returns formatted `400 Bad Request` with field-level issues.
   - `errorHandler`: Global catch-all error middleware that serializes operational errors into standard JSON format without leaking stack traces in production.
3. **Controllers (`*.controller.ts`):**  
   Handle HTTP request parsing, status code determination, and response formatting. Delegates all domain logic to the service layer.
4. **Services (`*.service.ts`):**  
   Contains core domain logic, atomic inventory manipulations, business rule validations (e.g. stock limits, duplicate checks), and orchestrates model operations.
5. **Models & Schemas (`models/`):**  
   Defines Mongoose schemas, indexes, field types, constraints (e.g. unique VIN, non-negative stock), and data transformation hooks.
6. **Data-Access Layer Consideration:**  
   Mongoose models themselves provide an active-record/repository interface. Creating an additional redundant repository abstraction layer would add boilerplate without tangible test benefit. Tests will interact with services and real database collections directly.

---

## 4. Domain Data Models & Schema Design

### 4.1 User Entity (`User`)

```typescript
interface IUser {
  _id: string;
  name: string;
  email: string; // Unique, indexed, lowercase
  passwordHash: string; // Bcrypt hash with 12 salt rounds (excluded from JSON)
  role: 'customer' | 'admin'; // Defaults strictly to 'customer'
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 Vehicle Entity (`Vehicle`)

```typescript
interface IVehicle {
  _id: mongoose.Types.ObjectId;
  make: string; // e.g. "Toyota", "BMW", "Tesla" (indexed)
  model: string; // e.g. "Camry", "M3", "Model 3" (indexed)
  category: 'Sedan' | 'SUV' | 'Truck' | 'Coupe' | 'Hatchback' | 'EV' | 'Convertible' | 'Van'; // Enum (indexed)
  price: number; // Finite positive amount (> 0) (indexed)
  quantityInStock: number; // Non-negative integer (>= 0) (indexed)
  year?: number; // Optional model year (1900 - current year + 1)
  description?: string; // Optional editorial description
  imageUrl?: string; // Optional vehicle visual asset URL
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 Purchase Audit Log Entity (`Purchase`)

```typescript
interface IPurchase {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // Reference to User
  vehicleId: mongoose.Types.ObjectId; // Reference to Vehicle
  priceAtPurchase: number; // Snapshot of vehicle price at time of purchase
  purchasedAt: Date; // Timestamp of purchase transaction
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 5. RESTful API Contract

All endpoints adhere to standard REST conventions and return JSON payloads.

### 5.1 Standard Response Envelopes

- **Success:**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```
- **Paginated Success:**
  ```json
  {
    "success": true,
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
  ```
- **Error:**
  ```json
  {
    "success": false,
    "error": {
      "code": "INSUFFICIENT_STOCK",
      "message": "Vehicle is out of stock",
      "details": []
    }
  }
  ```

### 5.2 Authentication Endpoints (`/api/auth`)

| Method | Endpoint             | Access        | Request Body                | Response Codes      | Description                                                      |
| :----- | :------------------- | :------------ | :-------------------------- | :------------------ | :--------------------------------------------------------------- |
| `POST` | `/api/auth/register` | Public        | `{ name, email, password }` | `201`, `400`, `409` | Register new customer. Role defaults strictly to `customer`.     |
| `POST` | `/api/auth/login`    | Public        | `{ email, password }`       | `200`, `400`, `401` | Authenticate user; returns JWT token and sanitized user profile. |
| `GET`  | `/api/auth/me`       | Authenticated | None (Bearer header)        | `200`, `401`        | Retrieve currently authenticated user profile.                   |

### 5.3 Vehicle Catalog & Inventory Endpoints (`/api/vehicles`)

| Method   | Endpoint                     | Access                             | Query / Body                                                                                   | Response Codes                    | Description                                                          |
| :------- | :--------------------------- | :--------------------------------- | :--------------------------------------------------------------------------------------------- | :-------------------------------- | :------------------------------------------------------------------- |
| `GET`    | `/api/vehicles`              | **Public**                         | Query: `page`, `limit`, `sortBy`, `sortOrder`                                                  | `200`, `400`                      | Browse vehicle catalog with pagination. Zero-stock vehicles visible. |
| `GET`    | `/api/vehicles/search`       | **Public**                         | Query: `make`, `model`, `category`, `minPrice`, `maxPrice`, `page`, `limit`                    | `200`, `400`                      | Search and filter catalog with safe regex matching & price bounds.   |
| `GET`    | `/api/vehicles/:id`          | **Public**                         | None                                                                                           | `200`, `400`, `404`               | Retrieve single vehicle detail by MongoDB ID.                        |
| `POST`   | `/api/vehicles`              | **Admin Only**                     | Body: `{ make, model, category, price, quantityInStock, year?, description?, imageUrl? }`      | `201`, `400`, `401`, `403`        | Create new vehicle in inventory.                                     |
| `PUT`    | `/api/vehicles/:id`          | **Admin Only**                     | Body: `{ make?, model?, category?, price?, quantityInStock?, year?, description?, imageUrl? }` | `200`, `400`, `401`, `403`, `404` | Update vehicle metadata and stock.                                   |
| `DELETE` | `/api/vehicles/:id`          | **Admin Only**                     | None                                                                                           | `200`, `400`, `401`, `403`, `404` | Delete vehicle record from inventory (preserves audit records).      |
| `POST`   | `/api/vehicles/:id/purchase` | **Authenticated (Customer/Admin)** | None                                                                                           | `200`, `400`, `401`, `404`, `409` | Atomically purchase 1 unit; creates purchase audit record.           |
| `POST`   | `/api/vehicles/:id/restock`  | **Admin Only**                     | Body: `{ quantity: number }` (positive integer)                                                | `200`, `400`, `401`, `403`, `404` | Atomically increment stock quantity.                                 |

---

## 6. Critical Security & Concurrency Controls

1. **Role Escalation Prevention:**
   - The registration Zod schema strictly strips or rejects any `role` attribute provided in the request body. Role is hard-coded to `'customer'` in `auth.service.ts`.
   - Admin users can only be initialized via a secure database seed script using environment variables (`ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD`).
2. **Atomic Inventory Decrement (Race Condition & Oversell Immunity):**
   - Stock reduction uses conditional MongoDB atomic operations:
     ```typescript
     const vehicle = await Vehicle.findOneAndUpdate(
       { _id: vehicleId, quantityInStock: { $gte: 1 } },
       { $inc: { quantityInStock: -1 } },
       { new: true },
     );
     if (!vehicle) {
       // Check if vehicle exists to distinguish 404 Not Found from 409 Conflict
       const exists = await Vehicle.findById(vehicleId);
       if (!exists) throw new NotFoundError('Vehicle not found');
       throw new ConflictError('Vehicle is out of stock');
     }
     ```
   - If audit record creation fails post-decrement on environments without replica sets, compensation rollback restores the decremented inventory unit:
     ```typescript
     try {
       await Purchase.create({ userId, vehicleId, priceAtPurchase: vehicle.price });
     } catch (err) {
       await Vehicle.findByIdAndUpdate(vehicleId, { $inc: { quantityInStock: 1 } });
       throw err;
     }
     ```
   - This ensures zero oversell guarantee under high concurrency without requiring multi-document replica set transaction prerequisites on standalone testing instances.
3. **Safe Search Query Execution:**
   - Free-text user search queries are escaped using `escapeRegex` before MongoDB `$regex` evaluation, preventing ReDoS (Regular Expression Denial of Service) and regex injection attacks.
4. **Password Sanitization:**
   - Mongoose schema options set `transform: (doc, ret) => { delete ret.passwordHash; return ret; }` to prevent accidental serialization in logs or HTTP responses.
