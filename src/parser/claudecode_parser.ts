import { Parser } from "./parser.ts";
import { Message, SessionData } from "../types/session.ts";

export class ClaudeCodeParser implements Parser {
  async parse(filePath: string): Promise<SessionData | null> {
    const content = await Deno.readTextFile(filePath);
    const lines = content.trim().split("\n");
    if (lines.length === 0) return null;

    // Based on the log structure, we can try to extract metadata from the first user/assistant line if needed,
    // or set defaults. The example logs don't have a single metadata object line.
    const sessionId = "test_session"; // placeholder for now

    const messages = lines
      .map((line) => {
        try {
          const obj = JSON.parse(line);
          if (obj.type === "summary") return null;

          return {
            id: obj.uuid,
            timestamp: obj.timestamp,
            type: obj.type === "user" ? "user" : "gemini",
            content: obj.message?.content?.[0]?.text || "",
          };
        } catch (_e) {
          return null;
        }
      })
      .filter((m): m is Message => m !== null);

    return {
      metadata: {
        sessionId,
        projectHash: "unknown",
        startTime: lines[0] ? JSON.parse(lines[0]).timestamp : "",
        lastUpdated: lines[lines.length - 1]
          ? JSON.parse(lines[lines.length - 1]).timestamp
          : "",
        kind: "claudecode",
      },
      messages: messages,
    };
  }
}
