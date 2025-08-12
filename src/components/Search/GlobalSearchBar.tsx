import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGlobalSearch } from './GlobalSearchProvider';
import { Search, X, Package, ShoppingCart, MapPin, Warehouse, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GlobalSearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { isSearching, searchResults, performSearch, clearResults } = useGlobalSearch();
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
        setIsOpen(true);
      }, 300); // Debounce search
    } else {
      clearResults();
      setIsOpen(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch, clearResults]);

  const handleResultClick = (result: any) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery('');
    clearResults();
  };

  const handleClear = () => {
    setQuery('');
    clearResults();
    setIsOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4" />;
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'farm':
        return <MapPin className="w-4 h-4" />;
      case 'inventory':
        return <Warehouse className="w-4 h-4" />;
      case 'supplier':
        return <Building2 className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-800';
      case 'product':
        return 'bg-green-100 text-green-800';
      case 'farm':
        return 'bg-orange-100 text-orange-800';
      case 'inventory':
        return 'bg-purple-100 text-purple-800';
      case 'supplier':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative flex-1 max-w-lg">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, products, farms..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              onFocus={() => {
                if (searchResults.length > 0) {
                  setIsOpen(true);
                }
              }}
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={handleClear}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            {isSearching && (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            )}
            
            <CommandList>
              {!isSearching && searchResults.length === 0 && query && (
                <CommandEmpty>No results found for "{query}"</CommandEmpty>
              )}
              
              {!isSearching && searchResults.length > 0 && (
                <CommandGroup heading={`${searchResults.length} results found`}>
                  {searchResults.map((result) => (
                    <CommandItem
                      key={`${result.type}-${result.id}`}
                      onSelect={() => handleResultClick(result)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="flex-shrink-0 mt-1">
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{result.title}</span>
                            <Badge className={getTypeBadgeColor(result.type)}>
                              {result.type}
                            </Badge>
                          </div>
                          {result.subtitle && (
                            <p className="text-sm text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          )}
                          {result.description && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {result.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default GlobalSearchBar;