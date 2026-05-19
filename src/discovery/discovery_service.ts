import { join } from "@std/path";
import { DiscoveredSource, DiscoveryProbe, PathProbe } from "./probe.ts";

const DEFAULT_PROBES: DiscoveryProbe[] = [
  new PathProbe(
    "gemini",
    join(Deno.env.get("HOME") || "", ".gemini/tmp"),
    "gemini",
  ),
  new PathProbe(
    "claudecode",
    join(Deno.env.get("HOME") || "", ".claude/logs"),
    "claudecode",
  ),
  new PathProbe(
    "opencode",
    join(Deno.env.get("HOME") || "", ".local/share/opencode/log"),
    "opencode",
  ),
  new PathProbe(
    "codex",
    join(Deno.env.get("HOME") || "", ".codex/logs"),
    "generic",
  ),
];

export class DiscoveryService {
  constructor(private probes: DiscoveryProbe[] = DEFAULT_PROBES) {}

  async discover(): Promise<DiscoveredSource[]> {
    const discovered: DiscoveredSource[] = [];
    for (const probe of this.probes) {
      const results = await probe.discover();
      discovered.push(...results);
    }
    return discovered;
  }
}
