import { assertEquals } from "@std/assert";

Deno.test("CLI sync command validates agent flag", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-all", "main.ts", "sync", "--agent=invalid-agent"],
    stderr: "piped",
    stdout: "piped",
  });

  const { code, stderr } = await command.output();
  const errorOutput = new TextDecoder().decode(stderr);

  assertEquals(code, 1);
  assertEquals(
    errorOutput.includes("Error: Invalid agent type 'invalid-agent'"),
    true,
  );
  assertEquals(
    errorOutput.includes(
      "Supported agents: gemini, claudecode, opencode, codex, generic",
    ),
    true,
  );
});

Deno.test("CLI sync command accepts valid agent flag", async () => {
  // This test assumes it can run in the current environment
  // We just check that it doesn't fail with the error message
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-all", "main.ts", "sync", "--agent=gemini"],
    stderr: "piped",
    stdout: "piped",
  });

  const { stderr } = await command.output();
  const errorOutput = new TextDecoder().decode(stderr);

  // It might fail for other reasons, but we check that it didn't fail due to validation
  assertEquals(errorOutput.includes("Error: Invalid agent type"), false);
});
