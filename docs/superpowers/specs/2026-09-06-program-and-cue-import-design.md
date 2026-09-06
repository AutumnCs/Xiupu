# Program and Cue Import Design

## Goal

Allow a multi-part performance brief to retain its individual programs and allow a supplied Cue table to become editable, time-accurate execution data.

## Scope

- Add a lightweight Program object within ProjectBrief.
- Infer editable programs from heading-based program material such as the Four Seasons example.
- Carry program and chapter identity onto generated Cue rows.
- Import a Markdown pipe table or tab-separated copied table into a PlanSnapshot.

## Decisions

- Programs remain embedded in the project snapshot in this phase; no new database table is introduced.
- Cue import is deterministic and preserves supplied time ranges rather than asking AI to reinterpret them.
- Program matching is best-effort using program title/type and source material; unmatched Cue rows remain editable and are flagged as unassigned.
- This work does not add music-file parsing, spreadsheet file import, or multi-project planning.
