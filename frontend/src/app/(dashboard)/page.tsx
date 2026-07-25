'use client';

import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { ErrorState } from '@/components/shared/states';
import { PageLoader } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  FlaskConical,
  GitCompare,
  Layers,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const MCP_TOOL_COUNT = 8;

const quickActions = [
  {
    href: '/compare',
    title: 'Compare Protocols',
    description: 'Head-to-head live metrics',
    icon: GitCompare,
  },
  {
    href: '/market',
    title: 'Market Overview',
    description: 'Rankings across all protocols',
    icon: BarChart3,
  },
  {
    href: '/research',
    title: 'Purchase Research',
    description: 'Pay with HBAR, get reports',
    icon: FlaskConical,
  },
  {
    href: '/wallet',
    title: 'Wallet',
    description: 'Balance & transfers',
    icon: Wallet,
  },
  {
    href: '/protocols',
    title: 'Protocol Explorer',
    description: 'Live TVL, volume, txs',
    icon: Layers,
  },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [protocolCount, setProtocolCount] = useState(0);
  const [balance, setBalance] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [protocols, setProtocols] = useState<Array<{ id: string; name: string }>>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const protocolsRes = await api.listProtocols();
      const items = protocolsRes.data.protocols ?? [];
      setProtocols(items);
      setProtocolCount(items.length);

      try {
        const walletRes = await api.walletBalance();
        setBalance(walletRes.data.hbar);
        setAccountId(walletRes.data.accountId);
      } catch (walletErr) {
        setBalance('Unavailable');
        setAccountId(
          walletErr instanceof Error ? walletErr.message : 'Wallet not configured',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Header
        title="Dashboard"
        description="AI-native DeFi research platform powered by live MCP tools, The Graph, and Hedera Testnet."
        badge="Live Data"
      />

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Supported Protocols" value={String(protocolCount)} icon={Layers} />
        <KpiCard label="MCP Tools" value={String(MCP_TOOL_COUNT)} icon={Wrench} accent="secondary" />
        <KpiCard
          label="HBAR Balance"
          value={balance ?? '—'}
          icon={Wallet}
          accent="accent"
          subtitle={accountId ?? undefined}
        />
        <KpiCard
          label="Wallet Status"
          value={balance === 'Unavailable' ? 'Not configured' : 'Connected'}
          icon={Zap}
          subtitle="Hedera Testnet"
        />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {protocols.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                {p.name}
                <Badge variant="success">Live</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/protocols?protocol=${p.id}`}>
                <Button variant="ghost" size="sm">
                  View metrics
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickActions.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full cursor-pointer">
              <CardHeader>
                <div className="mb-2 w-fit rounded-xl bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
