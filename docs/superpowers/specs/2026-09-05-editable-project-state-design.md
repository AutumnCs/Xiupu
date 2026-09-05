# Editable Project State Design

## Goal

Turn the linear local demo into a director-controlled workspace: requirements are editable and lockable; a cue sheet has stable cue IDs and machine-readable timing; later workflow nodes can read the same project state.

## Scope

This iteration is local-only. State remains in the browser for the active session; no file upload, Supabase, collaboration, or LangGraph dependency is added.

## Data model

`ProjectState` is the single client-side aggregate. It owns `requirements`, `creativeBrief`, `cueSheet`, `changeSet`, and `versions`.

Requirements become `RequirementItem { id, text, tone, locked }`. Locked items are passed into generation as non-negotiable constraints. Directors may add, edit, delete, lock, or unlock items before asking AI to regenerate directions or a plan.

`Cue` replaces the display-only row model as `Cue { id, startSeconds, durationSeconds, music, speech, people, formationNote, visual, lighting, props, actors, blocking, camera, notes }`. UI timecode remains derived from start and duration. Existing API payloads stay backward-compatible while accepting extended cue data.

## Interaction

Each requirement group shows inline editing controls and a lock toggle. A modification marks downstream content stale; the workspace offers a contextual regeneration choice: directions only, cue sheet only, or both. Existing content stays visible until a new result is confirmed.

The UI will initially expose manual cue editing and stable IDs. Dependency propagation, department deliverables, version branches, persistence, and document ingestion are follow-up work.

## Agent evolution

Current route handlers remain deterministic service calls. Later, each service maps to a graph node consuming and returning `ProjectState`; human confirmation boundaries become graph interrupts only after persistent storage is introduced.

## Verification

Unit tests cover requirement item creation and locking plus Cue time derivation. Existing Agent tests, lint, and production build must pass.
