import { Session } from "../domain/session.ts";
import { normalizeSession } from "../domain/normalization.ts";
import { Parser } from "./parser.ts";

export class GeminiParser implements Parser {
  async parse(filePath: string): Promise<Session | null> {
    const content = await Deno.readTextFile(filePath);

    if (filePath.endsWith(".jsonl")) {
      return this.parseJsonl(content, filePath);
    } else if (filePath.endsWith(".json")) {
      return this.parseJson(content, filePath);
    }

    return null;
  }

  private parseJsonl(content: string, _filePath: string): Session | null {
    const lines = content.trim().split("\n");
    if (lines.length === 0) return null;

    let metadata: Record<string, unknown>;
    try {
      metadata = JSON.parse(lines[0]);
    } catch (_e) {
      return null;
    }

    const messages: Record<string, unknown>[] = [];
    for (let i = 1; i < lines.length; i++) {
      try {
        const obj = JSON.parse(lines[i]);
        if (obj.message) {
          messages.push({
            id: obj.message.id,
            timestamp: obj.timestamp,
            type: obj.message.role,
            content: JSON.stringify(obj.message.content),
            usage: obj.message.usage,
          });
        }
      } catch (_e) {
        // Skip malformed lines
      }
    }

    return normalizeSession({ metadata, messages });
  }

  private parseJson(content: string, _filePath: string): Session | null {
    try {
      const data = JSON.parse(content);
      return normalizeSession(data);
    } catch (_e) {
      return null;
    }
  }
}

export async function parseSessionFile(filePath: string) {
  return await new GeminiParser().parse(filePath);
}
