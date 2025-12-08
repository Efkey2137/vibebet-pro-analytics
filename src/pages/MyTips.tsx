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
      // 1. Pobierz ID typów, które użytkownik "kupił" (płatne) LUB "dodał" (darmowe)
      // W obu przypadkach są one w tabeli user_purchases
      const { data: purchases, error: purchaseError } = await supabase
        .from('user_purchases')
        .select('tip_id')
        .eq('user_id', user.id);

      if (purchaseError) throw purchaseError;

      const purchasedIds = purchases?.map(p => p.tip_id) || [];

      if (purchasedIds.length === 0) {
        setTips([]);
        setLoading(false);
        return;
      }

      // 2. Pobierz szczegóły tych konkretnych typów
      const { data, error: tipsError } = await supabase
        .from('tips')
        .select('*')
        .in('id', purchasedIds)
        .order('match_date', { ascending: false });

      if (tipsError) throw tipsError;

      setTips((data || []) as Tip[]);
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
              Tutaj znajdziesz wszystkie typy, które obstawiłeś.
            </p>
          </div>

          {tips.length === 0 ? (
            <div className="text-center py-20 card-betting rounded-2xl max-w-md mx-auto">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Brak typów</h2>
              <p className="text-muted-foreground mb-6">
                Nie masz jeszcze żadnych aktywnych kuponów. Przejdź do oferty i wybierz swoje pewniaki!
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
                  isUnlocked={true} // W sekcji "Moje Typy" wszystko jest odblokowane
                  showBuyButton={false}
                  showBetStatus={true} // Nowa flaga, żeby pokazać "Obstawione"
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