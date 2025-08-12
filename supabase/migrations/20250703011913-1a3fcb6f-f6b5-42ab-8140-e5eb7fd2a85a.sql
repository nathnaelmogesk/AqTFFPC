
-- Enable RLS on suppliers table if not already enabled
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow suppliers to view their own record
CREATE POLICY "Suppliers can view their own record" 
  ON public.suppliers 
  FOR SELECT 
  USING (auth.uid() = id);

-- Create policy to allow suppliers to insert their own record
CREATE POLICY "Suppliers can create their own record" 
  ON public.suppliers 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create policy to allow suppliers to update their own record
CREATE POLICY "Suppliers can update their own record" 
  ON public.suppliers 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Enable RLS on products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow suppliers to view their own products
CREATE POLICY "Suppliers can view their own products" 
  ON public.products 
  FOR SELECT 
  USING (auth.uid() = supplier_id);

-- Create policy to allow suppliers to insert their own products
CREATE POLICY "Suppliers can create their own products" 
  ON public.products 
  FOR INSERT 
  WITH CHECK (auth.uid() = supplier_id);

-- Create policy to allow suppliers to update their own products
CREATE POLICY "Suppliers can update their own products" 
  ON public.products 
  FOR UPDATE 
  USING (auth.uid() = supplier_id);

-- Create policy to allow suppliers to delete their own products
CREATE POLICY "Suppliers can delete their own products" 
  ON public.products 
  FOR DELETE 
  USING (auth.uid() = supplier_id);
