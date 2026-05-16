# ClankerCam Design Summary

ClankerCam is evolving from a single-agent analysis tool (Gemini CLI) into a
comprehensive, agent-agnostic analytics platform.

## Core Design Principles

1. **Agent-Agnosticism:** The system decouples session history parsing from the
   source agent (Gemini, OpenCode, ClaudeCode, etc.).
2. **Source-Based Architecture:** The core abstraction is the `Source`
   interface. Any data-originating location (local directories, remote services)
   is a `Source` that provides a standard `listProjects` and `listSessions`
   interface.
3. **Read-Write Model:** Beyond simple log analysis, the system supports
   persistent user-provided metadata (tags and comments) stored in a local
   SQLite database.
4. **Smart Discovery & Registry:** The application will auto-discover common
   agent log directories, while maintaining a registry that allows users to
   override or manually register custom paths.
5. **Selective Synchronization:** The CLI provides granular control over data
   ingestion, supporting both full-bulk (`sync --all`) and agent-specific
   (`sync --agent=<name>`) operations.

## Architecture

- **Data Flow:** Agents -> Filesystem Logs -> Sync Registry -> SQLite Index ->
  Web Browser UI.
- **Components:**
  - `DiscoveryService`: Probes common system paths for supported agents.
  - `SyncEngine`: orchestrates data ingestion from registered sources into the
    SQLite index.
  - `API`: Exposes the indexed sessions for the web dashboard.
