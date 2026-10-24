# Phase 00: Design Ambiguities & Engineering Decisions

**Project:** Incubyte Car Dealership Inventory System  
**Document Status:** Pending User Review & Approval  
**Context:** Pre-implementation architectural alignment

---

## 1. Overview

Before writing application code or finalizing test assertions, critical system boundaries and behaviors must be explicitly defined. This document analyzes the 10 core architectural ambiguities identified in the assessment requirements, proposes minimal, defensible, and robust engineering decisions, and highlights the specific decisions that require your explicit approval.

---

## 2. Detailed Ambiguity Analysis & Proposed Decisions

### Decision 1: Authentication Boundary for Vehicle Listing

- **Ambiguity:** Should `GET /api/vehicles` (catalog listing and search) be publicly accessible, or should it require an authenticated user session?
- **Analysis:** In automotive dealership systems, prospective buyers inspect inventory before registering an account. Requiring authentication just to view cars adds user friction and hurts conversion. However, administrative management, vehicle creation, vehicle modification, and actual purchases represent authenticated interactions.
- **Proposed Defensible Decision:**
  - **`GET /api/vehicles` and `GET /api/vehicles/:id` are PUBLIC.** Any visitor can browse, search, and filter inventory.
  - **`POST /api/vehicles/:id/purchase` is AUTHENTICATED.** Only logged-in customers can execute a purchase.
  - **`POST`, `PUT`, `DELETE`, and `POST .../restock` are ADMIN ONLY.**
- **Impact:** Aligns with standard e-commerce best practices while keeping privileged actions strictly guarded.

---

### Decision 2: User Roles & Initial Administrator Provisioning

- **Ambiguity:** What user roles exist, and how is the very first administrator account created without exposing an insecure public registration backdoor?
- **Analysis:** If the registration endpoint accepts `role: "admin"`, an attacker can elevate their privileges simply by crafting a custom HTTP payload. Hardcoding credentials in source code is a major security vulnerability.
- **Proposed Defensible Decision:**
  - Two distinct roles: `'customer'` and `'admin'`.
  - Public registration (`POST /api/auth/register`) strictly sets `role: 'customer'`. Any `role` parameter sent in the request body is stripped/rejected by the Zod schema.
  - The initial administrator is provisioned via an idempotent CLI seed script: `npm run seed:admin` (or automatically on startup if no admin exists), reading credentials securely from environment variables (`ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD`).
- **Impact:** Zero risk of unauthorized privilege escalation; repeatable setup for local evaluation and CI environments.

---

### Decision 3: Purchase Quantity Semantics

- **Ambiguity:** Does a vehicle purchase action mean purchasing exactly one (1) unit, or can a user specify a quantity (e.g. 3 cars)?
- **Analysis:** Automotive purchases are predominantly single-unit transactions. Allowing arbitrary bulk quantities complicates UI controls and purchase logic without adding real value to an inventory assessment.
- **Proposed Defensible Decision:**
  - Default purchase quantity is **1 unit per click**.
  - The API contract accepts an optional `{ quantity?: number }` defaulting to `1` (constrained to `1 <= quantity <= availableStock`).
- **Impact:** Clean UI (single "Purchase" button on vehicle card/detail), yet flexible backend contract.

---

### Decision 4: Purchase Records & Audit History

- **Ambiguity:** Should purchasing only decrement `stockQuantity` on the vehicle document, or should it generate a persistent order/purchase record?
- **Analysis:** Merely decrementing a counter lacks business traceability—there would be no record of which user purchased which vehicle, at what price, and at what time. However, building a full-blown checkout/payment gateway introduces unnecessary scope creep.
- **Proposed Defensible Decision:**
  - Introduce a lightweight `PurchaseLog` document recorded in the same transaction/operation as the stock decrement.
  - Captures: `vehicleId`, `userId`, `unitPrice`, `quantity: 1`, `purchasedAt: timestamp`.
  - No payment processing, simulated credit cards, or complex shipping forms—keeping scope lean and focused on inventory integrity.
- **Impact:** High engineering craftsmanship with minimal scope overhead.

---

### Decision 5: Concurrency Control & Oversell Prevention

- **Ambiguity:** How does the system prevent race conditions and negative inventory when multiple users attempt to purchase the last remaining vehicle simultaneously?
- **Analysis:** If two requests read `stockQuantity = 1` concurrently, both might calculate `1 - 1 = 0` and overwrite the stock, resulting in 2 cars sold with only 1 in stock.
- **Proposed Defensible Decision:**
  - Implement **atomic conditional updates** using MongoDB's `$inc` operator with an atomic filter guard:
    ```typescript
    const result = await Vehicle.findOneAndUpdate(
      { _id: vehicleId, stockQuantity: { $gte: purchaseQty } },
      { $inc: { stockQuantity: -purchaseQty } },
      { new: true },
    );
    ```
  - If `result` is null, the stock was already depleted by a competing thread. The controller immediately responds with `409 Conflict` (`"INSUFFICIENT_STOCK"`).
- **Impact:** 100% thread-safe without heavy distributed locks or external Redis queues.

