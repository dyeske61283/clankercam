import { assertEquals } from "@std/assert";
import { GenericParser } from "./generic_parser.ts";

Deno.test("GenericParser parses JSONL correctly", async () => {
  const parser = new GenericParser();
  const filePath = "test_session.jsonl";

  // Create a temporary file
  const content =
    '{"id": "msg1", "timestamp": "2026-05-19T00:00:00Z", "type": "user", "content": "hello"}\n' +
    '{"id": "msg2", "timestamp": "2026-05-19T00:00:01Z", "type": "assistant", "content": "hi"}';
  await Deno.writeTextFile(filePath, content);

  try {
    const result = await parser.parse(filePath);
    assertEquals(result?.messages.length, 2);
    assertEquals(result?.messages[0].id, "msg1");
    assertEquals(result?.metadata.kind, "generic");
  } finally {
    await Deno.remove(filePath);
  }
});
