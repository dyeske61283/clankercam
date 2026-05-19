import { DB } from "@sqlite";
import { SessionSource } from "./source.ts";
import { SQLiteSessionRepository } from "../db/repository.ts";
import { Session } from "../domain/session.ts";
import { NoopSyncLogger, SyncLogger } from "./logger.ts";

export async function syncSessions(
  db: DB,
  sources: SessionSource | SessionSource[],
  logger: SyncLogger = new NoopSyncLogger(),
) {
  const repository = new SQLiteSessionRepository(db);
  const sourceList = Array.isArray(sources) ? sources : [sources];

  for (const source of sourceList) {
    logger.info(`Syncing from source: ${source.name} (${source.agentType})`);
    for await (const project of source.listProjects()) {
      await syncProjectSessions(project.hash, source, repository, logger);
    }
  }
}

export async function syncProjectSessions(
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
      if (!sessionData.metadata.startTime && sessionData.messages.length > 0) {
        const timestamps = sessionData.messages.map((m) =>
          new Date(m.timestamp).getTime()
        );
        const oldest = new Date(Math.min(...timestamps)).toISOString();
        const newest = new Date(Math.max(...timestamps)).toISOString();
        sessionData.metadata.startTime = oldest;
        sessionData.metadata.lastUpdated = newest;
        logger.warn(
          `    Inferred startTime/lastUpdated for session ${sessionData.metadata.sessionId}: ${oldest}/${newest}`,
        );
      }

      if (
        !sessionData.metadata.startTime || !sessionData.metadata.lastUpdated
      ) {
        logger.warn(
          `    Skipping session ${sessionData.metadata.sessionId}: Missing startTime or lastUpdated`,
        );
        continue;
      }
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
            usage.cache ?? 0,
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
      logger.info(
        `Session ${sessionData.metadata.sessionId} tokens: ${
          JSON.stringify(session.tokenUsage)
        }`,
      );
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
