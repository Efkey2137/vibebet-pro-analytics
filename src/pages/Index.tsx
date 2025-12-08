import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TipCard, Tip } from '@/components/tips/TipCard';
import { TierFilter } from '@/components/tips/TierFilter';
import { StatsOverview } from '@/components/tips/StatsOverview';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Zap, Shield, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const tierDescriptions: Record<string, { title: string; description: string }> = {
  'Free': { title: 'Darmowe typy', description: 'Sprawdź nasze umiejętności za darmo' },
  '10 PLN': { title: 'Standard', description: 'Solidne typy na co dzień' },
  '20 PLN': { title: 'Premium', description: 'Wyższa jakość, lepsze kursy' },
  '40 PLN': { title: 'Premium+', description: 'Szczegółowa analiza' },
  '75 PLN': { title: 'Wysoka Pewność', description: 'Najlepsze okazje' },
  '100 PLN': { title: 'VIP - Max Confidence', description: 'Gwarantowane emocje' },
};

export default function Index() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [allTipsForStats, setAllTipsForStats] = useState<Tip[]>([]);
  const [selectedTier, setSelectedTier] = useState('all');
  const [loading, setLoading] = useState(true);
  const [purchasedTipIds, setPurchasedTipIds] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTips();
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchTips = async () => {
    try {
      // Fetch all tips for display (RLS will filter)
      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .order('match_date', { ascending: false });

      if (error) throw error;
      
      // Cast to Tip type
      const typedData = (data || []) as Tip[];
      setTips(typedData);
      
      // Also fetch settled tips for stats (free tips only for non-admin)
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

  const handleBuyTip = (tip: Tip) => {
    if (!user) {
      toast.error('Musisz być zalogowany, aby kupić typ');
      navigate('/auth');
      return;
    }
    
    // In real app, this would integrate with payment gateway
    toast.info('Funkcja płatności w przygotowaniu');
  };

  const filteredTips = selectedTier === 'all' 
    ? tips 
    : tips.filter(t => t.pricing_tier === selectedTier);

  const isUnlocked = (tip: Tip) => {
    return tip.pricing_tier === 'Free' || purchasedTipIds.includes(tip.id);
  };

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
                  Zobacz archiwum
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 border-y border-border bg-card/30">
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

        {/* Stats & Archive */}
        <section id="archive" className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold mb-4">
                Nasze <span className="text-primary">Wyniki</span>
              </h2>
              <p className="text-muted-foreground">
                Sprawdź historię naszych typów i statystyki
              </p>
            </div>

            {/* Stats Overview */}
            <div className="mb-12">
              <StatsOverview tips={allTipsForStats} />
            </div>

            {/* Tier Descriptions */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {Object.entries(tierDescriptions).map(([tier, info]) => (
                <div 
                  key={tier}
                  className="p-3 rounded-lg bg-secondary/30 border border-border text-center"
                >
                  <p className="font-semibold text-sm text-foreground">{info.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                  <p className="text-xs text-primary mt-2 font-medium">
                    {tier === 'Free' ? 'Za darmo' : tier}
                  </p>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div className="mb-8">
              <TierFilter selectedTier={selectedTier} onTierChange={setSelectedTier} />
            </div>

            {/* Tips Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredTips.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Brak typów w tej kategorii</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTips.map((tip) => (
                  <TipCard 
                    key={tip.id} 
                    tip={tip} 
                    isUnlocked={isUnlocked(tip)}
                    onBuy={() => handleBuyTip(tip)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
