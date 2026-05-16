import { assertEquals } from "@std/assert";
import { Registry } from "./registry.ts";
import { DiscoveryService } from "./discovery_service.ts";
import * as configLoader from "../config/loader.ts";

Deno.test("Registry should load and merge paths from DiscoveryService and config", async () => {
  const discoveryService = {
    discover: () => Promise.resolve(["/path/a"]),
  };
  const mockConfigLoader = {
    loadConfig: (_path: string) =>
      Promise.resolve({
        sources: [{ id: "b", name: "b", type: "filesystem", path: "/path/b" }],
      }),
  };

  const registry = new Registry(
    discoveryService as unknown as DiscoveryService,
    mockConfigLoader as unknown as typeof configLoader,
    "configPath",
  );
  const sources = await registry.getSources();

  assertEquals(sources, ["/path/a", "/path/b"]);
});