---

### Decision 6: Error Handling for Missing Vehicles & Depleted Stock

- **Ambiguity:** What HTTP status codes and error responses are returned when a vehicle does not exist or has zero inventory?
- **Analysis:** Consistent, typed HTTP error codes allow the frontend and API consumers to respond deterministically.
- **Proposed Defensible Decision:**
  - **Non-existent vehicle ID:** Returns `404 Not Found` with `{ success: false, error: { code: "VEHICLE_NOT_FOUND", message: "Vehicle does not exist" } }`.
  - **Attempted purchase with zero/insufficient stock:** Returns `409 Conflict` with `{ success: false, error: { code: "INSUFFICIENT_STOCK", message: "Requested vehicle is out of stock" } }`.
  - **Malformed ID or invalid body:** Returns `400 Bad Request` with structured validation errors.
- **Impact:** Predictable API behavior and clear test assertions.

---

### Decision 7: Multi-Criteria Search & Filter Interactions

- **Ambiguity:** How do search filters interact, and how are invalid price ranges (e.g., `minPrice > maxPrice`) handled?
- **Analysis:** Real-world users frequently combine make, model, category, and price range filters simultaneously.
- **Proposed Defensible Decision:**
  - Search criteria combine via logical `AND`.
  - Text queries (`make`, `model`) use case-insensitive partial matching (trimmed, escaped regex or text search).
  - Category uses exact match against predefined enum values (`Sedan`, `SUV`, `Truck`, `Coupe`, `EV`, `Hatchback`).
  - Validation: If `minPrice` is provided and exceeds `maxPrice`, Zod returns `400 Bad Request` (`"minPrice cannot exceed maxPrice"`).
- **Impact:** Intuitive catalog exploration and robust input sanitization.

---

### Decision 8: Prevention of Role Escalation

- **Ambiguity:** How is unauthorized privilege escalation prevented across the entire API surface?
- **Analysis:** Vulnerabilities often occur when user input is spread directly into database update queries (`User.create(req.body)`).
- **Proposed Defensible Decision:**
  - Strict input DTO whitelist using Zod. The `registerSchema` only allows `{ name, email, password }`. Extra properties are stripped.
  - Role attribute is assigned explicitly in `auth.service.ts`: `role: 'customer'`.
  - All administrative routes enforce `requireRole('admin')`, which inspects the verified JWT claims.
- **Impact:** Impregnable role boundary with automated test coverage.

---

### Decision 9: Reliable MongoDB Integration Tests without In-Memory Substitutes

- **Ambiguity:** How can MongoDB integration tests run reliably and fast without violating the rule: _"An in-memory database must never substitute for the required application database"_?
- **Analysis:** The local machine has an active, running MongoDB Server on `127.0.0.1:27017` (`TcpTestSucceeded: True`), and Docker is also available. In CI (GitHub Actions), a native `mongo:7.0` service container is easily configured.
- **Proposed Defensible Decision:**
  - **Local & Test Environment:** Integration tests connect to `mongodb://127.0.0.1:27017/dealership_test` with a unique test suite prefix.
  - **Test Lifecycle:** In Vitest `tests/setup.ts`, a `beforeAll` verifies database connectivity, an `afterEach` truncates collections to guarantee zero test pollution, and `afterAll` terminates the Mongoose connection cleanly.
  - **Zero In-Memory Mocks:** No `mongodb-memory-server` or fake in-memory drivers. Every query executes against authentic MongoDB wire protocol.
- **Impact:** Total fidelity to production behavior with sub-second execution speeds.

---

### Decision 10: Scope Boundaries (Scope Creep Prevention)

- **Ambiguity:** What features should be explicitly excluded to keep the application focused on craftsmanship, TDD, and the core inventory system?
- **Proposed Defensible Decision:**
  - **Excluded:** External payment gateways (Stripe/PayPal), fake credit card checkout, complex shipping logistics, unnecessary microservices, multi-tenancy dealership switching.
  - **Included:** Complete, robust inventory lifecycle: Registration, Authentication, Vehicle Catalog, Compound Filtering, Atomic Stock Reduction, Admin Vehicle CRUD, Admin Restocking, Concurrency Safety, and Responsive Accessible UI.
- **Impact:** Keeps the codebase clean, deeply tested, and fully aligned with the internship assessment evaluation criteria.

---

## 3. Decisions Requiring Your Explicit Approval

Before proceeding to Phase 01, please review and confirm your agreement on the following four key items:

1. **Public vs. Authenticated Vehicle Catalog:** Confirm that visitors can view and filter vehicles without logging in, but must log in to purchase.
2. **Single-Unit Purchase Model:** Confirm that vehicle purchases decrement by 1 unit per click (with backend support for custom quantity).
3. **Database Setup for Testing:** Confirm using the local running MongoDB instance (`127.0.0.1:27017/dealership_test`) for integration testing, coupled with MongoDB Atlas for persistent deployment.
4. **Initial Admin Provisioning:** Confirm using an environment-variable driven seed script (`npm run seed:admin`) rather than an open web registration option for admins.
