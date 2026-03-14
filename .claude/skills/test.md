---
name: test
description: Run unit tests and e2e tests for the project
---

Run all tests:

```bash
npm run test
```

Unit tests only (Vitest):
```bash
npm run test:unit
```

E2E tests only (Playwright):
```bash
npm run test:e2e
```

Check coverage:
```bash
npm run test:coverage
```

After running, summarize:
- Total tests passed/failed
- Any failing tests with error details
- Coverage percentage if available
