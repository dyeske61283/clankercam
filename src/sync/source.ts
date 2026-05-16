import { SessionData } from "../types/session.ts";

export interface ProjectInfo {
  hash: string;
}

export interface Source {
  id: string;
  name: string;
  listProjects(): AsyncIterable<ProjectInfo>;
  listSessions(projectHash: string): AsyncIterable<SessionData>;
}

export interface SessionSource extends Source {}
