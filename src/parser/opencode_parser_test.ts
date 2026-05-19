import { assertEquals } from "@std/assert";
import { OpenCodeParser } from "./opencode_parser.ts";

Deno.test("OpenCodeParser should parse the example log file", async () => {
  const parser = new OpenCodeParser();
  const result = await parser.parse("./opencode_example_session_log.jsonl");

  if (!result) {
    throw new Error("Result is null");
  }

  assertEquals(result.metadata.kind, "opencode");
  assertEquals(result.messages.length > 0, true);
  assertEquals(result.messages[0].type, "gemini");
  // Check that the content is parsed correctly from the JSONL
  assertEquals(typeof result.messages[0].content, "string");
  assertEquals(result.messages[0].content.length > 0, true);
});
