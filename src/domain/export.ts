import { SessionData } from "../types/session.ts";

/**
 * ExportBundle represents the standard schema for exporting session data.
 */
export interface ExportBundle {
  version: string;
  exportedAt: string;
  sessions: SessionData[];
}

/**
 * SessionFingerprint utility for generating stable, unique identifiers for sessions.
 * Used for reliable duplicate detection (Agent+Source+Timestamp+Hash).
 */
export class SessionFingerprint {
  /**
   * Generates a fingerprint string.
   * @param agent Name of the agent tool (e.g., "gemini", "claudecode")
   * @param source Identifier for the source location
   * @param timestamp Start time of the session
   * @param content Stringified content (messages) for hashing
   */
  static generate(
    agent: string,
    source: string,
    timestamp: string,
    content: string,
  ): string {
    const hash = this.simpleHash(content);
    return `${agent}|${source}|${timestamp}|${hash}`;
  }

  /**
   * Simple hash function for generating stable identifiers.
   * Note: This is a fast, non-cryptographic hash suitable for duplicate detection.
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }
}

/**
 * ArchiveService handles the serialization and deserialization of session data.
 */
export class ArchiveService {
  private static readonly CURRENT_VERSION = "1.0";

  /**
   * Bundles a list of sessions into a JSON string.
   */
  static bundle(sessions: SessionData[]): string {
    const bundle: ExportBundle = {
      version: this.CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      sessions,
    };
    return JSON.stringify(bundle, null, 2);
  }

  /**
   * Unbundles a JSON string back into an array of SessionData.
   */
  static unbundle(json: string): SessionData[] {
    const bundle: ExportBundle = JSON.parse(json);
    // Future-proofing: handle version migrations here if needed
    return bundle.sessions;
  }
}
