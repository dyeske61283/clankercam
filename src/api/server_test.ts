import { assertEquals } from "@std/assert";
import { createApi } from "./server.ts";
import { initDb } from "../db/schema.ts";
import { SQLiteSessionRepository } from "../db/repository.ts";

Deno.test("API returns correctly formatted JSON", async () => {
  const db = initDb(":memory:");
  const repo = new SQLiteSessionRepository(db);
  const app = createApi(db);

  // Add some data
  repo.saveProject("p1");
  repo.saveSession("p1", {
    metadata: {
      sessionId: "s1",
      projectHash: "p1",
      startTime: "2024-01-01T00:00:00Z",
      lastUpdated: "2024-01-01T00:01:00Z",
      kind: "chat",
    },
    messages: [
      {
        id: "m1",
        type: "user",
        content: "hello",
        timestamp: "2024-01-01T00:00:05Z",
        toolCalls: [
          { id: "tc1", name: "test_tool", args: { a: 1 }, status: "success" },
        ],
      },
    ],
  });
  repo.saveTokenUsage("s1", 5, 5, 10, 0);

  // Test /api/stats/global
  const resStats = await app.request("/api/stats/global");
  const stats = await resStats.json();
  console.log("Global stats response sample:", stats);
  assertEquals(stats.totalSessions, 1);
  assertEquals(stats.totalToolCalls, 1);
  assertEquals(stats.totalTokens, 10);

  // Test /api/projects
  const resProjects = await app.request("/api/projects");
  const projects = await resProjects.json();
  assertEquals(projects.length, 1);
  assertEquals(typeof projects[0].sessionCount, "number");
  assertEquals(projects[0].sessionCount, 1);

  // Test /api/projects/:id/sessions
  const resSessions = await app.request("/api/projects/p1/sessions");
  const sessions = await resSessions.json();
  assertEquals(sessions.length, 1);
  assertEquals(typeof sessions[0].messageCount, "number");
  assertEquals(typeof sessions[0].toolCallCount, "number");
  assertEquals(sessions[0].messageCount, 1);
  assertEquals(sessions[0].toolCallCount, 1);

  db.close();
});
