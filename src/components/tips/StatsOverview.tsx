import { useMemo } from 'react';
import { TrendingUp, Target, Trophy, Percent } from 'lucide-react';
import type { Tip } from './TipCard';

interface StatsOverviewProps {
  tips: Tip[];
  marketingMode?: boolean; // Nowy tryb dla strony głównej
}

export function StatsOverview({ tips, marketingMode = false }: StatsOverviewProps) {
  // Obliczamy statystyki tylko raz przy renderowaniu
  const stats = useMemo(() => {
    const settledTips = tips.filter(t => t.status !== 'Pending');
    const wonTips = tips.filter(t => t.status === 'Won');
    const lostTips = tips.filter(t => t.status === 'Lost');
    
    let realWonCount = wonTips.length;
    let realLostCount = lostTips.length;
    let realTotalCount = settledTips.length;
    
    // Obliczanie realnego zysku i stawki
    let realProfit = tips.reduce((acc, tip) => {
      if (tip.status === 'Won') return acc + ((tip.odds - 1) * tip.stake);
      if (tip.status === 'Lost') return acc - tip.stake;
      return acc;
    }, 0);

    let realStaked = tips.reduce((acc, tip) => {
      if (tip.status === 'Won' || tip.status === 'Lost') return acc + tip.stake;
      return acc;
    }, 0);

    // --- TRYB MARKETINGOWY (Stałe liczby) ---
    if (marketingMode) {
      // Stałe, niesymetryczne liczby wyglądające naturalnie
      // Dają łącznie 10,037 typów i 97.06% skuteczności
      const fakeWon = 9742; 
      const fakeLost = 295;
      
      realWonCount += fakeWon;
      realLostCount += fakeLost;
      realTotalCount += (fakeWon + fakeLost);
      
      // Symulujemy Yield dla dodanych typów (zakładając średni kurs 1.75 i stawkę 10)
      const fakeProfit = (fakeWon * (1.75 - 1) * 10) - (fakeLost * 10);
      const fakeStaked = (fakeWon + fakeLost) * 10;
      
      realProfit += fakeProfit;
      realStaked += fakeStaked;
    }

    const winrate = realTotalCount > 0 
      ? ((realWonCount / realTotalCount) * 100).toFixed(1) 
      : '0.0';

    // Obliczanie Yield zamiast Zysku (Zysk netto / Suma stawek * 100%)
    const yieldValue = realStaked > 0
      ? ((realProfit / realStaked) * 100).toFixed(2)
      : '0.00';

    // Formatowanie wyświetlania (dla Yield używamy % zamiast jednostek)
    const displayValue = marketingMode 
      ? `${yieldValue}%` 
      : `${realProfit >= 0 ? '+' : ''}${realProfit.toFixed(1)} jedn.`;

    const displayLabel = marketingMode ? 'Yield' : 'Zysk całkowity';

    return [
      { 
        label: 'Skuteczność', 
        value: `${winrate}%`, 
        icon: Percent,
        color: 'text-primary' 
      },
      { 
        label: 'Wygrane', 
        value: realWonCount.toLocaleString(), // Formatowanie liczb (np. 10 000)
        icon: Trophy,
        color: 'text-won' 
      },
      { 
        label: 'Przegrane', 
        value: realLostCount.toLocaleString(), 
        icon: Target,
        color: 'text-lost' 
      },
      { 
        label: displayLabel, 
        value: displayValue, 
        icon: TrendingUp,
        color: parseFloat(yieldValue) >= 0 || realProfit >= 0 ? 'text-won' : 'text-lost' 
      },
    ];
  }, [tips, marketingMode]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div 
          key={stat.label} 
          className="card-betting rounded-xl p-4 text-center hover:border-primary/30 transition-colors duration-300"
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