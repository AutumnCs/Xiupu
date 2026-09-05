# Readable Requirements and Serial Impact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make requirement rows readable in narrow panels and apply director-feedback impacts one at a time.

**Architecture:** A pure queue helper selects the next applicable impact. The workbench confirms only that item, regenerates V2, then requests a fresh impact report based on the updated state. Requirement-row CSS owns all narrow-layout adjustments.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Tailwind CSS.

## Global Constraints

- Keep all copy in `zh-CN.json` and `en-US.json`.
- Do not add persistence, multi-Agent behavior, or bulk confirmation.
- Verify with `bun run test`, `bun run lint`, and `bun run build`.

---

### Task 1: Impact queue helper

**Files:**
- Create: `src/lib/project-state/impact-queue.ts`
- Create: `src/lib/project-state/impact-queue.test.ts`

**Interfaces:**
- Produces `getNextImpact(report, skippedIds): ImpactItem | null`.

- [ ] Write a test proving must impacts precede maybe impacts and skipped items are omitted.
- [ ] Run the isolated test and confirm it fails because the helper does not exist.
- [ ] Implement the minimal ordering helper.
- [ ] Run the isolated test and confirm it passes.

### Task 2: Serial feedback confirmation

**Files:**
- Modify: `src/components/stagemuse/workbench.tsx`
- Modify: `src/lib/api/stagemuse.ts`
- Modify: `src/app/api/agents/feedback/route.ts`
- Modify: `src/lib/agents/feedback-analyst.ts`
- Modify: locale files

- [ ] Replace checkbox-based bulk application with one current impact card.
- [ ] Generate V2 using only the confirmed impact, then reanalyse the feedback against the returned V2.
- [ ] Pass already-confirmed titles to analysis so the report does not repeat completed work.
- [ ] Add localized queue, confirm, skip, and reassessment copy.

### Task 3: Requirement-row layout

**Files:**
- Modify: `src/components/stagemuse/workbench.tsx`
- Modify: `src/app/globals.css`

- [ ] Render each requirement row with a wrapping text field and compact action group.
- [ ] Use icon-only buttons with localized accessible labels.
- [ ] Ensure narrow cards do not overlap or clip requirement text.

### Task 4: Verification

- [ ] Run `bun run test`.
- [ ] Run `bun run lint`.
- [ ] Run `bun run build`.
