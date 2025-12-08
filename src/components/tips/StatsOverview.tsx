import { TrendingUp, Target, Trophy, Percent } from 'lucide-react';
import type { Tip } from './TipCard';

interface StatsOverviewProps {
  tips: Tip[];
}

export function StatsOverview({ tips }: StatsOverviewProps) {
  const settledTips = tips.filter(t => t.status !== 'Pending');
  const wonTips = tips.filter(t => t.status === 'Won');
  const lostTips = tips.filter(t => t.status === 'Lost');
  
  const winrate = settledTips.length > 0 
    ? ((wonTips.length / settledTips.length) * 100).toFixed(1) 
    : '0.0';

  // Calculate profit: Won = +((odds - 1) * stake), Lost = -stake
  const profit = tips.reduce((acc, tip) => {
    if (tip.status === 'Won') return acc + ((tip.odds - 1) * tip.stake);
    if (tip.status === 'Lost') return acc - tip.stake;
    return acc;
  }, 0);

  const stats = [
    { 
      label: 'Skuteczność', 
      value: `${winrate}%`, 
      icon: Percent,
      color: 'text-primary' 
    },
    { 
      label: 'Wygrane', 
      value: wonTips.length.toString(), 
      icon: Trophy,
      color: 'text-won' 
    },
    { 
      label: 'Przegrane', 
      value: lostTips.length.toString(), 
      icon: Target,
      color: 'text-lost' 
    },
    { 
      label: 'Zysk całkowity', 
      value: `${profit >= 0 ? '+' : ''}${profit.toFixed(1)} jedn.`, 
      icon: TrendingUp,
      color: profit >= 0 ? 'text-won' : 'text-lost' 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div 
          key={stat.label} 
          className="card-betting rounded-xl p-4 text-center"
        >
          <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
          <p className={`text-2xl font-bold font-display ${stat.color}`}>
            {stat.value}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
