import { Parser } from "./parser.ts";
import { Session } from "../domain/session.ts";
import { normalizeSession } from "../domain/normalization.ts";

interface ClaudeMessage {
  id: string;
  timestamp: string;
  type: string;
  content: string;
  sessionId: string;
}

export class ClaudeCodeParser implements Parser {
  async parse(filePath: string): Promise<Session | null> {
    const content = await Deno.readTextFile(filePath);
    const lines = content.trim().split("\n");
    if (lines.length === 0) return null;

    const messages = lines
      .map((line) => {
        try {
          const obj = JSON.parse(line);
          if (obj.type === "summary") return null;

          return {
            id: obj.uuid,
            timestamp: obj.timestamp,
            type: obj.type,
            content: obj.message?.content?.[0]?.text || "",
            sessionId: obj.sessionId,
          };
        } catch (_e) {
          return null;
        }
      })
      .filter((m): m is ClaudeMessage => m !== null);

    const sessionId = messages[0]?.sessionId;

    return normalizeSession({
      metadata: {
        sessionId,
        kind: "claudecode",
      },
      messages: messages,
    });
  }
}
