import { exists, expandGlob } from "@std/fs";
import { join } from "@std/path";
import { AgentType } from "../sync/source.ts";

export interface DiscoveredSource {
  path: string;
  agentType: AgentType;
}

export interface DiscoveryProbe {
  id: string;
  discover(): Promise<DiscoveredSource[]>;
}

export class PathProbe implements DiscoveryProbe {
  constructor(
    public id: string,
    private path: string,
    private agentType: AgentType,
  ) {}

  async discover(): Promise<DiscoveredSource[]> {
    if (await exists(this.path)) {
      return [{
        path: this.path,
        agentType: this.agentType,
      }];
    }
    return [];
  }
}

export class PatternProbe implements DiscoveryProbe {
  constructor(
    public id: string,
    private pattern: string,
    private agentType: AgentType,
  ) {}

  async discover(): Promise<DiscoveredSource[]> {
    const results: DiscoveredSource[] = [];
    // Expand ~ manually if needed or assume expandGlob handles it (it doesn't by default on all systems)
    let pattern = this.pattern;
    if (pattern.startsWith("~/")) {
      pattern = join(Deno.env.get("HOME") || "", pattern.substring(2));
    }

    for await (const entry of expandGlob(pattern)) {
      if (entry.isDirectory) {
        results.push({
          path: entry.path,
          agentType: this.agentType,
        });
      }
    }
    return results;
  }
}
