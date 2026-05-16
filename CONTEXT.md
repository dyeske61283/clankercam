# Context: ClankerCam

Analyzing and browsing AI coding agent session history to understand usage
patterns and facilitate team learning.

## Glossary

### Session

A single continuous interaction with an AI coding agent, represented by a
history file (e.g., `.jsonl`). Each interaction contains metadata, user prompts,
and agent responses.

### Source

An abstraction for any location or service where Session data originates (e.g.,
local filesystem, remote cloud storage, or third-party agent tool directories).

### Agent Tool

Any CLI or software that generates session logs, such as Gemini CLI, OpenCode,
or ClaudeCode.

### Tool Call

An execution of a specific command or function by the agent during a session.

### Token Usage

The number of tokens consumed during a session, categorized by input and output.

### Project

A logical grouping of sessions, usually corresponding to a specific directory
where an Agent Tool was invoked.

### Analytics

Aggregated data derived from sessions.

### Browser

A web-based dashboard used to navigate through Projects and Sessions.

## Architecture

- **Runtime:** Deno
- **Backend:** Hono (Fast, lightweight web framework)
- **Frontend:** Vanilla TypeScript, CSS (No build step)
- **Data Source:** Abstracted via the 'Source' interface, supporting multiple
  Agent Tools via a DiscoveryService.
- **Persistence:** SQLite (Used for indexing, caching metadata, and storing
  user-provided tags and comments).
- **Data Portability:** CLI-based export/import primitives allow for
  transporting normalized session data across distributed environments.
- **Read-Write Model:** The system supports both reading raw logs and writing
  user-specific metadata (tags/comments) to a local SQLite database.
- **Collision Strategy:** Fingerprinting (Agent+Source+Timestamp+Hash) is used
  for reliable duplicate detection.
