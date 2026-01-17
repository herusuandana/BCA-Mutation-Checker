import * as fs from "fs";
import * as path from "path";
import { Config } from "../types/config";

/**
 * Error thrown when configuration file cannot be loaded
 */
export class ConfigLoadError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "ConfigLoadError";
  }
}

/**
 * Load configuration from a JSON file
 * @param configPath - Path to the configuration file
 * @returns Parsed configuration object
 * @throws ConfigLoadError if file cannot be read or parsed
 */
export function loadConfig(configPath: string): Config {
  try {
    // Check if file exists
    if (!fs.existsSync(configPath)) {
      throw new ConfigLoadError(`Configuration file not found: ${configPath}`);
    }

    // Read file content
    const fileContent = fs.readFileSync(configPath, "utf-8");

    // Parse JSON
    let config: Config;
    try {
      config = JSON.parse(fileContent);
    } catch (parseError) {
      throw new ConfigLoadError(
        `Failed to parse configuration file: ${configPath}`,
        parseError as Error,
      );
    }

    return config;
  } catch (error) {
    if (error instanceof ConfigLoadError) {
      throw error;
    }
    throw new ConfigLoadError(
      `Failed to load configuration from ${configPath}`,
      error as Error,
    );
  }
}

/**
 * Load configuration from default locations
 * Tries the following paths in order:
 * 1. ./config/config.json
 * 2. ./config.json
 * 3. Environment variable CONFIG_PATH
 * @returns Parsed configuration object
 * @throws ConfigLoadError if no configuration file is found
 */
export function loadDefaultConfig(): Config {
  const defaultPaths = [
    path.join(process.cwd(), "config", "config.json"),
    path.join(process.cwd(), "config.json"),
  ];

  // Add path from environment variable if set
  if (process.env.CONFIG_PATH) {
    defaultPaths.unshift(process.env.CONFIG_PATH);
  }

  for (const configPath of defaultPaths) {
    if (fs.existsSync(configPath)) {
      return loadConfig(configPath);
    }
  }

  throw new ConfigLoadError(
    "No configuration file found. Tried: " + defaultPaths.join(", "),
  );
}
