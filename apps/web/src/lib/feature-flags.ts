import { z } from 'zod';

// Schemas de validación
export const FeatureFlagCheckSchema = z.object({
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  userRole: z.string().optional(),
  customAttributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

export const FeatureFlagResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    isEnabled: z.boolean(),
    reason: z.string().optional()
  })
});

export const FeatureFlagsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    enabled: z.boolean(),
    environment: z.string(),
    rolloutPercentage: z.number(),
    targetUsers: z.array(z.string()),
    targetOrganizations: z.array(z.string()),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()])
    }))
  })),
  total: z.number()
});

// Tipos
export type FeatureFlagCheck = z.infer<typeof FeatureFlagCheckSchema>;
export type FeatureFlagResponse = z.infer<typeof FeatureFlagResponseSchema>;
export type FeatureFlagsResponse = z.infer<typeof FeatureFlagsResponseSchema>;

// Cliente de feature flags
export class FeatureFlagsClient {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos

  constructor(baseUrl: string = '/api/config') {
    this.baseUrl = baseUrl;
  }

  // Obtener todos los feature flags
  async getFeatureFlags(environment?: string): Promise<FeatureFlagsResponse> {
    const cacheKey = `feature-flags-${environment || 'all'}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const url = new URL(`${this.baseUrl}/feature-flags`);
      if (environment) {
        url.searchParams.set('environment', environment);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': this.getUserId(),
          'X-Organization-ID': this.getOrganizationId()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const validated = FeatureFlagsResponseSchema.parse(data);

      this.setCache(cacheKey, validated);
      return validated;
    } catch (error) {
      console.error('Failed to get feature flags:', error);
      throw error;
    }
  }

  // Verificar si un feature flag está habilitado
  async checkFeatureFlag(
    flagName: string,
    context?: FeatureFlagCheck
  ): Promise<FeatureFlagResponse> {
    const cacheKey = `feature-flag-${flagName}-${JSON.stringify(context || {})}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/feature-flags/${flagName}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': this.getUserId(),
          'X-Organization-ID': this.getOrganizationId()
        },
        body: JSON.stringify(context || {})
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const validated = FeatureFlagResponseSchema.parse(data);

      this.setCache(cacheKey, validated);
      return validated;
    } catch (error) {
      console.error(`Failed to check feature flag ${flagName}:`, error);
      throw error;
    }
  }

  // Verificar múltiples feature flags
  async checkMultipleFeatureFlags(
    flagNames: string[],
    context?: FeatureFlagCheck
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    try {
      const promises = flagNames.map(async (flagName) => {
        try {
          const result = await this.checkFeatureFlag(flagName, context);
          results[flagName] = result.data.isEnabled;
        } catch (error) {
          console.warn(`Failed to check feature flag ${flagName}:`, error);
          results[flagName] = false;
        }
      });

      await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Failed to check multiple feature flags:', error);
      return results;
    }
  }

  // Obtener configuración de environment
  async getEnvironmentConfig(environment: string): Promise<any> {
    const cacheKey = `environment-${environment}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/environments/${environment}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': this.getUserId(),
          'X-Organization-ID': this.getOrganizationId()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Failed to get environment config for ${environment}:`, error);
      throw error;
    }
  }

  // Obtener valor de configuración
  async getConfigValue(key: string, environment?: string, defaultValue?: any): Promise<any> {
    const cacheKey = `config-${key}-${environment || 'default'}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const url = new URL(`${this.baseUrl}/values/${key}`);
      if (environment) {
        url.searchParams.set('environment', environment);
      }
      if (defaultValue !== undefined) {
        url.searchParams.set('defaultValue', defaultValue);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': this.getUserId(),
          'X-Organization-ID': this.getOrganizationId()
        }
      });

      if (!response.ok) {
        if (response.status === 404 && defaultValue !== undefined) {
          return { success: true, data: { key, value: defaultValue } };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Failed to get config value ${key}:`, error);
      throw error;
    }
  }

  // Obtener estadísticas de configuración
  async getConfigStats(): Promise<any> {
    const cacheKey = 'config-stats';
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': this.getUserId(),
          'X-Organization-ID': this.getOrganizationId()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get config stats:', error);
      throw error;
    }
  }

  // Limpiar caché
  clearCache(): void {
    this.cache.clear();
  }

  // Limpiar caché de un key específico
  clearCacheKey(key: string): void {
    this.cache.delete(key);
  }

  // Utilidades privadas
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private getUserId(): string {
    // Obtener user ID del contexto de la aplicación
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          return user.id || '';
        } catch {
          return '';
        }
      }
    }
    return '';
  }

  private getOrganizationId(): string {
    // Obtener organization ID del contexto de la aplicación
    if (typeof window !== 'undefined') {
      const orgData = localStorage.getItem('organization');
      if (orgData) {
        try {
          const org = JSON.parse(orgData);
          return org.id || '';
        } catch {
          return '';
        }
      }
    }
    return '';
  }
}

// Instancia singleton
export const featureFlagsClient = new FeatureFlagsClient();

// Hook de React para feature flags
export function useFeatureFlag(flagName: string, context?: FeatureFlagCheck): void {
  const [isEnabled, setIsEnabled] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const checkFlag = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await featureFlagsClient.checkFeatureFlag(flagName, context);

        if (mounted) {
          setIsEnabled(result.data.isEnabled);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsEnabled(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkFlag();

    return () => {
      mounted = false;
    };
  }, [flagName, JSON.stringify(context)]);

  return { isEnabled, loading, error };
}

// Hook para múltiples feature flags
export function useMultipleFeatureFlags(flagNames: string[], context?: FeatureFlagCheck): void {
  const [flags, setFlags] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const checkFlags = async () => {
      try {
        setLoading(true);
        setError(null);

        const results = await featureFlagsClient.checkMultipleFeatureFlags(flagNames, context);

        if (mounted) {
          setFlags(results);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setFlags({});
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkFlags();

    return () => {
      mounted = false;
    };
  }, [JSON.stringify(flagNames), JSON.stringify(context)]);

  return { flags, loading, error };
}

// Componente de React para feature flags
interface FeatureFlagProps {
  flagName: string;
  context?: FeatureFlagCheck;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureFlag({ flagName, context, children, fallback = null }: FeatureFlagProps): void {
  const { isEnabled, loading, error } = useFeatureFlag(flagName, context);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    console.warn(`Feature flag ${flagName} error:`, error);
    return <>{fallback}</>;
  }

  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// Componente para múltiples feature flags
interface MultipleFeatureFlagsProps {
  flags: string[];
  context?: FeatureFlagCheck;
  children: (flags: Record<string, boolean>) => React.ReactNode;
  fallback?: React.ReactNode;
}

export function MultipleFeatureFlags({ flags, context, children, fallback = null }: MultipleFeatureFlagsProps): void {
  const { flags: flagStates, loading, error } = useMultipleFeatureFlags(flags, context);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    console.warn('Multiple feature flags error:', error);
    return <>{fallback}</>;
  }

  return <>{children(flagStates)}</>;
}

// Importar React para los hooks
import React from 'react';
