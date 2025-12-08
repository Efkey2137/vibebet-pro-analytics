import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TipCard, Tip } from '@/components/tips/TipCard';
import { TierFilter } from '@/components/tips/TierFilter';
import { StatsOverview } from '@/components/tips/StatsOverview';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function Archive() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [selectedTier, setSelectedTier] = useState('all');
  const [loading, setLoading] = useState(true);
  const [purchasedTipIds, setPurchasedTipIds] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchSettledTips();
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchSettledTips = async () => {
    try {
      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .neq('status', 'Pending')
        .order('settled_at', { ascending: false });

      if (error) throw error;
      setTips((data || []) as Tip[]);
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

  const filteredTips = selectedTier === 'all' 
    ? tips 
    : tips.filter(t => t.pricing_tier === selectedTier);

  const isUnlocked = (tip: Tip) => {
    return tip.pricing_tier === 'Free' || purchasedTipIds.includes(tip.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold mb-4">
              <span className="text-primary">Archiwum</span> Typów
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Pełna historia naszych rozegranych typów. Transparentność i dowody każdej wygranej.
            </p>
          </div>

          {/* Stats */}
          <div className="mb-12">
            <StatsOverview tips={tips} />
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
              <p className="text-muted-foreground">Brak rozegranych typów w tej kategorii</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTips.map((tip) => (
                <TipCard 
                  key={tip.id} 
                  tip={tip} 
                  isUnlocked={isUnlocked(tip)}
                  showBuyButton={false}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
