import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { initDb } from "./schema.ts";
import { SQLiteSessionRepository } from "./repository.ts";

Deno.test("SessionRepository handles data persistence and retrieval", () => {
  const db = initDb(":memory:");
  const repo = new SQLiteSessionRepository(db);

  repo.saveProject("p1");
  repo.saveSession("p1", {
    metadata: {
      sessionId: "s1",
      projectHash: "p1",
      startTime: "2024-01-01T00:00:00Z",
      lastUpdated: "2024-01-01T00:01:00Z",
      kind: "chat"
    },
    messages: [
      {
        id: "m1",
        type: "user",
        content: "hello",
        timestamp: "2024-01-01T00:00:05Z",
        tokenUsage: { input: 5, output: 5, total: 10 }

      }
    ]
  });
  repo.saveTokenUsage("s1", 5, 5, 10);

  const projects = repo.getAllProjects();
  assertEquals(projects.length, 1);
  assertEquals(projects[0].id, "p1");

  const stats = repo.getGlobalStats();
  assertEquals(stats.totalSessions, 1);
  assertEquals(stats.totalTokens, 10);

  const sessions = repo.getProjectSessions("p1");
  assertEquals(sessions.length, 1);
  assertEquals(sessions[0].id, "s1");

  const session = repo.getSession("s1");
  assertEquals(session.messages.length, 1);
  assertEquals(session.messages[0].content, "hello");

  db.close();
});
