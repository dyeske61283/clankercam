import { assertEquals } from "@std/assert";
import { initDb } from "../db/schema.ts";
import { syncSessions } from "./engine.ts";
import { SessionData } from "../types/session.ts";
import { ProjectInfo, SessionSource } from "./source.ts";

class MockSessionSource implements SessionSource {
  projects: ProjectInfo[] = [];
  sessions: Record<string, SessionData[]> = {};

  async *listProjects(): AsyncIterable<ProjectInfo> {
    for (const project of this.projects) {
      yield project;
    }
  }

  async *listSessions(projectHash: string): AsyncIterable<SessionData> {
    const projectSessions = this.sessions[projectHash] || [];
    for (const session of projectSessions) {
      yield session;
    }
  }
}

Deno.test("syncSessions persists data from SessionSource to DB", async () => {
  const db = initDb(":memory:");
  try {
    const source = new MockSessionSource();
    source.projects = [{ hash: "p1" }];
    source.sessions["p1"] = [
      {
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
            tokenUsage: { input: 10, output: 5, total: 15 },
          },
        ],
      },
    ];

    await syncSessions(db, source);

    const projects = db.query("SELECT id FROM projects");
    assertEquals(projects, [["p1"]]);

    const sessions = db.query("SELECT id, project_id FROM sessions");
    assertEquals(sessions, [["s1", "p1"]]);

    const messages = db.query("SELECT id, session_id, content FROM messages");
    assertEquals(messages, [["m1", "s1", "hello"]]);

    const usage = db.query(
      "SELECT input_tokens, output_tokens FROM token_usage",
    );
    assertEquals(usage, [[10, 5]]);
  } finally {
    db.close();
  }
});
