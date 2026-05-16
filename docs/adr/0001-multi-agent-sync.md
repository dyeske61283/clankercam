# ADR 0001: Multi-Agent Synchronization and Data Portability

## Status

Proposed

## Context

ClankerCam is evolving from a single-agent analysis tool into a multi-agent,
collaborative analytics platform. To support team-wide usage, we need a robust
system for collecting, normalizing, and sharing agent session logs across
distributed environments.

## Decisions

### 1. Source-Based Abstraction

- The system will use a `SessionSource` interface to abstract where logs
  originate.
- Implementation will include a `DiscoveryService` to auto-detect common agent
  paths, with support for user-provided manual overrides via a registry.

### 2. Export/Import Primitives

- To ensure transport-agnostic portability, the CLI will provide `export` and
  `import` primitives.
- `export` bundles session data and user metadata into a portable archive.
- `import` merges archive data into the local SQLite database.

### 3. Normalization and Identity

- Data will be normalized to a standard `SessionData` format during export to
  ensure consistency across different agent tools (Gemini, OpenCode, ClaudeCode,
  etc.).
- A `SessionFingerprint` (composite of `agentName`, `sourceId`, `startTime`, and
  a content hash) will be used to reliably detect and merge duplicate sessions
  during import.

### 4. Collision Strategy

- Upon detecting a fingerprint collision during import, the system will default
  to preserving the most recent record, with plans to implement versioning or
  user-configurable merge policies in future versions.

## Consequences

- **Positive:** Enables decentralized data collection and multi-agent support.
- **Negative:** Increased complexity in the ingestion layer due to normalization
  needs.
- **Next Steps:** Implement `DiscoveryService`, update `sync` CLI, and develop
  the archive export/import logic.
