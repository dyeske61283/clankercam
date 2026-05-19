import { assertEquals } from "@std/assert";
import { DB } from "@sqlite";
import { SQLiteSessionRepository } from "../db/repository.ts";
import { exportSessions } from "./export_cmd.ts";
import { SessionData } from "../types/session.ts";

Deno.test("exportSessions fetches sessions and writes to file", async () => {
  const db = new DB(":memory:");
  // Set up schema (simplified for test)
  db.execute(`
    CREATE TABLE projects (id TEXT PRIMARY KEY, path TEXT);
    CREATE TABLE sessions (id TEXT PRIMARY KEY, project_id TEXT, start_time TEXT, last_updated TEXT, kind TEXT, metadata TEXT);
    CREATE TABLE messages (id TEXT PRIMARY KEY, session_id TEXT, type TEXT, content TEXT, timestamp TEXT);
    CREATE TABLE tool_calls (id TEXT PRIMARY KEY, message_id TEXT, name TEXT, args TEXT, status TEXT, timestamp TEXT);
    CREATE TABLE token_usage (session_id TEXT, input_tokens INTEGER, output_tokens INTEGER, total_tokens INTEGER, cache_tokens INTEGER);
  `);

  const repo = new SQLiteSessionRepository(db);
  repo.saveProject("test-project");
  const session: SessionData = {
    metadata: {
      sessionId: "s1",
      projectHash: "test-project",
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      kind: "test",
    },
    messages: [],
  };
  repo.saveSession("test-project", session);

  const outputPath = "test-export.json";

  try {
    await exportSessions(repo, "test-project", outputPath);

    const fileInfo = await Deno.stat(outputPath);
    assertEquals(fileInfo.isFile, true);

    const content = await Deno.readTextFile(outputPath);
    const decoded = JSON.parse(content);
    assertEquals(decoded.version, "1.0");
    assertEquals(decoded.sessions.length, 1);
    assertEquals(decoded.sessions[0].metadata.sessionId, "s1");
  } finally {
    try {
      await Deno.remove(outputPath);
    } catch (_e) {
      // ignore
    }
    db.close();
  }
});
