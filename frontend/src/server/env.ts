import dotenv from 'dotenv';
import path from 'path';

let loaded = false;

export function loadBackendEnv(): void {
  if (loaded) return;

  const root = path.join(process.cwd(), '..');
  dotenv.config({ path: path.join(root, '.env') });
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  loaded = true;
}
