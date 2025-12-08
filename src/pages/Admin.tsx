import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tip } from '@/components/tips/TipCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Loader2, Plus, CheckCircle, XCircle, RotateCcw, Upload, BarChart3, Trash2, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const pricingTiers = ['Free', '10 PLN', '20 PLN', '40 PLN', '75 PLN', '100 PLN'];

// Szybkie typy
const quickPicks = [
  "1", "X", "2", 
  "1X", "X2", "12", 
  "HWEH", "AWEH", 
  "Over 1.5 Goals", "Over 2.5 Goals", 
  "BTTS Tak", "BTTS Nie"
];

interface TierStats {
  tier: string;
  totalTips: number;
  wonTips: number;
  lostTips: number;
  winrate: number;
  yield: number;
  profitLoss: number;
}

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tierStats, setTierStats] = useState<TierStats[]>([]);
  
  // Form state
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [league, setLeague] = useState('');
  const [pick, setPick] = useState('');
  const [odds, setOdds] = useState('');
  const [pricingTier, setPricingTier] = useState('Free');
  const [analysis, setAnalysis] = useState('');
  const [isBetBuilder, setIsBetBuilder] = useState(false);
  
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/');
        toast.error('Brak dostępu do panelu admina');
      } else {
        fetchAllTips();
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchAllTips = async () => {
    try {
      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const typedTips = (data || []) as Tip[];
      setTips(typedTips);
      calculateTierStats(typedTips);
    } catch (error) {
      console.error('Error fetching tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTierStats = (allTips: Tip[]) => {
    const stats: TierStats[] = pricingTiers.map(tier => {
      const tierTips = allTips.filter(t => t.pricing_tier === tier);
      const settledTips = tierTips.filter(t => t.status !== 'Pending');
      const wonTips = tierTips.filter(t => t.status === 'Won');
      const lostTips = tierTips.filter(t => t.status === 'Lost');
      
      const winrate = settledTips.length > 0 
        ? (wonTips.length / settledTips.length) * 100 
        : 0;
      
      let profitLoss = 0;
      tierTips.forEach(tip => {
        if (tip.status === 'Won') profitLoss += (tip.odds - 1) * tip.stake;
        if (tip.status === 'Lost') profitLoss -= tip.stake;
      });
      
      const totalStaked = settledTips.reduce((acc, tip) => acc + tip.stake, 0);
      const yieldPercent = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0;

      return {
        tier,
        totalTips: tierTips.length,
        wonTips: wonTips.length,
        lostTips: lostTips.length,
        winrate,
        yield: yieldPercent,
        profitLoss,
      };
    });

    setTierStats(stats);
  };

  const handleCreateTip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('tips').insert({
        home_team: homeTeam,
        away_team: awayTeam,
        league,
        match_date: new Date().toISOString(),
        pick,
        odds: parseFloat(odds),
        stake: 10,
        pricing_tier: pricingTier as "Free" | "10 PLN" | "20 PLN" | "40 PLN" | "75 PLN" | "100 PLN",
        analysis: analysis || null,
        is_bet_builder: isBetBuilder,
      });

      if (error) throw error;

      toast.success('Typ dodany pomyślnie!');
      setHomeTeam('');
      setAwayTeam('');
      setLeague('');
      setPick('');
      setOdds('');
      setPricingTier('Free');
      setAnalysis('');
      setIsBetBuilder(false);
      
      fetchAllTips();
    } catch (error) {
      console.error('Error creating tip:', error);
      toast.error('Błąd podczas dodawania typu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Typ został usunięty');
      fetchAllTips();
    } catch (error) {
      console.error('Error deleting tip:', error);
      toast.error('Nie udało się usunąć typu');
    }
  };

  const handleSettle = async (tipId: string, status: 'Won' | 'Lost' | 'Void') => {
    try {
      const updateData = {
        status,
        settled_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('tips')
        .update(updateData)
        .eq('id', tipId);

      if (error) throw error;

      const statusPL = status === 'Won' ? 'wygrany' : status === 'Lost' ? 'przegrany' : 'zwrot';
      toast.success(`Typ oznaczony jako ${statusPL}`);
      fetchAllTips();
    } catch (error) {
      console.error('Error settling tip:', error);
      toast.error('Błąd podczas rozliczania typu');
    }
  };

  // ZMIANA: Funkcja cofania rozliczenia
  const handleUnsettle = async (tipId: string) => {
    try {
      const { error } = await supabase
        .from('tips')
        .update({
          status: 'Pending',
          settled_at: null
        })
        .eq('id', tipId);

      if (error) throw error;

      toast.info('Cofnięto rozliczenie typu');
      fetchAllTips();
    } catch (error) {
      console.error('Error unsettling tip:', error);
      toast.error('Błąd podczas cofania rozliczenia');
    }
  };

  const pendingTips = tips.filter(t => t.status === 'Pending');
  // ZMIANA: Filtrujemy ostatnio rozliczone typy (max 10)
  const settledTips = tips
    .filter(t => t.status !== 'Pending')
    .sort((a, b) => new Date(b.settled_at || '').getTime() - new Date(a.settled_at || '').getTime())
    .slice(0, 10);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold mb-2">
              Panel <span className="text-primary">Admina</span>
            </h1>
            <p className="text-muted-foreground">Zarządzaj typami i sprawdzaj statystyki</p>
          </div>

          <Tabs defaultValue="add" className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="add" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Dodaj Typ
              </TabsTrigger>
              <TabsTrigger value="settle" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CheckCircle className="w-4 h-4 mr-2" />
                Rozlicz ({pendingTips.length})
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="w-4 h-4 mr-2" />
                Statystyki
              </TabsTrigger>
            </TabsList>

            {/* Add Tip Tab */}
            <TabsContent value="add">
              <div className="card-betting rounded-2xl p-6 max-w-2xl">
                <h2 className="text-xl font-semibold mb-6">Dodaj nowy typ</h2>
                <form onSubmit={handleCreateTip} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Drużyna gospodarzy</Label>
                      <Input 
                        value={homeTeam} 
                        onChange={(e) => setHomeTeam(e.target.value)}
                        placeholder="np. Real Madryt"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Drużyna gości</Label>
                      <Input 
                        value={awayTeam} 
                        onChange={(e) => setAwayTeam(e.target.value)}
                        placeholder="np. Barcelona"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Liga</Label>
                    <Input 
                      value={league} 
                      onChange={(e) => setLeague(e.target.value)}
                      placeholder="np. La Liga"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Typ (Pick)</Label>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {quickPicks.map((qp) => (
                        <Button
                          key={qp}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => setPick(qp)}
                        >
                          {qp}
                        </Button>
                      ))}
                    </div>

                    <Input 
                      value={pick} 
                      onChange={(e) => setPick(e.target.value)}
                      placeholder="Wpisz typ lub wybierz powyżej"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kurs</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        min="1.01"
                        value={odds} 
                        onChange={(e) => setOdds(e.target.value)}
                        placeholder="np. 1.85"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cena</Label>
                      <Select value={pricingTier} onValueChange={setPricingTier}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pricingTiers.map(tier => (
                            <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Analiza (opcjonalnie)</Label>
                    <Textarea 
                      value={analysis} 
                      onChange={(e) => setAnalysis(e.target.value)}
                      placeholder="Szczegółowa analiza meczu..."
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch checked={isBetBuilder} onCheckedChange={setIsBetBuilder} />
                    <Label>Bet Builder</Label>
                  </div>

                  <Button type="submit" variant="neon" size="lg" disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Dodaj typ
                  </Button>
                </form>
              </div>
            </TabsContent>

            {/* Settle Tab */}
            <TabsContent value="settle">
              <div className="space-y-8">
                {/* Pending Tips Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Oczekujące na rozliczenie</h2>
                  
                  {pendingTips.length === 0 ? (
                    <div className="card-betting rounded-xl p-8 text-center">
                      <p className="text-muted-foreground">Brak typów oczekujących na rozliczenie</p>
                    </div>
                  ) : (
                    pendingTips.map(tip => (
                      <div key={tip.id} className="card-betting rounded-xl p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{tip.home_team} vs {tip.away_team}</p>
                            <p className="text-sm text-muted-foreground">
                              {tip.league} • {format(new Date(tip.match_date), 'dd MMM yyyy', { locale: pl })}
                            </p>
                            <p className="text-sm text-primary mt-1">{tip.pick} @ {tip.odds}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="won" 
                              size="sm"
                              onClick={() => handleSettle(tip.id, 'Won')}
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              Wygrana
                            </Button>
                            <Button 
                              variant="lost" 
                              size="sm"
                              onClick={() => handleSettle(tip.id, 'Lost')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Przegrana
                            </Button>
                            <Button 
                              variant="void" 
                              size="sm"
                              onClick={() => handleSettle(tip.id, 'Void')}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Zwrot
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Czy na pewno chcesz usunąć ten typ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tej operacji nie można cofnąć. Typ zostanie trwale usunięty z bazy danych.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(tip.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Usuń
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ZMIANA: Sekcja Ostatnio Rozliczone (możliwość cofnięcia missclicka) */}
                {settledTips.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h2 className="text-xl font-semibold">Ostatnio rozliczone (historia)</h2>
                    {settledTips.map(tip => (
                      <div key={tip.id} className="card-betting rounded-xl p-4 opacity-75 hover:opacity-100 transition-opacity">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={
                                tip.status === 'Won' ? 'text-won' : 
                                tip.status === 'Lost' ? 'text-lost' : 'text-void'
                              }>
                                ● {tip.status === 'Won' ? 'Wygrany' : tip.status === 'Lost' ? 'Przegrany' : 'Zwrot'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(tip.settled_at || ''), 'HH:mm dd.MM')}
                              </span>
                            </div>
                            <p className="font-medium text-sm">{tip.home_team} vs {tip.away_team}</p>
                            <p className="text-xs text-muted-foreground">{tip.pick} @ {tip.odds}</p>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUnsettle(tip.id)}
                            className="shrink-0"
                          >
                            <Undo2 className="w-4 h-4 mr-1" />
                            Cofnij
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Statystyki według ceny</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Pakiet</th>
                        <th className="text-center py-3 px-4 font-semibold">Liczba typów</th>
                        <th className="text-center py-3 px-4 font-semibold">Wygrane</th>
                        <th className="text-center py-3 px-4 font-semibold">Przegrane</th>
                        <th className="text-center py-3 px-4 font-semibold">Skuteczność %</th>
                        <th className="text-center py-3 px-4 font-semibold">Yield %</th>
                        <th className="text-center py-3 px-4 font-semibold">Zysk/Strata</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tierStats.map(stat => (
                        <tr key={stat.tier} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="py-3 px-4 font-medium">{stat.tier}</td>
                          <td className="py-3 px-4 text-center">{stat.totalTips}</td>
                          <td className="py-3 px-4 text-center text-won">{stat.wonTips}</td>
                          <td className="py-3 px-4 text-center text-lost">{stat.lostTips}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={stat.winrate >= 50 ? 'text-won' : 'text-lost'}>
                              {stat.winrate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={stat.yield >= 0 ? 'text-won' : 'text-lost'}>
                              {stat.yield.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={stat.profitLoss >= 0 ? 'text-won' : 'text-lost'}>
                              {stat.profitLoss >= 0 ? '+' : ''}{stat.profitLoss.toFixed(1)} jedn.
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}