import { assertEquals } from "@std/assert";
import { FileSystemSessionSource } from "./filesystem_source.ts";
import { join } from "@std/path";
import { GeminiParser } from "../parser/session_parser.ts";

Deno.test("FileSystemSessionSource.listProjects() lists directories in the root", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const project1 = join(tempDir, "project1");
    const project2 = join(tempDir, "project2");
    await Deno.mkdir(project1);
    await Deno.mkdir(project2);
    // Create a non-directory file to ensure it's ignored
    await Deno.writeTextFile(join(tempDir, "not-a-project.txt"), "hello");

    const source = new FileSystemSessionSource(
      "fs-test",
      "Test FS",
      "gemini",
      tempDir,
      new GeminiParser(),
    );
    const projects = [];
    for await (const project of source.listProjects()) {
      projects.push(project.hash);
    }

    projects.sort();
    assertEquals(projects, ["project1", "project2"]);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("FileSystemSessionSource.listSessions() lists sessions in project/chats", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const projectHash = "project1";
    const chatsPath = join(tempDir, projectHash, "chats");
    await Deno.mkdir(chatsPath, { recursive: true });

    const sessionData = {
      sessionId: "session1",
      projectHash,
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      kind: "chat",
      messages: [],
    };

    await Deno.writeTextFile(
      join(chatsPath, "session1.json"),
      JSON.stringify(sessionData),
    );

    const source = new FileSystemSessionSource(
      "fs-test",
      "Test FS",
      "gemini",
      tempDir,
      new GeminiParser(),
    );
    const sessions = [];
    for await (const session of source.listSessions(projectHash)) {
      sessions.push(session);
    }

    assertEquals(sessions.length, 1);
    assertEquals(sessions[0].metadata.sessionId, "session1");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("FileSystemSessionSource.listSessions() handles custom subdirectory", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const projectHash = "project2";
    const customPath = join(tempDir, projectHash, "history");
    await Deno.mkdir(customPath, { recursive: true });

    const sessionData = {
      sessionId: "session2",
      projectHash,
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      kind: "chat",
      messages: [],
    };

    await Deno.writeTextFile(
      join(customPath, "session2.json"),
      JSON.stringify(sessionData),
    );

    const source = new FileSystemSessionSource(
      "fs-custom",
      "Custom FS",
      "claudecode",
      tempDir,
      new GeminiParser(),
      "history",
    );
    const sessions = [];
    for await (const session of source.listSessions(projectHash)) {
      sessions.push(session);
    }

    assertEquals(sessions.length, 1);
    assertEquals(sessions[0].metadata.sessionId, "session2");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
