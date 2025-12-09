import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const tiers = [
  { value: 'all', label: 'Wszystkie', shortLabel: 'Wszystkie' },
  { value: 'Free', label: 'Darmowe', shortLabel: 'Free' },
  { value: '10 PLN', label: '10 zł', shortLabel: '10zł' },
  { value: '20 PLN', label: '20 zł', shortLabel: '20zł' },
  { value: '40 PLN', label: '40 zł', shortLabel: '40zł' },
  { value: '75 PLN', label: '75 zł', shortLabel: '75zł' },
  { value: '100 PLN', label: '100 zł', shortLabel: '100zł' },
];

interface TierFilterProps {
  selectedTier: string;
  onTierChange: (tier: string) => void;
}

export function TierFilter({ selectedTier, onTierChange }: TierFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {tiers.map((tier) => (
          <button
            key={tier.value}
            onClick={() => onTierChange(tier.value)}
            className={cn(
              "px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0",
              selectedTier === tier.value
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <span className="sm:hidden">{tier.shortLabel}</span>
            <span className="hidden sm:inline">{tier.label}</span>
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="h-1.5" />
    </ScrollArea>
  );
}
