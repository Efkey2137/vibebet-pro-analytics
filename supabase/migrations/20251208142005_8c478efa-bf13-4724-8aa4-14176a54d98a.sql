-- Create enum for pricing tiers
CREATE TYPE public.pricing_tier AS ENUM ('Free', '10 PLN', '20 PLN', '40 PLN', '75 PLN', '100 PLN');

-- Create enum for tip status
CREATE TYPE public.tip_status AS ENUM ('Pending', 'Won', 'Lost', 'Void');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create tips table
CREATE TABLE public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  league TEXT NOT NULL,
  pick TEXT NOT NULL,
  odds DECIMAL(5,2) NOT NULL,
  stake INTEGER NOT NULL CHECK (stake >= 1 AND stake <= 10),
  pricing_tier pricing_tier NOT NULL DEFAULT 'Free',
  status tip_status NOT NULL DEFAULT 'Pending',
  analysis TEXT,
  is_bet_builder BOOLEAN DEFAULT FALSE,
  proof_image_url TEXT,
  settled_at TIMESTAMP WITH TIME ZONE
);

-- Create user_purchases table
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tip_id UUID REFERENCES public.tips(id) ON DELETE CASCADE NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount_paid DECIMAL(10,2) NOT NULL,
  UNIQUE (user_id, tip_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Tips policies
CREATE POLICY "Anyone can view free tips"
  ON public.tips FOR SELECT
  USING (pricing_tier = 'Free');

CREATE POLICY "Users can view purchased tips"
  ON public.tips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_purchases
      WHERE user_purchases.tip_id = tips.id
      AND user_purchases.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all tips"
  ON public.tips FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create tips"
  ON public.tips FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tips"
  ON public.tips FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tips"
  ON public.tips FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- User purchases policies
CREATE POLICY "Users can view own purchases"
  ON public.user_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchases"
  ON public.user_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
  ON public.user_purchases FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for proof images
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-images', 'proof-images', true);

-- Storage policies for proof images
CREATE POLICY "Anyone can view proof images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proof-images');

CREATE POLICY "Admins can upload proof images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'proof-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update proof images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'proof-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete proof images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'proof-images' AND public.has_role(auth.uid(), 'admin'));