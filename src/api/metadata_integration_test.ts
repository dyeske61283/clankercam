import { assertEquals } from "@std/assert";
import { createApi } from "./server.ts";
import { initDb } from "../db/schema.ts";

Deno.test("API metadata endpoints return valid data", async () => {
  const db = initDb(":memory:");
  const app = createApi(db);

  // Initial call - should be empty or default
  const res = await app.request("/api/stats/global");
  assertEquals(res.status, 200);

  const stats = await res.json();
  assertEquals(typeof stats.totalSessions, "number");
});
