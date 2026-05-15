# Context: ClankerCam

Analyzing and browsing Gemini CLI session history to understand usage patterns.

## Glossary

### Session
A single continuous interaction with the Gemini CLI, represented by a `.jsonl` history file found in project-specific directories under `~/.gemini/tmp/`. Each line in the file is a JSON object representing session metadata or a message exchange.

### Tool Call
An execution of a specific tool (e.g., `read_file`, `grep_search`) by the agent during a session.

### Token Usage
The number of tokens consumed during a session, typically categorized into input tokens (prompt) and output tokens (completion).

### Project
A logical grouping of sessions, usually corresponding to a specific directory where the Gemini CLI was invoked. In the filesystem, this is represented by a subdirectory under `~/.gemini/tmp/`.

### Analytics
Aggregated data derived from sessions. This includes:
- **Session-level metrics:** Tool frequency, token counts, and duration.
- **Aggregated metrics:** Global totals and averages, as well as breakdowns by Project.

### Browser
A web-based dashboard used to navigate through Projects and Sessions. It provides a visual interface for:
- **Global Overview:** High-level analytics across all sessions.
- **Project Navigation:** Browsing sessions grouped by their source directory.
- **Session Inspector:** A detailed, formatted view of messages and tool calls within a single session.

## Architecture

- **Runtime:** Deno
- **Backend:** Hono (Fast, lightweight web framework)
- **Frontend:** Vanilla TypeScript, CSS (No build step)
- **Data Source:** Raw `.jsonl` history files from `~/.gemini/tmp/`
- **Persistence:** SQLite (For indexing sessions, tool calls, and enabling fast search/aggregation)
