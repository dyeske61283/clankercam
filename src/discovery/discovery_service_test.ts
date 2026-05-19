import { assertEquals } from "@std/assert";
import { DiscoveryService } from "./discovery_service.ts";
import { PathProbe } from "./probe.ts";

Deno.test("DiscoveryService aggregates results from multiple probes", async () => {
  const dir1 = await Deno.makeTempDir();
  const dir2 = await Deno.makeTempDir();
  try {
    const discovery = new DiscoveryService([
      new PathProbe("probe1", dir1, "gemini"),
      new PathProbe("probe2", dir2, "claudecode"),
    ]);
    const discovered = await discovery.discover();

    assertEquals(discovered.length, 2);
    assertEquals(discovered.find((d) => d.path === dir1)?.agentType, "gemini");
    assertEquals(
      discovered.find((d) => d.path === dir2)?.agentType,
      "claudecode",
    );
  } finally {
    await Deno.remove(dir1);
    await Deno.remove(dir2);
  }
});
