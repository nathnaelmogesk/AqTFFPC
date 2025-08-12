
-- Update the existing user to ensure they have admin role
UPDATE public.profiles 
SET role = 'admin', name = 'Admin User'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'nathnael.moges.k@gmail.com'
);
