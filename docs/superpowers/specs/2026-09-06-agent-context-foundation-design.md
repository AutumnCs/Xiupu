# Agent Context Foundation Design

## Goal

Turn the existing sequential AI endpoints into an explicit, inspectable agent workflow without introducing a separate orchestration runtime or autonomous group chat.

## Scope

- Register the current domain agents with their responsibility, inputs, outputs, and dependencies.
- Preserve a bounded list of agent-run records in each project snapshot.
- Derive a project knowledge view from project materials, structured requirements, protected Cue state, and creator preferences.
- Add a locally persisted creator preference profile and include it in project context sent to generation agents.
- Show the agent map, usable knowledge, recent activity, and editable preferences in the creative workspace.

## Decisions

- The first version stays within the existing Next.js request lifecycle. An Agent is a typed, independently replaceable domain node; it is not an autonomous chat participant.
- Project knowledge is source-based and deterministic in this version. Existing project fields and imported materials are passed as context; embeddings and semantic retrieval are deferred until documents grow beyond the single-project demo scope.
- Creator preference is explicitly editable, local-browser scoped, and advisory. It never overrides current project requirements or locked Cue data.
- Agent runs record metadata only: agent id, input-source labels, timestamp, duration, outcome, and fallback status. Prompts, private documents, and model raw outputs are not stored in the trace.

## Data Flow

```text
creator profile + project materials + confirmed project state
  → derived knowledge entries
  → typed agent input
  → agent output
  → bounded trace entry + project snapshot
```

The creative director receives project context in addition to structured requirements. Performance and Cue agents receive the profile and supporting materials through the existing ProjectBrief object.

## Out of Scope

- New database tables, embeddings, vector search, external knowledge sources, and autonomous agent handoffs.
- Team permissions, long-lived background jobs, and model-specific routing.
