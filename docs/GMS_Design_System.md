# Design System — Calispec GMS

> **Calispec.ai** is a Next-Generation SaaS Platform Purpose-Built for Managing the Entire Lifecycle of Gauges, Calibration Events, Inspection Processes, and Metrology Studies in a Single, Intelligent Interface.

---

## 1. Color Palette

A purpose-driven color system designed for clarity, compliance, and operational efficiency. Every color has a defined role to ensure consistency, accessibility, and faster decision-making.

### 1.1 Brand & Accent

| Name | Hex | Usage |
|---|---|---|
| Calispec Blue | `#0274BB` | Primary — navigation, primary actions, active states, links, system highlights |
| Calispec Orange | `#EF7626` | Accent — alerts, notifications, reminders, high-attention actions |
| Blue Light | `#E6F2FF` | Supporting background — create hierarchy without adding visual noise |
| Blue Navy | `#003B8C` | Deep brand — emphasis, high contrast areas, premium visual hierarchy |

### 1.2 Semantic

| Name | Hex | Usage |
|---|---|---|
| Success | `#16A34A` | Healthy, compliant, completed, and successful system states |
| Warning | `#F59E0B` | Upcoming actions, attention-required items, and pending deadlines |
| Error | `#DC2626` | Critical, overdue, failed, or blocked states requiring immediate attention |
| Analytics | `#7C3AED` | Insights, reports, trends, and Measurement System Analysis |
| Information | `#0284C7` | Neutral informational messages and guidance |

### 1.3 Surface

| Name | Hex | Usage |
|---|---|---|
| White | `#FFFFFF` | Primary application background |
| Gray 50 | `#FAFAFA` | Section backgrounds and subtle containers |
| Gray 100 | `#F5F7FA` | Cards, inputs, and secondary surfaces |
| Gray 200 | `#E5E7EB` | Borders, dividers, and table separators |
| Gray 300 | `#D1D5DB` | Disabled states and placeholders |
| Gray 400 | `#9CA3AF` | Secondary labels and supporting content |
| Gray 500 | `#6B7280` | Body text and medium emphasis content |
| Gray 600 | `#4B5563` | Primary text on light surfaces |
| Gray 700 | `#374151` | Headings and strong emphasis content |
| Gray 900 | `#111827` | Highest emphasis text and key information |

---

## 2. Typography Scale

**Typeface:** Inter  
Inter is the primary typeface across the Calispec GMS. Designed for clarity, readability, and high-density enterprise interfaces across dashboards, tables, forms, reports, and compliance workflows.

### 2.1 Display

| Token | Size / Line Height / Weight / Tracking | Example |
|---|---|---|
| Display XXL | `72px / 1.0 / 600 / -0.02em` | Calibration Command Center |
| Display XL | `56px / 1.0 / 600 / -0.02em` | Gauge Management Dashboard |
| Display LG | `44px / 1.0 / 500 / -0.02em` | Enterprise Calibration Intelligence Platform |
| Display MD | `32px / 1.0 / 500 / -0.02em` | Critical Gauges Requiring Immediate Attention |
| Display SM | `24px / 1.0 / 500 / -0.02em` | Upcoming Calibration Schedule |
| Display XS | `20px / 1.0 / 500 / -0.02em` | Measurement System Analysis Dashboard |

### 2.2 KPI

| Token | Size / Line Height / Weight / Tracking | Example |
|---|---|---|
| KPI Numbers | `64px / 1.0 / 500 / -0.02em` | 123456 |
| KPI Display | `40px / 1.0 / 500 / -0.02em` | Total Gauges |
| KPI Medium | `28px / 1.0 / 500 / -0.02em` | Due This Month |
| KPI Small | `20px / 1.0 / 500 / -0.02em` | Overdue Gauges |

### 2.3 Body & UI

| Token | Size / Line Height / Weight / Tracking | Usage |
|---|---|---|
| Body Default | `16px / 1.0 / 400 / 0em` | Main body copy and descriptions |
| Body Small | `14px / 1.0 / 400 / 0em` | Secondary body copy, helper text |
| Table Header | `18px / 1.0 / 600 / 0em` | Column headers in data tables |
| Table Cell | `16px / 1.0 / 400 / 0em` | Row content in data tables |
| Button Large | `16px / 1.0 / 600 / 0em` | Primary and large action buttons |
| Button Small | `14px / 1.0 / 500 / 0em` | Secondary and compact buttons |
| Status Badge | `14px / 1.0 / 600 / 0em` | Status pills and badge labels |

---

## 3. Button Variants

Buttons drive operational workflows throughout Calispec GMS. Each button type represents a specific action priority and should maintain consistent behavior across all modules.

### 3.1 Variants

