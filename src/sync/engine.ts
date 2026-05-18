import { DB } from "@sqlite";
import { SessionSource } from "./source.ts";
import { SQLiteSessionRepository } from "../db/repository.ts";
import { Session } from "../domain/session.ts";
import { NoopSyncLogger, SyncLogger } from "./logger.ts";

export async function syncSessions(
  db: DB,
  source: SessionSource,
  logger: SyncLogger = new NoopSyncLogger(),
) {
  const repository = new SQLiteSessionRepository(db);

  for await (const project of source.listProjects()) {
    await syncProjectSessions(project.hash, source, repository, logger);
  }
}

async function syncProjectSessions(
  projectHash: string,
  source: SessionSource,
  repository: SQLiteSessionRepository,
  logger: SyncLogger,
) {
  logger.info(`Syncing project: ${projectHash}`);
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
            logger.warn(
              `    Skipping duplicate token usage: ${sessionData.metadata.sessionId}`,
            );
          } else {
            logger.error(
              `    Error processing token usage for ${sessionData.metadata.sessionId}:`,
              err,
            );
          }
        }
      }
      logger.info(`  Processed session: ${sessionData.metadata.sessionId}`);
      sessionCount++;
    } catch (err: unknown) {
      if (
        err instanceof Error && err.message.includes("UNIQUE constraint failed")
      ) {
        logger.warn(
          `    Skipping duplicate session: ${sessionData.metadata.sessionId}`,
        );
      } else {
        logger.error(
          `    Error processing session ${sessionData.metadata.sessionId}:`,
          err,
        );
      }
    }
  }
  if (sessionCount > 0) {
    logger.info(`Synced ${sessionCount} sessions for project ${projectHash}`);
  }
}
