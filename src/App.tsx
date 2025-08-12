
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import FarmerProfile from "./pages/FarmerProfile";
import FarmerFarms from "./pages/FarmerFarms";
import FarmerInventory from "./pages/FarmerInventory";
import FarmerOrders from "./pages/FarmerOrders";
import SupplierDashboard from "./pages/SupplierDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AgentFarmers from "./pages/AgentFarmers";
import AgentFarms from "./pages/AgentFarms";
import AgentOrders from "./pages/AgentOrders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/profile" element={<Index />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <FarmerProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/farms" 
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <FarmerFarms />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <FarmerInventory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <FarmerOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supplier-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['supplier']}>
                  <SupplierDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agent-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['agent']}>
                  <AgentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/farmers" 
              element={
                <ProtectedRoute allowedRoles={['agent']}>
                  <AgentFarmers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agent-farms" 
              element={
                <ProtectedRoute allowedRoles={['agent']}>
                  <AgentFarms />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agent-orders" 
              element={
                <ProtectedRoute allowedRoles={['agent']}>
                  <AgentOrders />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
