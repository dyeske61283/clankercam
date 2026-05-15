import { SessionData } from "../types/session.ts";

export interface ProjectInfo {
  hash: string;
}

export interface SessionSource {
  listProjects(): AsyncIterable<ProjectInfo>;
  listSessions(projectHash: string): AsyncIterable<SessionData>;
}
