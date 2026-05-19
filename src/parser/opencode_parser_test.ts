import { assertEquals } from "@std/assert";
import { OpenCodeParser } from "./opencode_parser.ts";

Deno.test("OpenCodeParser should parse the example log file", async () => {
  const parser = new OpenCodeParser();
  const result = await parser.parse(
    "./logs/opencode_example_session_log.jsonl",
  );

  if (!result) {
    throw new Error("Result is null");
  }

  assertEquals(result.data.metadata.kind, "opencode");
  assertEquals(result.data.messages.length > 0, true);
  assertEquals(result.data.messages[0].type, "gemini");
  // Check that the content is parsed correctly from the JSONL
  assertEquals(typeof result.data.messages[0].content, "string");
  assertEquals(result.data.messages[0].content.length > 0, true);
});
