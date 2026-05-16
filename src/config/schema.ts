export interface AgentSourceConfig {
  id: string;
  name: string;
  type: "filesystem" | "custom";
  path: string;
}

export interface ClankerCamConfig {
  sources: AgentSourceConfig[];
  probePaths?: string[];
}
