import { join } from "@std/path";
import { SessionData } from "../types/session.ts";
import { parseSessionFile } from "../parser/session_parser.ts";
import { AgentType, ProjectInfo, SessionSource } from "./source.ts";

export class FileSystemSessionSource implements SessionSource {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly agentType: AgentType,
    private readonly rootDir: string,
    private readonly sessionSubdir: string = "chats",
  ) {}

  async *listProjects(): AsyncIterable<ProjectInfo> {
    for await (const entry of Deno.readDir(this.rootDir)) {
      if (entry.isDirectory) {
        yield { hash: entry.name };
      }
    }
  }

  async *listSessions(projectHash: string): AsyncIterable<SessionData> {
    const projectPath = join(this.rootDir, projectHash);
    const chatsPath = join(projectPath, this.sessionSubdir);

    try {
      const stats = await Deno.stat(chatsPath);
      if (!stats.isDirectory) return;
    } catch {
      return;
    }

    for await (const entry of Deno.readDir(chatsPath)) {
      if (
        entry.isFile &&
        (entry.name.endsWith(".jsonl") || entry.name.endsWith(".json"))
      ) {
        const filePath = join(chatsPath, entry.name);
        const session = await parseSessionFile(filePath);
        if (session) {
          yield session;
        }
      }
    }
  }
}
