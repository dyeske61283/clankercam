import { Parser } from "./parser.ts";
import { Session } from "../domain/session.ts";
import { normalizeSession } from "../domain/normalization.ts";

export class OpenCodeParser implements Parser {
  async parse(filePath: string): Promise<Session | null> {
    const content = await Deno.readTextFile(filePath);
    const lines = content.trim().split("\n");
    if (lines.length === 0) return null;

    const messages = lines
      .map((line, index) => {
        try {
          const obj = JSON.parse(line);
          return {
            id: `msg_${index}`,
            timestamp: obj.timestamp,
            type: "assistant",
            content: obj.answer || "",
          };
        } catch (_e) {
          return null;
        }
      })
      .filter((m) => m !== null);

    return normalizeSession({
      metadata: {
        kind: "opencode",
      },
      messages: messages,
    });
  }
}
