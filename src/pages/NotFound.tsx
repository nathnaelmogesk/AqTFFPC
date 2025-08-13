
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      <div className="text-center space-y-6 p-8">
         <img
          src="/favicon.ico"
          alt="AquaTreasure Logo"
          className="w-24 h-24 rounded-2xl mx-auto object-contain"
        />
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Welcome to AquaTreasure FeedFortune!</h1>
          <h2 className="text-lg font-semibold text-gray-700">Your trusted partner in aquaculture management.</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Log in to manage your fish farms, monitor feeding schedules, and optimize growth with our innovative solutions.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link to="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Login 
            </Link>
          </Button>
          
          <p className="text-sm text-gray-500">
            Need help? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
