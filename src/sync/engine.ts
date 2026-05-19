import { DB } from "@sqlite";
import { SessionSource } from "./source.ts";
import { SQLiteSessionRepository } from "../db/repository.ts";
// import { Session } from "../domain/session.ts";
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
  for await (const session of source.listSessions(projectHash)) {
    const sessionData = session.data;
    const usage = session.tokenUsage;

    try {
      if (repository.sessionExists(sessionData.metadata.sessionId)) {
        logger.warn(
          `    Skipping duplicate session: ${sessionData.metadata.sessionId}`,
        );
        continue;
      }

      repository.saveSession(projectHash, sessionData, usage);

      logger.info(
        `Session ${sessionData.metadata.sessionId} tokens: ${
          JSON.stringify(session.tokenUsage)
        }`,
      );
      sessionCount++;
    } catch (err: unknown) {
      logger.error(
        `    Error processing session ${sessionData.metadata.sessionId}:`,
        err,
      );
    }
  }
  if (sessionCount > 0) {
    logger.info(`Synced ${sessionCount} sessions for project ${projectHash}`);
  }
}
