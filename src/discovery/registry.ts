import { DiscoveredSource, DiscoveryService } from "./discovery_service.ts";
import * as configLoader from "../config/loader.ts";

export class Registry {
  constructor(
    private discoveryService: DiscoveryService,
    private loader: typeof configLoader,
    private configPath: string,
  ) {}

  async getSources(): Promise<DiscoveredSource[]> {
    const discovered = await this.discoveryService.discover();
    const config = await this.loader.loadConfig(this.configPath);

    const configSources: DiscoveredSource[] = config.sources.map((s) => ({
      path: s.path,
      agentType: s.agentType || "gemini",
    }));

    // Merge and unique by path
    const merged = new Map<string, DiscoveredSource>();
    for (const source of [...discovered, ...configSources]) {
      merged.set(source.path, source);
    }

    return Array.from(merged.values());
  }
}
