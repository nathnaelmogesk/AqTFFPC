
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading || (user && !profile)) {
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

  // Redirect based on user role
  const getDashboardRoute = () => {
    switch (profile?.role) {
      case 'admin':
        return '/admin-dashboard';
      case 'supplier':
        return '/supplier-dashboard';
      case 'agent':
        return '/agent-dashboard';
      case 'farmer':
        return '/dashboard';
      default:
        return '/dashboard'; // Default fallback to farmer dashboard
    }
  };

  return <Navigate to={getDashboardRoute()} replace />;
};

export default Index;
