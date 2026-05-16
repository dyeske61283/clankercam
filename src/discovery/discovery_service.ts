import { exists } from "@std/fs";
import { join } from "@std/path";

const DEFAULT_PROBE_PATHS = [
  "/tmp/gemini/logs",
  "/tmp/opencode/logs",
  "/tmp/claudecode/logs",
];

export class DiscoveryService {
  constructor(private searchPaths: string[] = DEFAULT_PROBE_PATHS) {}

  async discover(): Promise<string[]> {
    const discovered: string[] = [];
    for (const path of this.searchPaths) {
      const logsPath = join(path, ".gemini-agent-logs");
      if (await exists(logsPath)) {
        discovered.push(logsPath);
      }
    }
    return discovered;
  }
}
