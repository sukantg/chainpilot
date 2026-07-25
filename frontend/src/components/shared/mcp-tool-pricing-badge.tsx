import { Badge } from '@/components/ui/badge';
import type { McpToolName } from '@/lib/mcp-definitions';
import { formatToolPrice, getToolTier } from '@/lib/mcp-pricing';
import { Coins, Sparkles } from 'lucide-react';

export function McpToolPricingBadge({
  tool,
  developerMode = false,
}: {
  tool: McpToolName;
  developerMode?: boolean;
}) {
  const tier = getToolTier(tool);

  if (tier === 'free') {
    return (
      <Badge variant="success" className="gap-1">
        <Sparkles className="h-3 w-3" />
        Free
      </Badge>
    );
  }

  return (
    <Badge variant="accent" className="gap-1">
      <Coins className="h-3 w-3" />
      {formatToolPrice(tool)}
      {developerMode ? ' via API' : ''}
    </Badge>
  );
}
