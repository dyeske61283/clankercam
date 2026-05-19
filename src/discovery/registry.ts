import { DiscoveryService } from "./discovery_service.ts";
import { DiscoveredSource, PathProbe, PatternProbe } from "./probe.ts";
import * as configLoader from "../config/loader.ts";

export class Registry {
  constructor(
    private discoveryService: DiscoveryService,
    private loader: typeof configLoader,
    private configPath: string,
  ) {}

  async getSources(): Promise<DiscoveredSource[]> {
    const config = await this.loader.loadConfig(this.configPath);
    const discovered = await this.discoveryService.discover();

    const configProbeResults: DiscoveredSource[] = [];
    if (config.probes) {
      for (const probeConfig of config.probes) {
        const probe = probeConfig.type === "path"
          ? new PathProbe(
            probeConfig.id,
            probeConfig.path,
            probeConfig.agentType,
          )
          : new PatternProbe(
            probeConfig.id,
            probeConfig.path,
            probeConfig.agentType,
          );
        configProbeResults.push(...await probe.discover());
      }
    }

    const configSources: DiscoveredSource[] = config.sources.map((s) => ({
      path: s.path,
      agentType: s.agentType || "gemini",
    }));

    // Merge and unique by path
    const merged = new Map<string, DiscoveredSource>();
    for (
      const source of [
        ...discovered,
        ...configProbeResults,
        ...configSources,
      ]
    ) {
      merged.set(source.path, source);
    }

    return Array.from(merged.values());
  }
}
