import { assertEquals } from "@std/assert";
import { DiscoveryService } from "./discovery_service.ts";

Deno.test("DiscoveryService should find directories in standard locations", async () => {
  const testBase = await Deno.makeTempDir();

  const discovery = new DiscoveryService([{
    path: testBase,
    agentType: "gemini",
  }]);
  const discovered = await discovery.discover();

  assertEquals(discovered, [{ path: testBase, agentType: "gemini" }]);
  await Deno.remove(testBase, { recursive: true });
});
