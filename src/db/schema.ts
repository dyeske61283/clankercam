import { DB } from "@sqlite";

export function initDb(path: string) {
  const db = new DB(path);

  db.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL
    )
  `);

  db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      kind TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    )
  `);

  db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      type TEXT,
      content TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    )
  `);

  db.execute(`
    CREATE TABLE IF NOT EXISTS tool_calls (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      name TEXT NOT NULL,
      args TEXT NOT NULL,
      status TEXT,
      timestamp TEXT,
      FOREIGN KEY(message_id) REFERENCES messages(id)
    )
  `);

  db.execute(`
    CREATE TABLE IF NOT EXISTS token_usage (
      session_id TEXT PRIMARY KEY,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    )
  `);

  return db;
}
