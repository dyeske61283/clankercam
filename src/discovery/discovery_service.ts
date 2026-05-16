import { exists } from "@std/fs";
import { join } from "@std/path";

const DEFAULT_PROBE_PATHS = [
  // Existing
  "/tmp/gemini/logs",
  "/tmp/opencode/logs",
  "/tmp/claudecode/logs",
  join(Deno.env.get("HOME") || "", ".gemini/tmp"),

  // Claude Code
  join(Deno.env.get("HOME") || "", ".claude/logs"),

  // OpenCode
  join(Deno.env.get("HOME") || "", ".local/share/opencode/log"),

  // Roo Code (VS Code logs)
  join(Deno.env.get("HOME") || "", "Library/Application Support/Code/logs"), // macOS
  join(Deno.env.get("HOME") || "", ".config/Code/logs"), // Linux

  // Codex CLI
  join(Deno.env.get("HOME") || "", ".codex/logs"),
];

export class DiscoveryService {
  constructor(private searchPaths: string[] = DEFAULT_PROBE_PATHS) {}

  async discover(): Promise<string[]> {
    const discovered: string[] = [];
    for (const path of this.searchPaths) {
      const logsPath = path;
      if (await exists(logsPath)) {
        discovered.push(logsPath);
      }
    }
    return discovered;
  }
}
