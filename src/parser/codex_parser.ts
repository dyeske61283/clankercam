import { Parser } from "./parser.ts";
import { Message, SessionData } from "../types/session.ts";

export class CodexParser implements Parser {
  async parse(filePath: string): Promise<SessionData | null> {
    const content = await Deno.readTextFile(filePath);
    const lines = content.trim().split("\n");
    if (lines.length === 0) return null;

    let sessionId = "unknown";
    const messages: Message[] = [];

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === "session_meta") {
          sessionId = obj.payload?.id || sessionId;
        } else if (
          obj.type === "response_item" && obj.payload?.type === "message"
        ) {
          const content = obj.payload.content?.[0]?.text || "";
          messages.push({
            id: crypto.randomUUID(), // Placeholder
            timestamp: obj.timestamp,
            type: obj.payload.role === "user" ? "user" : "gemini",
            content,
          });
        }
      } catch (_e) {
        // ignore
      }
    }

    return {
      metadata: {
        sessionId,
        projectHash: "unknown",
        startTime: lines[0] ? JSON.parse(lines[0]).timestamp : "",
        lastUpdated: lines[lines.length - 1]
          ? JSON.parse(lines[lines.length - 1]).timestamp
          : "",
        kind: "codex",
      },
      messages,
    };
  }
}
