import { assertEquals } from "@std/assert";
import { DiscoveryService } from "./discovery_service.ts";
import { join } from "@std/path";

Deno.test("DiscoveryService should find directories in standard locations", async () => {
  const testBase = await Deno.makeTempDir();
  const agentLogs = join(testBase, ".gemini-agent-logs");
  await Deno.mkdir(agentLogs);

  const discovery = new DiscoveryService([testBase]);
  const discovered = await discovery.discover();

  assertEquals(discovered, [agentLogs]);
  await Deno.remove(testBase, { recursive: true });
});
