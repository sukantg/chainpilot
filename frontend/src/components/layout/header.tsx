'use client';

import { Badge } from '@/components/ui/badge';

export function Header({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {badge && <Badge variant="accent">{badge}</Badge>}
        </div>
        {description && <p className="max-w-2xl text-muted">{description}</p>}
      </div>
    </div>
  );
}
