-- Tabela dostępu użytkowników do typów z datą wygaśnięcia
CREATE TABLE public.user_tier_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pricing_tier pricing_tier NOT NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, pricing_tier)
);

-- Włącz RLS
ALTER TABLE public.user_tier_access ENABLE ROW LEVEL SECURITY;

-- Admini mogą wszystko
CREATE POLICY "Admins can manage tier access"
ON public.user_tier_access
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Użytkownicy mogą widzieć swój dostęp
CREATE POLICY "Users can view own tier access"
ON public.user_tier_access
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));