# StageMuse Visual Shell Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the guessed purple/black StageMuse home shell with the supplied light pastel stage visual system while preserving all existing creation, execution, Cue, revision, Supabase, and i18n behavior.

**Architecture:** Keep the current Next.js App Router and Workbench as the product runtime. Port only the supplied visual shell, scene assets, Atmosphere animation, and interaction styling into the existing page and global styles; map shell actions to the existing workspace entry state instead of importing the source archive's Vinext runtime.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, lucide-react, existing StageMuse Workbench, supplied PNG/WebGL visual assets.

## Global Constraints

- Preserve existing API, Supabase, Cue, revision, i18n, auth, and Workbench behavior.
- Do not import the source archive's Vinext, Cloudflare, or dependency configuration.
- Keep all supplied credentials out of source files.
- Keep accessible labels and reduced-motion behavior for visual effects.
- Update README in the same change and commit the visual integration plus documentation together.

---

### Task 1: Port visual assets and animation components

**Files:**
- Create: `public/images/xiupu-scene-clean.png`
- Create: `public/images/xiupu-reference.png`
- Create: `src/components/stagemuse/atmosphere.tsx`
- Create: `src/components/stagemuse/cursor-particles.tsx`

**Interfaces:**
- `Atmosphere` renders the supplied scene background and optional WebGL motion without accepting business props.
- `CursorParticles` renders a decorative pointer particle canvas and remains inert when reduced motion is enabled.

- [ ] **Step 1:** Copy the two supplied PNG assets from the extracted source into `public/images/`.
- [ ] **Step 2:** Adapt the source `Atmosphere` component to the existing `@/components/stagemuse` namespace and supplied asset path.
- [ ] **Step 3:** Adapt `CursorParticles` to the existing component naming and class conventions.
- [ ] **Step 4:** Run TypeScript/build checks for the new components.

### Task 2: Replace the guessed home shell with the supplied visual language

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- The home page keeps `workspaceOpen` as the boundary between the visual landing shell and the existing `Workbench`.
- Home prompt, project card, and four subject actions call the existing `setWorkspaceOpen(true)` path.
- Existing `LanguageSwitcher`, `UserBadge`, and translated product copy remain available.

- [ ] **Step 1:** Replace the purple/black landing markup with the supplied light-stage composition: masthead, navigation rail, intro copy, subject annotations, project card, creation dock, and accessibility labels.
- [ ] **Step 2:** Add `Atmosphere` and `CursorParticles` behind the landing shell.
- [ ] **Step 3:** Port the supplied responsive and reduced-motion styles into scoped `xiupu-home`/StageMuse classes, retaining current tokens and avoiding global resets that affect Workbench.
- [ ] **Step 4:** Wire all primary shell actions to open the existing Workbench and preserve the current back-to-home behavior.
- [ ] **Step 5:** Verify the execution and creative workspace tabs still render unchanged after entering the Workbench.

### Task 3: Documentation and validation

**Files:**
- Modify: `README.md`

- [ ] **Step 1:** Keep the visitor-facing README structure and add one sentence describing the light stage visual shell without turning it into deployment documentation.
- [ ] **Step 2:** Run `bun run lint`.
- [ ] **Step 3:** Run `bun run build`.
- [ ] **Step 4:** Review the diff for accidental changes to business logic or credentials.
- [ ] **Step 5:** Commit the visual integration and README together with message `feat: integrate stage studio visual shell`.

