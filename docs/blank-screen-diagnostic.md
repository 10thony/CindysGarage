# Blank Screen Diagnostic Report

**Date:** January 17, 2026  
**Issue:** Application displays blank screen with TanStack Router `notFoundError` warning  
**Error Message:**
```
Warning: A notFoundError was encountered on the route with ID "__root__", but a notFoundComponent option was not configured, nor was a router level defaultNotFoundComponent configured.
```

---

## Executive Summary

The application is rendering a blank dark screen due to a combination of **missing route configuration** and **potential SSR/hydration issues** in the TanStack Start framework setup. The root cause is that TanStack Router encounters a "not found" state but has no component configured to display, resulting in an empty render.

---

## Diagnostic Findings

### 1. Browser State Analysis
- **URL:** `http://localhost:3000/`
- **Title:** Correctly shows "Cindy's Garage - Garage Sale Inventory Manager"
- **DOM State:** Minimal structure - only a single generic element rendered
- **Console Errors:** None in browser console
- **Screenshot:** Completely blank/dark screen

### 2. Terminal Output Analysis
The dev server shows:
- Vite v7.3.1 started successfully on port 3000
- Convex functions ready
- TanStack Router warning about `notFoundError` on `__root__` route

### 3. Code Analysis

#### Route Configuration (`src/routes/__root.tsx`)
```typescript
export const Route = createRootRoute({
  head: () => ({...}),
  component: RootComponent,
  // MISSING: notFoundComponent
  // MISSING: errorComponent
  // MISSING: pendingComponent
})
```

#### Router Setup (`src/router.tsx`)
```typescript
const router = createRouter({
  routeTree,
  scrollRestoration: true,
  // MISSING: defaultNotFoundComponent
  // MISSING: defaultErrorComponent
})
```

#### Client Entry (`src/client.tsx`)
```typescript
hydrateRoot(
  document,  // Hydrates entire document
  <StrictMode>
    <StartClient />  // No explicit router passed
  </StrictMode>
)
```

---

## Root Cause Analysis

### Primary Issue: SSR Hydration Mismatch

TanStack Start is a **full-stack SSR framework**. The current setup has several architectural conflicts:

1. **Dual HTML Structure Conflict**
   - `index.html` contains `<div id="root"></div>` (SPA-style)
   - `__root.tsx` renders full HTML document with `<html>`, `<head>`, `<body>`
   - SSR renders the full document, but `index.html` may interfere

2. **Missing Router Connection in Client**
   - `StartClient` component is used without explicit router reference
   - The router is defined in `router.tsx` but may not be auto-discovered

3. **NotFoundError Propagation**
   - When SSR/hydration fails to match routes, a `notFoundError` bubbles up
   - No `notFoundComponent` exists to catch and display the error
   - Result: Empty render

---

## Potential Remedies (Ranked by Viability)

### Tier 1: High Viability - Quick Fixes

#### Fix #1: Add `notFoundComponent` to Root Route (⭐ HIGHEST PRIORITY)
**Viability: 95% | Effort: Low | Risk: None**

The most likely immediate fix. Add proper fallback components to the root route.

```typescript
// src/routes/__root.tsx
export const Route = createRootRoute({
  head: () => ({...}),
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
        <a href="/" className="text-blue-500 hover:underline">Go Home</a>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-red-500">
        <h1 className="text-4xl font-bold">Error</h1>
        <p>{error.message}</p>
      </div>
    </div>
  ),
})
```

#### Fix #2: Add `defaultNotFoundComponent` to Router (⭐ HIGH PRIORITY)
**Viability: 90% | Effort: Low | Risk: None**

Configure router-level fallbacks.

```typescript
// src/router.tsx
const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultNotFoundComponent: () => (
    <div>Page not found</div>
  ),
  defaultErrorComponent: ({ error }) => (
    <div>An error occurred: {error.message}</div>
  ),
})
```

---

### Tier 2: Medium Viability - Structural Fixes

#### Fix #3: Remove/Update `index.html` for SSR Compatibility
**Viability: 75% | Effort: Medium | Risk: Low**

TanStack Start renders the full HTML document server-side. The `index.html` file may be interfering with the SSR output.

**Option A:** Delete `index.html` entirely (TanStack Start generates it)

