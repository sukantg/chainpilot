import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MCP_TOOL_DEFINITIONS, MCP_TOOL_LABELS, type McpToolName } from '@/lib/mcp-definitions';
import {
  FREE_TOOL_NAMES,
  PAID_TOOL_NAMES,
} from '@/lib/mcp-pricing';
import { cn } from '@/lib/utils';
import { Coins, Sparkles } from 'lucide-react';
import { McpToolPricingBadge } from './mcp-tool-pricing-badge';

function ToolList({
  tools,
  onSelect,
  selectedTool,
  variant,
  developerMode,
}: {
  tools: McpToolName[];
  onSelect?: (tool: McpToolName) => void;
  selectedTool?: McpToolName;
  variant: 'free' | 'paid';
  developerMode: boolean;
}) {
  return (
    <ul className="space-y-2">
      {tools.map((tool) => {
        const selectable = Boolean(onSelect);
        const selected = selectedTool === tool;

        return (
          <li key={tool}>
            {selectable ? (
              <button
                type="button"
                onClick={() => onSelect?.(tool)}
                className={cn(
                  'flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                  selected
                    ? variant === 'paid'
                      ? 'border-accent/50 bg-accent/10'
                      : 'border-success/50 bg-success/10'
                    : variant === 'paid'
                      ? 'border-white/8 bg-black/20 hover:border-accent/30 hover:bg-accent/5'
                      : 'border-white/8 bg-black/20 hover:border-success/30 hover:bg-success/5',
                )}
              >
                <ToolRow tool={tool} developerMode={developerMode} />
              </button>
            ) : (
              <div
                className={cn(
                  'flex items-start justify-between gap-3 rounded-xl border px-4 py-3',
                  variant === 'paid'
                    ? 'border-accent/10 bg-black/20'
                    : 'border-success/10 bg-black/20',
                )}
              >
                <ToolRow tool={tool} developerMode={developerMode} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ToolRow({
  tool,
  developerMode,
}: {
  tool: McpToolName;
  developerMode: boolean;
}) {
  return (
    <>
      <div className="min-w-0">
        <p className={cn('text-sm text-foreground', developerMode && 'font-mono')}>
          {developerMode ? tool : MCP_TOOL_LABELS[tool]}
        </p>
        <p className="mt-1 text-xs text-muted">{MCP_TOOL_DEFINITIONS[tool].description}</p>
      </div>
      <McpToolPricingBadge tool={tool} developerMode={developerMode} />
    </>
  );
}

function ToolSection({
  title,
  description,
  icon: Icon,
  tools,
  variant,
  onSelect,
  selectedTool,
  developerMode,
}: {
  title: string;
  description: string;
  icon: typeof Sparkles;
  tools: McpToolName[];
  variant: 'free' | 'paid';
  onSelect?: (tool: McpToolName) => void;
  selectedTool?: McpToolName;
  developerMode: boolean;
}) {
  return (
    <Card className={variant === 'paid' ? 'border-accent/20' : 'border-success/20'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={cn('h-5 w-5', variant === 'paid' ? 'text-accent' : 'text-success')} />
          {title}
          <Badge variant={variant === 'paid' ? 'accent' : 'success'}>{tools.length}</Badge>
        </CardTitle>
        <p className="text-sm text-muted">{description}</p>
      </CardHeader>
      <CardContent>
        <ToolList
          tools={tools}
          onSelect={onSelect}
          selectedTool={selectedTool}
          variant={variant}
          developerMode={developerMode}
        />
      </CardContent>
    </Card>
  );
}

export function McpToolCatalog({
  onSelect,
  selectedTool,
  tier,
  developerMode = false,
}: {
  onSelect?: (tool: McpToolName) => void;
  selectedTool?: McpToolName;
  tier?: 'free' | 'paid';
  developerMode?: boolean;
}) {
  const freeTitle = developerMode ? 'Free tools' : 'Free features';
  const paidTitle = developerMode ? 'Paid tools' : 'Premium features';
  const freeDescription = developerMode
    ? 'No payment required on the public API.'
    : 'Included at no cost.';
  const paidDescription = developerMode
    ? 'Require HBAR payment on the public API.'
    : 'Paid with HBAR micropayments.';

  if (tier === 'free') {
    return (
      <ToolSection
        title={freeTitle}
        description={freeDescription}
        icon={Sparkles}
        tools={FREE_TOOL_NAMES}
        variant="free"
        onSelect={onSelect}
        selectedTool={selectedTool}
        developerMode={developerMode}
      />
    );
  }

  if (tier === 'paid') {
    return (
      <ToolSection
        title={paidTitle}
        description={paidDescription}
        icon={Coins}
        tools={PAID_TOOL_NAMES}
        variant="paid"
        onSelect={onSelect}
        selectedTool={selectedTool}
        developerMode={developerMode}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ToolSection
        title={freeTitle}
        description={freeDescription}
        icon={Sparkles}
        tools={FREE_TOOL_NAMES}
        variant="free"
        onSelect={onSelect}
        selectedTool={selectedTool}
        developerMode={developerMode}
      />
      <ToolSection
        title={paidTitle}
        description={paidDescription}
        icon={Coins}
        tools={PAID_TOOL_NAMES}
        variant="paid"
        onSelect={onSelect}
        selectedTool={selectedTool}
        developerMode={developerMode}
      />
    </div>
  );
}
