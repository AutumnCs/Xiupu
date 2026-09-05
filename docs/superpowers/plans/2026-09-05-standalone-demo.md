# Standalone Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run Xiupu locally and on an independent host without a host-platform SDK, session bridge, UI wrapper, or AI proxy.

**Architecture:** Replace external session authentication with an opaque HTTP-only guest cookie managed by local route helpers. Keep Agent route payloads stable while passing this local identity as actor scope. Make the AI adapter server-only and OpenAI-compatible, then remove host-only UI and deployment configuration.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun, Vitest, Drizzle/PostgreSQL, OpenAI-compatible HTTP API.

## Global Constraints

- Guest identity is an opaque HTTP-only cookie with `SameSite=Lax` and `Secure` outside development.
- AI keys are server-only and use `AI_PROVIDER_BASE_URL`, `AI_PROVIDER_API_KEY`, and `AI_PROVIDER_MODEL`.
- Keep current Agent route payload and success-response shapes unchanged.
- Do not add formal login, collaboration, persistence, billing, or document ingestion.
- User-visible copy remains in both locale files.

---

### Task 1: Add locally managed guest identity

**Files:**
- Create: `src/lib/auth/guest.ts`
- Create: `src/lib/auth/guest.test.ts`
- Modify: `src/lib/auth/index.ts`
- Modify: the five `src/app/api/agents/*/route.ts` files

**Interfaces:**
- Produces `requireGuest(request: NextRequest): { guestId: string; response?: NextResponse }`.
- Routes pass `guestId` to existing Agent calls in place of the prior actor id.

- [ ] **Step 1: Write the failing test**

```ts
it("creates an HTTP-only guest cookie when absent", () => {
  const result = requireGuest(new NextRequest("http://localhost"));
  expect(result.guestId).toMatch(/^guest_/);
  expect(result.response?.cookies.get("xiupu_guest_id")?.httpOnly).toBe(true);
});
```

- [ ] **Step 2: Verify RED**

Run: `bunx vitest run src/lib/auth/guest.test.ts`

Expected: FAIL because `requireGuest` does not exist.

- [ ] **Step 3: Implement the helper and route handoff**

Validate existing cookies with `/^guest_[a-zA-Z0-9_-]{16,}$/`; otherwise create `guest_${crypto.randomUUID().replaceAll("-", "")}`. Set `httpOnly: true`, `sameSite: "lax"`, `secure: process.env.NODE_ENV === "production"`, `path: "/"`, and a 30-day `maxAge`. Copy its `Set-Cookie` header to each JSON route response.

- [ ] **Step 4: Verify GREEN and commit**

Run: `bunx vitest run src/lib/auth/guest.test.ts && bun run lint`

Commit: `git commit -am "feat: add standalone guest identity"`

### Task 2: Replace the AI proxy with an OpenAI-compatible adapter

**Files:**
- Create: `src/lib/ai/provider.ts`
- Create: `src/lib/ai/provider.test.ts`
- Modify: `src/lib/eazo-ai-billing.ts`
- Modify: `src/lib/agents/run-agent.ts`

**Interfaces:**
- `getProviderConfig(input)` returns normalized `{ baseUrl, apiKey, model }` or throws `"AI provider is not configured"`.
- Existing `appAi.chat(params)` remains Agent-facing.

- [ ] **Step 1: Write the failing test**

```ts
it("rejects incomplete configuration", () => {
  expect(() => getProviderConfig({ baseUrl: "", apiKey: "", model: "" }))
    .toThrow("AI provider is not configured");
});
```

- [ ] **Step 2: Verify RED**

Run: `bunx vitest run src/lib/ai/provider.test.ts`

Expected: FAIL because `getProviderConfig` does not exist.

- [ ] **Step 3: Implement and remove proxy branches**

Use normalized `AI_PROVIDER_BASE_URL` with `/chat/completions`, bearer authentication, and `AI_PROVIDER_MODEL`. Preserve JSON and SSE handling. Remove external model-key, app identity, billing-proxy and host environment-variable paths.

- [ ] **Step 4: Verify GREEN and commit**

Run: `bunx vitest run src/lib/ai/provider.test.ts && bun run lint`

Commit: `git commit -am "feat: use independent AI provider"`

### Task 3: Remove host-only client and layout code

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/stagemuse/workbench.tsx`, `src/lib/api/request.ts`
- Modify: `src/components/user-profile/user-badge.tsx`, `src/i18n/index.ts`, `src/lib/i18n/preference.ts`
- Delete: `src/components/user-profile/user-sync-effect.tsx`, `src/components/eazo/preview-inspector.tsx`

**Interfaces:**
- Root layout contains the i18n provider, app content, font, and toaster only.
- Workbench does not ask users to log in.
- Client requests send only locale metadata.

- [ ] **Step 1: Write the failing dependency test**

```ts
it("does not import the previous SDK", () => {
  expect(rootLayoutSource).not.toContain("@eazo/sdk");
});
```

- [ ] **Step 2: Verify RED**

Run: `bunx vitest run src/app/layout.test.ts`

Expected: FAIL because the root layout still imports the SDK.

- [ ] **Step 3: Simplify UI and request layers**

Remove provider, branding script, canvas bridge, session-header injection, host-auth login call, and user sync. Keep i18n, toaster, font, metadata, and locale header. Replace the profile control with a localized “Guest mode” indicator. Rename local locale event and storage keys to `xiupu-*`.

- [ ] **Step 4: Verify GREEN and commit**

Run: `bunx vitest run src/app/layout.test.ts src/components/i18n/locale-sync-effect.test.tsx && bun run lint`

Commit: `git commit -am "feat: remove host runtime dependencies"`

### Task 4: Clean packages, configuration, and deployment documentation

**Files:**
- Modify: `package.json`, `bun.lock`, `next.config.ts`, `.env.example`, `README.md`, `vercel.json`

**Interfaces:**
- The package manifest has no external SDK dependency or SDK-copy scripts.
- The example environment file documents only standalone runtime values.

- [ ] **Step 1: Write the failing manifest test**

```ts
it("does not include the previous SDK", () => {
  expect(packageJson.dependencies["@eazo/sdk"]).toBeUndefined();
});
```

- [ ] **Step 2: Verify RED**

Run: `bunx vitest run standalone-manifest.test.ts`

Expected: FAIL because the dependency exists.

- [ ] **Step 3: Update deployment artifacts**

Remove obsolete SDK scripts and transpilation. Refresh `bun.lock`. Document `DATABASE_URL`, `AI_PROVIDER_BASE_URL`, `AI_PROVIDER_API_KEY`, `AI_PROVIDER_MODEL`, `NEXT_PUBLIC_APP_TITLE`, and `NEXT_PUBLIC_APP_DESCRIPTION`. Remove obsolete notification cron configuration and document local/Vercel deployment.

- [ ] **Step 4: Verify and commit**

Run: `bun run lint && bun run build`

Commit: `git commit -am "chore: prepare standalone deployment"`

## Plan Self-Review

- Spec coverage: Tasks 1-4 cover guest identity, independent AI, host UI removal, and clean deployment artifacts.
- Placeholder scan: all tasks identify files, interfaces, tests, commands, and expected failure conditions.
- Type consistency: every route receives `guestId`, and `appAi.chat` stays unchanged for Agent callers.

