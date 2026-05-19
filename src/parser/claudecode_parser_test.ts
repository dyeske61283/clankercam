import { assertEquals } from "@std/assert";
import { ClaudeCodeParser } from "./claudecode_parser.ts";

Deno.test("ClaudeCodeParser parses example log correctly", async () => {
  const parser = new ClaudeCodeParser();
  // Using the first few lines of the provided example for a quick test
  const testFilePath = "claudecode_example_session_log.jsonl";
  const result = await parser.parse(testFilePath);

  if (!result) {
    throw new Error("Parser returned null");
  }

  // Basic assertions
  assertEquals(result.metadata.sessionId, "test_session");
  assertEquals(result.messages.length > 0, true);
});
