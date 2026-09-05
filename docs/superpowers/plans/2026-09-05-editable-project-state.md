# Editable Project State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add editable, lockable requirement state and stable Cue data to the local Xiupu workspace.

**Architecture:** Add pure domain helpers for requirement items and cue timing, then evolve shared agent types and the workbench UI to use them. Keep API response shapes compatible and do not add persistence or an agent framework.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, existing OpenAI-compatible routes.

## Global Constraints

- Keep all user-facing labels in `en-US` and `zh-CN` locale files.
- Do not add Supabase, LangGraph, or files/database persistence in this iteration.
- AI output remains a draft and must never overwrite edited project state without user action.

---

### Task 1: Add project-state domain helpers

**Files:**
- Create: `src/lib/project-state/requirements.ts`
- Create: `src/lib/project-state/requirements.test.ts`
- Create: `src/lib/project-state/cues.ts`
- Create: `src/lib/project-state/cues.test.ts`

**Interfaces:**
- Produces `RequirementItem`, `createRequirementItem`, `toggleRequirementLock`.
- Produces `formatCueTimecode(startSeconds, durationSeconds)`.

- [ ] **Step 1: Write failing tests**

```ts
expect(createRequirementItem("fixed", "8 名演员")).toMatchObject({ tone: "fixed", text: "8 名演员", locked: false });
expect(toggleRequirementLock({ id: "r1", tone: "fixed", text: "8 名演员", locked: false }).locked).toBe(true);
expect(formatCueTimecode(60, 12)).toBe("1:00–1:12");
```

- [ ] **Step 2: Verify RED**

Run: `bun run test -- src/lib/project-state/requirements.test.ts src/lib/project-state/cues.test.ts`

- [ ] **Step 3: Implement minimal pure helpers**

```ts
export type RequirementItem = { id: string; tone: ReqTone; text: string; locked: boolean };
export function formatCueTimecode(startSeconds: number, durationSeconds: number): string {
  const format = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return `${format(startSeconds)}–${format(startSeconds + durationSeconds)}`;
}
```

- [ ] **Step 4: Verify GREEN and commit**

Run: `bun run test -- src/lib/project-state/requirements.test.ts src/lib/project-state/cues.test.ts`

### Task 2: Extend shared project and Agent types

**Files:**
- Modify: `src/lib/agents/types.ts`
- Modify: `src/lib/agents/plan-composer.ts`
- Modify: `src/lib/agents/preset-case.ts`

**Interfaces:**
- `PlanRow` gains optional `id`, `startSeconds`, `durationSeconds`, `actors`, `blocking`, `camera`, and `notes`.
- Existing rows keep rendering while generated rows gain stable IDs.

- [ ] **Step 1: Write a failing test for generated Cue IDs**

```ts
expect(normalizePlanRows([{ time: "0:00–0:12" }])[0].id).toMatch(/^cue_/);
```

- [ ] **Step 2: Verify RED, implement row normalization, and verify GREEN**

Run: `bun run test -- src/lib/project-state/cues.test.ts`

- [ ] **Step 3: Commit**

`git commit -am "feat: add stable cue data"`

### Task 3: Make requirement editing director-controlled

**Files:**
- Modify: `src/components/stagemuse/workbench.tsx`
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/en-US.json`

**Interfaces:**
- Workbench stores `RequirementItem[]` and serializes it into the current API `StructuredRequirement` shape at generation time.
- Directors can edit, add, remove, and lock every item.

- [ ] **Step 1: Add a component test for lock state rendering**

```tsx
render(<RequirementEditor items={[{ id: "r1", tone: "fixed", text: "8 名演员", locked: false }]} />);
await user.click(screen.getByRole("button", { name: /锁定/i }));
expect(screen.getByText(/已锁定/i)).toBeInTheDocument();
```

- [ ] **Step 2: Verify RED, implement focused editor component, and verify GREEN**

Run: `bun run test -- src/components/stagemuse/requirement-editor.test.tsx`

- [ ] **Step 3: Add localized copy and commit**

`git commit -am "feat: make requirements editable and lockable"`

### Task 4: Add scoped regeneration and Cue display fields

**Files:**
- Modify: `src/components/stagemuse/workbench.tsx`
- Modify: `src/lib/api/stagemuse.ts`
- Modify: `src/lib/agents/run-agent.ts`

**Interfaces:**
- Requirement edits mark directions and plan stale without deleting them.
- UI offers directions-only, plan-only, and full regeneration; all choices retain prior output until successful replacement.

- [ ] **Step 1: Write a failing state-transition test**

```ts
expect(markRequirementsChanged(state)).toMatchObject({ directionsStale: true, planStale: true });
```

- [ ] **Step 2: Verify RED, implement state transition, and verify GREEN**

Run: `bun run test -- src/lib/project-state/requirements.test.ts`

- [ ] **Step 3: Verify full application and commit**

Run: `bun run test && bun run lint && bun run build`

`git commit -am "feat: add scoped project regeneration"`
