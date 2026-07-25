'use client';

import { Header } from '@/components/layout/header';
import { ErrorState } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { CheckCircle2, Send, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<{ accountId: string; hbar: string } | null>(null);
  const [recipient, setRecipient] = useState('0.0.3');
  const [amount, setAmount] = useState('1');
  const [transferring, setTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<{
    transactionHash: string;
    status: string;
  } | null>(null);

  async function loadBalance() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.walletBalance();
      if (res.isError) throw new Error(JSON.stringify(res.data));
      setBalance(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBalance();
  }, []);

  async function sendTransfer() {
    setTransferring(true);
    setTransferResult(null);
    try {
      const res = await api.transferHbar(recipient, Number(amount));
      if (res.isError) throw new Error(JSON.stringify(res.data));
      setTransferResult(res.data as { transactionHash: string; status: string });
      toast.success('Transfer submitted');
      await loadBalance();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  }

  if (loading) return <PageLoader />;
  if (error || !balance) return <ErrorState message={error ?? 'Wallet unavailable'} onRetry={loadBalance} />;

  return (
    <>
      <Header
        title="Wallet"
        description="Hedera Testnet wallet — live balance and HBAR transfers."
        badge="Hedera Payments"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-accent" />
              Wallet Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted">Address</p>
              <p className="mt-1 font-mono text-sm">{balance.accountId}</p>
            </div>
            <div>
              <p className="text-sm text-muted">HBAR Balance</p>
              <p className="mt-1 text-3xl font-semibold">{balance.hbar}</p>
            </div>
            <Badge variant="success">Connected · Testnet</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Transfer HBAR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0.0.123456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (HBAR)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <Button onClick={sendTransfer} disabled={transferring} className="w-full">
              {transferring ? 'Sending…' : 'Send HBAR'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {transferResult && (
        <Card className="mt-6 border-success/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-300">
              <CheckCircle2 className="h-5 w-5" />
              Transaction Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted">Status:</span> {transferResult.status}</p>
            <p><span className="text-muted">Transaction ID:</span> <span className="font-mono">{transferResult.transactionHash}</span></p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
