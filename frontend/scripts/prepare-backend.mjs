import { cpSync, existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const frontendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(frontendRoot, '..');
const backendDistSrc = path.join(repoRoot, 'dist');
const serverBackendDest = path.join(frontendRoot, 'src/server/chainpilot-backend');

function run(command, cwd) {
  console.log(`> ${command} (in ${cwd})`);
  execSync(command, { cwd, stdio: 'inherit' });
}

function removeDir(dir) {
  if (!existsSync(dir)) return;

  const trash = `${dir}-trash-${Date.now()}`;
  try {
    renameSync(dir, trash);
    rmSync(trash, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    return;
  } catch {
    // Fall through to shell removal below.
  }

  run(`rm -rf "${dir}"`, frontendRoot);
}

console.log('Preparing ChainPilot backend for deployment...');

if (!existsSync(path.join(repoRoot, 'package.json'))) {
  throw new Error(`Repo root not found at ${repoRoot}`);
}

const rootPackage = JSON.parse(
  readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
);

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

removeDir(serverBackendDest);

cpSync(backendDistSrc, serverBackendDest, { recursive: true });

const requiredModules = [
  'graph/compare.js',
  'graph/client.js',
  'graph/config.js',
  'hedera/client.js',
  'hedera/hcs.js',
  'src/purchase-research.js',
];

for (const modulePath of requiredModules) {
  const fullPath = path.join(serverBackendDest, modulePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Backend build missing required module: ${modulePath}`);
  }
}

console.log('Verified backend modules:', requiredModules.join(', '));

const backendPackage = {
  name: 'chainpilot-backend',
  type: 'module',
  private: true,
  dependencies: {
    '@hashgraph/sdk': rootPackage.dependencies['@hashgraph/sdk'],
    dotenv: rootPackage.dependencies.dotenv,
    graphql: rootPackage.dependencies.graph,
    'graphql-request': rootPackage.dependencies['graphql-request'],
  },
};

writeFileSync(
  path.join(serverBackendDest, 'package.json'),
  JSON.stringify(backendPackage, null, 2),
);

console.log('Installing backend runtime dependencies...');
run('npm install --omit=dev', serverBackendDest);

console.log(`ChainPilot backend ready at ${serverBackendDest}`);
