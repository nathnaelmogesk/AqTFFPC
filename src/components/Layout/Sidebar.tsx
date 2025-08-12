
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Users, 
  User,
  List,
  Calendar,
  Settings,
  Folder,
  FolderOpen,
  Mail,
  Bell,
  Package,
  ShoppingCart,
  Package2,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    const userRole = profile?.role || 'farmer';

    switch (userRole) {
      case 'farmer':
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/profile', label: 'Profile', icon: User },
          { path: '/farms', label: 'My Farms', icon: FolderOpen },
          { path: '/inventory', label: 'Inventory', icon: List },
          { path: '/orders', label: 'Orders', icon: Calendar },
        ];
      
      case 'agent':
        return [
          { path: '/agent-dashboard', label: 'Dashboard', icon: Home },
          { path: '/profile', label: 'Profile', icon: User },
          { path: '/farmers', label: 'Manage Farmers', icon: Users },
          { path: '/agent-farms', label: 'Farms', icon: FolderOpen },
          { path: '/agent-orders', label: 'Orders', icon: Calendar },
        ];
      
      case 'supplier':
        return [
          { path: '/supplier-dashboard', label: 'Dashboard', icon: Home },
          { path: '/profile', label: 'Profile', icon: User },
        ];
      
      case 'admin':
        return [
          { path: '/admin-dashboard', label: 'Dashboard', icon: Home },
          { path: '/profile', label: 'Profile', icon: User },
        ];
      
      default:
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/profile', label: 'Profile', icon: User },
        ];
    }
  };

  const menuItems = getMenuItems();
  const userRole = profile?.role || 'farmer';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-200 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-green-100 text-green-900 border border-green-200"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        
        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Quick Actions
          </h3>
          <div className="space-y-1">
            {userRole === 'farmer' && (
              <NavLink 
                to="/orders"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded-lg"
                onClick={onClose}
              >
                <Calendar className="h-4 w-4" />
                Place Order
              </NavLink>
            )}
            {userRole === 'agent' && (
              <NavLink 
                to="/farmers"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg"
                onClick={onClose}
              >
                <Users className="h-4 w-4" />
                Manage Farmers
              </NavLink>
            )}
            {userRole === 'supplier' && (
              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg">
                <Package className="h-4 w-4" />
                Add Product
              </button>
            )}
            {userRole === 'admin' && (
              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-purple-700 hover:bg-purple-50 rounded-lg">
                <Settings className="h-4 w-4" />
                System Settings
              </button>
            )}
            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg">
              <Bell className="h-4 w-4" />
              Notifications
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
