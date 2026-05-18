import { SessionData } from "../types/session.ts";

export type AgentType = "gemini" | "claudecode" | "opencode" | "generic";

export interface ProjectInfo {
  hash: string;
}

export interface Source {
  id: string;
  name: string;
  agentType: AgentType;
  listProjects(): AsyncIterable<ProjectInfo>;
  listSessions(projectHash: string): AsyncIterable<SessionData>;
}

export interface SessionSource extends Source {}
