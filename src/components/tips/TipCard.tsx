import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Lock, CheckCircle2, XCircle, Clock, RotateCcw, Eye, Trophy, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export interface Tip {
  id: string;
  created_at: string;
  match_date: string;
  home_team: string;
  away_team: string;
  league: string;
  pick: string;
  odds: number;
  stake: number;
  pricing_tier: string;
  status: 'Pending' | 'Won' | 'Lost' | 'Void';
  analysis: string | null;
  is_bet_builder: boolean;
  proof_image_url: string | null;
  settled_at: string | null;
}

interface TipCardProps {
  tip: Tip;
  isUnlocked: boolean;
  onBuy?: () => void;
  showBuyButton?: boolean;
}

const statusConfig = {
  Pending: { 
    icon: Clock, 
    label: 'Oczekujący', 
    className: 'status-pending',
    badgeClass: 'bg-pending/20 text-pending border-pending/30'
  },
  Won: { 
    icon: CheckCircle2, 
    label: 'Wygrany', 
    className: 'status-won',
    badgeClass: 'bg-won/20 text-won border-won/30'
  },
  Lost: { 
    icon: XCircle, 
    label: 'Przegrany', 
    className: 'status-lost',
    badgeClass: 'bg-lost/20 text-lost border-lost/30'
  },
  Void: { 
    icon: RotateCcw, 
    label: 'Zwrot', 
    className: 'status-void',
    badgeClass: 'bg-void/20 text-void border-void/30'
  },
};

const tierPrices: Record<string, number> = {
  'Free': 0,
  '10 PLN': 10,
  '20 PLN': 20,
  '40 PLN': 40,
  '75 PLN': 75,
  '100 PLN': 100,
};

export function TipCard({ tip, isUnlocked, onBuy, showBuyButton = true }: TipCardProps) {
  const StatusIcon = statusConfig[tip.status].icon;
  const price = tierPrices[tip.pricing_tier] || 0;
  const isFree = tip.pricing_tier === 'Free';

  return (
    <div className={cn(
      "card-betting rounded-xl p-5 transition-all duration-300 hover:border-primary/30 animate-fade-in",
      !isUnlocked && !isFree && "relative overflow-hidden"
    )}>
      {/* Locked Overlay */}
      {!isUnlocked && !isFree && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
          <Lock className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Typ płatny</span>
          {showBuyButton && onBuy && (
            <Button variant="neon" size="sm" onClick={onBuy}>
              Kup za {price} zł
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {tip.league}
          </Badge>
          {tip.is_bet_builder && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              <Layers className="w-3 h-3 mr-1" />
              Bet Builder
            </Badge>
          )}
        </div>
        <Badge className={cn("border", statusConfig[tip.status].badgeClass)}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {statusConfig[tip.status].label}
        </Badge>
      </div>

      {/* Match Info */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-foreground mb-1">
          <span>{tip.home_team}</span>
          <span className="text-muted-foreground">vs</span>
          <span>{tip.away_team}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(tip.match_date), 'dd MMMM yyyy, HH:mm', { locale: pl })}
        </p>
      </div>

      {/* Betting Details */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Typ</p>
          <p className="text-sm font-semibold text-foreground truncate">{tip.pick}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Kurs</p>
          <p className="text-sm font-semibold text-primary">{tip.odds.toFixed(2)}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Stawka</p>
          <p className="text-sm font-semibold text-foreground">{tip.stake}/10</p>
        </div>
      </div>

      {/* Analysis */}
      {tip.analysis && (isUnlocked || isFree) && (
        <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
          <p className="text-sm text-muted-foreground">{tip.analysis}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {isFree ? (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Darmowy
            </Badge>
          ) : (
            <Badge variant="outline">
              {price} zł
            </Badge>
          )}
        </div>

        {tip.status === 'Won' && tip.proof_image_url && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="won" size="sm">
                <Eye className="w-4 h-4 mr-1" />
                Zobacz Kupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-won">
                  <Trophy className="w-5 h-5" />
                  <span className="font-semibold">Wygrany kupon</span>
                </div>
                <img 
                  src={tip.proof_image_url} 
                  alt="Dowód wygranej" 
                  className="max-w-full rounded-lg border border-border"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
