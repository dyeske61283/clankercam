import { AgentType } from "../sync/source.ts";

export interface AgentSourceConfig {
  id: string;
  name: string;
  type: "filesystem" | "custom";
  agentType?: AgentType;
  path: string;
}

export interface ClankerCamConfig {
  sources: AgentSourceConfig[];
  probePaths?: string[];
}
