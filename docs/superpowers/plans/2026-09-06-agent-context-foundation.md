# Agent Context Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add inspectable agent definitions, project knowledge context, creator preferences, and persisted agent-run metadata to the single-program workbench.

**Architecture:** Keep the existing Route Handler API surface and model provider. Add pure project-state modules for agent registration and knowledge derivation, then have the workbench persist a bounded client-side trace and provide explicit creator preferences through ProjectBrief. The creative director accepts this expanded project context.

**Tech Stack:** Next.js, React, TypeScript, Vitest, i18next, existing Supabase project snapshots.

## Global Constraints

- No new database table, vector database, framework dependency, or autonomous group chat.
- Creator preferences are advisory and must not overwrite project requirements or locked Cues.
- Trace metadata must not include prompts, provider raw output, or private document content.
- User-visible copy is present in `zh-CN` and `en-US` locale files.

### Task 1: Typed Agent and Knowledge State

**Files:**
- Create: `src/lib/agents/agent-registry.ts`
- Create: `src/lib/project-state/project-intelligence.ts`
- Create: `src/lib/project-state/project-intelligence.test.ts`
- Modify: `src/lib/agents/types.ts`

- [ ] Write a failing test that expects knowledge entries for supporting materials, fixed requirements, protected Cues, and a creator preference.
- [ ] Run `bun test src/lib/project-state/project-intelligence.test.ts` and verify the missing-module failure.
- [ ] Add immutable types and pure helpers that derive entries while excluding blank sources.
- [ ] Add the static catalog for requirement, creative, performance, Cue, visual, feedback, revision, and consistency agents.
- [ ] Re-run the focused test.

### Task 2: Context Propagation and Trace Persistence

**Files:**
- Modify: `src/lib/agents/creative-director.ts`
- Modify: `src/lib/agents/orchestrator.ts`
- Modify: `src/app/api/agents/directions/route.ts`
- Modify: `src/lib/api/stagemuse.ts`
- Modify: `src/lib/api/projects.ts`
- Modify: `src/components/stagemuse/workbench.tsx`

- [ ] Pass ProjectBrief into creative-direction generation and include project material/profile context in the prompt.
- [ ] Add a bounded, metadata-only agent run trace to snapshots.
- [ ] Record success/failure/fallback and duration around existing agent API calls.
- [ ] Persist explicit profile fields in ProjectBrief and local browser storage.

### Task 3: Project Intelligence UI and Documentation

**Files:**
- Create: `src/components/stagemuse/project-intelligence-panel.tsx`
- Modify: `src/components/stagemuse/workbench.tsx`
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/en-US.json`
- Modify: `README.md`

- [ ] Render a compact creative-view panel for profile fields, project knowledge entries, agent definitions, and recent agent activity.
- [ ] Keep the panel editable only while the project is not locked.
- [ ] Describe the architecture and extension path in the README.
- [ ] Run focused tests, lint, build, then commit and push.
