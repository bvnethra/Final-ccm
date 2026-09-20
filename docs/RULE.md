# Nethra CCM — Application Coding & Design Rules

> **Core Philosophy:** Build high-performance, visually stunning, fully accessible enterprise applications with 100% full-page navigation, strict multi-tenant isolation, and clear software architecture.

---

## 1. Design & UI Aesthetics Rules

1. **Rich Modern Aesthetics:**
   - Dark theme baseline using tailored slate (`slate-950`, `slate-900`, `slate-800`).
   - Vibrant accents: Electric Indigo (`indigo-400`/`indigo-500`), Cyan (`cyan-400`), Emerald (`emerald-400`), Rose (`rose-500`).
   - Glassmorphism: `backdrop-blur-md`, subtle border highlights (`border-slate-800/80`), translucent cards (`bg-slate-900/60`).
   - Modern typography using crisp sans-serif font stack.

2. **No Browser Defaults:**
   - All interactive controls (buttons, inputs, selects, textareas, checkboxes) must use custom styled primitives from `src/components/ui/UIPrimitives.tsx`.

---

## 2. Strict Full-Page Form Navigation Rule

> [!CAUTION]
> **NO POPUP MODALS FOR PRIMARY FORMS OR ENTITY CREATION.**
> All entity creation and editing forms MUST be dedicated full-page routes with distinct URLs.

* **Incorrect:** Registering an intake request inside an overlay `<Modal>` on `/requests`.
* **Correct:** Navigating to `/requests/new` full page, filling out the form, submitting, and redirecting back to `/requests` list upon success.

### Mandatory Full-Page Route Map:
- New User Registration: `/admin/users/new`
- Edit User: `/admin/users/:id/edit`
- New Organization: `/admin/organizations/new`
- Dynamic Role Builder: `/admin/roles`
- New Equipment Intake Request: `/requests/new`
- Lab Equipment Inspection: `/lab/verification/:requestId`
- Metrology Calibration Test: `/lab/calibration/:requestId`
- New Quotation Builder: `/commercial/quotations/new`
- Gate Pass Dispatch Generator: `/logistics/dispatch/new`

---

## 3. Architecture & Component Pattern Rules

1. **Container / Presenter / View Pattern:**
   - **Container (`*Container.tsx`):** Holds React state, TanStack Query hooks, Auth Context, event handler methods.
   - **Presenter (`*Presenter.tsx`):** Coordinates sub-views, grid layouts, loading indicators, and error boundaries.
   - **View (`*View.tsx`):** Pure functional render component displaying data and binding user input events.

2. **No Superficial Symptom Patches:**
   - Never fix an error by wrapping empty fallbacks or masking missing profile records.
   - If `user_profiles` returns null, throw an explicit `Error("No active user profile found for this account. Contact your system administrator.")`.

3. **TanStack Query Invalidation Policy:**
   - Every mutation MUST explicitly invalidate matching query keys (`['calibrationRequests', tenantId]`, `['labQueue', tenantId]`, etc.) upon success to guarantee UI freshness.
