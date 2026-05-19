import { SessionRepository } from "../db/repository.ts";
import { ArchiveService } from "../domain/export.ts";

export async function importSessions(
  filePath: string,
  repository: SessionRepository,
) {
  const data = await Deno.readTextFile(filePath);
  const sessions = ArchiveService.unbundle(data);

  for (const session of sessions) {
    try {
      const projectHash = session.metadata.projectHash;
      repository.saveProject(projectHash);
      repository.saveSession(projectHash, session);

      // Save token usage if present
      const totalTokens = session.messages.reduce(
        (sum, m) => sum + (m.tokenUsage?.total ?? 0),
        0,
      );
      if (totalTokens > 0) {
        const input = session.messages.reduce(
          (sum, m) => sum + (m.tokenUsage?.input ?? 0),
          0,
        );
        const output = session.messages.reduce(
          (sum, m) => sum + (m.tokenUsage?.output ?? 0),
          0,
        );
        const cache = session.messages.reduce(
          (sum, m) => sum + (m.tokenUsage?.cache ?? 0),
          0,
        );
        repository.saveTokenUsage(
          session.metadata.sessionId,
          input,
          output,
          totalTokens,
          cache,
        );
      }
    } catch (err: unknown) {
      if (
        err instanceof Error && err.message.includes("UNIQUE constraint failed")
      ) {
        // Collision handled: skip duplicate
        continue;
      }
      throw err;
    }
  }
}
