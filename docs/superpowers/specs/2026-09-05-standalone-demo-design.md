# Xiupu standalone demo design

## Goal

Run Xiupu locally and on an independent host without requiring a host-platform session, UI wrapper, or AI proxy.

## Scope

- Replace the current host-session dependency with an opaque, HTTP-only guest cookie.
- Keep the current API contracts and Agent pipeline stable where possible.
- Route AI calls only through an OpenAI-compatible provider configured by server-side environment variables.
- Remove host-specific UI providers, banners, preview bridge, notifications, and session headers.
- Update example environment variables and deployment configuration.

## Deliberate exclusions

- No email, OAuth, team, or billing system in this iteration.
- No migration of production user data.
- No new collaboration or document-ingestion features.

## Architecture

1. A request without a guest cookie receives a cryptographically random identifier in a secure HTTP-only cookie.
2. Route handlers call a local `requireGuest` helper that returns this identifier. Existing Agent routes use it as their user scope.
3. The client request wrapper stops attaching an external session header and retains only locale metadata.
4. The AI client becomes a server-only OpenAI-compatible adapter. It uses `AI_PROVIDER_BASE_URL`, `AI_PROVIDER_API_KEY`, and `AI_PROVIDER_MODEL`; no fallback proxy is retained.
5. The root layout becomes an ordinary Next.js layout. It keeps i18n and toast UI but removes host wrappers, scripts, and canvas integration.

## Compatibility and safety

- The guest cookie is opaque, HTTP-only, `SameSite=Lax`, and `Secure` outside development.
- It is sufficient for demo isolation, but it is not represented as a formal account or a recovery mechanism.
- Missing AI configuration returns a localized, actionable service-unavailable error and never exposes secrets.
- The local `users` table remains untouched in this iteration; project persistence is a follow-on milestone.

## Acceptance criteria

- `bun run dev` serves the workbench with no host-specific environment variables.
- A configured OpenAI-compatible provider can execute all five Agent routes.
- No package import or runtime code path requires the previous host SDK.
- The UI no longer renders platform branding or requires embedded-host messaging.
- `bun run lint` and `bun run build` pass.

## Follow-on work

Replace guest identity with formal authentication and persist projects, plans, feedback, and versions in PostgreSQL.
