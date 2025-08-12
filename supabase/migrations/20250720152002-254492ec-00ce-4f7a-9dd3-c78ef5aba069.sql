-- Drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all farms" ON public.farms;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create proper admin policies using the security definer function
CREATE POLICY "Admins can view all farms" 
ON public.farms 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');