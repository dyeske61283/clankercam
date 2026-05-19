import { Message, SessionMetadata } from "../types/session.ts";
import { Parser } from "./parser.ts";

export class GeminiParser implements Parser {
  async parse(filePath: string) {
    const content = await Deno.readTextFile(filePath);

    if (filePath.endsWith(".jsonl")) {
      return this.parseJsonl(content, filePath);
    } else if (filePath.endsWith(".json")) {
      return this.parseJson(content, filePath);
    }

    return null;
  }

  private parseJsonl(content: string, filePath: string) {
    const lines = content.trim().split("\n");
    if (lines.length === 0) return null;

    let metadata: SessionMetadata;
    try {
      metadata = JSON.parse(lines[0]);
    } catch (e) {
      console.error(`Failed to parse metadata in ${filePath}:`, e);
      return null;
    }

    const messages: Message[] = [];
    for (let i = 1; i < lines.length; i++) {
      try {
        const obj = JSON.parse(lines[i]);
        if (obj.message && obj.message.id) {
          const msg: Message = {
            id: obj.message.id,
            timestamp: obj.timestamp,
            type: obj.message.role === "assistant" ? "gemini" : "user",
            content: JSON.stringify(obj.message.content),
            tokenUsage: (console.log(
                "DEBUG: message id",
                obj.message.id,
                "usage:",
                obj.message.usage,
              ),
                obj.message.usage)
              ? {
                input: obj.message.usage.input_tokens || 0,
                output: obj.message.usage.output_tokens || 0,
                total: (obj.message.usage.input_tokens || 0) +
                  (obj.message.usage.output_tokens || 0) +
                  (obj.message.usage.cache_read_input_tokens || 0) +
                  (obj.message.usage.cache_creation_input_tokens || 0),
                cache: (obj.message.usage.cache_read_input_tokens || 0) +
                  (obj.message.usage.cache_creation_input_tokens || 0),
              }
              : undefined,
          };
          messages.push(msg);
        }
      } catch (e) {
        console.warn(
          `Failed to parse message line ${i + 1} in ${filePath}:`,
          e,
        );
      }
    }

    return { metadata, messages };
  }

  private parseJson(content: string, filePath: string) {
    try {
      const data = JSON.parse(content);
      const { messages, ...metadata } = data;
      // Filter messages in JSON format too just in case
      const filteredMessages = (messages || []).filter((
        m: Record<string, unknown>,
      ) => m.id && m.timestamp);
      return {
        metadata: metadata as SessionMetadata,
        messages: filteredMessages as Message[],
      };
    } catch (e) {
      console.error(`Failed to parse JSON session in ${filePath}:`, e);
      return null;
    }
  }
}

// Keep the old function for backward compatibility for now if needed,
// but we should probably migrate everything to the class.
export async function parseSessionFile(filePath: string) {
  return await Promise.resolve(() => new GeminiParser().parse(filePath));
}
