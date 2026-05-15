import { initDb } from "./src/db/schema.ts";
import { syncSessions } from "./src/sync/engine.ts";
import { FileSystemSessionSource } from "./src/sync/filesystem_source.ts";
import { createApi } from "./src/api/server.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { serveStatic } from "https://deno.land/x/hono/middleware.ts";

const GEMINI_TMP_DIR = join(Deno.env.get("HOME") || "", ".gemini/tmp");
const DB_PATH = "clankercam.db";
const PORT = 8000;

async function main() {
  const args = Deno.args;
  const command = args[0];

  if (command === "sync") {
    console.log("Syncing sessions from", GEMINI_TMP_DIR);
    const db = initDb(DB_PATH);
    const source = new FileSystemSessionSource(GEMINI_TMP_DIR);
    await syncSessions(db, source);
    db.close();
    console.log("Sync complete!");
  } else if (command === "serve") {
    const db = initDb(DB_PATH);
    const api = createApi(db);
    
    // Serve static files from 'public' directory
    api.use("/*", serveStatic({ root: "./public" }));
    
    console.log(`ClankerCam server running at http://localhost:${PORT}`);
    Deno.serve({ port: PORT }, api.fetch);
  } else {
    console.log("ClankerCam - Gemini CLI Analytics");
    console.log("Usage:");
    console.log("  deno run --allow-read --allow-write --allow-env --allow-net main.ts sync");
    console.log("  deno run --allow-read --allow-write --allow-env --allow-net main.ts serve");
  }
}

if (import.meta.main) {
  main();
}
