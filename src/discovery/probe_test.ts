import { assertEquals } from "@std/assert";
import { PathProbe, PatternProbe } from "./probe.ts";
import { join } from "@std/path";

Deno.test("PathProbe discovers existing directory", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const probe = new PathProbe("test-probe", tempDir, "gemini");
    const results = await probe.discover();

    assertEquals(results.length, 1);
    assertEquals(results[0].path, tempDir);
    assertEquals(results[0].agentType, "gemini");
  } finally {
    await Deno.remove(tempDir);
  }
});

Deno.test("PathProbe ignores non-existent directory", async () => {
  const nonExistentPath = join(Deno.cwd(), "non-existent-path-12345");
  const probe = new PathProbe("test-probe", nonExistentPath, "gemini");
  const results = await probe.discover();

  assertEquals(results.length, 0);
});

Deno.test("PatternProbe matches directories using glob", async () => {
  const tempBase = await Deno.makeTempDir();
  try {
    const project1 = join(tempBase, "p1", "logs");
    const project2 = join(tempBase, "p2", "logs");
    await Deno.mkdir(project1, { recursive: true });
    await Deno.mkdir(project2, { recursive: true });

    const pattern = join(tempBase, "*", "logs");
    const probe = new PatternProbe("pattern-probe", pattern, "generic");
    const results = await probe.discover();

    assertEquals(results.length, 2);
    const paths = results.map((r) => r.path).sort();
    assertEquals(paths, [project1, project2].sort());
  } finally {
    await Deno.remove(tempBase, { recursive: true });
  }
});
