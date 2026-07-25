'use client';

import { cn, formatCount, formatUsd } from '@/lib/utils';
import { motion } from 'framer-motion';

export function KpiCard({
  label,
  value,
  icon: Icon,
  accent = 'primary',
  subtitle,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: 'primary' | 'secondary' | 'accent';
  subtitle?: string;
}) {
  const colors = {
    primary: 'text-primary bg-primary/10',
    secondary: 'text-secondary bg-secondary/10',
    accent: 'text-accent bg-accent/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass glow-hover rounded-2xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        <div className={cn('rounded-xl p-2.5', colors[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

export function formatMetric(label: string, value: string): string {
  if (label.toLowerCase().includes('transaction')) return formatCount(value);
  return formatUsd(value);
}
