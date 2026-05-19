import { assertEquals } from "@std/assert";
import { CodexParser } from "./codex_parser.ts";

Deno.test("CodexParser parses valid jsonl file", async () => {
  const parser = new CodexParser();
  // Create a minimal codex log file
  const testLog =
    `{"timestamp":"2026-01-08T07:46:47.642Z","type":"session_meta","payload":{"id":"test-id"}}
{"timestamp":"2026-01-08T07:46:47.647Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"hello"}]}}`;

  await Deno.writeTextFile("test.jsonl", testLog);
  try {
    const result = await parser.parse("test.jsonl");
    assertEquals(result?.metadata.sessionId, "test-id");
    assertEquals(result?.messages.length, 1);
    assertEquals(result?.messages[0].content, "hello");
  } finally {
    await Deno.remove("test.jsonl");
  }
});
