# Plan: Implement Registry for Path Discovery and Merging

## Objective

Create a `Registry` that aggregates paths from the `DiscoveryService` and the
`ClankerCamConfig` (manual overrides/configured sources), ensuring unique and
valid paths are merged.

## Key Files & Context

- `src/discovery/discovery_service.ts`: Handles automated path discovery.
- `src/config/loader.ts`: Handles reading `ClankerCamConfig`.
- New file: `src/discovery/registry.ts`: The orchestrator to merge sources.

## Implementation Steps

1. **Define Registry Interface:** Create `src/discovery/registry.ts` to
   coordinate `DiscoveryService` and `loadConfig`.
2. **Implementation:**
   - Inject `DiscoveryService` and path to config file into `Registry`.
   - Implement a `getSources()` method that:
     - Calls `DiscoveryService.discover()`.
     - Calls `loadConfig()`.
     - Merges the results, preferring config-defined sources if conflicts occur
       (or deduplicating).
3. **Testing:**
   - Create `src/discovery/registry_test.ts` to mock `DiscoveryService` and test
     the merging logic.
4. **Integration:** Ensure the rest of the application can consume this
   `Registry`.

## Verification

- Run tests: `deno test src/discovery/registry_test.ts`
- Manual verification of merging logic (e.g., test cases for overlapping paths).
