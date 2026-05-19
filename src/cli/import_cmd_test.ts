import { assertEquals } from "@std/assert";
import { SQLiteSessionRepository } from "../db/repository.ts";
import { initDb } from "../db/schema.ts";
import { importSessions } from "./import_cmd.ts";
import { ArchiveService } from "../domain/export.ts";
import { SessionData } from "../types/session.ts";

Deno.test("importSessions should import sessions from a file", async () => {
  const dbPath = ":memory:";
  const db = initDb(dbPath);
  const repository = new SQLiteSessionRepository(db);

  const sessions: SessionData[] = [
    {
      metadata: {
        sessionId: "session-1",
        projectHash: "project-1",
        startTime: "2023-01-01T00:00:00Z",
        lastUpdated: "2023-01-01T01:00:00Z",
        kind: "gemini",
      },
      messages: [
        {
          id: "msg-1",
          timestamp: "2023-01-01T00:00:00Z",
          type: "user",
          content: "Hello",
        },
      ],
    },
  ];

  const bundle = ArchiveService.bundle(sessions);
  const tempFile = await Deno.makeTempFile();
  await Deno.writeTextFile(tempFile, bundle);

  try {
    await importSessions(tempFile, repository);

    const projects = repository.getAllProjects();
    assertEquals(projects.length, 1);
    assertEquals(projects[0].id, "project-1");

    const session = repository.getSession("session-1");
    assertEquals(session.sessionId, "session-1");
    assertEquals(session.messages.length, 1);
  } finally {
    await Deno.remove(tempFile);
    db.close();
  }
});

Deno.test("importSessions should handle collisions", async () => {
  const dbPath = ":memory:";
  const db = initDb(dbPath);
  const repository = new SQLiteSessionRepository(db);

  const sessions: SessionData[] = [
    {
      metadata: {
        sessionId: "session-1",
        projectHash: "project-1",
        startTime: "2023-01-01T00:00:00Z",
        lastUpdated: "2023-01-01T01:00:00Z",
        kind: "gemini",
      },
      messages: [
        {
          id: "msg-1",
          timestamp: "2023-01-01T00:00:00Z",
          type: "user",
          content: "Hello",
        },
      ],
    },
  ];

  repository.saveProject("project-1");
  repository.saveSession("project-1", sessions[0]);

  const bundle = ArchiveService.bundle(sessions);
  const tempFile = await Deno.makeTempFile();
  await Deno.writeTextFile(tempFile, bundle);

  try {
    // Should not throw and should handle gracefully
    await importSessions(tempFile, repository);

    const session = repository.getSession("session-1");
    assertEquals(session.sessionId, "session-1");
  } finally {
    await Deno.remove(tempFile);
    db.close();
  }
});
