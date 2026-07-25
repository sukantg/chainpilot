import dotenv from 'dotenv';
import path from 'path';

let loaded = false;

export function loadBackendEnv(): void {
  if (loaded) return;

  // Vercel injects env vars directly — dotenv is a local fallback only.
  if (process.env.THE_GRAPH_API_KEY && process.env.HEDERA_ACCOUNT_ID) {
    loaded = true;
    return;
  }

  const root = path.join(process.cwd(), '..');
  dotenv.config({ path: path.join(root, '.env') });
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  loaded = true;
}
