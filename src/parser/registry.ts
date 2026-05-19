import { Parser } from "./parser.ts";
import { GeminiParser } from "./session_parser.ts";
import { AgentType } from "../sync/source.ts";

export class ParserRegistry {
  private parsers = new Map<AgentType, Parser>();

  constructor() {
    // Default parsers
    this.register("gemini", new GeminiParser());
    // For now, others use GeminiParser if they have same format,
    // or we can add placeholders.
    this.register("claudecode", new GeminiParser());
    this.register("opencode", new GeminiParser());
    this.register("generic", new GeminiParser());
  }

  register(agentType: AgentType, parser: Parser) {
    this.parsers.set(agentType, parser);
  }

  getParser(agentType: AgentType): Parser {
    const parser = this.parsers.get(agentType);
    if (!parser) {
      throw new Error(`No parser registered for agent type: ${agentType}`);
    }
    return parser;
  }
}
