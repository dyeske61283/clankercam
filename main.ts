import { initDb } from "./src/db/schema.ts";
import { syncSessions } from "./src/sync/engine.ts";
import { FileSystemSessionSource } from "./src/sync/filesystem_source.ts";
import { createApi } from "./src/api/server.ts";
import { join } from "@std/path";
import { serveStatic } from "@hono/hono/deno";
import { DiscoveryService } from "./src/discovery/discovery_service.ts";
import { Registry } from "./src/discovery/registry.ts";
import * as configLoader from "./src/config/loader.ts";
import { ConsoleSyncLogger } from "./src/sync/logger.ts";

const _GEMINI_TMP_DIR = join(Deno.env.get("HOME") || "", ".gemini/tmp");
const DB_PATH = "clankercam.db";
const CONFIG_PATH = "config.json";
const PORT = 8000;

async function main() {
  const args = Deno.args;
  const command = args[0];

  if (command === "sync") {
    const verbose = args.includes("--verbose") || args.includes("-v");
    const logger = new ConsoleSyncLogger(verbose);
    console.log("Syncing sessions...");
    const db = initDb(DB_PATH);

    const discoveryService = new DiscoveryService();
    const registry = new Registry(discoveryService, configLoader, CONFIG_PATH);

    const sourcePaths = await registry.getSources();

    for (const path of sourcePaths) {
      logger.info(`Syncing source: ${path}`);
      const source = new FileSystemSessionSource(path);
      await syncSessions(db, source, logger);
    }

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
    console.log(
      "  deno run --allow-read --allow-write --allow-env --allow-net main.ts sync",
    );
    console.log(
      "  deno run --allow-read --allow-write --allow-env --allow-net main.ts serve",
    );
  }
}

if (import.meta.main) {
  main();
}
