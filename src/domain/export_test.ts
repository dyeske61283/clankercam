import { assertEquals } from "@std/assert";
import { ArchiveService, ExportBundle, SessionFingerprint } from "./export.ts";
import { SessionData } from "../types/session.ts";

const mockSession: SessionData = {
  metadata: {
    sessionId: "test-session",
    projectHash: "abc-123",
    startTime: "2024-05-19T10:00:00Z",
    lastUpdated: "2024-05-19T10:30:00Z",
    kind: "gemini",
  },
  messages: [
    {
      id: "msg-1",
      timestamp: "2024-05-19T10:00:00Z",
      type: "user",
      content: "Hello",
    },
  ],
};

Deno.test("SessionFingerprint generates stable ID", () => {
  const agent = "gemini";
  const source = "local-fs";
  const timestamp = "2024-05-19T10:00:00Z";
  const content = JSON.stringify(mockSession.messages);

  const fingerprint1 = SessionFingerprint.generate(
    agent,
    source,
    timestamp,
    content,
  );
  const fingerprint2 = SessionFingerprint.generate(
    agent,
    source,
    timestamp,
    content,
  );

  assertEquals(fingerprint1, fingerprint2);
  // Example of expected format: agent|source|timestamp|hash
  const parts = fingerprint1.split("|");
  assertEquals(parts.length, 4);
  assertEquals(parts[0], agent);
  assertEquals(parts[1], source);
  assertEquals(parts[2], timestamp);
});

Deno.test("ArchiveService bundles and unbundles sessions", () => {
  const sessions: SessionData[] = [mockSession];
  const json = ArchiveService.bundle(sessions);

  const bundle: ExportBundle = JSON.parse(json);
  assertEquals(bundle.version, "1.0");
  assertEquals(bundle.sessions.length, 1);
  assertEquals(bundle.sessions[0].metadata.sessionId, "test-session");

  const unbundled = ArchiveService.unbundle(json);
  assertEquals(unbundled.length, 1);
  assertEquals(unbundled[0].metadata.sessionId, "test-session");
});
