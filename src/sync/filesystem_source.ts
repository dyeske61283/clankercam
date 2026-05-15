import { join } from "https://deno.land/std/path/mod.ts";
import { SessionData } from "../types/session.ts";
import { parseSessionFile } from "../parser/session_parser.ts";
import { ProjectInfo, SessionSource } from "./source.ts";

export class FileSystemSessionSource implements SessionSource {
  constructor(private geminiTmpDir: string) {}

  async *listProjects(): AsyncIterable<ProjectInfo> {
    for await (const entry of Deno.readDir(this.geminiTmpDir)) {
      if (entry.isDirectory) {
        yield { hash: entry.name };
      }
    }
  }

  async *listSessions(projectHash: string): AsyncIterable<SessionData> {
    const projectPath = join(this.geminiTmpDir, projectHash);
    const chatsPath = join(projectPath, "chats");

    try {
      const stats = await Deno.stat(chatsPath);
      if (!stats.isDirectory) return;
    } catch {
      return;
    }

    for await (const entry of Deno.readDir(chatsPath)) {
      if (entry.isFile && (entry.name.endsWith(".jsonl") || entry.name.endsWith(".json"))) {
        const filePath = join(chatsPath, entry.name);
        const session = await parseSessionFile(filePath);
        if (session) {
          yield session;
        }
      }
    }
  }
}
