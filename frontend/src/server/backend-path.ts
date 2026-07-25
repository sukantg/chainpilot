import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

function isBackendDist(dir: string): boolean {
  return existsSync(path.join(dir, 'graph', 'compare.js'));
}

/** Resolve compiled ChainPilot backend (local dev vs Vercel serverless). */
export function resolveBackendDist(moduleUrl?: string): string {
  const candidates: string[] = [
    path.join(process.cwd(), 'src/server/chainpilot-backend'),
    path.join(process.cwd(), 'frontend/src/server/chainpilot-backend'),
  ];

  if (moduleUrl) {
    const here = path.dirname(fileURLToPath(moduleUrl));
    let current = here;
    for (let i = 0; i < 8; i++) {
      candidates.push(path.join(current, 'chainpilot-backend'));
      current = path.dirname(current);
    }
  }

  for (const candidate of candidates) {
    if (isBackendDist(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `ChainPilot backend not found. Tried: ${candidates.slice(0, 4).join(', ')}…`,
  );
}
