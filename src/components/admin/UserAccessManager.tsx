import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, UserPlus, Trash2, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface TierAccess {
  id: string;
  user_id: string;
  pricing_tier: string;
  expires_at: string;
  granted_at: string;
}

const pricingTiers = ['10 PLN', '20 PLN', '40 PLN', '75 PLN', '100 PLN'];

export function UserAccessManager() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tierAccess, setTierAccess] = useState<TierAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsersAndAccess();
  }, []);

  const fetchUsersAndAccess = async () => {
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');

      if (profilesError) throw profilesError;
      setUsers(profilesData || []);

      // Fetch all tier access records
      const { data: accessData, error: accessError } = await supabase
        .from('user_tier_access')
        .select('*')
        .order('expires_at', { ascending: false });

      if (accessError) throw accessError;
      setTierAccess(accessData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Błąd podczas pobierania danych');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedTier) {
      toast.error('Wybierz użytkownika i pakiet');
      return;
    }

    setSubmitting(true);
    try {
      // Set expiration to 23:59:59 of current day
      const now = new Date();
      const expiresAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      // Check if access already exists
      const { data: existingAccess } = await supabase
        .from('user_tier_access')
        .select('id')
        .eq('user_id', selectedUserId)
        .eq('pricing_tier', selectedTier as "Free" | "10 PLN" | "20 PLN" | "40 PLN" | "75 PLN" | "100 PLN")
        .maybeSingle();

      let error;
      if (existingAccess) {
        // Update existing
        const result = await supabase
          .from('user_tier_access')
          .update({
            expires_at: expiresAt.toISOString(),
            granted_by: currentUser?.id
          })
          .eq('id', existingAccess.id);
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from('user_tier_access')
          .insert({
            user_id: selectedUserId,
            pricing_tier: selectedTier as "Free" | "10 PLN" | "20 PLN" | "40 PLN" | "75 PLN" | "100 PLN",
            expires_at: expiresAt.toISOString(),
            granted_by: currentUser?.id
          });
        error = result.error;
      }

      if (error) throw error;

      toast.success('Dostęp przyznany pomyślnie!');
      setSelectedUserId('');
      setSelectedTier('');
      fetchUsersAndAccess();
    } catch (error) {
      console.error('Error granting access:', error);
      toast.error('Błąd podczas przyznawania dostępu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    try {
      const { error } = await supabase
        .from('user_tier_access')
        .delete()
        .eq('id', accessId);

      if (error) throw error;

      toast.success('Dostęp został usunięty');
      fetchUsersAndAccess();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Błąd podczas usuwania dostępu');
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group access by user
  const accessByUser = tierAccess.reduce((acc, access) => {
    if (!acc[access.user_id]) {
      acc[access.user_id] = [];
    }
    acc[access.user_id].push(access);
    return acc;
  }, {} as Record<string, TierAccess[]>);

  const usersWithAccess = users.filter(user => accessByUser[user.id]?.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grant Access Form */}
      <div className="card-betting rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Przyznaj dostęp do pakietu
        </h3>
        
        <form onSubmit={handleGrantAccess} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Użytkownik</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz użytkownika..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Szukaj..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  {filteredUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email || user.full_name || 'Użytkownik bez emaila'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Pakiet</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz pakiet..." />
                </SelectTrigger>
                <SelectContent>
                  {pricingTiers.map(tier => (
                    <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>Dostęp będzie ważny do godziny 23:59 dzisiejszego dnia</span>
          </div>

          <Button type="submit" variant="neon" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Przyznaj dostęp
          </Button>
        </form>
      </div>

      {/* Active Access List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Aktywne dostępy</h3>
        
        {usersWithAccess.length === 0 ? (
          <div className="card-betting rounded-xl p-8 text-center">
            <p className="text-muted-foreground">Brak przyznanych dostępów</p>
          </div>
        ) : (
          usersWithAccess.map(user => (
            <div key={user.id} className="card-betting rounded-xl p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{user.email || user.full_name || 'Nieznany użytkownik'}</p>
                  {user.full_name && user.email && (
                    <p className="text-sm text-muted-foreground">{user.full_name}</p>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {accessByUser[user.id]?.map(access => (
                    <div key={access.id} className="flex items-center gap-1">
                      <Badge 
                        variant="outline" 
                        className={isExpired(access.expires_at) 
                          ? 'bg-destructive/10 text-destructive border-destructive/30' 
                          : 'bg-primary/10 text-primary border-primary/30'
                        }
                      >
                        {access.pricing_tier}
                        <span className="ml-1 text-xs opacity-70">
                          {isExpired(access.expires_at) 
                            ? '(wygasł)' 
                            : `do ${format(new Date(access.expires_at), 'HH:mm', { locale: pl })}`
                          }
                        </span>
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRevokeAccess(access.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
