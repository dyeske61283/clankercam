import { SessionData, TokenUsage } from "../types/session.ts";

export class Session {
  constructor(public readonly data: SessionData) {}

  get tokenUsage(): TokenUsage {
    const input = this.data.messages.reduce(
      (sum, msg) => sum + (msg.tokenUsage?.input ?? 0),
      0,
    );
    const output = this.data.messages.reduce(
      (sum, msg) => sum + (msg.tokenUsage?.output ?? 0),
      0,
    );
    const cache = this.data.messages.reduce(
      (sum, msg) => sum + (msg.tokenUsage?.cache ?? 0),
      0,
    );
    return { input, output, total: input + output + cache, cache };
  }

  get inputTokens(): number {
    return this.tokenUsage.input;
  }

  get outputTokens(): number {
    return this.tokenUsage.output;
  }

  get totalTokens(): number {
    return this.tokenUsage.total;
  }
}
