# Program and Cue Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Preserve programs in project data and import supplied Cue tables as editable execution rows.

**Architecture:** Add Program and program identity fields to the existing snapshot types. Pure project-state helpers infer simple program cards and parse common table text into PlanRow values. The workbench exposes compact project-program and Cue-import panels; AI Cue generation receives program context.

**Tech Stack:** TypeScript, React, Vitest, existing Next.js Agent APIs and i18n.

## Global Constraints

- No new persistence table or third-party parser dependency.
- Imported exact time ranges are preserved.
- Imported rows remain ordinary editable Cue rows and feed existing department/revision logic.
- User-visible copy exists in Chinese and English.

### Task 1: Program and Cue Parsing

**Files:**
- Create: `src/lib/project-state/programs.ts`
- Create: `src/lib/project-state/cue-import.ts`
- Create: `src/lib/project-state/cue-import.test.ts`
- Modify: `src/lib/agents/types.ts`

- [ ] Write a failing test importing the documented Markdown Cue table and asserting exact time, visual, lighting, props, and program assignment.
- [ ] Implement pure heading-based program inference and Markdown/TSV Cue parsing.
- [ ] Add Program plus program identity fields to project/Cue types.
- [ ] Run the focused test.

### Task 2: AI Context and Workbench

**Files:**
- Create: `src/components/stagemuse/program-list-editor.tsx`
- Create: `src/components/stagemuse/cue-importer.tsx`
- Modify: `src/lib/agents/plan-composer.ts`
- Modify: `src/components/stagemuse/workbench.tsx`
- Modify: locale files

- [ ] Pass project programs to Cue generation and preserve identity when returned.
- [ ] Render an editable, inferred program list near project input.
- [ ] Render a paste/import control in execution view and replace V1 with imported Cue data.
- [ ] Run focused tests, lint, build, update README, commit, and push.
