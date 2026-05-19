import { Parser } from "./parser.ts";
import { Session } from "../domain/session.ts";
import { normalizeSession } from "../domain/normalization.ts";

/**
 * GenericParser handles unknown or non-standard agent session formats.
 * It provides basic extraction by attempting to identify metadata and messages
 * from standard JSON/JSONL structures.
 */
export class GenericParser implements Parser {
  async parse(filePath: string): Promise<Session | null> {
    const content = await Deno.readTextFile(filePath);

    // Attempt basic JSONL parsing first
    if (filePath.endsWith(".jsonl")) {
      return this.parseGenericJsonl(content);
    }

    // Fallback to JSON
    return this.parseGenericJson(content);
  }

  private parseGenericJsonl(content: string): Session | null {
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
      .filter((obj) => obj && (obj.id || obj.timestamp));

    return normalizeSession({
      metadata: {
        kind: "generic",
      },
      messages,
    });
  }

  private parseGenericJson(content: string): Session | null {
    try {
      const data = JSON.parse(content);
      return normalizeSession(data);
    } catch {
      return null;
    }
  }
}
