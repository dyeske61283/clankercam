import { DB } from "@sqlite";
import { Message, SessionData, TokenUsage } from "../types/session.ts";

export interface SessionRepository {
  saveSession(projectHash: string, session: SessionData): void;
  saveProject(projectHash: string): void;
  saveTokenUsage(
    sessionId: string,
    inputTokens: number,
    outputTokens: number,
    totalTokens: number,
    cacheTokens: number,
  ): void;
  getGlobalStats(): {
    totalSessions: number;
    totalToolCalls: number;
    totalTokens: number;
    totalCacheTokens: number;
    topTools: { name: string; count: number }[];
  };
  getAllProjects(): { id: string; path: string; sessionCount: number }[];
  getProjectSessions(
    projectId: string,
  ): {
    id: string;
    startTime: string;
    lastUpdated: string;
    kind: string;
    messageCount: number;
    toolCallCount: number;
  }[];
  getSession(sessionId: string): {
    sessionId: string;
    metadata: Record<string, unknown>;
    messages: Message[];
    tokenUsage?: TokenUsage;
  };
}

export class SQLiteSessionRepository implements SessionRepository {
  constructor(private db: DB) {}

  saveProject(projectHash: string): void {
    this.db.query("INSERT OR IGNORE INTO projects (id, path) VALUES (?, ?)", [
      projectHash,
      "unknown",
    ]);
  }

  saveSession(projectHash: string, session: SessionData): void {
    this.withTransaction(() => {
      const { metadata, messages } = session;

      this.db.query(
        "INSERT INTO sessions (id, project_id, start_time, last_updated, kind, metadata) VALUES (?, ?, ?, ?, ?, ?)",
        [
          metadata.sessionId,
          projectHash,
          metadata.startTime,
          metadata.lastUpdated,
          metadata.kind,
          JSON.stringify({ tags: metadata.tags, comment: metadata.comment }),
        ],
      );

      for (const msg of messages) {
        this.db.query(
          "INSERT INTO messages (id, session_id, type, content, timestamp) VALUES (?, ?, ?, ?, ?)",
          [
            msg.id,
            metadata.sessionId,
            msg.type,
            typeof msg.content === "string"
              ? msg.content
              : JSON.stringify(msg.content),
            msg.timestamp,
          ],
        );

        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            this.db.query(
              "INSERT INTO tool_calls (id, message_id, name, args, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
              [
                tc.id,
                msg.id,
                tc.name,
                JSON.stringify(tc.args),
                tc.status || "unknown",
                tc.timestamp || msg.timestamp,
              ],
            );
          }
        }
      }
    });
  }

  private inTransaction = false;

  withTransaction<T>(fn: () => T): T {
    if (this.inTransaction) {
      return fn();
    }

    this.inTransaction = true;
    this.db.query("BEGIN TRANSACTION");
    try {
      const result = fn();
      this.db.query("COMMIT");
      return result;
    } catch (e) {
      this.db.query("ROLLBACK");
      throw e;
    } finally {
      this.inTransaction = false;
    }
  }

  saveTokenUsage(
    sessionId: string,
    inputTokens: number,
    outputTokens: number,
    totalTokens: number,
    cacheTokens: number,
  ): void {
    this.db.query(
      "INSERT INTO token_usage (session_id, input_tokens, output_tokens, total_tokens, cache_tokens) VALUES (?, ?, ?, ?, ?)",
      [sessionId, inputTokens, outputTokens, totalTokens, cacheTokens],
    );
  }

  getGlobalStats() {
    const totalSessions = this.db.query(
      "SELECT count(*) FROM sessions",
    )[0][0] as number;
    const totalToolCalls = this.db.query(
      "SELECT count(*) FROM tool_calls",
    )[0][0] as number;
    const totalTokens = (this.db.query(
      "SELECT sum(total_tokens) FROM token_usage",
    )[0][0] as number) || 0;
    const totalCacheTokens = (this.db.query(
      "SELECT sum(cache_tokens) FROM token_usage",
    )[0][0] as number) || 0;
    const topTools = this.db.query(
      "SELECT name, count(*) as count FROM tool_calls GROUP BY name ORDER BY count DESC LIMIT 10",
    );

    return {
      totalSessions,
      totalToolCalls,
      totalTokens,
      totalCacheTokens,
      topTools: topTools.map(([name, count]) => ({
        name: name as string,
        count: count as number,
      })),
    };
  }

  getAllProjects() {
    const projects = this.db.query(`
      SELECT p.id, p.path, count(s.id) as session_count
      FROM projects p
      LEFT JOIN sessions s ON p.id = s.project_id
      GROUP BY p.id
    `);

    return projects.map(([id, path, sessionCount]) => ({
      id: id as string,
      path: path as string,
      sessionCount: sessionCount as number,
    }));
  }

  getProjectSessions(projectId: string) {
    const sessions = this.db.query(
      `
      SELECT s.id, s.start_time, s.last_updated, s.kind,
             (SELECT count(*) FROM messages WHERE session_id = s.id) as message_count,
             (SELECT count(*) FROM tool_calls tc JOIN messages m ON tc.message_id = m.id WHERE m.session_id = s.id) as tool_call_count
      FROM sessions s
      WHERE s.project_id = ?
      ORDER BY s.start_time DESC
    `,
      [projectId],
    );

    return sessions.map((
      [id, startTime, lastUpdated, kind, messageCount, toolCallCount],
    ) => ({
      id: id as string,
      startTime: startTime as string,
      lastUpdated: lastUpdated as string,
      kind: kind as string,
      messageCount: messageCount as number,
      toolCallCount: toolCallCount as number,
    }));
  }

  getSession(sessionId: string) {
    const session = this.db.query(
      `SELECT metadata FROM sessions WHERE id = ?`,
      [sessionId],
    )[0];

    const metadata = session ? JSON.parse(session[0] as string) : {};

    const tokenUsage = this.db.query(
      `SELECT input_tokens, output_tokens, total_tokens, cache_tokens FROM token_usage WHERE session_id = ?`,
      [sessionId],
    )[0];

    const messages = this.db.query(
      `
      SELECT id, type, content, timestamp
      FROM messages
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `,
      [sessionId],
    );

    const result = [];
    for (const [id, type, content, timestamp] of messages) {
      const toolCalls = this.db.query(
        `
        SELECT id, name, args, status, timestamp
        FROM tool_calls
        WHERE message_id = ?
      `,
        [id as unknown as import("@sqlite").QueryParameter],
      );

      result.push({
        id: id as string,
        type: type as Message["type"],
        content: content as string,
        timestamp: timestamp as string,
        toolCalls: toolCalls.map(([tid, name, args, status, ttimestamp]) => ({
          id: tid as string,
          name: name as string,
          args: JSON.parse(args as string),
          status: status as string,
          timestamp: ttimestamp as string,
        })),
      });
    }

    return {
      sessionId,
      metadata,
      messages: result,
      tokenUsage: tokenUsage
        ? {
          input: tokenUsage[0] as number,
          output: tokenUsage[1] as number,
          total: tokenUsage[2] as number,
          cache: tokenUsage[3] as number,
        }
        : undefined,
    };
  }

  updateSessionMetadata(
    sessionId: string,
    metadata: { tags?: string[]; comment?: string },
  ): void {
    const existing = this.getSession(sessionId);
    const updatedMetadata = { ...existing.metadata, ...metadata };
    this.db.query(
      `UPDATE sessions SET metadata = ? WHERE id = ?`,
      [JSON.stringify(updatedMetadata), sessionId],
    );
  }
}
