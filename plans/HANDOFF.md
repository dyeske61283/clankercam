# Handoff: ClankerCam Multi-Agent Refactor

## Current State

- The project is currently a functional, single-agent (Gemini) analytics tool.
- We have established a design for a multi-agent, source-agnostic architecture.
- `CONTEXT.md` reflects the updated terminology and architectural goals.

## Implementation Roadmap

### 1. Refactor Discovery Service

- Implement `src/sync/discovery.ts`.
- Define standard paths for Gemini, OpenCode, and ClaudeCode.
- Implement logic to probe these paths and return valid
  `FileSystemSessionSource` instances.

### 2. Implement Registry

- Create a configuration mechanism (e.g., `~/.clankercam/config.json`) to store
  user-defined overrides for agent paths.
- Update `main.ts` to load this config and combine it with auto-discovered
  paths.

### 3. Update Sync Engine

- Refactor `syncSessions` to accept a list of `SessionSource` objects instead of
  a single instance.
- Update `main.ts` CLI parsing:
  - `sync --all`: Iterate over all discovered/registered sources.
  - `sync --agent=<name>`: Filter sources by name/type before sync.

### 4. Persistence (Tags/Comments)

- Extend `src/db/schema.ts` to include `tags` and `comments` tables linked by a
  unique session ID.
- Provide API endpoints in `src/api/server.ts` to allow the frontend to POST
  tags/comments.

## Known Challenges

- **Agent Log Format Heterogeneity:** Different agents use different log
  formats. You will likely need a `ParserRegistry` to map agents to their
  specific parsers (e.g., `GeminiParser`, `ClaudeParser`).
- **SQLite Schema Migration:** As the system grows, ensure the SQLite schema
  remains extensible.
