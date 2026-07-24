import { compareProtocols } from '../graph/compare.js';
import { formatProtocolComparisonReport } from '../graph/report.js';
import { ensureEnvLoaded, getBalance, transferHBAR } from '../hedera/client.js';

const DEFAULT_RESEARCH_PRICE_HBAR = 1;

export interface PurchaseResearchInput {
  protocolA: string;
  protocolB: string;
  amount: number;
  recipient?: string;
}

export interface PurchaseResearchResult {
  report: string;
  payment: {
    transactionHash: string;
    status: string;
    amount: number;
    recipient: string;
  };
}

function parseHbarBalance(hbar: string): number {
  const value = Number.parseFloat(hbar.replace(/[^\d.-]/g, ''));
  if (Number.isNaN(value)) {
    throw new Error(`Unable to parse wallet balance: ${hbar}`);
  }
  return value;
}

function getResearchPrice(): number {
  const configured = process.env.RESEARCH_PRICE_HBAR;
  if (!configured) {
    return DEFAULT_RESEARCH_PRICE_HBAR;
  }

  const price = Number(configured);
  if (Number.isNaN(price) || price <= 0) {
    throw new Error('RESEARCH_PRICE_HBAR must be a positive number');
  }

  return price;
}

function getPaymentRecipient(recipient?: string): string {
  const paymentRecipient =
    recipient ?? process.env.RESEARCH_PAYMENT_RECIPIENT;

  if (!paymentRecipient) {
    throw new Error(
      'Missing payment recipient. Provide recipient or set RESEARCH_PAYMENT_RECIPIENT in .env',
    );
  }

  return paymentRecipient;
}

export async function purchaseResearch(
  input: PurchaseResearchInput,
): Promise<PurchaseResearchResult> {
  ensureEnvLoaded();

  const requiredPrice = getResearchPrice();
  const recipient = getPaymentRecipient(input.recipient);

  if (input.amount < requiredPrice) {
    throw new Error(
      `Payment amount ${input.amount} HBAR is below the required price of ${requiredPrice} HBAR`,
    );
  }

  const balance = await getBalance();
  const availableHbar = parseHbarBalance(balance.hbar);

  if (availableHbar < input.amount) {
    throw new Error(
      `Insufficient balance: ${balance.hbar} available, ${input.amount} HBAR required`,
    );
  }

  const transfer = await transferHBAR(recipient, input.amount);
  const comparison = await compareProtocols(input.protocolA, input.protocolB);

  const report = formatProtocolComparisonReport(comparison, {
    amount: input.amount,
    recipient,
    transactionHash: transfer.transactionId,
    status: transfer.status,
  });

  return {
    report,
    payment: {
      transactionHash: transfer.transactionId,
      status: transfer.status,
      amount: input.amount,
      recipient,
    },
  };
}
