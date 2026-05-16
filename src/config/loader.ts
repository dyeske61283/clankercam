import { ClankerCamConfig } from "./schema.ts";

export async function loadConfig(
  configPath: string,
): Promise<ClankerCamConfig> {
  const defaultProbePaths = [
    "/tmp/gemini/logs",
    "/tmp/opencode/logs",
    "/tmp/claudecode/logs",
  ];
  try {
    const configContent = await Deno.readTextFile(configPath);
    let config: ClankerCamConfig;
    try {
      config = JSON.parse(configContent) as ClankerCamConfig;
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(
          `Failed to parse config at ${configPath}: ${e.message}`,
        );
      }
      throw e;
    }
    return {
      ...config,
      probePaths: config.probePaths ?? defaultProbePaths,
    };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return { sources: [], probePaths: defaultProbePaths };
    }
    throw error;
  }
}
