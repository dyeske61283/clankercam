import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { Session } from "./session.ts";

Deno.test("Session calculates total tokens correctly", () => {
  const session = new Session({
    metadata: { sessionId: "s1", projectHash: "p1", startTime: "", lastUpdated: "", kind: "" },
    messages: [
      { id: "m1", type: "user", content: "h", timestamp: "", tokenUsage: { input: 5, output: 5, total: 10 } },
      { id: "m2", type: "gemini", content: "h", timestamp: "", tokenUsage: { input: 10, output: 20, total: 30 } }
    ]
  });

  assertEquals(session.inputTokens, 15);
  assertEquals(session.outputTokens, 25);
  assertEquals(session.totalTokens, 40);
});
