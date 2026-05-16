import { assertEquals } from "@std/assert";
import { loadConfig } from "./loader.ts";

const defaultProbePaths = [
  "/tmp/gemini/logs",
  "/tmp/opencode/logs",
  "/tmp/claudecode/logs",
];

Deno.test("loadConfig returns default when file missing", async () => {
  const config = await loadConfig("./nonexistent.json");
  assertEquals(config, { sources: [], probePaths: defaultProbePaths });
});

Deno.test("loadConfig reads file correctly", async () => {
  const tempFile = await Deno.makeTempFile({ suffix: ".json" });
  const configData = {
    sources: [{
      id: "test",
      name: "Test",
      type: "filesystem" as const,
      path: "/tmp",
    }],
  };
  await Deno.writeTextFile(tempFile, JSON.stringify(configData));

  try {
    const config = await loadConfig(tempFile);
    assertEquals(config, { ...configData, probePaths: defaultProbePaths });
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test("loadConfig respects custom probePaths", async () => {
  const tempFile = await Deno.makeTempFile({ suffix: ".json" });
  const customPaths = ["/custom/path"];
  const configData = {
    sources: [],
    probePaths: customPaths,
  };
  await Deno.writeTextFile(tempFile, JSON.stringify(configData));

  try {
    const config = await loadConfig(tempFile);
    assertEquals(config, configData);
  } finally {
    await Deno.remove(tempFile);
  }
});
