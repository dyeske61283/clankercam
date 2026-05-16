# Plan: ClankerCam Multi-Agent Refactor

## Epic 1: Discovery & Registry

- **Goal:** Enable the system to auto-discover agent logs and allow user manual
  overrides.
- **Tasks:**
  1. Define `Source` and `SessionSource` interfaces.
  2. Implement `DiscoveryService` to probe common paths for Gemini, OpenCode,
     and ClaudeCode.
  3. Create configuration schema for `~/.clankercam/config.json`.
  4. Implement `Registry` to load and merge auto-discovered and manual source
     paths.

## Epic 2: Multi-Agent Sync Engine

- **Goal:** Update synchronization to handle multiple sources and agent types.
- **Dependencies:** Requires Epic 1.
- **Tasks:**
  1. Refactor `SyncEngine` to accept a list of `SessionSource` instances.
  2. Implement `ParserRegistry` to handle heterogeneity of agent log formats.
  3. Update CLI `main.ts` to support `sync --all` and `sync --agent=<name>`.

## Epic 3: Persistence & Metadata

- **Goal:** Enable user-defined metadata (tags/comments) on sessions.
- **Dependencies:** Requires Sync Engine (to have stable session IDs).
- **Tasks:**
  1. Update `src/db/schema.ts` for tags/comments.
  2. Create API endpoints for tagging/commenting.
  3. Ensure UI integration works with the new data model.

## Epic 4: Export/Import Primitives

- **Goal:** Enable data portability between environments (ADR 0001).
- **Dependencies:** Requires stable `SessionData` format.
- **Tasks:**
  1. Define `SessionData` standard export schema.
  2. Implement `export` command (bundle data + metadata).
  3. Implement `import` command (merge data, resolve collisions via
     fingerprint).
