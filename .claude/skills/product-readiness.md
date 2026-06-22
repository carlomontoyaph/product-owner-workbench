# Product Readiness Skill

## Purpose

Audit the codebase for production-readiness across multiple dimensions, preparing the prototype for commercial application after internal validation.

## Architecture Checks Performed

### 1. **Error Handling & Resilience**
- ✓ Try-catch blocks around API calls (OpenAI integration)
- ✓ User-facing error messages vs. console errors
- ✓ Fallback UI states for loading/error conditions
- ✓ Null/undefined handling in component render paths
- ✓ Recovery mechanisms for failed operations

### 2. **Security & Secrets Management**
- ✓ API keys (OpenAI) stored securely (not hardcoded in source)
- ✓ No sensitive data logged to console
- ✓ Input validation on user-provided data before API calls
- ✓ CORS and CSP headers configured appropriately
- ✓ No credentials exposed in config files or build output

### 3. **Type Safety & Code Quality**
- ✓ Strict TypeScript enabled (tsconfig.json)
- ✓ No `any` types used without justification
- ✓ Type-safe exports from lib/ modules
- ✓ Component prop types fully defined
- ✓ Union types for state instead of boolean flags

### 4. **Performance & Optimization**
- ✓ React.memo for pure components (expensive renders)
- ✓ useCallback/useMemo hooks to prevent re-renders
- ✓ Lazy loading of large components (dynamic import)
- ✓ Bundle size analysis (Tailwind purging, code splitting)
- ✓ No memory leaks (event listener cleanup, debounce/throttle)
- ✓ Pagination/virtualization for large lists

### 5. **Data Handling & Validation**
- ✓ Zod or similar schema validation on data ingress
- ✓ Consistent data transformation pipelines (normalizers)
- ✓ No untrusted data directly rendered to DOM
- ✓ Data serialization/deserialization safety (save/load)
- ✓ Handling of stale or inconsistent state

### 6. **Accessibility (a11y)**
- ✓ ARIA labels on interactive elements
- ✓ Keyboard navigation support
- ✓ Color contrast ratios (WCAG AA minimum)
- ✓ Focus management and visible focus indicators
- ✓ Semantic HTML where possible

### 7. **Logging & Observability**
- ✓ Structured logging (not just console.log)
- ✓ Log levels (debug, info, warn, error)
- ✓ No sensitive data in logs
- ✓ Error tracking integration (Sentry, LogRocket, etc.)
- ✓ Performance metrics tracked

### 8. **Configuration Management**
- ✓ Environment variables for all external configs
- ✓ .env.local/.env.example documented
- ✓ Build-time vs. runtime config separation
- ✓ Feature flags or experiments properly gated
- ✓ No hard-coded URLs or API endpoints

### 9. **Testing Coverage**
- ✓ Unit tests for lib/ modules (utilities, builders, normalizers)
- ✓ Component tests for Shared/ and complex components
- ✓ Integration tests for key workflows (save/load, export)
- ✓ E2E tests for critical user paths
- ✓ Test coverage thresholds defined

### 10. **Documentation & Onboarding**
- ✓ README with setup, build, run instructions
- ✓ Architecture ADR (Architecture Decision Record) for major choices
- ✓ Inline comments for non-obvious logic
- ✓ Component prop documentation (TSDoc or equivalent)
- ✓ API integration guide for OpenAI setup

### 11. **Deployment & CI/CD**
- ✓ GitHub Actions or equivalent CI pipeline
- ✓ Automated builds and test runs on PR
- ✓ Linting enforced in pre-commit hooks
- ✓ Docker containerization (if applicable)
- ✓ Staging and production deploy workflows
- ✓ Rollback procedures documented

### 12. **Browser & Device Compatibility**
- ✓ Tested on modern browsers (Chrome, Firefox, Safari, Edge)
- ✓ Mobile responsive design and touch interaction
- ✓ No console errors or warnings in production build
- ✓ polyfills for legacy browser support (if needed)

### 13. **State Management & Data Flow**
- ✓ Predictable state mutations (no unexpected side effects)
- ✓ Clear data flow (unidirectional, props down, events up)
- ✓ No prop drilling (appropriate context usage)
- ✓ De-duplication of state (single source of truth)
- ✓ Undo/redo or audit trail for user actions

### 14. **Scalability Patterns**
- ✓ Component composition follows single responsibility
- ✓ Lib functions are pure and testable
- ✓ API abstraction layer for OpenAI (easy to swap providers)
- ✓ Backend-readiness (frontend can integrate with REST/GraphQL API)
- ✓ Database schema design (if/when persistent backend added)

### 15. **User Experience**
- ✓ Loading indicators for long-running operations
- ✓ Toast/snackbar notifications for user feedback
- ✓ Confirmation dialogs for destructive actions
- ✓ Intuitive error messages (not technical jargon)
- ✓ Graceful degradation if AI features unavailable

## How to Use This Skill

Run the audit with:
```bash
/product-readiness [--focus <area>] [--detail]
```

**Options:**
- `--focus <area>` — Audit a specific area (e.g., security, performance, testing)
- `--detail` — Generate detailed findings with code locations and remediation steps

## Output Format

The skill returns:
- **Summary** — Overall readiness score (0–100)
- **Findings** — Categorized by severity (critical, high, medium, low)
- **Recommendations** — Prioritized action items with effort estimates
- **Blockers** — What MUST be fixed before commercial release

---

**Last Updated:** 2026-06-22  
**Maintained By:** Product Owner Workbench team
