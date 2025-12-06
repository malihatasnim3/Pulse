import { spawn } from "node:child_process";
import path from "node:path";
import { NormalizedTrendTopic } from "./types";

/**
 * Calls the local Python helper that uses pytrends to fetch trends.
 * Requires Python + pytrends installed in the runtime.
 * Configure PYTRENDS_PYTHON (e.g., "python3") and PYTRENDS_SCRIPT_PATH if needed.
 */
export async function fetchPytrendsTopics(keywords: string[]): Promise<NormalizedTrendTopic[]> {
  const python = process.env.PYTRENDS_PYTHON || "python3";
  const script =
    process.env.PYTRENDS_SCRIPT_PATH ||
    path.join(process.cwd(), "pytrends_service", "fetch.py");

  const args = [script, ...keywords];

  const output = await new Promise<string>((resolve, reject) => {
    const proc = spawn(python, args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`pytrends script failed (code ${code}): ${stderr}`));
      }
      if (stderr) {
        console.warn("[pytrends] stderr:", stderr);
      }
      resolve(stdout);
    });
    proc.on("error", (err) => reject(err));
  });

  try {
    const parsed = JSON.parse(output) as NormalizedTrendTopic[];
    return parsed;
  } catch (err) {
    console.error("[pytrends] JSON parse failed", err, output);
    return [];
  }
}
