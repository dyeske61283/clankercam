import { assertEquals } from "@std/assert";
import { ParserRegistry } from "./registry.ts";

Deno.test("ParserRegistry provides correct parser for agent types", () => {
  const registry = new ParserRegistry();

  const agents = [
    "gemini",
    "claudecode",
    "opencode",
    "codex",
    "generic",
  ] as const;

  for (const agent of agents) {
    const parser = registry.getParser(agent);
    assertEquals(!!parser, true);
  }
});
