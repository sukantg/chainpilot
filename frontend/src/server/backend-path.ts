import path from 'path';
import { existsSync } from 'fs';

/** Resolve compiled ChainPilot backend (local dev vs Vercel). */
export function resolveBackendDist(): string {
  const candidates = [
    path.join(process.cwd(), 'backend-dist'),
    path.join(process.cwd(), '..', 'dist'),
  ];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'graph', 'compare.js'))) {
      return candidate;
    }
  }

  throw new Error(
    'ChainPilot backend not found. Run "npm run build:backend" from frontend/ or deploy with vercel-build.',
  );
}
