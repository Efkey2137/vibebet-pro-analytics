import { ArrowRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TierGroupCardProps {
  title: string;
  description: string;
  count: number;
  priceLabel: string;
  onClick: () => void;
}

export function TierGroupCard({ title, description, count, priceLabel, onClick }: TierGroupCardProps) {
  return (
    <div 
      onClick={onClick}
      className="card-betting rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between h-full min-h-[200px]"
    >
      {/* Hover Effect Background */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div>
        <div className="flex justify-between items-start mb-4">
          <Badge variant="outline" className={cn(
            "text-xs font-display tracking-wider",
            priceLabel === 'Free' ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary"
          )}>
            {priceLabel === 'Free' ? 'DARMOWE' : priceLabel}
          </Badge>
          <div className="flex items-center gap-1.5 text-muted-foreground bg-background/50 px-2 py-1 rounded-md text-xs">
            <Layers className="w-3.5 h-3.5" />
            <span className="font-mono font-bold text-foreground">{count}</span>
          </div>
        </div>

        <h3 className="text-xl font-bold font-display mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
          {count} {count === 1 ? 'dostępny typ' : count > 1 && count < 5 ? 'dostępne typy' : 'dostępnych typów'}
        </span>
        <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent text-primary hover:text-primary/80">
          Otwórz <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}