| Variant | Usage |
|---|---|
| **Primary** | Main actions — Add Gauge, Submit, Confirm |
| **Primary Hover** | Hover state of primary button |
| **Primary Disabled** | Inactive or unavailable primary actions |
| **Secondary (Outline)** | Supporting actions — Generate Report |
| **Tertiary (Text)** | Low-priority actions — View Gauge History, Read the announcement → |
| **Outline Ink** | Back navigation and neutral actions |
| **Success** | Approve Request |
| **Warning** | Review Due Gauges |
| **Danger** | Reject Request |
| **Success Outline** | Outline variant of success action |
| **Warning Outline** | Outline variant of warning action |
| **Danger Outline** | Outline variant of danger action |
| **Icon Button (Outline)** | Icon-only actions — Generate Report |
| **Badge Pill** | Status indicators — ACTIVE, OVERDUE |

### 3.2 Navigation & Pagination

| Component | Variants |
|---|---|
| Category Tab | Active / Inactive — All · Gauge · Instrument · Equipment |
| Pagination | Previous · 1 · 2 · 3 · 4 · 5 · Next |

---

## 4. Cards & Containers

Cards organize operational data, metrics, workflows, and analytics throughout Calispec GMS. Every card follows a consistent structure to improve scanability, hierarchy, and decision-making across all modules.

### 4.1 Card Types

| Type | Description |
|---|---|
| **KPI / Stat Card** | Displays a key metric (e.g. Total Gauges: 12,456) with supporting breakdown values and sub-labels |
| **Dashboard Card** | Titled container with a primary action button; used for module entry points (e.g. Standards Room Dashboard) |

### 4.2 Card Anatomy

- **Header** — Card title and optional actions/icons
- **Body** — Primary KPI, charts, or content
- **Sub-metrics** — Supporting data rows (In Use, In Stock, For Calibration, Repair)
- **Footer/CTA** — Action button or link (e.g. Operations)

---

## 5. Form Elements

Forms are the foundation of operational workflows in Calispec GMS. Every input should follow a consistent pattern to improve accuracy, reduce errors, and support audit-ready data entry.

### 5.1 Input Types

| Component | States / Notes |
|---|---|
| **Text Input** | Default — placeholder text (e.g. Enter your email address) |
| **Text Input Focused** | Blue border highlight, cursor visible |
| **Text Input Error** | Red border + error message below (e.g. "Gauge ID is required") |
| **Text Input Read Only** | Greyed background, not editable (label: "Read only field") |
| **Dropdown / Select** | Collapsed with placeholder label (e.g. SELECT VENDOR) |
| **Search Input** | Prefix search icon, placeholder (e.g. Search Gauge ID) |
| **Date Picker** | Formatted date display (e.g. 22-06-2026) |
| **Multi-Select** | Tag/pill display for selected values (e.g. Plant 1, Plant 2) |
| **Number Input with Helper** | Value field + helper text below (e.g. "Enter the measurement value in mm") |
| **Textarea** | Multi-line free text (e.g. Notes) |
| **File Upload** | Drag-and-drop zone + Select Files button; supports multiple files; shows uploaded file list with thumbnails |

---

## 6. Layout & Spacing System

A consistent **8px base grid** ensures predictable layouts across all screens. Every screen in Calispec GMS should follow the same spacing rhythm to improve readability, scanning, and usability.

### 6.1 Spacing Tokens

| Token | Value |
|---|---|
| `xxs` | 4px |
| `xs` | 8px |
| `sm` | 12px |
| `md` | 24px |
| `xl` | 32px |
| `xxl` | 48px |
| `section` | 64px |

---

## 7. Border Radius Scale

### 7.1 Functional Elements (0–4px)
Buttons, inputs, tables, and interactive controls use subtle corner radii to maintain precision and clarity.

### 7.2 Surface Elements (8–16px)
Cards, dashboards, modals, drawers, and analytics containers use softer corners to improve visual grouping and reduce interface density.

### 7.3 Radius Tokens

| Token | Value | Usage |
|---|---|---|
| `none` | `0px` | Tables, full-bleed elements |
| `xs` | `2px` | Subtle rounding, badges |
| `sm` | `3px` | Status pills |
| `md` | `4px` | Buttons, inputs, form controls |
| `lg` | `8px` | Cards, panels |
| `xl` | `16px` | Modals, drawers, analytics containers |
| `pill` | `999px` | Badge pills, tags, toggle switches |

---

## 8. Module Reference

The design system applies consistently across the following GMS modules:

- **Inventory** — Gauge listing, tracking, and status management
- **MSA (Measurement System Analysis)** — Trends, reports, analytics
- **Standards Room** — Standards management, logs, daily operations
- **Management** — Dashboards, compliance, approval workflows
- **Corporate** — Enterprise-wide reporting and oversight

---

*Last updated: July 2026 · Source: GMS_Design_System.pdf*
