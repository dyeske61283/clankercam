import { SessionData } from "../types/session.ts";

export interface Parser {
  parse(filePath: string): Promise<SessionData | null>;
}
