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
    const config = JSON.parse(configContent) as ClankerCamConfig;
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
