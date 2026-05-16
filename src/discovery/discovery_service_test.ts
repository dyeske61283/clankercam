import { assertEquals } from "@std/assert";
import { DiscoveryService } from "./discovery_service.ts";

Deno.test("DiscoveryService should find directories in standard locations", async () => {
  const testBase = await Deno.makeTempDir();

  const discovery = new DiscoveryService([testBase]);
  const discovered = await discovery.discover();

  assertEquals(discovered, [testBase]);
  await Deno.remove(testBase, { recursive: true });
});
