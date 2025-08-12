-- Allow admins to update any profile (needed for assigning agents to farmers)
-- Uses existing security definer function get_current_user_role()

-- Enable RLS is already enabled; we only add a policy for UPDATE
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.get_current_user_role() = 'admin');
