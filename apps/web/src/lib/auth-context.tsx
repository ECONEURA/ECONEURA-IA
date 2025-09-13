'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// import { EconeuraSDK } from '@econeura/sdk';
import type {
  User,
  Organization,
  Role,
  LoginRequest,
  LoginResponse,
  MeResponse
} from '@econeura/shared';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  role: Role | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  sdk: any | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: (allDevices?: boolean) => Promise<void>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: string, scope?: 'organization' | 'own') => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organization: null,
  role: null,
  permissions: [],
  isLoading: true,
  isAuthenticated: false,
  sdk: null,
  login: async () => {},
  logout: async () => {},
  refreshSession: async () => {},
  hasPermission: () => false,
});

const TOKEN_KEY = 'econeura_access_token';
const REFRESH_TOKEN_KEY = 'econeura_refresh_token';
const USER_KEY = 'econeura_user';
const ORG_KEY = 'econeura_org';
const ROLE_KEY = 'econeura_role';
const PERMISSIONS_KEY = 'econeura_permissions';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sdk, setSdk] = useState<any | null>(null);
  const router = useRouter();

  // Initialize SDK
  const initializeSdk = useCallback((accessToken?: string, refreshToken?: string) => {
    // Minimal stub with required surface
    const stub = {
      client: {
        setAccessToken: (_t: string) => {},
        setRefreshToken: (_t: string) => {},
      },
      auth: {
        async me(): Promise<MeResponse> {
          // Try to read cached values if present
          const cachedUser = localStorage.getItem(USER_KEY);
          const cachedOrg = localStorage.getItem(ORG_KEY);
          const cachedRole = localStorage.getItem(ROLE_KEY);
          const cachedPermissions = localStorage.getItem(PERMISSIONS_KEY);
          if (cachedUser && cachedOrg && cachedRole && cachedPermissions) {
            return {
              user: JSON.parse(cachedUser),
              organization: JSON.parse(cachedOrg),
              role: JSON.parse(cachedRole),
              permissions: JSON.parse(cachedPermissions),
              tokens: { accessToken: accessToken || '', refreshToken: refreshToken || '' }
            } as unknown as MeResponse;
          }
          throw new Error('Not authenticated');
        },
        async login(_credentials: LoginRequest): Promise<LoginResponse> {
          // This stub should not be used for real auth; throw to surface missing SDK
          throw new Error('SDK not initialized: login unavailable in stub');
        },
        async refresh({ refreshToken }: { refreshToken: string }): Promise<LoginResponse> {
          // Pass-through stub; in real SDK, this would call API
          return {
            user: null as any,
            organization: null as any,
            role: null as any,
            permissions: [],
            tokens: { accessToken: accessToken || '', refreshToken: refreshToken || '' }
          } as unknown as LoginResponse;
        },
        async logout(_opts?: { allDevices?: boolean }) { /* no-op */ },
      },
    };
    setSdk(stub);
    return stub;
  }, []);

  // Load stored session on mount
  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (storedToken && storedRefreshToken) {
          // Initialize SDK with stored tokens
          const sdkInstance = initializeSdk(storedToken, storedRefreshToken);
          
          // For now, just load cached data since SDK is not implemented
          const cachedUser = localStorage.getItem(USER_KEY);
          const cachedOrg = localStorage.getItem(ORG_KEY);
          const cachedRole = localStorage.getItem(ROLE_KEY);
          const cachedPermissions = localStorage.getItem(PERMISSIONS_KEY);
          
          if (cachedUser && cachedOrg && cachedRole && cachedPermissions) {
            setUser(JSON.parse(cachedUser));
            setOrganization(JSON.parse(cachedOrg));
            setRole(JSON.parse(cachedRole));
            setPermissions(JSON.parse(cachedPermissions));
          }
        } else {
          // Try to load cached user data for faster UI
          const cachedUser = localStorage.getItem(USER_KEY);
          const cachedOrg = localStorage.getItem(ORG_KEY);
          const cachedRole = localStorage.getItem(ROLE_KEY);
          const cachedPermissions = localStorage.getItem(PERMISSIONS_KEY);

          if (cachedUser && cachedOrg && cachedRole && cachedPermissions) {
            setUser(JSON.parse(cachedUser));
            setOrganization(JSON.parse(cachedOrg));
            setRole(JSON.parse(cachedRole));
            setPermissions(JSON.parse(cachedPermissions));
          }

          // Initialize SDK without tokens (for public endpoints)
          initializeSdk();
        }
      } catch (error) {
        console.error('Error loading session:', error);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredSession();
  }, [initializeSdk]);

  // Clear session data
  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORG_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);
    setUser(null);
    setOrganization(null);
    setRole(null);
    setPermissions([]);
  };

  // Login function
  const login = async (credentials: LoginRequest) => {
    try {
  const sdkInstance = sdk || initializeSdk();
  if (!sdkInstance) throw new Error('SDK not initialized');
  const response = await sdkInstance.auth.login(credentials);

      // Store tokens
      localStorage.setItem(TOKEN_KEY, response.tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.tokens.refreshToken);

      // Update SDK with new tokens
      sdkInstance.client.setAccessToken(response.tokens.accessToken);
      sdkInstance.client.setRefreshToken(response.tokens.refreshToken);

      // Update state
      setUser(response.user as User);
      setOrganization(response.organization as Organization);
      setRole(response.role as Role);
      setPermissions(response.permissions);

      // Store in localStorage for faster next load
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      localStorage.setItem(ORG_KEY, JSON.stringify(response.organization));
      localStorage.setItem(ROLE_KEY, JSON.stringify(response.role));
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(response.permissions));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async (allDevices = false) => {
    try {
      if (sdk) {
        await sdk.auth.logout({ allDevices });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear session regardless of API call result
      clearSession();
      router.push('/login');
    }
  };

  // Refresh session
  const refreshSession = async () => {
    try {
      if (!sdk) return;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error('No refresh token');

  const response = await sdk.auth.refresh({ refreshToken });

      // Update tokens
      localStorage.setItem(TOKEN_KEY, response.tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.tokens.refreshToken);

      // Update SDK
      sdk.client.setAccessToken(response.tokens.accessToken);
      sdk.client.setRefreshToken(response.tokens.refreshToken);

      // Get updated user info
  const meData = await sdk.auth.me();
      setUser(meData.user as User);
      setOrganization(meData.organization as Organization);
      setRole(meData.role as Role);
      setPermissions(meData.permissions);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      clearSession();
      router.push('/login');
    }
  };

  // Check permission
  const hasPermission = (permission: string, scope: 'organization' | 'own' = 'organization') => {
    if (!permissions.length) return false;

    // Check for admin wildcard
    if (permissions.includes('*') ||
        permissions.includes('*:*') ||
        permissions.includes('*:*:*')) {
      return true;
    }

    // Check exact permission
    if (permissions.includes(permission)) {
      return true;
    }

    // Check wildcard permission (e.g., crm:contacts:* matches crm:contacts:view)
    const permissionParts = permission.split(':');
    for (const userPerm of permissions) {
      if (userPerm.endsWith(':*')) {
        const permBase = userPerm.slice(0, -2);
        if (permission.startsWith(permBase + ':')) {
          return true;
        }
      }
    }

    return false;
  };

  const value = {
    user,
    organization,
    role,
    permissions,
    isLoading,
    isAuthenticated: !!user,
    sdk,
    login,
    logout,
    refreshSession,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}