**Option B:** Ensure `index.html` is only a minimal shell:
```html
<!DOCTYPE html>
<html>
<head></head>
<body></body>
</html>
```

The SSR process should override this completely during server rendering.

#### Fix #4: Verify Router Export for TanStack Start
**Viability: 70% | Effort: Medium | Risk: Low**

TanStack Start may need the router exported differently. Create/update `src/app.tsx`:

```typescript
// src/app.tsx (new file)
import { createStart } from '@tanstack/react-start'
import { getRouter } from './router'

export default createStart({
  router: getRouter(),
})
```

---

### Tier 3: Lower Viability - Deeper Investigation Required

#### Fix #5: Switch to SPA Mode (If SSR Not Required)
**Viability: 60% | Effort: High | Risk: Medium**

If SSR is not strictly required, convert to a standard SPA setup:

1. Replace `@tanstack/react-start` with standard `@tanstack/react-router`
2. Update `client.tsx` to use `createRoot` instead of `hydrateRoot`
3. Mount to `#root` element in `index.html`
4. Remove `server.ts` and SSR-related config

```typescript
// client.tsx (SPA mode)
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={getRouter()} />
)
```

#### Fix #6: Debug SSR Output Directly
**Viability: 50% | Effort: Medium | Risk: None**

Add server-side logging to understand what's being rendered:

```typescript
// src/server.ts
import handler, { createServerEntry } from '@tanstack/react-start/server-entry'

export default createServerEntry({
  async fetch(request: Request) {
    console.log('[SSR] Handling request:', request.url)
    const response = await handler.fetch(request)
    const html = await response.clone().text()
    console.log('[SSR] Rendered HTML length:', html.length)
    console.log('[SSR] HTML preview:', html.substring(0, 500))
    return response
  },
})
```

#### Fix #7: Check Environment Variables
**Viability: 40% | Effort: Low | Risk: None**

Verify `VITE_CONVEX_URL` is properly set. Missing env vars could cause silent failures:

```bash
# Check if .env.local exists and has the required variable
cat .env.local | grep VITE_CONVEX_URL
```

The `convex.ts` throws an error if `VITE_CONVEX_URL` is missing, which could interrupt rendering.

---

## Recommended Action Plan

1. **Immediate (Do First):**
   - Apply Fix #1: Add `notFoundComponent` to root route
   - Apply Fix #2: Add `defaultNotFoundComponent` to router
   - Test the application

2. **If Still Broken:**
   - Apply Fix #3: Check/remove `index.html` interference
   - Apply Fix #4: Create `app.tsx` for proper TanStack Start integration

3. **If Still Broken:**
   - Apply Fix #6: Add SSR debugging
   - Apply Fix #7: Verify environment variables

4. **Nuclear Option:**
   - Apply Fix #5: Convert to SPA mode if SSR complexity is not worth it

---

## Technical Context

### TanStack Start SSR Behavior
- The `__root__` route's `component` is SSR'd and defines the HTML shell
- `shellComponent` is always SSR'd even if `ssr: false` is set on routes
- Child routes inherit SSR restrictions from parents
- `notFoundError` triggers when route matching fails; without a handler, renders nothing

### Hydration Requirements
- `hydrateRoot(document, ...)` expects server-rendered HTML matching client structure
- Any mismatch causes hydration errors and potential blank renders
- TanStack Start's `StartClient` handles router registration automatically

---

## Files Analyzed

| File | Status | Notes |
|------|--------|-------|
| `src/routes/__root.tsx` | ⚠️ | Missing fallback components |
| `src/routes/index.tsx` | ✅ | Correctly defines "/" route |
| `src/router.tsx` | ⚠️ | Missing default error/notFound components |
| `src/client.tsx` | ⚠️ | Uses hydration without explicit router |
| `src/server.ts` | ✅ | Standard TanStack Start server entry |
| `src/routeTree.gen.ts` | ✅ | Correctly generated with routes |
| `index.html` | ⚠️ | May conflict with SSR HTML |
| `vite.config.ts` | ✅ | Correct TanStack Start plugin config |

---

## Conclusion

The blank screen is most likely caused by the combination of:
1. A route matching failure or SSR issue causing `notFoundError`
2. No `notFoundComponent` configured to handle the error
3. Result: Nothing renders to the screen

**Start with Fixes #1 and #2** - they have the highest probability of resolving the issue with minimal risk and effort.
