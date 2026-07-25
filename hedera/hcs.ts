import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';
import { createHash } from 'node:crypto';
import { getTestnetClient, ensureEnvLoaded } from './client.js';

export interface ReceiptPayload {
  tool: string;
  paymentTxId: string;
  payer?: string;
  args?: Record<string, unknown>;
  resultHash: string;
}

export function hashResult(data: unknown): string {
  const json = JSON.stringify(data);
  return createHash('sha256').update(json).digest('hex');
}

export async function ensureReceiptTopic(): Promise<string> {
  ensureEnvLoaded();
  const existing = process.env.HCS_RECEIPT_TOPIC_ID;
  if (existing) {
    return existing;
  }

  const client = getTestnetClient();
  const tx = await new TopicCreateTransaction()
    .setTopicMemo('ChainPilot x402 research receipts')
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const topicId = receipt.topicId?.toString();

  if (!topicId) {
    throw new Error('Failed to create HCS receipt topic');
  }

  return topicId;
}

export async function logReceiptToHCS(payload: ReceiptPayload): Promise<string> {
  ensureEnvLoaded();
  const topicId = process.env.HCS_RECEIPT_TOPIC_ID ?? (await ensureReceiptTopic());
  const client = getTestnetClient();

  const message = JSON.stringify({
    v: 1,
    service: 'chainpilot',
    ts: new Date().toISOString(),
    ...payload,
  });

  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message)
    .execute(client);

  return tx.transactionId.toString();
}
