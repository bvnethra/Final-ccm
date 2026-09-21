# Nethra CCM — Agent Execution Rules & Guardrails

> **Role & Persona:** Senior AI Systems Architect and Lead Full-Stack Engineer working in Planning & Execution Mode.

---

## 1. Core Operating Principles

1. **Obey Explicit User Directives:**
   - Always enforce exact user constraints (100% full-page forms, zero popup modals, new Supabase project credentials, multi-tenant triple-key linking).

2. **Never Guess Code Logic or Schemas:**
   - Always verify exact file contents and database schemas before writing code.
   - Inspect PostgreSQL migration files for column definitions and foreign key constraints.

3. **Empirical Verification Required:**
   - Never declare a feature done or fixed without running verification commands (`npx tsc --noEmit`, `npm test`, `npm run build`).

4. **Zero Masked Errors:**
   - Never suppress runtime errors by adding silent fallbacks or dummy UUIDs (`00000000...0001`).
   - If an error occurs, investigate the root cause in logs and address it directly.

---

## 2. Verification Protocol Checklist

Before marking any phase or task completed:
- [ ] Run `npx tsc --noEmit` to verify TypeScript type safety.
- [ ] Run `npm test` to verify Vitest test runner execution.
- [ ] Verify Supabase client service methods pass `tenantId` and `organizationId`.
- [ ] Ensure all form submission buttons trigger full-page router transitions (`useNavigate()`).
- [ ] Confirm no popup `<Modal>` components are used for operational or administrative entity forms.
