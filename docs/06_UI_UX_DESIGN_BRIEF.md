# Phase 00: UI/UX Design System Brief & Visual Contract

**Project:** Incubyte Car Dealership Inventory System  
**Document Status:** Implemented & Verified (Phase 04)  
**Design Philosophy:** Editorial Automotive Craftsmanship & Utilitarian Precision

---

## 1. Aesthetic Direction & Brand Identity

The user interface rejects generic, neon-accented AI templates and cheap dashboard clichés. Instead, it draws inspiration from high-end automotive editorial design, bespoke British/German engineering brochures, and premium architectural catalogs.

The visual tone is:

- **Refined:** Generous white space, crisp hairline borders, and balanced layout proportions.
- **Editorial:** High-resolution vehicle photography, prominent typographic hierarchy, and clear automotive specifications.
- **Functional & Honest:** Direct inventory indicators, clear stock numbers, unambiguous out-of-stock indicators, and seamless administrative control.

---

## 2. Color Palette & Design Tokens

The color system is anchored in warm neutrals, deep charcoal typography, and a signature **Forest Green** accent conveying prestige, heritage, and quiet luxury.

### 2.1 Color Tokens

| Token Name                  | Hex Code  | HSL Value            | Usage Context                                             |
| :-------------------------- | :-------- | :------------------- | :-------------------------------------------------------- |
| **Surface Base**            | `#FDFDFC` | `hsl(60, 20%, 99%)`  | App background, main card surface.                        |
| **Surface Muted**           | `#F7F7F5` | `hsl(60, 8%, 97%)`   | Filter panels, table headers, input backdrops.            |
| **Surface Subdued**         | `#EFEFEB` | `hsl(60, 8%, 93%)`   | Dividers, badge backgrounds, subtle borders.              |
| **Border Neutral**          | `#E2E2DC` | `hsl(60, 8%, 87%)`   | Card borders, table cell dividers, modal outlines.        |
| **Text Primary (Charcoal)** | `#1A1A18` | `hsl(60, 5%, 10%)`   | Primary headings, vehicle titles, prominent prices.       |
| **Text Secondary**          | `#5C5C56` | `hsl(60, 3%, 35%)`   | Vehicle specs, subtitles, secondary metadata.             |
| **Text Muted**              | `#8A8A82` | `hsl(60, 3%, 52%)`   | Placeholder text, disabled labels, timestamps.            |
| **Accent Primary (Forest)** | `#1B4332` | `hsl(153, 42%, 18%)` | Primary buttons, active state indicators, key CTAs.       |
| **Accent Hover**            | `#143527` | `hsl(153, 44%, 15%)` | Hover state for primary CTAs.                             |
| **Accent Light**            | `#E8F0EC` | `hsl(153, 25%, 93%)` | In-stock badges, active filter chips.                     |
| **Destructive / Error**     | `#B91C1C` | `hsl(0, 74%, 42%)`   | Out-of-stock badges, deletion actions, validation errors. |
| **Warning / Low Stock**     | `#B45309` | `hsl(38, 92%, 37%)`  | Low-stock alert badge (< 3 units).                        |

---

## 3. Typography & Hierarchy

- **Font Family:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`.
- **Typographic Scale:**
  - `Hero Display`: `text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900`
  - `H1 (Page Title)`: `text-3xl font-semibold tracking-tight text-neutral-900`
  - `H2 (Section Header)`: `text-2xl font-semibold tracking-tight text-neutral-900`
  - `H3 (Vehicle Card Title)`: `text-lg font-semibold tracking-tight text-neutral-900`
  - `Body Standard`: `text-sm font-normal leading-relaxed text-neutral-700`
  - `Caption / Meta`: `text-xs font-medium tracking-wide uppercase text-neutral-500`
  - `Price Display`: `text-xl font-bold font-mono tracking-tight text-neutral-900`

---

## 4. Component Design Specifications

### 4.1 Editorial Vehicle Card (`VehicleCard`)

- **Container:** Rounded rectangular card (`rounded-lg border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200`).
- **Aspect Ratio:** 16:9 vehicle imagery with fallback gradient placeholder.
- **Header:** Year, Make, Model prominently displayed; Category chip (e.g. `SUV`, `Electric`) in top right corner.
- **Specs Strip:** Clean grid displaying mileage, engine/drivetrain, and inventory status.
- **Stock Badge:**
  - `In Stock (N units)`: Soft green badge (`bg-emerald-50 text-emerald-800 border-emerald-200`).
  - `Low Stock (1-2 units)`: Soft amber badge (`bg-amber-50 text-amber-800 border-amber-200`).
  - `Out of Stock`: Muted red badge (`bg-rose-50 text-rose-800 border-rose-200`).
- **Action CTA:**
  - When in stock: Solid Forest Green button (`bg-[#1B4332] text-white hover:bg-[#143527] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B4332]`).
  - When out of stock: Disabled button (`bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200`).

### 4.2 Search & Multi-Filter Bar (`CatalogFilterBar`)

- Single cohesive filter control panel above the inventory grid.
- Search input with clearable icon.
- Category selector pills or dropdown.
- Dual-input price range filter (`Min Price` - `Max Price`) with instant validation against negative numbers or inverted ranges.
- Quick "Reset All Filters" CTA.

### 4.3 Administrative Management Portal (`AdminWorkspace`)

- **Inventory Ledger Table:** Dense, clean tabular view displaying VIN, Thumbnail, Make, Model, Year, Category, Price, Stock Level, and Action buttons.
- **Inline Restock Action:** Clean numeric stepper or Restock modal dialog allowing an administrator to enter quantity and submit without leaving the view.
- **Vehicle Creation / Edit Modal:** Accessible Radix-based dialog with tabbed or grouped inputs (Basic Info, Pricing & Inventory, Specifications).
- **Destructive Deletion Confirmation:** Explicit confirmation dialog preventing accidental vehicle removal.

---

## 5. Interaction States & Accessibility Standard (WAI-ARIA)

1. **Focus States:** Every interactive element features a prominent, high-contrast keyboard focus ring (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-800`).
2. **Loading States:** Skeleton loaders (`animate-pulse bg-neutral-200 rounded`) matching the exact geometry of vehicle cards and table rows. No generic full-page spinners that cause layout shift.
3. **Empty States:** When no vehicles match search criteria, render a helpful empty state with clear illustration, descriptive message, and a "Clear Filters" action.
4. **Reduced Motion:** All transitions strictly observe `@media (prefers-reduced-motion: reduce)` rules (`motion-reduce:transition-none`).
5. **Color Contrast:** All body text and UI controls maintain a minimum contrast ratio of **4.5:1** against their background surfaces, complying with WCAG 2.1 Level AA.
