import { assertEquals } from "@std/assert";
import { normalizeSession } from "./normalization.ts";

Deno.test("normalizeSession maps 'assistant' role to 'gemini'", () => {
  const rawData: Record<string, unknown> = {
    metadata: {
      sessionId: "s1",
      projectHash: "p1",
      startTime: "2023-01-01T00:00:00Z",
      lastUpdated: "2023-01-01T00:01:00Z",
      kind: "test",
    },
    messages: [
      {
        id: "m1",
        timestamp: "2023-01-01T00:00:30Z",
        type: "assistant", // Tool-specific role
        content: "Hello",
      },
    ],
  };

  const session = normalizeSession(rawData);
  assertEquals(session.data.messages[0].type, "gemini");
});

Deno.test("normalizeSession interpolates missing timestamps", () => {
  const rawData: Record<string, unknown> = {
    metadata: {
      sessionId: "s1",
      projectHash: "p1",
      startTime: "2023-01-01T00:00:00Z",
      lastUpdated: "2023-01-01T00:01:00Z",
      kind: "test",
    },
    messages: [
      {
        id: "m1",
        timestamp: "2023-01-01T00:00:10Z",
        type: "user",
        content: "First",
      },
      {
        id: "m2",
        // timestamp missing
        type: "gemini",
        content: "Second",
      },
      {
        id: "m3",
        timestamp: "2023-01-01T00:00:30Z",
        type: "user",
        content: "Third",
      },
    ],
  };

  const session = normalizeSession(rawData);
  assertEquals(session.data.messages[1].timestamp, "2023-01-01T00:00:10Z"); // Should fallback to previous
});

Deno.test("normalizeSession normalizes token usage fields", () => {
  const rawData: Record<string, unknown> = {
    metadata: {
      sessionId: "s1",
      projectHash: "p1",
      startTime: "2023-01-01T00:00:00Z",
      lastUpdated: "2023-01-01T00:01:00Z",
      kind: "test",
    },
    messages: [
      {
        id: "m1",
        timestamp: "2023-01-01T00:00:10Z",
        type: "gemini",
        content: "Hello",
        usage: { // Raw field from some tools
          input_tokens: 10,
          output_tokens: 20,
          cache_read_input_tokens: 5,
        },
      },
    ],
  };

  const session = normalizeSession(rawData);
  const usage = session.data.messages[0].tokenUsage;
  assertEquals(usage?.input, 10);
  assertEquals(usage?.output, 20);
  assertEquals(usage?.cache, 5);
  assertEquals(usage?.total, 35);
});

Deno.test("normalizeSession completes missing metadata", () => {
  const rawData: Record<string, unknown> = {
    metadata: {
      // sessionId missing
      // projectHash missing
      startTime: "2023-01-01T00:00:00Z",
      lastUpdated: "2023-01-01T00:01:00Z",
      kind: "test",
    },
    messages: [],
  };

  const session = normalizeSession(rawData);
  const metadata = session.data.metadata;
  assertEquals(typeof metadata.sessionId, "string");
  assertEquals(metadata.sessionId.length > 0, true);
  assertEquals(metadata.projectHash, "unknown");
});

Deno.test("normalizeSession deduplicates messages", () => {
  const rawData: Record<string, unknown> = {
    metadata: {
      sessionId: "s1",
      projectHash: "p1",
      startTime: "2023-01-01T00:00:00Z",
      lastUpdated: "2023-01-01T00:01:00Z",
      kind: "test",
    },
    messages: [
      {
        id: "m1",
        timestamp: "2023-01-01T00:00:10Z",
        type: "user",
        content: "Hello",
      },
      {
        id: "m1",
        timestamp: "2023-01-01T00:00:10Z",
        type: "user",
        content: "Hello",
      },
      {
        id: "m2",
        timestamp: "2023-01-01T00:00:20Z",
        type: "gemini",
        content: "Hi",
      },
    ],
  };

  const session = normalizeSession(rawData);
  assertEquals(session.data.messages.length, 2);
  assertEquals(session.data.messages[0].id, "m1");
  assertEquals(session.data.messages[1].id, "m2");
});
