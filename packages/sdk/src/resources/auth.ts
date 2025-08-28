import { ApiClient } from '../client';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  MeResponse,
  SessionsResponse,
} from '@econeura/shared';

export class AuthResource {
  constructor(private client: ApiClient) {}

  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/api/v1/auth/login', data, {
      skipAuth: true,
    });
    
    // Automatically set tokens in the client
    if (response.data.tokens) {
      this.client.setAccessToken(response.data.tokens.accessToken);
      this.client.setRefreshToken(response.data.tokens.refreshToken);
    }
    
    return response.data;
  }

  /**
   * Refresh access token
   */
  async refresh(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await this.client.post<RefreshTokenResponse>('/api/v1/auth/refresh', data, {
      skipAuth: true,
    });
    
    // Automatically update tokens in the client
    if (response.data.tokens) {
      this.client.setAccessToken(response.data.tokens.accessToken);
      this.client.setRefreshToken(response.data.tokens.refreshToken);
    }
    
    return response.data;
  }

  /**
   * Logout current session or all sessions
   */
  async logout(data?: LogoutRequest): Promise<void> {
    await this.client.post('/api/v1/auth/logout', data);
  }

  /**
   * Get current user information
   */
  async me(): Promise<MeResponse> {
    const response = await this.client.get<MeResponse>('/api/v1/auth/me');
    return response.data;
  }

  /**
   * Get all user sessions
   */
  async sessions(): Promise<SessionsResponse> {
    const response = await this.client.get<SessionsResponse>('/api/v1/auth/sessions');
    return response.data;
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.client.delete(`/api/v1/auth/sessions/${sessionId}`);
  }
}