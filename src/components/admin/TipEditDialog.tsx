import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tip } from '@/components/tips/TipCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';

const pricingTiers = ['Free', '10 PLN', '20 PLN', '40 PLN', '75 PLN', '100 PLN'];

const quickPicks = [
  "1", "X", "2", 
  "1X", "X2", "12", 
  "HWEH", "AWEH", 
  "Over 1.5 Goals", "Over 2.5 Goals", 
  "BTTS"
];

interface TipEditDialogProps {
  tip: Tip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function TipEditDialog({ tip, open, onOpenChange, onSaved }: TipEditDialogProps) {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [league, setLeague] = useState('');
  const [picks, setPicks] = useState<string[]>(['']);
  const [odds, setOdds] = useState('');
  const [pricingTier, setPricingTier] = useState('Free');
  const [analysis, setAnalysis] = useState('');
  const [isBetBuilder, setIsBetBuilder] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tip) {
      setHomeTeam(tip.home_team);
      setAwayTeam(tip.away_team);
      setLeague(tip.league);
      // Parse picks - if contains " | " it's multiple picks
      const existingPicks = tip.pick.includes(' | ') ? tip.pick.split(' | ') : [tip.pick];
      setPicks(existingPicks);
      setOdds(tip.odds?.toString() || '');
      setPricingTier(tip.pricing_tier);
      setAnalysis(tip.analysis || '');
      setIsBetBuilder(tip.is_bet_builder || false);
    }
  }, [tip]);

  const addPick = () => {
    setPicks([...picks, '']);
  };

  const removePick = (index: number) => {
    if (picks.length > 1) {
      setPicks(picks.filter((_, i) => i !== index));
    }
  };

  const updatePick = (index: number, value: string) => {
    const newPicks = [...picks];
    newPicks[index] = value;
    setPicks(newPicks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tip) return;

    setSubmitting(true);

    try {
      const combinedPick = picks.filter(p => p.trim()).join(' | ');
      
      const { error } = await supabase
        .from('tips')
        .update({
          home_team: homeTeam,
          away_team: awayTeam,
          league,
          pick: combinedPick,
          odds: odds ? parseFloat(odds) : null,
          pricing_tier: pricingTier as "Free" | "10 PLN" | "20 PLN" | "40 PLN" | "75 PLN" | "100 PLN",
          analysis: analysis || null,
          is_bet_builder: isBetBuilder,
        })
        .eq('id', tip.id);

      if (error) throw error;

      toast.success('Typ zaktualizowany!');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating tip:', error);
      toast.error('Błąd podczas aktualizacji');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edytuj typ</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="flex items-center gap-3 pb-2">
            <Switch checked={isBetBuilder} onCheckedChange={setIsBetBuilder} />
            <Label>Bet Builder (wiele typów)</Label>
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
                  onClick={() => updatePick(picks.length - 1, qp)}
                >
                  {qp}
                </Button>
              ))}
            </div>

            {picks.map((pick, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input 
                  value={pick} 
                  onChange={(e) => updatePick(index, e.target.value)}
                  placeholder={index === 0 ? "Wpisz typ" : "Dodatkowy typ"}
                  required={index === 0}
                />
                {picks.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removePick(index)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            {isBetBuilder && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addPick}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                Dodaj typ
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kurs (opcjonalnie)</Label>
              <Input 
                type="number"
                step="0.01"
                min="1.01"
                value={odds} 
                onChange={(e) => setOdds(e.target.value)}
                placeholder="np. 1.85"
              />
            </div>
            <div className="space-y-2">
              <Label>Pakiet</Label>
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

          <div className="flex gap-3">
            <Button type="submit" variant="neon" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Zapisz zmiany
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
