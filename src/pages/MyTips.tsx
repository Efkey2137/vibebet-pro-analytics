import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TipCard, Tip } from '@/components/tips/TipCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MyTips() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchMyTips();
    }
  }, [user, authLoading, navigate]);

  const fetchMyTips = async () => {
    if (!user) return;
    
    try {
      // Get purchased tip IDs
      const { data: purchases } = await supabase
        .from('user_purchases')
        .select('tip_id')
        .eq('user_id', user.id);

      const purchasedIds = purchases?.map(p => p.tip_id) || [];

      // Get free tips and purchased tips
      const { data: freeTips } = await supabase
        .from('tips')
        .select('*')
        .eq('pricing_tier', 'Free')
        .order('match_date', { ascending: false });

      let purchasedTips: Tip[] = [];
      if (purchasedIds.length > 0) {
        const { data } = await supabase
          .from('tips')
          .select('*')
          .in('id', purchasedIds)
          .order('match_date', { ascending: false });
        purchasedTips = (data || []) as Tip[];
      }

      // Combine and dedupe
      const allTips = [...(freeTips as Tip[] || []), ...purchasedTips];
      const uniqueTips = allTips.filter((tip, index, self) => 
        index === self.findIndex(t => t.id === tip.id)
      );

      setTips(uniqueTips.sort((a, b) => 
        new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
      ));
    } catch (error) {
      console.error('Error fetching tips:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold mb-4">
              <span className="text-primary">Moje</span> Typy
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Wszystkie Twoje zakupione typy i darmowe typy w jednym miejscu.
            </p>
          </div>

          {tips.length === 0 ? (
            <div className="text-center py-20 card-betting rounded-2xl max-w-md mx-auto">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Brak typów</h2>
              <p className="text-muted-foreground mb-6">
                Nie masz jeszcze żadnych typów. Sprawdź naszą ofertę!
              </p>
              <Button variant="neon" onClick={() => navigate('/')}>
                Zobacz typy
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tips.map((tip) => (
                <TipCard 
                  key={tip.id} 
                  tip={tip} 
                  isUnlocked={true}
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
