import { DB } from "@sqlite";
import { SessionSource } from "./source.ts";
import { SQLiteSessionRepository } from "../db/repository.ts";
import { Session } from "../domain/session.ts";

export async function syncSessions(
  db: DB,
  source: SessionSource,
  verbose: boolean = false,
) {
  const repository = new SQLiteSessionRepository(db);

  for await (const project of source.listProjects()) {
    await syncProjectSessions(project.hash, source, repository, verbose);
  }
}

async function syncProjectSessions(
  projectHash: string,
  source: SessionSource,
  repository: SQLiteSessionRepository,
  verbose: boolean,
) {
  if (verbose) console.log(`Syncing project: ${projectHash}`);
  repository.saveProject(projectHash);

  let sessionCount = 0;
  for await (const sessionData of source.listSessions(projectHash)) {
    try {
      repository.saveSession(projectHash, sessionData);

      const session = new Session(sessionData);
      const usage = session.tokenUsage;
      if (usage.total > 0) {
        try {
          repository.saveTokenUsage(
            sessionData.metadata.sessionId,
            usage.input,
            usage.output,
            usage.total,
          );
        } catch (err: unknown) {
          if (
            err instanceof Error &&
            err.message.includes("UNIQUE constraint failed")
          ) {
            if (verbose) {
              console.warn(
                `    Skipping duplicate token usage: ${sessionData.metadata.sessionId}`,
              );
            }
          } else {
            console.error(
              `    Error processing token usage for ${sessionData.metadata.sessionId}:`,
              err,
            );
          }
        }
      }
      if (verbose) {
        console.log(`  Processed session: ${sessionData.metadata.sessionId}`);
      }
      sessionCount++;
    } catch (err: unknown) {
      if (
        err instanceof Error && err.message.includes("UNIQUE constraint failed")
      ) {
        if (verbose) {
          console.warn(
            `    Skipping duplicate session: ${sessionData.metadata.sessionId}`,
          );
        }
      } else {
        console.error(
          `    Error processing session ${sessionData.metadata.sessionId}:`,
          err,
        );
      }
    }
  }
  if (sessionCount > 0) {
    if (verbose) {
      console.log(`Synced ${sessionCount} sessions for project ${projectHash}`);
    }
  }
}
