import { Session } from "../domain/session.ts";

export type AgentType =
  | "gemini"
  | "claudecode"
  | "opencode"
  | "codex"
  | "generic";

export interface ProjectInfo {
  hash: string;
}

export interface Source {
  id: string;
  name: string;
  agentType: AgentType;
  listProjects(): AsyncIterable<ProjectInfo>;
  listSessions(projectHash: string): AsyncIterable<Session>;
}

export interface SessionSource extends Source {}
