'use client';

import { Header } from '@/components/layout/header';
import { ErrorState } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Select } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { FileText, ShoppingCart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PurchaseResult {
  report: string;
  payment: {
    transactionHash: string;
    status: string;
    amount: number;
    recipient: string;
  };
}

export default function ResearchPage() {
  const [protocols, setProtocols] = useState<Array<{ id: string; name: string }>>([]);
  const [protocolA, setProtocolA] = useState('uniswap');
  const [protocolB, setProtocolB] = useState('aave');
  const [amount, setAmount] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);

  useEffect(() => {
    void api.listProtocols().then((res) => setProtocols(res.data.protocols));
  }, []);

  async function purchase() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.purchaseResearch(protocolA, protocolB, Number(amount));
      if (res.isError) throw new Error(JSON.stringify(res.data));
      setResult(res.data as PurchaseResult);
      toast.success('Research report purchased');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Purchase failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header
        title="Purchase Research"
        description="Pay with HBAR on Hedera Testnet and receive a deterministic markdown research report."
        badge="AI Research"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-5 w-5 text-secondary" />
            Research Purchase
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 md:items-end">
          <div className="space-y-2">
            <Label>Protocol A</Label>
            <Select value={protocolA} onChange={(e) => setProtocolA(e.target.value)}>
              {protocols.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Protocol B</Label>
            <Select value={protocolB} onChange={(e) => setProtocolB(e.target.value)}>
              {protocols.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Research Price (HBAR)</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <Button onClick={purchase} disabled={loading || protocolA === protocolB}>
            {loading ? 'Processing…' : 'Purchase Report'}
          </Button>
        </CardContent>
      </Card>

      {loading && <PageLoader />}
      {error && !loading && <ErrorState message={error} onRetry={purchase} />}

      {result && !loading && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-3">
              <div>
                <p className="text-muted">HBAR Paid</p>
                <p className="font-medium">{result.payment.amount} ℏ</p>
              </div>
              <div>
                <p className="text-muted">Transaction ID</p>
                <p className="font-mono text-xs">{result.payment.transactionHash}</p>
              </div>
              <div>
                <p className="text-muted">Status</p>
                <Badge variant="success">{result.payment.status}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Research Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <article className="markdown-report max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.report}</ReactMarkdown>
              </article>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
