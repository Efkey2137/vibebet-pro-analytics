import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TipCard, Tip } from '@/components/tips/TipCard';
import { TierGroupCard } from '@/components/tips/TierGroupCard';
import { TierFilter } from '@/components/tips/TierFilter';
import { StatsOverview } from '@/components/tips/StatsOverview';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { groupTipsByMatch } from '@/lib/groupTipsByMatch';
import { Zap, Shield, TrendingUp, ChevronRight, Loader2, Brain, Cpu, Binary, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const tierDescriptions: Record<string, { title: string; description: string }> = {
  'Free': { title: 'Darmowe typy', description: 'Idealne na start. Sprawdź naszą skuteczność bez ryzyka.' },
  '10 PLN': { title: 'Standard', description: 'Solidne, codzienne typy z dobrą analizą.' },
  '20 PLN': { title: 'Premium', description: 'Wyższa jakość, selekcjonowane mecze i lepsze kursy.' },
  '40 PLN': { title: 'Premium+', description: 'Szczegółowa analiza i typy o podwyższonym prawdopodobieństwie.' },
  '75 PLN': { title: 'Wysoka Pewność', description: 'Najlepsze okazje tygodnia. Tylko mocne sygnały.' },
  '100 PLN': { title: 'VIP - Max Confidence', description: 'Gwarantowane emocje. Nasze najmocniejsze pozycje.' },
};

export default function Index() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [allTipsForStats, setAllTipsForStats] = useState<Tip[]>([]);
  const [selectedTier, setSelectedTier] = useState('all');
  const [loading, setLoading] = useState(true);
  const [purchasedTipIds, setPurchasedTipIds] = useState<string[]>([]);
  const [userTierAccess, setUserTierAccess] = useState<string[]>([]); // Aktywne dostępy do tierów
  
  // ZMIANA: Pobieramy isAdmin
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTips();
    if (user) {
      fetchPurchases();
      fetchUserTierAccess();
    }
  }, [user]);

  const fetchTips = async () => {
    try {
      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .order('match_date', { ascending: false });

      if (error) throw error;
      const typedData = (data || []) as Tip[];
      setTips(typedData);
      
      const { data: statsData } = await supabase
        .from('tips')
        .select('*')
        .neq('status', 'Pending');
      
      setAllTipsForStats((statsData || []) as Tip[]);
    } catch (error) {
      console.error('Error fetching tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_purchases')
      .select('tip_id')
      .eq('user_id', user.id);
    
    if (data) {
      setPurchasedTipIds(data.map(p => p.tip_id));
    }
  };

  const fetchUserTierAccess = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('user_tier_access')
      .select('pricing_tier')
      .eq('user_id', user.id)
      .gt('expires_at', now);
    
    if (data) {
      setUserTierAccess(data.map(a => a.pricing_tier));
    }
  };

  const handleBuyTip = async (tip: Tip) => {
    if (!user) {
      toast.error('Musisz być zalogowany, aby dodać typ');
      navigate('/auth');
      return;
    }

    if (tip.pricing_tier === 'Free') {
      try {
        const { error } = await supabase
          .from('user_purchases')
          .insert({
            user_id: user.id,
            tip_id: tip.id,
            amount_paid: 0
          });

        if (error) throw error;

        toast.success('Typ dodany do Twoich kuponów!');
        fetchPurchases();
      } catch (error) {
        console.error('Error adding tip:', error);
        toast.error('Błąd podczas dodawania typu');
      }
    } else {
      toast.info('Funkcja płatności w przygotowaniu');
    }
  };

  const handleRemoveTip = async (tip: Tip) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_purchases')
        .delete()
        .eq('user_id', user.id)
        .eq('tip_id', tip.id);

      if (error) throw error;

      toast.info('Typ usunięty z Twoich kuponów');
      fetchPurchases();
    } catch (error) {
      console.error('Error removing tip:', error);
      toast.error('Nie udało się usunąć typu');
    }
  };

  // Helpers do filtrowania po dacie
  const isToday = (date: string) => {
    const tipDate = new Date(date);
    const today = new Date();
    return tipDate.toDateString() === today.toDateString();
  };

  const isYesterday = (date: string) => {
    const tipDate = new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return tipDate.toDateString() === yesterday.toDateString();
  };

  const isTodayOrYesterday = (date: string) => {
    return isToday(date) || isYesterday(date);
  };

  // Typy tylko na dziś
  const todayTips = tips.filter(t => isToday(t.match_date));

  // Typy z dziś i wczoraj
  const recentTips = tips.filter(t => isTodayOrYesterday(t.match_date));

  // ZMIANA: Wybór puli typów w zależności od roli
  // Admin widzi typy z dziś i wczoraj (recentTips), Klient tylko z dziś (todayTips)
  const displayTips = isAdmin ? recentTips : todayTips;

  // Grupuj typy na te same mecze w bet buildery (używamy przefiltrowanej listy displayTips)
  const groupedTips = useMemo(() => groupTipsByMatch(displayTips), [displayTips]);

  const filteredTips = selectedTier === 'all' 
    ? groupedTips 
    : groupedTips.filter(t => t.pricing_tier === selectedTier);

  // ZMIANA: Funkcja sprawdzająca czy typ jest odblokowany (dla Admina zawsze TRUE)
  const isUnlocked = (tip: Tip) => {
    if (isAdmin) return true; // Admin widzi wszystko
    if (tip.pricing_tier === 'Free') return true;
    if (purchasedTipIds.includes(tip.id)) return true;
    if (userTierAccess.includes(tip.pricing_tier)) return true; // Ma aktywny dostęp do tego tieru
    return false;
  };

  const isAddedToMyTips = (tip: Tip) => {
    return purchasedTipIds.includes(tip.id);
  };

  // Grupy kategorii - liczba typów (zależna od widoku: Admin vs Klient)
  const availableGroups = selectedTier === 'all' 
    ? Object.entries(tierDescriptions)
        .map(([tier, info]) => ({
          tier,
          ...info,
          // ZMIANA: Liczymy count na podstawie displayTips (czyli dla admina today+yesterday, dla klienta today)
          count: displayTips.filter(t => t.pricing_tier === tier).length
        }))
        .filter(group => group.count > 0)
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-neon-glow opacity-30" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
                <span className="text-foreground">Profesjonalne</span>
                <br />
                <span className="text-neon">Typy Bukmacherskie</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Dołącz do grona wygrywających. Sprawdzone analizy, 
                transparentne wyniki, maksymalna skuteczność.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <Button variant="neon" size="xl" onClick={() => navigate('/auth?mode=signup')}>
                  Zacznij wygrywać
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="xl" onClick={() => document.getElementById('archive')?.scrollIntoView({ behavior: 'smooth' })}>
                  Zobacz ofertę
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* AI Section */}
        <section className="py-16 bg-secondary/10 border-y border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl bg-primary w-96 h-96 rounded-full -z-10"></div>
          
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex-1 space-y-6">
                <Badge variant="outline" className="border-primary text-primary px-4 py-1 text-sm tracking-wider font-display bg-primary/10">
                  AI POWERED TECHNOLOGY 2.0
                </Badge>
                
                <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">
                  Sztuczna Inteligencja. <br/>
                  <span className="text-primary">Matematyczna</span> Precyzja.
                </h2>
                
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Zapomnij o "czutce" i błędach ludzkich. Nasz autorski system 
                  <span className="text-foreground font-semibold"> VibeBet AI™ </span> 
                  analizuje ponad 50,000 zmiennych na sekundę. Algorytm nie ma gorszych dni, 
                  nie kieruje się emocjami. To czysta matematyka i statystyka.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Machine Learning</h4>
                      <p className="text-sm text-muted-foreground">Algorytm uczy się na każdym rozegranym meczu.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Zero Emocji</h4>
                      <p className="text-sm text-muted-foreground">Chłodna kalkulacja prawdopodobieństwa.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex justify-center">
                <div className="relative w-full max-w-sm aspect-square">
                  <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse"></div>
                  <div className="relative h-full w-full border border-primary/30 rounded-full flex items-center justify-center bg-background/50 backdrop-blur-sm animate-float">
                    <Brain className="w-32 h-32 text-primary drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                    <div className="absolute inset-0 animate-spin-slow">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 p-3 bg-card border border-primary rounded-xl shadow-lg shadow-primary/20">
                        <Cpu className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="absolute inset-0 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }}>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 p-3 bg-card border border-primary rounded-xl shadow-lg shadow-primary/20">
                        <Binary className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 border-b border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: TrendingUp, title: 'Wysoka skuteczność', desc: 'Sprawdzone strategie i analizy statystyczne' },
                { icon: Shield, title: 'Pełna transparentność', desc: 'Każdy wynik udokumentowany zrzutem ekranu' },
                { icon: Zap, title: 'Natychmiastowy dostęp', desc: 'Typy dostępne od razu po zakupie' },
              ].map((feature, i) => (
                <div key={i} className="text-center p-6 rounded-xl bg-secondary/30 border border-border">
                  <feature.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Tips Section */}
        <section id="archive" className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold mb-4">
                Dostępne <span className="text-primary">Zakłady</span>
              </h2>
              <p className="text-muted-foreground">
                Wybierz kategorię lub przeglądaj wszystkie typy
              </p>
            </div>

            {/* Stats Overview */}
            <div className="mb-12">
              <StatsOverview tips={allTipsForStats} marketingMode={true} />
            </div>

            {/* Filter */}
            <div className="mb-8 sticky top-20 z-40 bg-background/80 backdrop-blur-md p-4 rounded-xl border border-border/50">
              <div className="flex items-center justify-between">
                <TierFilter selectedTier={selectedTier} onTierChange={setSelectedTier} />
                {selectedTier !== 'all' && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTier('all')} className="ml-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Wróć do kategorii
                  </Button>
                )}
              </div>
            </div>

            {/* Content Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : selectedTier === 'all' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableGroups.length > 0 ? (
                  availableGroups.map((group) => (
                    <TierGroupCard 
                      key={group.tier}
                      title={group.title}
                      description={group.description}
                      count={group.count}
                      priceLabel={group.tier}
                      onClick={() => setSelectedTier(group.tier)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-20">
                    <p className="text-muted-foreground text-lg">Brak aktywnych typów na ten moment.</p>
                    <p className="text-sm text-muted-foreground">Zajrzyj ponownie później!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {filteredTips.length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <p className="text-muted-foreground">Brak typów w tej kategorii</p>
                  </div>
                ) : (
                  filteredTips.map((tip) => (
                    <TipCard 
                      key={tip.id} 
                      tip={tip} 
                      isUnlocked={isUnlocked(tip)} // Admin ma tu true
                      isAddedToMyTips={isAddedToMyTips(tip)}
                      onBuy={() => handleBuyTip(tip)}
                      onRemove={() => handleRemoveTip(tip)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}