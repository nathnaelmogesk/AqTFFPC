
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/Auth/LoginForm';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}
// Map roles to their redirect paths
const roleRedirectMap: Record<string, string> = {
  'admin': '/admin-dashboard',
  'supplier': '/supplier-dashboard',
  'agent': '/agent-dashboard',
  'farmer': '/dashboard',
  // Add other roles as needed
};


const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">FF</span>
          </div>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading FeedFortune...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Check role-based access control
if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    console.log('Access denied for user:', { 
      userRole: profile.role, 
      allowedRoles, 
      userId: user?.id 
    });

    // Get the redirect path from the map, defaulting to an unauthorized page
    const redirectPath = roleRedirectMap[profile.role] || '/unauthorized';

    // Redirect the user
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
