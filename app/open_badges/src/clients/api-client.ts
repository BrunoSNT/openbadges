import { API_CONFIG } from '@/lib/config';

// ===================================================================
// API TYPES - Open Badges v3.0 Compliant
// ===================================================================

export interface Profile {
  '@context': string[];
  type: 'Profile';
  id: string;
  name: string;
  description?: string;
  url?: string;
  phone?: string;
  email?: string;
  image?: string;
  publicKey?: any;
}

export interface Achievement {
  '@context': string[];
  type: string[];
  id: string;
  name: string;
  description: string;
  criteria?: {
    id?: string;
    narrative?: string;
  };
  image?: string;
  tags?: string[];
  issuer: string;
  createdAt: string;
}

export interface AchievementCredential {
  '@context': string[];
  type: string[];
  id: string;
  recipient: string;
  achievement: string;
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  revoked: boolean;
  revokedAt?: string;
  evidence?: string[];
}

export interface CredentialQuery {
  issuer?: string;
  recipient?: string;
  achievement?: string;
  status?: 'active' | 'revoked' | 'all';
  format?: 'json-ld' | 'jwt' | 'all';
  limit?: number;
  offset?: number;
  since?: string;
  sortBy?: 'issued_date' | 'validity' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface CredentialResponse {
  id: string;
  format: 'json-ld' | 'jwt';
  credential: any;
  status: 'active' | 'revoked';
  issuedDate: string;
  expirationDate?: string;
  issuer: {
    id: string;
    name: string;
    url?: string;
  };
  achievement: {
    id: string;
    name: string;
    description: string;
  };
  recipient: {
    id: string;
    type: string;
  };
}

export interface CredentialCreateRequest {
  achievementId: string;
  recipientId: string;
  format?: 'json-ld' | 'jwt';
  validFrom?: string;
  validUntil?: string;
  evidence?: any[];
  metadata?: Record<string, any>;
}

export interface ValidationRequest {
  credential: string | object;
  format: 'json-ld' | 'jwt';
  checkRevocation?: boolean;
  checkExpiration?: boolean;
}

export interface ValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  verificationResult: {
    verified: boolean;
    issuerTrusted: boolean;
    signatureValid: boolean;
    notRevoked: boolean;
    notExpired: boolean;
  };
}

export interface ProofRequest {
  credential: string | object;
  challenge?: string;
  domain?: string;
  keyId?: string;
  proofPurpose?: string;
}

export interface ProofResponse {
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    challenge?: string;
    domain?: string;
    jws: string;
  };
}

// OAuth 2.0 Token Response
export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

// Standard error response format
export interface Imsx_StatusInfo {
  imsx_statusInfo: {
    imsx_codeMajor: 'success' | 'processing' | 'failure' | 'unsupported';
    imsx_severity: 'status' | 'warning' | 'error';
    imsx_description?: string;
    imsx_codeMinor?: string;
  };
}

// API Response wrapper
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  code?: string;
  status: number;
}

// ===================================================================
// HTTP CLIENT CONFIGURATION
// ===================================================================

class HttpClient {
  private baseURL: string;
  private timeout: number;
  private token: string | null = null;

  constructor(baseURL: string, timeout: number = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  clearAuthToken() {
    this.token = null;
  }

  getAuthToken(): string | null {
    return this.token;
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = this.getHeaders(customHeaders);

      const config: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (data && method !== 'GET') {
        if (customHeaders?.['Content-Type'] === 'text/plain') {
          config.body = data;
        } else {
          config.body = JSON.stringify(data);
        }
      }

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        return {
          status: response.status,
          error: responseData?.imsx_statusInfo?.imsx_description || 
                 responseData?.error || 
                 `HTTP ${response.status}: ${response.statusText}`,
          code: responseData?.imsx_statusInfo?.imsx_codeMinor || 
                responseData?.code || 
                'HTTP_ERROR',
        };
      }

      return {
        status: response.status,
        data: responseData,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            status: 408,
            error: 'Request timeout',
            code: 'TIMEOUT',
          };
        }
        return {
          status: 0,
          error: error.message,
          code: 'NETWORK_ERROR',
        };
      }
      
      return {
        status: 0,
        error: 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
      };
    }
  }

  async get<T>(endpoint: string, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, customHeaders);
  }

  async post<T>(endpoint: string, data?: any, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, customHeaders);
  }

  async put<T>(endpoint: string, data?: any, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, customHeaders);
  }

  async delete<T>(endpoint: string, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, customHeaders);
  }
}

// ===================================================================
// MAIN API SERVICE
// ===================================================================

