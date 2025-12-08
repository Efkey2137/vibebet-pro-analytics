import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Lock, CheckCircle2, XCircle, Clock, RotateCcw, Eye, Trophy, Layers, Plus, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  onRemove?: () => void; // Nowy prop do usuwania
  showBuyButton?: boolean;
  showBetStatus?: boolean;
  isAddedToMyTips?: boolean;
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

export function TipCard({ 
  tip, 
  isUnlocked, 
  onBuy, 
  onRemove,
  showBuyButton = true, 
  showBetStatus = false,
  isAddedToMyTips = false 
}: TipCardProps) {
  const StatusIcon = statusConfig[tip.status].icon;
  const price = tierPrices[tip.pricing_tier] || 0;
  const isFree = tip.pricing_tier === 'Free';

  // Czy typ jest już "posiadany" (w My Tips lub obstawiony na głównej)
  const isOwned = isAddedToMyTips || showBetStatus;

  return (
    <div className={cn(
      "card-betting rounded-xl p-5 transition-all duration-300 hover:border-primary/30 animate-fade-in flex flex-col justify-between h-full",
      !isUnlocked && !isFree && "relative overflow-hidden"
    )}>
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

      <div>
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

        <div className="mb-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground mb-1">
            <span>{tip.home_team}</span>
            <span className="text-muted-foreground">vs</span>
            <span>{tip.away_team}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(tip.match_date), 'dd MMMM yyyy', { locale: pl })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Typ</p>
            <p className="text-sm font-semibold text-foreground truncate">{tip.pick}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Kurs</p>
            <p className="text-sm font-semibold text-primary">{tip.odds.toFixed(2)}</p>
          </div>
        </div>

        {tip.analysis && (isUnlocked || isFree) && (
          <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
            <p className="text-sm text-muted-foreground">{tip.analysis}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
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

        <div className="flex items-center gap-2">
          {tip.status === 'Won' && tip.proof_image_url && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="won" size="sm" className="h-8">
                  <Eye className="w-3 h-3 mr-1" />
                  Kupon
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

          {/* Logic for Add/Remove Buttons */}
          {isFree && (
            isOwned ? (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 text-won hover:text-won hover:bg-won/10 cursor-default px-2">
                  <Check className="w-4 h-4 mr-1" />
                  Obstawione
                </Button>
                
                {onRemove && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={onRemove}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Usuń z moich typów</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ) : (
              onBuy && (
                <Button variant="outline" size="sm" onClick={onBuy} className="h-8 hover:border-primary hover:text-primary">
                  <Plus className="w-4 h-4 mr-1" />
                  Obstawiam
                </Button>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}