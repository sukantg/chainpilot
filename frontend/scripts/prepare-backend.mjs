import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const frontendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(frontendRoot, '..');
const backendDistSrc = path.join(repoRoot, 'dist');
const backendDistDest = path.join(frontendRoot, 'backend-dist');
const serverBackendDest = path.join(frontendRoot, 'src/server/chainpilot-backend');

function run(command, cwd) {
  console.log(`> ${command} (in ${cwd})`);
  execSync(command, { cwd, stdio: 'inherit' });
}

console.log('Preparing ChainPilot backend for deployment...');

if (!existsSync(path.join(repoRoot, 'package.json'))) {
  throw new Error(`Repo root not found at ${repoRoot}`);
}

const rootNodeModules = path.join(repoRoot, 'node_modules');
if (!existsSync(rootNodeModules)) {
  const installCmd = existsSync(path.join(repoRoot, 'package-lock.json'))
    ? 'npm ci'
    : 'npm install';
  run(installCmd, repoRoot);
} else {
  console.log('Root node_modules present, skipping install');
}

run('npm run build', repoRoot);

if (!existsSync(backendDistSrc)) {
  throw new Error(`Backend build failed: ${backendDistSrc} not found`);
}

if (existsSync(backendDistDest)) {
  rmSync(backendDistDest, { recursive: true, force: true });
}
if (existsSync(serverBackendDest)) {
  rmSync(serverBackendDest, { recursive: true, force: true });
}

cpSync(backendDistSrc, backendDistDest, { recursive: true });
cpSync(backendDistSrc, serverBackendDest, { recursive: true });

const esmPackageJson = JSON.stringify({ type: 'module' }, null, 2);
writeFileSync(path.join(backendDistDest, 'package.json'), esmPackageJson);
writeFileSync(path.join(serverBackendDest, 'package.json'), esmPackageJson);

console.log(`Copied backend to ${backendDistDest}`);
console.log(`Copied backend to ${serverBackendDest}`);
