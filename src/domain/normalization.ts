import { Message, TokenUsage } from "../types/session.ts";
import { Session } from "./session.ts";

export function normalizeSession(data: Record<string, unknown>): Session {
  const dataMetadata = (data.metadata || {}) as Record<string, unknown>;
  const metadata = {
    ...dataMetadata,
    sessionId: (dataMetadata.sessionId || data.sessionId ||
      crypto.randomUUID()) as string,
    projectHash:
      (dataMetadata.projectHash || data.projectHash || "unknown") as string,
    startTime: (dataMetadata.startTime || data.startTime ||
      new Date().toISOString()) as string,
    lastUpdated: (dataMetadata.lastUpdated || data.lastUpdated ||
      new Date().toISOString()) as string,
    kind: (dataMetadata.kind || data.kind || "generic") as string,
  };

  let lastTimestamp = metadata.startTime;

  const messages = ((data.messages as Record<string, unknown>[]) || []).map(
    (msg) => {
      let type = msg.type as string;
      if (type === "assistant" || type === "ai" || type === "model") {
        type = "gemini";
      }

      const timestamp = (msg.timestamp || lastTimestamp) as string;
      lastTimestamp = timestamp;

      let tokenUsage = msg.tokenUsage as Record<string, number> | undefined;
      if (!tokenUsage && msg.usage) {
        const u = msg.usage as Record<string, number>;
        const input = u.input_tokens || u.input || 0;
        const output = u.output_tokens || u.output || 0;
        const cache = (u.cache_read_input_tokens || 0) +
          (u.cache_creation_input_tokens || 0) +
          (u.cache || 0);
        tokenUsage = {
          input,
          output,
          cache,
          total: input + output + cache,
        };
      }

      return {
        ...msg,
        id: msg.id as string,
        content: msg.content as string,
        type: type as Message["type"],
        timestamp,
        tokenUsage: tokenUsage as TokenUsage | undefined,
      };
    },
  );

  // Deduplicate by ID and content hash (or just ID for now if we assume IDs are unique per message)
  const uniqueMessages: Message[] = [];
  const seenIds = new Set<string>();
  for (const msg of messages) {
    const id = msg.id;
    if (!seenIds.has(id)) {
      uniqueMessages.push(msg as Message);
      seenIds.add(id);
    }
  }

  return new Session({ metadata, messages: uniqueMessages });
}
