import { assertEquals, assertThrows } from "@std/assert";
import { initDb } from "./schema.ts";
import { SQLiteSessionRepository } from "./repository.ts";
import { SessionData } from "../types/session.ts";

Deno.test("SQLiteSessionRepository.saveSession is not currently atomic (RED)", () => {
  const db = initDb(":memory:");
  const repository = new SQLiteSessionRepository(db);

  const projectHash = "p1";
  repository.saveProject(projectHash);

  // First, save a message with a specific ID to cause a conflict later
  db.query(
    "INSERT INTO sessions (id, project_id, start_time, last_updated, kind) VALUES (?, ?, ?, ?, ?)",
    ["existing_s", projectHash, "", "", "chat"],
  );
  db.query(
    "INSERT INTO messages (id, session_id, type, content, timestamp) VALUES (?, ?, ?, ?, ?)",
    ["duplicate_m", "existing_s", "user", "original", ""],
  );

  const sessionData: SessionData = {
    metadata: {
      sessionId: "new_s",
      projectHash: projectHash,
      startTime: "2024-01-01T00:00:00Z",
      lastUpdated: "2024-01-01T00:01:00Z",
      kind: "chat",
    },
    messages: [
      {
        id: "m1",
        type: "user",
        content: "fine",
        timestamp: "2024-01-01T00:00:05Z",
      },
      {
        id: "duplicate_m", // This will cause a constraint violation
        type: "user",
        content: "BOOM",
        timestamp: "2024-01-01T00:00:10Z",
      },
    ],
  };

  // This should throw because of the duplicate message ID
  assertThrows(() => {
    repository.saveSession(projectHash, sessionData);
  });

  // VERIFY ATOMICITY:
  // After failure, NO 'new_s' session record should exist
  const sessions = db.query("SELECT id FROM sessions WHERE id = 'new_s'");
  assertEquals(
    sessions.length,
    0,
    "Session record should NOT exist after partial failure (proving atomicity)",
  );

  db.close();
});

Deno.test("SQLiteSessionRepository.withTransaction rolls back multiple operations", () => {
  const db = initDb(":memory:");
  const repository = new SQLiteSessionRepository(db);

  const projectHash = "p1";
  repository.saveProject(projectHash);

  assertThrows(() => {
    repository.withTransaction(() => {
      repository.saveSession(projectHash, {
        metadata: {
          sessionId: "s1",
          projectHash,
          startTime: "",
          lastUpdated: "",
          kind: "chat",
        },
        messages: [],
      });

      repository.saveTokenUsage("s1", 10, 10, 20, 0);

      throw new Error("Manual abort");
    });
  });

  const sessions = db.query("SELECT id FROM sessions WHERE id = 's1'");
  assertEquals(
    sessions.length,
    0,
    "Session should not be saved if transaction aborted",
  );

  const usage = db.query("SELECT * FROM token_usage WHERE session_id = 's1'");
  assertEquals(
    usage.length,
    0,
    "Token usage should not be saved if transaction aborted",
  );

  db.close();
});

Deno.test("SQLiteSessionRepository handles nested transactions (RED)", () => {
  const db = initDb(":memory:");
  const repository = new SQLiteSessionRepository(db);

  const projectHash = "p1";
  repository.saveProject(projectHash);

  // This should NOT throw if we handle nested transactions correctly
  repository.withTransaction(() => {
    repository.saveSession(projectHash, {
      metadata: {
        sessionId: "s1",
        projectHash,
        startTime: "",
        lastUpdated: "",
        kind: "chat",
      },
      messages: [],
    });
  });

  const sessions = db.query("SELECT id FROM sessions WHERE id = 's1'");
  assertEquals(sessions.length, 1);

  db.close();
});
