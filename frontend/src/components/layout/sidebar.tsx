'use client';

import Image from 'next/image';
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
import { cn } from '@/lib/utils';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/protocols', label: 'Protocols', icon: Layers },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/compare-multiple', label: 'Compare Multiple', icon: BarChart3 },
  { href: '/market', label: 'Market', icon: Zap },
  { href: '/research', label: 'Research', icon: FlaskConical },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/developer', label: 'Developer Console', icon: Code2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/8">
      <div className="border-b border-white/8 px-5 py-6">
        <Link href="/" className="block">
          <Image
            src="/chainpilot-logo.png"
            alt="ChainPilot"
            width={160}
            height={160}
            className="h-auto w-full max-w-[160px] rounded-xl"
            priority
          />
          <p className="mt-3 text-xs text-muted">AI-native DeFi research</p>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                active
                  ? 'bg-primary/15 text-blue-200'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/8 p-4">
        <p className="text-xs text-muted">Powered by MCP · The Graph · Hedera</p>
      </div>
    </aside>
  );
}
