import { Hono } from "@hono/hono";
import { DB } from "@sqlite";
import { SQLiteSessionRepository } from "../db/repository.ts";

export function createApi(db: DB) {
  const app = new Hono();
  const repository = new SQLiteSessionRepository(db);

  // CORS
  app.use("*", async (c, next) => {
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    await next();
  });

  app.get("/api/stats/global", (c) => {
    return c.json(repository.getGlobalStats());
  });

  app.get("/api/projects", (c) => {
    return c.json(repository.getAllProjects());
  });

  app.get("/api/projects/:id/sessions", (c) => {
    const projectId = c.req.param("id");
    return c.json(repository.getProjectSessions(projectId));
  });

  app.get("/api/sessions/:id", (c) => {
    const sessionId = c.req.param("id");
    return c.json(repository.getSession(sessionId));
  });

  return app;
}
