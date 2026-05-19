export interface SessionMetadata {
  sessionId: string;
  projectHash: string;
  startTime: string;
  lastUpdated: string;
  kind: string;
  tags?: string[];
  comment?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown[];
  status?: string;
  timestamp?: string;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cache?: number;
}

export interface Message {
  id: string;
  timestamp: string;
  type: "gemini" | "user";
  content: string;
  toolCalls?: ToolCall[];
  tokenUsage?: TokenUsage;
}

export interface SessionData {
  metadata: SessionMetadata;
  messages: Message[];
}
