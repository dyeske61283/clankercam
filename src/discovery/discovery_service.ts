import { exists } from "@std/fs";
import { join } from "@std/path";
import { AgentType } from "../sync/source.ts";

export interface DiscoveredSource {
  path: string;
  agentType: AgentType;
}

const DEFAULT_PROBE_PATHS: DiscoveredSource[] = [
  // Gemini
  {
    path: join(Deno.env.get("HOME") || "", ".gemini/tmp"),
    agentType: "gemini",
  },
  { path: "/tmp/gemini/logs", agentType: "gemini" },

  // Claude Code
  {
    path: join(Deno.env.get("HOME") || "", ".claude/logs"),
    agentType: "claudecode",
  },
  { path: "/tmp/claudecode/logs", agentType: "claudecode" },

  // OpenCode
  {
    path: join(Deno.env.get("HOME") || "", ".local/share/opencode/log"),
    agentType: "opencode",
  },
  { path: "/tmp/opencode/logs", agentType: "opencode" },

  // Codex CLI
  {
    path: join(Deno.env.get("HOME") || "", ".codex/logs"),
    agentType: "generic",
  },
];

export class DiscoveryService {
  constructor(private probePaths: DiscoveredSource[] = DEFAULT_PROBE_PATHS) {}

  async discover(): Promise<DiscoveredSource[]> {
    const discovered: DiscoveredSource[] = [];
    for (const probe of this.probePaths) {
      if (await exists(probe.path)) {
        discovered.push(probe);
      }
    }
    return discovered;
  }
}
