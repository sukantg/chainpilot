import dotenv from 'dotenv';
import path from 'node:path';
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

function loadEnv(): void {
  if (envLoaded) {
    return;
  }

  const root = process.cwd();
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
      PrivateKey.fromString(privateKey),
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
