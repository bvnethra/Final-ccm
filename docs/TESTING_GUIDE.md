# Nethra CCM — Vitest & Quality Assurance Testing Guide

---

## 1. Test Architecture

Nethra CCM uses **Vitest** with JSDOM and `@testing-library/react` for unit and integration testing.

* **Test Location:** `src/test/*.test.ts`
* **Configuration:** `vite.config.ts` (`pool: 'threads'`, `singleThread: true`)
* **Setup File:** `src/test/setup.ts`

---

## 2. Running Unit Tests

Execute the Vitest test runner using:

```bash
cd react-supabase-ccm
npm test
```

---

## 3. Test Coverage Standards

Every feature module must have test coverage for:
1. **Permission Evaluator**: Verifying dot-notation permission codes and Super Admin overrides.
2. **Multi-Tenant Traceability**: Ensuring `tenantId` and `organizationId` are passed to Supabase service functions.
3. **Form Route Redirection**: Confirming submission transitions execute via `useNavigate()` to full-page routes.
