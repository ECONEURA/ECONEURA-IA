'use client';

import { useState, useEffect, useRef } from 'react';
import { useApiClient } from '@/hooks/useApi';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Package, 
  Building2,
  Tag,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SearchFilters {
  category?: string;
  supplier_id?: string;
  min_price?: number;
  max_price?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  type?: 'all' | 'products' | 'suppliers';
}

interface SearchSuggestion {
  products: string[];
  suppliers: string[];
  categories: string[];
  skus: string[];
}

interface SearchResult {
  products: any[];
  suppliers: any[];
  total_products: number;
  total_suppliers: number;
  search_metadata: {
    query: string;
    filters_applied: Record<string, any>;
    execution_time: number;
  };
}

interface AdvancedSearchProps {
  onSearch: (results: SearchResult) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  placeholder?: string;
  className?: string;
}

export default function AdvancedSearch({
  onSearch,
  onFiltersChange,
  placeholder = "Buscar productos y proveedores...",
  className = ""
}: AdvancedSearchProps) {
  const apiClient = useApiClient();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all'
  });
  const [suggestions, setSuggestions] = useState<SearchSuggestion>({
    products: [],
    suppliers: [],
    categories: [],
    skus: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load available filters on mount
  useEffect(() => {
    loadAvailableFilters();
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load suggestions when query changes
  useEffect(() => {
    if (query.length >= 2) {
      loadSuggestions();
    } else {
      setSuggestions({
        products: [],
        suppliers: [],
        categories: [],
        skus: []
      });
      setShowSuggestions(false);
    }
  }, [query]);

  const loadAvailableFilters = async () => {
    try {
      const response = await apiClient('/search/filters');
      setAvailableFilters(response.data);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await apiClient(`/search/suggestions?q=${encodeURIComponent(query)}&type=${filters.type || 'all'}`);
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const performSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: query,
        type: filters.type || 'all',
        ...(filters.category && { category: filters.category }),
        ...(filters.supplier_id && { supplier_id: filters.supplier_id }),
        ...(filters.min_price && { min_price: filters.min_price.toString() }),
        ...(filters.max_price && { max_price: filters.max_price.toString() }),
        ...(filters.stock_status && { stock_status: filters.stock_status })
      });

      const response = await apiClient(`/search/inventory?${params.toString()}`);
      onSearch(response.data);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const newFilters = { type: 'all' };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSuggestionClick = (suggestion: string, type: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'out_of_stock':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'En Stock';
      case 'low_stock':
        return 'Stock Bajo';
      case 'out_of_stock':
        return 'Sin Stock';
      default:
        return 'Desconocido';
    }
  };

  const activeFiltersCount = Object.keys(filters).filter(key => 
    key !== 'type' && filters[key as keyof SearchFilters]
  ).length;

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sand-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-mediterranean-100 text-mediterranean-700 text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 rounded ${showFilters ? 'bg-mediterranean-100 text-mediterranean-600' : 'text-sand-400 hover:text-sand-600'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={performSearch}
            disabled={loading || !query.trim()}
            className="px-3 py-1 bg-mediterranean-600 text-white rounded text-sm hover:bg-mediterranean-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-sand-200 rounded-lg shadow-lg p-4 z-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Type */}
            <div>
              <label className="block text-sm font-medium text-sand-700 mb-2">
                Tipo de búsqueda
              </label>
              <select
                value={filters.type || 'all'}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="products">Productos</option>
                <option value="suppliers">Proveedores</option>
              </select>
            </div>

            {/* Category Filter */}
            {availableFilters?.categories && (
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-2">
                  Categoría
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
                >
                  <option value="">Todas las categorías</option>
                  {availableFilters.categories.map((cat: any) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Supplier Filter */}
            {availableFilters?.suppliers && (
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-2">
                  Proveedor
                </label>
                <select
                  value={filters.supplier_id || ''}
                  onChange={(e) => handleFilterChange('supplier_id', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
                >
                  <option value="">Todos los proveedores</option>
                  {availableFilters.suppliers.map((supplier: any) => (
                    <option key={supplier.value} value={supplier.value}>
                      {supplier.label} ({supplier.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-sand-700 mb-2">
                Rango de precio
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.min_price || ''}
                  onChange={(e) => handleFilterChange('min_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="flex-1 px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
                />
                <span className="flex items-center text-sand-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.max_price || ''}
                  onChange={(e) => handleFilterChange('max_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="flex-1 px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Stock Status */}
            <div>
              <label className="block text-sm font-medium text-sand-700 mb-2">
                Estado de stock
              </label>
              <select
                value={filters.stock_status || ''}
                onChange={(e) => handleFilterChange('stock_status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="in_stock">En Stock</option>
                <option value="low_stock">Stock Bajo</option>
                <option value="out_of_stock">Sin Stock</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-sand-200">
            <button
              onClick={clearFilters}
              className="text-sand-600 hover:text-sand-800 text-sm"
            >
              Limpiar filtros
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-mediterranean-600 text-white rounded-lg hover:bg-mediterranean-700"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.products.length > 0 || suggestions.suppliers.length > 0 || suggestions.categories.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-sand-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Products */}
          {suggestions.products.length > 0 && (
            <div className="p-3 border-b border-sand-100">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-mediterranean-500" />
                <span className="text-sm font-medium text-sand-700">Productos</span>
              </div>
              <div className="space-y-1">
                {suggestions.products.slice(0, 5).map((product, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(product, 'product')}
                    className="w-full text-left px-2 py-1 rounded hover:bg-sand-50 text-sm text-sand-700"
                  >
                    {product}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers */}
          {suggestions.suppliers.length > 0 && (
            <div className="p-3 border-b border-sand-100">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-sand-700">Proveedores</span>
              </div>
              <div className="space-y-1">
                {suggestions.suppliers.slice(0, 5).map((supplier, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(supplier, 'supplier')}
                    className="w-full text-left px-2 py-1 rounded hover:bg-sand-50 text-sm text-sand-700"
                  >
                    {supplier}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {suggestions.categories.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-sand-700">Categorías</span>
              </div>
              <div className="space-y-1">
                {suggestions.categories.slice(0, 3).map((category, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(category, 'category')}
                    className="w-full text-left px-2 py-1 rounded hover:bg-sand-50 text-sm text-sand-700"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

