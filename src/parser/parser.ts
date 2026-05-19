import { Session } from "../domain/session.ts";

export interface Parser {
  parse(filePath: string): Promise<Session | null>;
}
