import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Types
export interface CompanyTaxonomy {
  id: string;
  name: string;
  description: string;
  metadata: {
    industry?: string;
    tags: string[];
    keywords: string[];
  };
  isActive: boolean;
  createdAt: string;
}

export interface CompanyView {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  filters: any[];
  sorting: any;
  columns: any[];
  isDefault: boolean;
  createdAt: string;
}

export interface CompanyClassification {
  taxonomyId: string;
  taxonomyName: string;
  confidence: number;
  reasoning: string;
}

// Hooks
export function useTaxonomies() {
  return useQuery({
    queryKey: ['companies-taxonomy', 'taxonomies'],
    queryFn: async () => {
      const response = await fetch('/api/companies-taxonomy/taxonomies');
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data.taxonomies as CompanyTaxonomy[];
    },
  });
}

export function useClassifyCompany() {
  return useMutation({
    mutationFn: async (companyData: {
      name: string;
      description?: string;
      website?: string;
      industry?: string;
      keywords?: string[];
    }) => {
      const response = await fetch('/api/companies-taxonomy/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data.classifications as CompanyClassification[];
    },
    onSuccess: () => {
      toast.success('Company classified successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to classify company');
    },
  });
}

export function useViews(organizationId: string) {
  return useQuery({
    queryKey: ['companies-taxonomy', 'views', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/companies-taxonomy/views/${organizationId}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data.views as CompanyView[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateView() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (viewData: {
      name: string;
      description?: string;
      organizationId: string;
      filters?: any[];
      sorting?: any;
      columns?: any[];
      isDefault?: boolean;
      isPublic?: boolean;
    }) => {
      const response = await fetch('/api/companies-taxonomy/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(viewData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data.view as CompanyView;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['companies-taxonomy', 'views', variables.organizationId] 
      });
      toast.success('View created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create view');
    },
  });
}

export function useCompaniesByView(viewId: string, organizationId: string, options?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['companies-taxonomy', 'companies-by-view', viewId, organizationId, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', options.page.toString());
      if (options?.limit) params.set('limit', options.limit.toString());
      if (options?.search) params.set('search', options.search);
      
      const response = await fetch(
        `/api/companies-taxonomy/views/${organizationId}/${viewId}/companies?${params}`
      );
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    enabled: !!viewId && !!organizationId,
  });
}

export function useTaxonomyHealth() {
  return useQuery({
    queryKey: ['companies-taxonomy', 'health'],
    queryFn: async () => {
      const response = await fetch('/api/companies-taxonomy/health');
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });
}
