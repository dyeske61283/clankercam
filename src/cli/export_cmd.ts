import { SessionRepository } from "../db/repository.ts";
import { ArchiveService } from "../domain/export.ts";
import { SessionData } from "../types/session.ts";

export async function exportSessions(
  repo: SessionRepository,
  projectId: string,
  outputPath: string,
): Promise<void> {
  const sessionSummaries = repo.getProjectSessions(projectId);
  const fullSessions: SessionData[] = [];

  for (const summary of sessionSummaries) {
    const sessionDetails = repo.getSession(summary.id);
    const sessionData: SessionData = {
      metadata: {
        sessionId: summary.id,
        projectHash: projectId,
        startTime: summary.startTime,
        lastUpdated: summary.lastUpdated,
        kind: summary.kind,
        tags: sessionDetails.metadata.tags as string[] | undefined,
        comment: sessionDetails.metadata.comment as string | undefined,
      },
      messages: sessionDetails.messages,
    };
    fullSessions.push(sessionData);
  }

  if (fullSessions.length === 0) {
    throw new Error(`No sessions found for project '${projectId}'`);
  }

  const archive = ArchiveService.bundle(fullSessions);
  await Deno.writeTextFile(outputPath, archive);
}
