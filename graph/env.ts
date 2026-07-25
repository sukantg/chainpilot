import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let envLoaded = false;

function getProjectRoot(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));

  if (currentDir.endsWith(`${path.sep}dist${path.sep}graph`)) {
    return path.resolve(currentDir, '../..');
  }

  return path.resolve(currentDir, '..');
}

export function loadGraphEnv(): void {
  if (envLoaded) {
    return;
  }

  const root = getProjectRoot();
  dotenv.config({ path: path.join(root, '.env') });

  if (!process.env.THE_GRAPH_API_KEY) {
    dotenv.config({ path: path.join(root, 'src', '.env') });
  }

  envLoaded = true;
}

export function getGraphApiKey(): string {
  loadGraphEnv();

  const apiKey = process.env.THE_GRAPH_API_KEY;
  if (!apiKey) {
    throw new Error('Missing THE_GRAPH_API_KEY in .env');
  }

  return apiKey;
}
