import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  type: 'order' | 'product' | 'farm' | 'inventory' | 'supplier';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: Record<string, any>;
}

interface SearchContextType {
  isSearching: boolean;
  searchResults: SearchResult[];
  performSearch: (query: string, filters?: SearchFilters) => Promise<void>;
  clearResults: () => void;
}

interface SearchFilters {
  types?: Array<'order' | 'product' | 'farm' | 'inventory' | 'supplier'>;
  dateRange?: { start: Date; end: Date };
  status?: string;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useGlobalSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useGlobalSearch must be used within a GlobalSearchProvider');
  }
  return context;
};

export const GlobalSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const performSearch = useCallback(async (query: string, filters?: SearchFilters) => {
    if (!user || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();

    try {
      // Search Orders (if user is farmer, agent, or supplier)
      if (!filters?.types || filters.types.includes('order')) {
        const { data: orders } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total_price,
            status,
            profiles!orders_farmer_id_fkey(name),
            farms(name, location),
            suppliers!orders_supplier_id_fkey(name)
          `)
          .or(`
            farmer_id.eq.${user.id},
            supplier_id.eq.${user.id}
          `)
          .ilike('profiles.name', `%${searchTerm}%`)
          .limit(10);

        orders?.forEach(order => {
          results.push({
            id: order.id,
            type: 'order',
            title: `Order #${order.id.slice(0, 8)}`,
            subtitle: `${order.profiles?.name} - ${order.status}`,
            description: `$${order.total_price} - ${new Date(order.created_at).toLocaleDateString()}`,
            url: `/orders/${order.id}`,
            metadata: order
          });
        });
      }

      // Search Products
      if (!filters?.types || filters.types.includes('product')) {
        const { data: products } = await supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            unit_price,
            feed_type,
            suppliers(name)
          `)
          .or(`
            name.ilike.%${searchTerm}%,
            description.ilike.%${searchTerm}%,
            feed_type.ilike.%${searchTerm}%
          `)
          .limit(10);

        products?.forEach(product => {
          results.push({
            id: product.id,
            type: 'product',
            title: product.name,
            subtitle: `${product.feed_type} - $${product.unit_price}`,
            description: product.description || `Supplied by ${product.suppliers?.name}`,
            url: `/products/${product.id}`,
            metadata: product
          });
        });
      }

      // Search Farms (if user is farmer or agent)
      if ((!filters?.types || filters.types.includes('farm')) && user) {
        const { data: farms } = await supabase
          .from('farms')
          .select(`
            id,
            name,
            location,
            livestock_type,
            size,
            profiles(name)
          `)
          .eq('farmer_id', user.id)
          .or(`
            name.ilike.%${searchTerm}%,
            location.ilike.%${searchTerm}%,
            livestock_type.ilike.%${searchTerm}%
          `)
          .limit(10);

        farms?.forEach(farm => {
          results.push({
            id: farm.id,
            type: 'farm',
            title: farm.name,
            subtitle: `${farm.livestock_type} - ${farm.location}`,
            description: `${farm.size} hectares`,
            url: `/farms/${farm.id}`,
            metadata: farm
          });
        });
      }

      // Search Inventory (if user is farmer)
      if ((!filters?.types || filters.types.includes('inventory')) && user) {
        const { data: inventory } = await supabase
          .from('inventory')
          .select(`
            id,
            current_stock,
            low_stock_threshold,
            farms!inner(name, farmer_id),
            products(name, unit, feed_type)
          `)
          .eq('farms.farmer_id', user.id)
          .or(`
            farms.name.ilike.%${searchTerm}%,
            products.name.ilike.%${searchTerm}%,
            products.feed_type.ilike.%${searchTerm}%
          `)
          .limit(10);

        inventory?.forEach(item => {
          results.push({
            id: item.id,
            type: 'inventory',
            title: `${item.products?.name} at ${item.farms?.name}`,
            subtitle: `${item.current_stock} ${item.products?.unit} in stock`,
            description: item.current_stock <= (item.low_stock_threshold || 0) ? 'Low stock alert' : 'Stock OK',
            url: `/inventory/${item.id}`,
            metadata: item
          });
        });
      }

      // Search Suppliers (public data)
      if (!filters?.types || filters.types.includes('supplier')) {
        const { data: suppliers } = await supabase
          .from('suppliers')
          .select('id, name, contact_name, email, phone, address')
          .or(`
            name.ilike.%${searchTerm}%,
            contact_name.ilike.%${searchTerm}%,
            address.ilike.%${searchTerm}%
          `)
          .eq('is_active', true)
          .limit(10);

        suppliers?.forEach(supplier => {
          results.push({
            id: supplier.id,
            type: 'supplier',
            title: supplier.name,
            subtitle: supplier.contact_name,
            description: `${supplier.email} - ${supplier.address}`,
            url: `/suppliers/${supplier.id}`,
            metadata: supplier
          });
        });
      }

      // Apply additional filters
      let filteredResults = results;
      
      if (filters?.status) {
        filteredResults = results.filter(result => 
          result.metadata?.status === filters.status
        );
      }

      if (filters?.dateRange) {
        filteredResults = filteredResults.filter(result => {
          if (result.metadata?.created_at) {
            const itemDate = new Date(result.metadata.created_at);
            return itemDate >= filters.dateRange!.start && itemDate <= filters.dateRange!.end;
          }
          return true;
        });
      }

      setSearchResults(filteredResults.slice(0, 50)); // Limit total results
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  const clearResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  return (
    <SearchContext.Provider value={{
      isSearching,
      searchResults,
      performSearch,
      clearResults
    }}>
      {children}
    </SearchContext.Provider>
  );
};