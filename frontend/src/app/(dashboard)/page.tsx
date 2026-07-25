'use client';

import { Header } from '@/components/layout/header';
import { McpToolCatalog } from '@/components/shared/mcp-tool-catalog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { ErrorState } from '@/components/shared/states';
import { PageLoader } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { FREE_TOOL_NAMES, PAID_TOOL_NAMES, formatToolPrice } from '@/lib/mcp-pricing';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  FlaskConical,
  GitCompare,
  Layers,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const freeQuickActions = [
  {
    href: '/wallet',
    title: 'Wallet',
    description: 'Check your balance and send HBAR',
    icon: Wallet,
    badge: 'Free',
  },
];

const paidQuickActions = [
  {
    href: '/protocols',
    title: 'Protocol Explorer',
    description: 'Live TVL, volume, and transactions',
    icon: Layers,
    badge: formatToolPrice('get_protocol'),
  },
  {
    href: '/compare',
    title: 'Compare Protocols',
    description: 'Head-to-head live metrics',
    icon: GitCompare,
    badge: formatToolPrice('compare_multiple_protocols'),
  },
  {
    href: '/market',
    title: 'Market Overview',
    description: 'Rankings across all protocols',
    icon: BarChart3,
    badge: formatToolPrice('market_summary'),
  },
  {
    href: '/research',
    title: 'Purchase Research',
    description: 'Pay with HBAR, get a markdown report',
    icon: FlaskConical,
    badge: formatToolPrice('purchase_research'),
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
        description="AI-native DeFi research powered by live on-chain data and Hedera Testnet."
        badge="Live Data"
      />

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Supported Protocols" value={String(protocolCount)} icon={Layers} />
        <KpiCard
          label="Features"
          value={String(FREE_TOOL_NAMES.length + PAID_TOOL_NAMES.length)}
          icon={Sparkles}
          accent="secondary"
          subtitle={`${FREE_TOOL_NAMES.length} free · ${PAID_TOOL_NAMES.length} premium`}
        />
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

      <h2 className="mb-4 text-xl font-semibold">Free</h2>
      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {freeQuickActions.map(({ href, title, description, icon: Icon, badge }) => (
          <Link key={href} href={href}>
            <Card className="h-full cursor-pointer border-success/20">
              <CardHeader>
                <div className="mb-2 flex items-center justify-between">
                  <div className="w-fit rounded-xl bg-success/10 p-2">
                    <Icon className="h-5 w-5 text-green-300" />
                  </div>
                  <Badge variant="success">{badge}</Badge>
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

      <h2 className="mb-4 text-xl font-semibold">Premium</h2>
      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paidQuickActions.map(({ href, title, description, icon: Icon, badge }) => (
          <Link key={href} href={href}>
            <Card className="h-full cursor-pointer border-accent/20">
              <CardHeader>
                <div className="mb-2 flex items-center justify-between">
                  <div className="w-fit rounded-xl bg-accent/10 p-2">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <Badge variant="accent">{badge}</Badge>
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

      <h2 className="mb-4 text-xl font-semibold">All features</h2>
      <McpToolCatalog />
    </motion.div>
  );
}
