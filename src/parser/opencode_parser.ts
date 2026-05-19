import { Parser } from "./parser.ts";
import { Message, SessionData } from "../types/session.ts";

export class OpenCodeParser implements Parser {
  async parse(filePath: string): Promise<SessionData | null> {
    const content = await Deno.readTextFile(filePath);
    const lines = content.trim().split("\n");
    if (lines.length === 0) return null;

    // Use a timestamp from the first line or current time if missing
    const firstLine = lines[0];
    let startTime = "";
    try {
      const obj = JSON.parse(firstLine);
      // OpenCode format doesn't have a clear timestamp field at the top level in all entries,
      // but we'll try to extract one if it exists, otherwise use a placeholder.
      startTime = obj.timestamp || new Date().toISOString();
    } catch (_e) {
      startTime = new Date().toISOString();
    }

    const messages = lines
      .map((line, index) => {
        try {
          const obj = JSON.parse(line);
          return {
            id: `msg_${index}`,
            timestamp: new Date().toISOString(), // OpenCode logs seem to lack explicit timestamps per message
            type: "gemini", // Mapping assistant to gemini
            content: obj.answer || "",
          };
        } catch (_e) {
          return null;
        }
      })
      .filter((m): m is Message => m !== null);

    return {
      metadata: {
        sessionId: "test_session",
        projectHash: "unknown",
        startTime: startTime,
        lastUpdated: new Date().toISOString(),
        kind: "opencode",
      },
      messages: messages,
    };
  }
}
