# Implementation Plan - Improve --agent Flag Validation and Help

## Objective

Enhance the `--agent` flag for the `sync` command to provide clear help text and
validate user input against supported agent types.

## Key Files & Context

- `main.ts`: Contains the CLI argument parsing and `sync` command logic.
- `src/sync/source.ts`: Defines `AgentType` which holds the valid values.

## Implementation Steps

1. **Import `AgentType`**: Import `AgentType` in `main.ts` to use it for
   validation.
2. **Implement Validation**: In `main.ts`, check if `agentFilter` is a valid
   `AgentType`. If not, print an error message, list supported agents, and exit.
3. **Update Help Text**: Update the usage information in `main.ts` to include
   information about the `--agent` flag and supported values.

## Verification & Testing

- Run `deno run --allow-all main.ts sync --agent=invalid-agent` and verify it
  fails with a clear message and lists valid agents.
- Run `deno run --allow-all main.ts sync --agent=gemini` and verify it works as
  expected.
- Check the help output by running `deno run --allow-all main.ts` (without
  arguments) to ensure it mentions the `--agent` flag.
