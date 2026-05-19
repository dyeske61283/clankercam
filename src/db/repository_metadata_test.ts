import { assertEquals } from "@std/assert";
import { initDb } from "./schema.ts";
import { SQLiteSessionRepository } from "./repository.ts";

Deno.test("SessionRepository handles metadata persistence", () => {
  const db = initDb(":memory:");
  const repo = new SQLiteSessionRepository(db);

  const sessionId = "test-session";
  const projectHash = "proj";

  repo.saveProject(projectHash);

  repo.saveSession(projectHash, {
    metadata: {
      sessionId,
      projectHash,
      startTime: "2026-05-19",
      lastUpdated: "2026-05-19",
      kind: "test",
    },
    messages: [],
  });

  repo.updateSessionMetadata(sessionId, { tags: ["test"], comment: "hello" });

  const session = repo.getSession(sessionId);
  assertEquals(session.metadata.tags, ["test"]);
  assertEquals(session.metadata.comment, "hello");
});
