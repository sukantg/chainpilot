import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AccountBalanceQuery,
  Client,
  Hbar,
  PrivateKey,
  TransferTransaction,
} from '@hashgraph/sdk';

export interface BalanceResult {
  accountId: string;
  hbar: string;
  tinybars: string;
}

export interface TransferResult {
  transactionId: string;
  status: string;
  from: string;
  to: string;
  amount: string;
}

interface HederaCredentials {
  accountId: string;
  privateKey: string;
}

let envLoaded = false;

function getProjectRoot(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));

  if (currentDir.endsWith(`${path.sep}dist${path.sep}hedera`)) {
    return path.resolve(currentDir, '../..');
  }

  return path.resolve(currentDir, '..');
}

function parsePrivateKey(privateKey: string): PrivateKey {
  const trimmed = privateKey.trim();
  const keyType = process.env.HEDERA_PRIVATE_KEY_TYPE?.toLowerCase();

  if (keyType === 'ecdsa') {
    return PrivateKey.fromStringECDSA(trimmed);
  }

  if (keyType === 'ed25519') {
    return PrivateKey.fromStringED25519(trimmed);
  }

  if (keyType === 'der') {
    return PrivateKey.fromStringDer(trimmed);
  }

  if (trimmed.startsWith('0x') || /^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return PrivateKey.fromStringECDSA(trimmed);
  }

  if (PrivateKey.isDerKey(trimmed)) {
    return PrivateKey.fromStringDer(trimmed);
  }

  return PrivateKey.fromStringED25519(trimmed);
}

function loadEnv(): void {
  if (envLoaded) {
    return;
  }

  const root = getProjectRoot();
  dotenv.config({ path: path.join(root, '.env') });

  if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
    dotenv.config({ path: path.join(root, 'src', '.env') });
  }

  envLoaded = true;
}

function getCredentials(): HederaCredentials {
  loadEnv();
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error(
      'Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in .env',
    );
  }

  return { accountId, privateKey };
}

let testnetClient: Client | null = null;

function getTestnetClient(): Client {
  loadEnv();

  if (!testnetClient) {
    const { accountId, privateKey } = getCredentials();
    testnetClient = Client.forTestnet().setOperator(
      accountId,
      parsePrivateKey(privateKey),
    );
  }

  return testnetClient;
}

export async function getBalance(accountId?: string): Promise<BalanceResult> {
  const { accountId: operatorAccountId } = getCredentials();
  const targetAccountId = accountId ?? operatorAccountId;
  const client = getTestnetClient();

  const balance = await new AccountBalanceQuery()
    .setAccountId(targetAccountId)
    .execute(client);

  return {
    accountId: targetAccountId,
    hbar: balance.hbars.toString(),
    tinybars: balance.hbars.toTinybars().toString(),
  };
}

export async function transferHBAR(
  toAccountId: string,
  amount: number,
): Promise<TransferResult> {
  if (amount <= 0) {
    throw new Error('Transfer amount must be greater than 0');
  }

  const { accountId: fromAccountId } = getCredentials();
  const client = getTestnetClient();

  const response = await new TransferTransaction()
    .addHbarTransfer(fromAccountId, new Hbar(-amount))
    .addHbarTransfer(toAccountId, new Hbar(amount))
    .execute(client);

  const receipt = await response.getReceipt(client);

  return {
    transactionId: response.transactionId.toString(),
    status: receipt.status.toString(),
    from: fromAccountId,
    to: toAccountId,
    amount: `${amount} ℏ`,
  };
}

export function ensureEnvLoaded(): void {
  loadEnv();
}

export function closeClient(): void {
  testnetClient?.close();
  testnetClient = null;
}
