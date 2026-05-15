# ClankerCam

ClankerCam is a tool for synchronizing and analyzing sessions from the Gemini CLI.

## Development

### Prerequisites
- [Deno](https://deno.land/) installed.

### Commands
- `deno task test`: Run all tests.
- `deno task lint`: Lint the codebase.
- `deno task fmt`: Format the codebase.

## Architecture
This project follows a modular architecture:
- `src/domain/`: Rich domain models.
- `src/db/`: Persistence layer.
- `src/sync/`: Synchronization engine and source adapters.
