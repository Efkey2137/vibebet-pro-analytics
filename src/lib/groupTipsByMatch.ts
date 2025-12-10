import { Tip } from '@/components/tips/TipCard';

/**
 * Grupuje typy na te same mecze (ta sama data, home_team, away_team) w jeden bet builder.
 * Łączy picks z pipe separatorem, bierze najwyższy pricing_tier i sumuje odds.
 */
export function groupTipsByMatch(tips: Tip[]): Tip[] {
  const matchGroups = new Map<string, Tip[]>();

  // Grupuj po kluczu meczu
  tips.forEach(tip => {
    const matchDate = new Date(tip.match_date).toDateString();
    const key = `${tip.home_team}-${tip.away_team}-${matchDate}`;
    
    const existing = matchGroups.get(key) || [];
    existing.push(tip);
    matchGroups.set(key, existing);
  });

  const result: Tip[] = [];

  matchGroups.forEach((groupTips) => {
    if (groupTips.length === 1) {
      // Pojedynczy typ - bez zmian
      result.push(groupTips[0]);
    } else {
      // Wiele typów na ten sam mecz - połącz w bet builder
      const tierOrder = ['Free', '10 PLN', '20 PLN', '40 PLN', '75 PLN', '100 PLN'];
      
      // Sortuj po cenie, weź najwyższą
      const sortedByTier = [...groupTips].sort((a, b) => 
        tierOrder.indexOf(b.pricing_tier) - tierOrder.indexOf(a.pricing_tier)
      );
      
      const baseTip = sortedByTier[0];
      
      // Zbierz wszystkie picks
      const allPicks: string[] = [];
      groupTips.forEach(tip => {
        // Każdy pick może już być multi-pickiem (z |)
        const picks = tip.pick.split(' | ').map(p => p.trim()).filter(Boolean);
        allPicks.push(...picks);
      });
      
      // Oblicz łączne odds (mnożenie)
      const combinedOdds = groupTips.reduce((acc, tip) => acc * tip.odds, 1);
      
      // Połącz analizy
      const analyses = groupTips
        .map(t => t.analysis)
        .filter(Boolean)
        .join(' | ');

      // Zbierz wszystkie ID (użyjemy pierwszego jako głównego)
      const mergedTip: Tip = {
        ...baseTip,
        pick: allPicks.join(' | '),
        odds: combinedOdds,
        is_bet_builder: true,
        analysis: analyses || null,
        // Zachowaj ID pierwszego tipa dla klucza React
      };

      result.push(mergedTip);
    }
  });

  // Sortuj po dacie meczu (malejąco)
  return result.sort((a, b) => 
    new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
  );
}
