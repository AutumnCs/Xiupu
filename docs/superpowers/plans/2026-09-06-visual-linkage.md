# Visual Reference Linkage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply an analyzed visual reference to the editable performance direction and eligible Cue rows without overwriting confirmed or locked work.

**Architecture:** A pure project-state transformer receives the current performance, Cue plan, and visual analysis. It appends a compact visual/lighting brief to editable sections and matching Cues, while returning affected and skipped Cue ids for UI feedback. The visual reference panel invokes this transformer through a callback owned by the workbench, so persistence continues to use the existing project snapshot.

**Tech Stack:** TypeScript, React state, Vitest, existing StageMuse agent types and i18n.

## Global Constraints

- Keep the single-program demo scope; no new database tables or image generation.
- Do not overwrite Cue rows whose status is `confirmed` or `locked`.
- Keep all user-visible copy in both locale files.

### Task 1: Pure linkage transformer

**Files:**
- Create: `src/lib/project-state/visual-linkage.ts`
- Test: `src/lib/project-state/visual-linkage.test.ts`

- [ ] Write a failing test covering section enrichment, editable Cue enrichment, and skipping confirmed/locked Cues.
- [ ] Run `bun test src/lib/project-state/visual-linkage.test.ts` and confirm the missing-module failure.
- [ ] Implement `applyVisualReferenceLinkage` returning `{ performance, plan, affectedCueIds, skippedCueIds }` with immutable copies.
- [ ] Run the focused test and confirm it passes.

### Task 2: Workbench integration

**Files:**
- Modify: `src/components/stagemuse/workbench.tsx`
- Modify: `src/components/stagemuse/visual-reference-panel.tsx`

- [ ] Add a workbench callback that applies the transformer to the active performance/plan, clears stale validation, and shows a toast for skipped Cues.
- [ ] Pass the callback and an enabled flag into the visual panel.
- [ ] Add an “apply to creative/execution” action beside the analyzed prompt; disable it when no generated plan exists and show a useful explanation.
- [ ] Keep V2 read-only behavior and existing save/version snapshot behavior intact.

### Task 3: Localized feedback and verification

**Files:**
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/en-US.json`

- [ ] Add localized labels for apply, applied, no-plan, and skipped-Cue feedback.
- [ ] Run `bun test`, `bun run lint`, and `bun run build`.
- [ ] Commit the completed linkage feature.
