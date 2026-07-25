'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Code2,
  FlaskConical,
  LayoutDashboard,
  Layers,
  Settings,
  GitCompare,
  Wallet,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatToolPrice } from '@/lib/mcp-pricing';

const freeNav = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    badge: 'Free',
    badgeVariant: 'success' as const,
  },
  {
    href: '/wallet',
    label: 'Wallet',
    icon: Wallet,
    badge: 'Free',
    badgeVariant: 'success' as const,
  },
];

const paidNav = [
  {
    href: '/protocols',
    label: 'Protocols',
    icon: Layers,
    badge: formatToolPrice('get_protocol'),
    badgeVariant: 'accent' as const,
  },
  {
    href: '/compare',
    label: 'Compare',
    icon: GitCompare,
    badge: formatToolPrice('compare_multiple_protocols'),
    badgeVariant: 'accent' as const,
  },
  {
    href: '/compare-multiple',
    label: 'Compare Multiple',
    icon: BarChart3,
    badge: formatToolPrice('compare_multiple_protocols'),
    badgeVariant: 'accent' as const,
  },
  {
    href: '/market',
    label: 'Market',
    icon: Zap,
    badge: formatToolPrice('market_summary'),
    badgeVariant: 'accent' as const,
  },
  {
    href: '/research',
    label: 'Research',
    icon: FlaskConical,
    badge: formatToolPrice('purchase_research'),
    badgeVariant: 'accent' as const,
  },
];

const utilityNav = [
  { href: '/developer', label: 'Developer Console', icon: Code2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavLink({
  href,
  label,
  icon: Icon,
  badge,
  badgeVariant,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  badgeVariant?: 'success' | 'accent';
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        active
          ? 'bg-primary/15 text-blue-200'
          : 'text-zinc-400 hover:bg-white/5 hover:text-foreground',
      )}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
      {badge && (
        <Badge variant={badgeVariant ?? 'default'} className="shrink-0 text-[10px]">
          {badge}
        </Badge>
      )}
    </Link>
  );
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      {children}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="glass fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/8">
      <div className="border-b border-white/8 px-5 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold tracking-tight">ChainPilot</p>
            <p className="text-xs text-muted">AI-native DeFi research</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Main navigation">
        <NavSection title="Free">
          {freeNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>
        <NavSection title="Premium">
          {paidNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>
        <NavSection title="Developer">
          {utilityNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>
      </nav>
      <div className="border-t border-white/8 p-4">
        <p className="text-xs text-muted">Live DeFi data · Hedera Testnet</p>
      </div>
    </aside>
  );
}
