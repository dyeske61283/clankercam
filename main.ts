import { AgentType } from "./src/sync/source.ts";
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
import { ParserRegistry } from "./src/parser/registry.ts";
import { SQLiteSessionRepository } from "./src/db/repository.ts";
import { exportSessions } from "./src/cli/export_cmd.ts";
import { importSessions } from "./src/cli/import_cmd.ts";

const _GEMINI_TMP_DIR = join(Deno.env.get("HOME") || "", ".gemini/tmp");
const DB_PATH = Deno.env.get("DB_PATH") || "clankercam.db";
const CONFIG_PATH = "config.json";
const PORT = 8000;

const VALID_AGENTS: AgentType[] = [
  "gemini",
  "claudecode",
  "opencode",
  "codex",
  "generic",
];

async function main() {
  const args = Deno.args;
  const command = args[0];

  if (command === "sync") {
    const verbose = args.includes("--verbose") || args.includes("-v");
    const agentArg = args.find((a) => a.startsWith("--agent="));
    const agentFilter = agentArg ? agentArg.split("=")[1] : null;

    if (agentFilter && !VALID_AGENTS.includes(agentFilter as AgentType)) {
      console.error(`Error: Invalid agent type '${agentFilter}'.`);
      console.error(`Supported agents: ${VALID_AGENTS.join(", ")}`);
      Deno.exit(1);
    }

    const logger = new ConsoleSyncLogger(verbose);
    console.log("Syncing sessions...");
    const db = initDb(DB_PATH);

    const discoveryService = new DiscoveryService();
    const registry = new Registry(discoveryService, configLoader, CONFIG_PATH);
    const parserRegistry = new ParserRegistry();

    let discoveredSources = await registry.getSources();

    if (agentFilter) {
      discoveredSources = discoveredSources.filter((ds) =>
        ds.agentType === agentFilter
      );
      logger.info(`Filtering sources by agent: ${agentFilter}`);
    }

    const sources = discoveredSources.map((ds) => {
      const parser = parserRegistry.getParser(ds.agentType);
      return new FileSystemSessionSource(
        ds.path,
        `Source at ${ds.path}`,
        ds.agentType,
        ds.path,
        parser,
      );
    });

    await syncSessions(db, sources, logger);

    db.close();
    console.log("Sync complete!");
  } else if (command === "serve") {
    const db = initDb(DB_PATH);
    const api = createApi(db);

    // Serve static files from 'public' directory
    api.use("/*", serveStatic({ root: "./public" }));

    console.log(`ClankerCam server running at http://localhost:${PORT}`);
    Deno.serve({ port: PORT }, api.fetch);
  } else if (command === "export") {
    const projectId = args[1];
    const outputPath = args[2] || "export.json";

    if (!projectId) {
      console.error("Error: Project ID is required.");
      console.error(
        "Usage: deno run --allow-read --allow-write main.ts export <projectId> [outputPath]",
      );
      Deno.exit(1);
    }

    const db = initDb(DB_PATH);
    const repo = new SQLiteSessionRepository(db);

    console.log(
      `Exporting sessions for project '${projectId}' to '${outputPath}'...`,
    );
    try {
      await exportSessions(repo, projectId, outputPath);
      console.log("Export complete!");
    } catch (e) {
      console.error(`Error: ${e.message}`);
      Deno.exit(1);
    } finally {
      db.close();
    }
  } else if (command === "import") {
    const filePath = args[1];
    if (!filePath) {
      console.error("Error: Missing file path for import.");
      console.error(
        "Usage: deno run --allow-read --allow-write main.ts import <file_path>",
      );
      Deno.exit(1);
    }

    const db = initDb(DB_PATH);
    const repository = new SQLiteSessionRepository(db);

    console.log(`Importing sessions from ${filePath}...`);
    try {
      await importSessions(filePath, repository);
      console.log("Import complete!");
    } catch (e) {
      console.error(`Error: ${e.message}`);
      Deno.exit(1);
    } finally {
      db.close();
    }
  } else {
    console.log("ClankerCam - Gemini CLI Analytics");
    console.log("Usage:");
    console.log(
      "  deno run --allow-read --allow-write --allow-env --allow-net main.ts sync [options]",
    );
    console.log("Options:");
    console.log(
      "  --agent=<name>  Filter by agent type (default: sync all agents)",
    );
    console.log("          Supported agents: " + VALID_AGENTS.join(", "));
    console.log("  --verbose, -v   Enable verbose logging");
    console.log(
      "  deno run --allow-read --allow-write --allow-env --allow-net main.ts serve",
    );
    console.log(
      "  deno run --allow-read --allow-write --allow-env --allow-net main.ts export <projectId> [outputPath]",
    );
    console.log(
      "  deno run --allow-read --allow-write --allow-env --allow-net main.ts import <file_path>",
    );
  }
}

if (import.meta.main) {
  main();
}
