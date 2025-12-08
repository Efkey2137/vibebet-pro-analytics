import { cn } from '@/lib/utils';

const tiers = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'Free', label: 'Darmowe' },
  { value: '10 PLN', label: '10 zł' },
  { value: '20 PLN', label: '20 zł' },
  { value: '40 PLN', label: '40 zł' },
  { value: '75 PLN', label: '75 zł' },
  { value: '100 PLN', label: '100 zł' },
];

interface TierFilterProps {
  selectedTier: string;
  onTierChange: (tier: string) => void;
}

export function TierFilter({ selectedTier, onTierChange }: TierFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tiers.map((tier) => (
        <button
          key={tier.value}
          onClick={() => onTierChange(tier.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            selectedTier === tier.value
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {tier.label}
        </button>
      ))}
    </div>
  );
}
