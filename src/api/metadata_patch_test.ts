import { assertEquals } from "@std/assert";
import { createApi } from "./server.ts";
import { initDb } from "../db/schema.ts";
import { SQLiteSessionRepository } from "../db/repository.ts";

Deno.test("PATCH /api/sessions/:id/metadata updates session metadata", async () => {
  const db = initDb(":memory:");
  const app = createApi(db);

  const repo = new SQLiteSessionRepository(db);
  const sessionId = "test-session";
  const projectHash = "test-project";

  // Create project first
  db.query("INSERT INTO projects (id, path) VALUES (?, ?)", [
    projectHash,
    "test/path",
  ]);

  repo.saveSession(projectHash, {
    metadata: {
      sessionId,
      projectHash,
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      kind: "test",
      tags: [],
      comment: "",
    },
    messages: [],
  });

  const patchRes = await app.request(`/api/sessions/${sessionId}/metadata`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tags: ["tag1", "tag2"],
      comment: "New comment",
    }),
  });
  assertEquals(patchRes.status, 200);

  const getRes = await app.request(`/api/sessions/${sessionId}`);
  const data = await getRes.json();
  assertEquals(data.metadata.tags, ["tag1", "tag2"]);
  assertEquals(data.metadata.comment, "New comment");
});

Deno.test("PATCH /api/sessions/:id/metadata handles partial updates", async () => {
  const db = initDb(":memory:");
  const app = createApi(db);

  const repo = new SQLiteSessionRepository(db);
  const sessionId = "test-session";
  const projectHash = "test-project";

  db.query("INSERT INTO projects (id, path) VALUES (?, ?)", [
    projectHash,
    "test/path",
  ]);

  repo.saveSession(projectHash, {
    metadata: {
      sessionId,
      projectHash,
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      kind: "test",
      tags: ["initial"],
      comment: "Initial comment",
    },
    messages: [],
  });

  // 1. Update only comment
  await app.request(`/api/sessions/${sessionId}/metadata`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment: "Updated comment" }),
  });

  let data = await (await app.request(`/api/sessions/${sessionId}`)).json();
  assertEquals(data.metadata.tags, ["initial"]);
  assertEquals(data.metadata.comment, "Updated comment");

  // 2. Update only tags
  await app.request(`/api/sessions/${sessionId}/metadata`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags: ["new-tag"] }),
  });

  data = await (await app.request(`/api/sessions/${sessionId}`)).json();
  assertEquals(data.metadata.tags, ["new-tag"]);
  assertEquals(data.metadata.comment, "Updated comment");
});