export default class ApiClient {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient(API_CONFIG.BASE_URL, API_CONFIG.TIMEOUT);
  }

  // ===================================================================
  // AUTHENTICATION METHODS
  // ===================================================================

  /**
   * Authenticate with the API using wallet signature
   */
  async login(walletAddress: string, signature: string, message: string): Promise<ApiResponse<TokenResponse>> {
    const response = await this.client.post<TokenResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      walletAddress,
      signature,
      message,
    });

    if (response.data?.access_token) {
      this.client.setAuthToken(response.data.access_token);
    }

    return response;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<TokenResponse>> {
    const response = await this.client.post<TokenResponse>(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
      refresh_token: refreshToken,
    });

    if (response.data?.access_token) {
      this.client.setAuthToken(response.data.access_token);
    }

    return response;
  }

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<ApiResponse<void>> {
    const response = await this.client.post<void>(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    this.client.clearAuthToken();
    return response;
  }

  /**
   * Set authentication token manually
   */
  setAuthToken(token: string) {
    this.client.setAuthToken(token);
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.client.clearAuthToken();
  }

  /**
   * Get current authentication token
   */
  getAuthToken(): string | null {
    return this.client.getAuthToken();
  }

  // ===================================================================
  // OPEN BADGES v3.0 API METHODS
  // ===================================================================

  /**
   * Get credentials with optional filtering and pagination
   * GET /ims/ob/v3p0/credentials
   */
  async getCredentials(params: CredentialQuery = {}): Promise<ApiResponse<{ compactJwsStrings: string[] }>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = `/ims/ob/v3p0/credentials${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.client.get(endpoint);
  }

  /**
   * Create or update a credential
   * POST /ims/ob/v3p0/credentials
   */
  async createCredential(
    credential: CredentialCreateRequest | string,
    format: 'json-ld' | 'jwt' = 'json-ld'
  ): Promise<ApiResponse<void>> {
    const contentType = format === 'jwt' ? 'text/plain' : 'application/vc+ld+json';
    
    return this.client.post('/ims/ob/v3p0/credentials', credential, {
      'Content-Type': contentType,
    });
  }

  /**
   * Get profile information
   * GET /ims/ob/v3p0/profile
   */
  async getProfile(): Promise<ApiResponse<Profile>> {
    return this.client.get('/ims/ob/v3p0/profile');
  }

  /**
   * Update profile information
   * PUT /ims/ob/v3p0/profile
   */
  async updateProfile(profile: Partial<Profile>): Promise<ApiResponse<void>> {
    return this.client.put('/ims/ob/v3p0/profile', profile);
  }

  /**
   * Get service discovery document
   * GET /ims/ob/v3p0/discovery
   */
  async getDiscovery(): Promise<ApiResponse<any>> {
    return this.client.get('/ims/ob/v3p0/discovery');
  }

  // ===================================================================
  // EXTENDED CREDENTIALS API METHODS
  // ===================================================================

  /**
   * Get detailed credentials list with extended filtering
   * GET /api/credentials
   */
  async getDetailedCredentials(query: CredentialQuery = {}): Promise<ApiResponse<{
    credentials: CredentialResponse[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
  }>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = `/api/credentials${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.client.get(endpoint);
  }

  /**
   * Get a specific credential by ID
   * GET /api/credentials/:id
   */
  async getCredentialById(id: string): Promise<ApiResponse<CredentialResponse>> {
    return this.client.get(`/api/credentials/${encodeURIComponent(id)}`);
  }

  /**
   * Issue a new credential
   * POST /api/credentials
   */
  async issueCredential(request: CredentialCreateRequest): Promise<ApiResponse<{ credentialId: string }>> {
    return this.client.post('/api/credentials', request);
  }

  /**
   * Revoke a credential
   * POST /api/credentials/:id/revoke
   */
  async revokeCredential(id: string, reason?: string): Promise<ApiResponse<void>> {
    return this.client.post(`/api/credentials/${encodeURIComponent(id)}/revoke`, {
      reason: reason || 'Revoked by issuer',
    });
  }

  /**
   * Reactivate a revoked credential
   * POST /api/credentials/:id/reactivate
   */
  async reactivateCredential(id: string, reason?: string): Promise<ApiResponse<void>> {
    return this.client.post(`/api/credentials/${encodeURIComponent(id)}/reactivate`, {
      reason: reason || 'Reactivated by issuer',
    });
  }

  // ===================================================================
  // BADGE MANAGEMENT METHODS (Legacy API Support)
  // ===================================================================

  /**
   * Get all badges (legacy endpoint)
   * GET /api/badge/list
   */
  async getBadges(): Promise<ApiResponse<AchievementCredential[]>> {
    return this.client.get(API_CONFIG.ENDPOINTS.BADGE.LIST);
  }

  /**
   * Issue a badge (legacy endpoint)
   * POST /api/badge/issue
   */
  async issueBadge(badgeData: {
    recipientId: string;
    achievementId: string;
    evidence?: string[];
  }): Promise<ApiResponse<{ badgeId: string }>> {
    return this.client.post(API_CONFIG.ENDPOINTS.BADGE.ISSUE, badgeData);
  }

  /**
   * Revoke a badge (legacy endpoint)
   * POST /api/badge/revoke
   */
  async revokeBadge(badgeId: string, reason?: string): Promise<ApiResponse<void>> {
    return this.client.post(API_CONFIG.ENDPOINTS.BADGE.REVOKE, {
      badgeId,
      reason: reason || 'Revoked by issuer',
    });
  }

  /**
   * Validate a badge (legacy endpoint)
   * POST /api/badge/validate
   */
  async validateBadge(badgeData: any): Promise<ApiResponse<ValidationResponse>> {
    return this.client.post(API_CONFIG.ENDPOINTS.BADGE.VALIDATE, badgeData);
  }

  // ===================================================================
  // VALIDATION METHODS
  // ===================================================================

  /**
   * Verify a credential
   * POST /api/validate/verify
   */
  async verifyCredential(request: ValidationRequest): Promise<ApiResponse<ValidationResponse>> {
    console.log('🔍 === FRONTEND CREDENTIAL VERIFICATION ===');
    console.log('📍 Verification Request:', {
      format: request.format,
      checkRevocation: request.checkRevocation,
      checkExpiration: request.checkExpiration,
      credentialType: typeof request.credential,
    });
    console.log('📍 Sending to API for proof verification...');
    
    const response = await this.client.post<ValidationResponse>(API_CONFIG.ENDPOINTS.VALIDATION.VERIFY, request);
    
    console.log('🔍 API Response for credential verification:', response);
    
    if (response.data) {
      const validation = response.data as ValidationResponse;
      console.log('📋 Validation Response Details:');
      console.log('   → Status:', validation);
      
      if (validation.verificationResult) {
        console.log('   → Verified:', validation.verificationResult.verified);
        console.log('   → Issuer Trusted:', validation.verificationResult.issuerTrusted);
        console.log('   → Signature Valid:', validation.verificationResult.signatureValid);
        console.log('   → Not Revoked:', validation.verificationResult.notRevoked);
        console.log('   → Not Expired:', validation.verificationResult.notExpired);
      }
      
      console.log('🔐 Cryptographic Summary:');
      console.log('   → Overall Valid:', validation.valid);
      console.log('   → Errors:', validation.errors || []);
      console.log('   → Warnings:', validation.warnings || []);
    } else {
      console.error('❌ Verification failed:', response.error);
    }
    
    return response;
  }

  /**
   * Validate schema compliance
   * POST /api/validate/schema
   */
  async validateSchema(credential: any): Promise<ApiResponse<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>> {
    return this.client.post(API_CONFIG.ENDPOINTS.VALIDATION.SCHEMA, credential);
  }

  // ===================================================================
  // PROOF METHODS
  // ===================================================================

  /**
   * Generate a proof for a credential
   * POST /api/proof/generate
   */
  async generateProof(request: ProofRequest): Promise<ApiResponse<ProofResponse>> {
    return this.client.post(API_CONFIG.ENDPOINTS.PROOF.GENERATE, request);
  }

  /**
   * Verify a proof
   * POST /api/proof/verify
   */
  async verifyProof(proof: any): Promise<ApiResponse<{
    verified: boolean;
    errors: string[];
  }>> {
    return this.client.post(API_CONFIG.ENDPOINTS.PROOF.VERIFY, proof);
  }

  // ===================================================================
  // USER PROFILE METHODS
  // ===================================================================

  /**
   * Get user profile
   * GET /api/user/profile
   */
  async getUserProfile(): Promise<ApiResponse<Profile>> {
    return this.client.get(API_CONFIG.ENDPOINTS.USER.PROFILE);
  }

  /**
   * Update user profile
   * PUT /api/user/update
   */
  async updateUserProfile(profile: Partial<Profile>): Promise<ApiResponse<void>> {
    return this.client.put(API_CONFIG.ENDPOINTS.USER.UPDATE, profile);
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.client.get('/health');
  }
}

// ===================================================================
// SINGLETON INSTANCE
// ===================================================================

export const apiClient = new ApiClient();
