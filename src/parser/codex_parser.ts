import { Parser } from "./parser.ts";
import { Session } from "../domain/session.ts";
import { normalizeSession } from "../domain/normalization.ts";

export class CodexParser implements Parser {
  async parse(filePath: string): Promise<Session | null> {
    const content = await Deno.readTextFile(filePath);
    const lines = content.trim().split("\n");
    if (lines.length === 0) return null;

    let sessionId: string | undefined;
    const messages: Record<string, unknown>[] = [];

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === "session_meta") {
          sessionId = obj.payload?.id;
        } else if (
          obj.type === "response_item" && obj.payload?.type === "message"
        ) {
          const content = obj.payload.content?.[0]?.text || "";
          messages.push({
            id: obj.payload.id || crypto.randomUUID(),
            timestamp: obj.timestamp,
            type: obj.payload.role,
            content,
          });
        }
      } catch (_e) {
        // ignore
      }
    }

    return normalizeSession({
      metadata: {
        sessionId,
        kind: "codex",
      },
      messages,
    });
  }
}
