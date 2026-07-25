import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-white/10 text-foreground',
  success: 'bg-success/15 text-green-300 border border-success/20',
  warning: 'bg-amber-500/15 text-amber-200 border border-amber-500/20',
  primary: 'bg-primary/15 text-blue-300 border border-primary/20',
  secondary: 'bg-secondary/15 text-purple-300 border border-secondary/20',
  accent: 'bg-accent/15 text-cyan-300 border border-accent/20',
  danger: 'bg-danger/15 text-red-300 border border-danger/20',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
