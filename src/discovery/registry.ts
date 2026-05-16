import { DiscoveryService } from "./discovery_service.ts";
import * as configLoader from "../config/loader.ts";

export class Registry {
  constructor(
    private discoveryService: DiscoveryService,
    private loader: typeof configLoader,
    private configPath: string,
  ) {}

  async getSources(): Promise<string[]> {
    const discovered = await this.discoveryService.discover();
    const config = await this.loader.loadConfig(this.configPath);
    const configPaths = config.sources.map((s) => s.path);

    // Merge and unique
    return Array.from(new Set([...discovered, ...configPaths]));
  }
}
