# Product Readiness Agent

## Purpose

Comprehensive audit of the PO Workbench codebase to assess production-readiness for commercial scaling. Identifies gaps, risks, and prioritized remediation steps needed before wider deployment.

## Capabilities

This agent specializes in:

1. **Architecture Review** — Examines code structure, patterns, and design decisions against production best practices
2. **Security Audit** — Identifies secrets, input validation gaps, authentication/authorization issues
3. **Performance Analysis** — Detects memory leaks, unnecessary re-renders, bundle size issues, slow API calls
4. **Test Coverage Assessment** — Evaluates testing gaps and recommends additional coverage
5. **Accessibility Compliance** — Checks WCAG 2.1 AA standards for inclusion
6. **Documentation Gaps** — Flags missing setup docs, architecture decisions, API guides
7. **Dependency Health** — Identifies outdated, vulnerable, or unused packages
8. **Scalability Patterns** — Assesses readiness for backend integration and multi-user architecture

## How to Invoke

Use the skill directly in Claude Code:
```
/product-readiness [--focus <dimension>] [--detail] [--severity <level>]
```

Or spawn this agent via the Agent tool:
```
agent("Audit PO Workbench for production-readiness", {
  label: "Product Readiness Audit",
  agentType: "claude"  // Uses the general-purpose agent with custom prompt
})
```

## Input Parameters

- **focus** — Optional. Audit a specific dimension:
  - `security` — Secrets, input validation, CORS, headers
  - `performance` — Bundle size, render optimization, memory leaks
  - `testing` — Test coverage, critical path testing
  - `accessibility` — WCAG compliance, keyboard nav, ARIA labels
  - `documentation` — README, architecture docs, setup guides
  - `scalability` — Backend readiness, multi-user patterns, database design
  - `devops` — CI/CD, deployment, monitoring, rollback procedures
  - `data-handling` — Validation, serialization, normalization, consistency
  
  If not specified, agent runs full audit across all dimensions.

- **detail** — Boolean. If true, returns detailed findings with:
  - Specific file paths and line numbers
  - Code snippets showing the issue
  - Remediation steps with examples
  - Effort estimates (hours to fix)

- **severity** — Optional. Filter findings by severity level:
  - `critical` — Must fix before release
  - `high` — Should fix; blocks commercial use
  - `medium` — Nice-to-have improvements
  - `low` — Polish/nice-to-haves
  
  If not specified, returns all levels.

## Expected Output

Returns a structured report with:

```json
{
  "readiness_score": "0–100",
  "timestamp": "ISO 8601",
  "summary": "Overall assessment and key blockers",
  "dimensions": {
    "<dimension>": {
      "status": "✓ ready | ⚠ needs-review | ✗ critical",
      "findings": [
        {
          "severity": "critical|high|medium|low",
          "title": "Issue title",
          "description": "What's wrong",
          "location": "file.ts:line",
          "impact": "Why it matters for production",
          "remediation": "How to fix it",
          "effort": "hours estimate"
        }
      ]
    }
  },
  "blockers": ["Critical issue 1", "Critical issue 2"],
  "recommendations": [
    {
      "priority": 1,
      "action": "Fix X",
      "reasoning": "Why this first",
      "effort": "hours estimate"
    }
  ],
  "next_steps": "Suggested follow-up actions"
}
```

## Usage Examples

**Quick security check:**
```
/product-readiness --focus security --severity critical,high
```

**Detailed performance audit with code examples:**
```
/product-readiness --focus performance --detail
```

**Full audit with all findings:**
```
/product-readiness --detail
```

## Key Checks

The agent specifically verifies:

- ✓ OpenAI API key handling (not hardcoded, secured in env vars)
- ✓ Error boundaries and fallback UI states
- ✓ Input sanitization before API calls and DOM rendering
- ✓ TypeScript strict mode enabled and enforced
- ✓ React render optimization (memo, callbacks, keys in lists)
- ✓ Bundle size analysis and code splitting
- ✓ WCAG 2.1 AA accessibility compliance
- ✓ Unit test coverage on lib/ modules (target: 80%+)
- ✓ Integration tests for save/load, export, AI features
- ✓ E2E test coverage for critical user workflows
- ✓ Environment variable documentation
- ✓ Error logging and monitoring setup
- ✓ Sensitive data handling (no logs, no local storage of secrets)
- ✓ State consistency and undo/redo patterns
- ✓ README with setup and deployment instructions
- ✓ Architecture documentation for major decisions

## Integration with Workflow

This agent is designed to work with:
- **Product Increment Review** — Run after feature development to validate production-readiness
- **Pre-Release Checklist** — Run before wider internal rollout
- **Security Review** — Can be focused on security dimension alone
- **Performance Regression Detection** — Compare audit results across releases

## Notes for Future Integration

When scaling to production:
1. Add automated audit to CI/CD pipeline (run on every PR)
2. Integrate findings into GitHub Issues for tracking
3. Set up scheduled audits (weekly) to catch regressions
4. Create dashboard to track readiness score over time
5. Link audit findings to sprint planning (prioritize fixes by dimension)

---

**Agent Type:** General-purpose architecture/code review  
**Created:** 2026-06-22  
**Last Reviewed:** 2026-06-22
