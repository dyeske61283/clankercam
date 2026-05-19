import { Parser } from "./parser.ts";
import { SessionData } from "../types/session.ts";

/**
 * GenericParser handles unknown or non-standard agent session formats.
 * It provides basic extraction by attempting to identify metadata and messages
 * from standard JSON/JSONL structures.
 */
export class GenericParser implements Parser {
  async parse(filePath: string): Promise<SessionData | null> {
    const content = await Deno.readTextFile(filePath);

    // Attempt basic JSONL parsing first
    if (filePath.endsWith(".jsonl")) {
      return this.parseGenericJsonl(content);
    }

    // Fallback to JSON
    return this.parseGenericJson(content);
  }

  private parseGenericJsonl(content: string): SessionData | null {
    const lines = content.trim().split("\n");
    if (lines.length === 0) return null;

    const messages = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((obj) => obj && obj.id && obj.timestamp);

    return {
      metadata: {
        sessionId: crypto.randomUUID(),
        projectHash: "unknown",
        startTime: messages[0]?.timestamp || "",
        lastUpdated: messages[messages.length - 1]?.timestamp || "",
        kind: "generic",
      },
      messages,
    };
  }

  private parseGenericJson(content: string): SessionData | null {
    try {
      const data = JSON.parse(content);
      return {
        metadata: {
          sessionId: data.sessionId || crypto.randomUUID(),
          projectHash: data.projectHash || "unknown",
          startTime: data.startTime || "",
          lastUpdated: data.lastUpdated || "",
          kind: "generic",
        },
        messages: data.messages || [],
      };
    } catch {
      return null;
    }
  }
}
