import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Construction, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/*
import { useEffect, useState } from 'react';
import { TipCard, Tip } from '@/components/tips/TipCard';
import { TierFilter } from '@/components/tips/TierFilter';
import { StatsOverview } from '@/components/tips/StatsOverview';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
*/

export default function Archive() {
  const navigate = useNavigate();

  // CAŁA LOGIKA ZAKOMENTOWANA TYMCZASOWO
  /*
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
  */

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="container mx-auto px-4 text-center">
          
          <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
            <div className="relative bg-card border border-primary/30 p-5 rounded-2xl">
              <History className="w-12 h-12 text-primary" />
              <div className="absolute -bottom-2 -right-2 bg-background border border-border p-1.5 rounded-lg">
                <Construction className="w-5 h-5 text-pending" />
              </div>
            </div>
          </div>

          <h1 className="font-display text-4xl font-bold mb-4">
            Archiwum <span className="text-primary">w Budowie</span>
          </h1>
          
          <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-lg">
            Właśnie tworzymy historię. Archiwum zostanie udostępnione po rozliczeniu pierwszych typów, aby zapewnić pełną transparentność statystyk.
          </p>

          <Button variant="neon" size="lg" onClick={() => navigate('/')}>
            Wróć do typów na dziś
          </Button>

        </div>
      </main>

      <Footer />
    </div>
  );
}