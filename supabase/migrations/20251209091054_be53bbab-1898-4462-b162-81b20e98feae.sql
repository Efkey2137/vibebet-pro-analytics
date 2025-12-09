-- Pozwól wszystkim widzieć wszystkie tipy (blokowanie treści jest na froncie)
CREATE POLICY "Anyone can view all tips metadata" 
ON public.tips 
FOR SELECT 
USING (true);