import { useState, useCallback, useEffect } from 'react';
import { apiClient, type ApiResponse } from '@/clients/api-client';
import type { 
  ValidationResult
} from '@/types/badge';
import type {
  CredentialCreateRequest,
  ValidationRequest,
  CredentialResponse,
  Profile,
  AchievementCredential as ApiAchievementCredential
} from '@/clients/api-client';

// ===================================================================
// CUSTOM HOOKS FOR API INTERACTIONS
// ===================================================================

/**
 * Generic hook for API requests with loading, error, and success states
 */
export function useApiRequest<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiCall();
      
      if (response.error) {
        setError(response.error);
        setData(null);
        setSuccess(false);
      } else {
        setData(response.data || null);
        setError(null);
        setSuccess(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setData(null);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    success,
    execute,
    reset,
  };
}

/**
 * Hook for authentication operations
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const loginRequest = useApiRequest<{ access_token: string; refresh_token?: string }>();
  const logoutRequest = useApiRequest<void>();
  const refreshRequest = useApiRequest<{ access_token: string }>();

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      apiClient.setAuthToken(savedToken);
    }
  }, []);

  const login = useCallback(async (walletAddress: string, signature: string, message: string) => {
    await loginRequest.execute(() => apiClient.login(walletAddress, signature, message));
    
    if (loginRequest.data?.access_token) {
      const accessToken = loginRequest.data.access_token;
      setToken(accessToken);
      setIsAuthenticated(true);
      localStorage.setItem('auth_token', accessToken);
      
      if (loginRequest.data.refresh_token) {
        localStorage.setItem('refresh_token', loginRequest.data.refresh_token);
      }
    }
  }, [loginRequest]);

  const logout = useCallback(async () => {
    await logoutRequest.execute(() => apiClient.logout());
    
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }, [logoutRequest]);

  const refreshToken = useCallback(async () => {
    const savedRefreshToken = localStorage.getItem('refresh_token');
    if (!savedRefreshToken) {
      await logout();
      return;
    }

    await refreshRequest.execute(() => apiClient.refreshToken(savedRefreshToken));
    
    if (refreshRequest.data?.access_token) {
      const accessToken = refreshRequest.data.access_token;
      setToken(accessToken);
      setIsAuthenticated(true);
      localStorage.setItem('auth_token', accessToken);
    } else {
      await logout();
    }
  }, [refreshRequest, logout]);

  return {
    isAuthenticated,
    token,
    login,
    logout,
    refreshToken,
    loginLoading: loginRequest.loading,
    loginError: loginRequest.error,
    logoutLoading: logoutRequest.loading,
    refreshLoading: refreshRequest.loading,
  };
}

/**
 * Hook for credential operations
 */
export function useCredentials() {
  const fetchRequest = useApiRequest<{ compactJwsStrings: string[] }>();
  const detailedFetchRequest = useApiRequest<{ credentials: CredentialResponse[]; pagination: { limit: number; offset: number; total: number; hasMore: boolean } }>();
  const createRequest = useApiRequest<void>();
  const issueRequest = useApiRequest<{ credentialId: string }>();
  const revokeRequest = useApiRequest<void>();
  const validateRequest = useApiRequest<ValidationResult>();

  const fetchCredentials = useCallback((params?: Record<string, string | number>) => {
    return fetchRequest.execute(() => apiClient.getCredentials(params));
  }, [fetchRequest]);

  const fetchDetailedCredentials = useCallback((query?: { issuer?: string; subject?: string; type?: string }) => {
    return detailedFetchRequest.execute(() => apiClient.getDetailedCredentials(query));
  }, [detailedFetchRequest]);

  const createCredential = useCallback((credential: CredentialCreateRequest | string, format: 'json-ld' | 'jwt' = 'json-ld') => {
    return createRequest.execute(() => apiClient.createCredential(credential, format));
  }, [createRequest]);

  const issueCredential = useCallback((request: CredentialCreateRequest) => {
    return issueRequest.execute(() => apiClient.issueCredential(request));
  }, [issueRequest]);

  const revokeCredential = useCallback((id: string, reason?: string) => {
    return revokeRequest.execute(() => apiClient.revokeCredential(id, reason));
  }, [revokeRequest]);

  const validateCredential = useCallback((request: ValidationRequest) => {
    return validateRequest.execute(() => apiClient.verifyCredential(request));
  }, [validateRequest]);

  return {
    // Data
    credentials: fetchRequest.data,
    detailedCredentials: detailedFetchRequest.data,
    issuedCredential: issueRequest.data,
    validationResult: validateRequest.data,

    // Loading states
    fetchLoading: fetchRequest.loading,
    detailedFetchLoading: detailedFetchRequest.loading,
    createLoading: createRequest.loading,
    issueLoading: issueRequest.loading,
    revokeLoading: revokeRequest.loading,
    validateLoading: validateRequest.loading,

    // Error states
    fetchError: fetchRequest.error,
    detailedFetchError: detailedFetchRequest.error,
    createError: createRequest.error,
    issueError: issueRequest.error,
    revokeError: revokeRequest.error,
    validateError: validateRequest.error,

    // Success states
    createSuccess: createRequest.success,
    issueSuccess: issueRequest.success,
    revokeSuccess: revokeRequest.success,

    // Actions
    fetchCredentials,
    fetchDetailedCredentials,
    createCredential,
    issueCredential,
    revokeCredential,
    validateCredential,

    // Reset functions
    resetFetch: fetchRequest.reset,
    resetCreate: createRequest.reset,
    resetIssue: issueRequest.reset,
    resetRevoke: revokeRequest.reset,
    resetValidate: validateRequest.reset,
  };
}

/**
 * Hook for profile operations
 */
export function useProfile() {
  const fetchRequest = useApiRequest<Profile>();
  const updateRequest = useApiRequest<void>();
  const userProfileRequest = useApiRequest<Profile>();

  const fetchProfile = useCallback(() => {
    return fetchRequest.execute(() => apiClient.getProfile());
  }, [fetchRequest]);

  const updateProfile = useCallback((profile: Partial<Profile>) => {
    return updateRequest.execute(() => apiClient.updateProfile(profile));
  }, [updateRequest]);

  const fetchUserProfile = useCallback(() => {
    return userProfileRequest.execute(() => apiClient.getUserProfile());
  }, [userProfileRequest]);

  const updateUserProfile = useCallback((profile: Partial<Profile>) => {
    return updateRequest.execute(() => apiClient.updateUserProfile(profile));
  }, [updateRequest]);

  return {
    // Data
    profile: fetchRequest.data,
    userProfile: userProfileRequest.data,

    // Loading states
    fetchLoading: fetchRequest.loading,
    updateLoading: updateRequest.loading,
    userProfileLoading: userProfileRequest.loading,

    // Error states
    fetchError: fetchRequest.error,
    updateError: updateRequest.error,
    userProfileError: userProfileRequest.error,

    // Success states
    updateSuccess: updateRequest.success,

    // Actions
    fetchProfile,
    updateProfile,
    fetchUserProfile,
    updateUserProfile,

    // Reset functions
    resetFetch: fetchRequest.reset,
    resetUpdate: updateRequest.reset,
    resetUserProfile: userProfileRequest.reset,
  };
}

/**
 * Hook for badge operations (legacy API support)
 */
export function useBadges() {
  const fetchRequest = useApiRequest<ApiAchievementCredential[]>();
  const issueRequest = useApiRequest<{ badgeId: string }>();
  const revokeRequest = useApiRequest<void>();
  const validateRequest = useApiRequest<ValidationResult>();

  const fetchBadges = useCallback(() => {
    return fetchRequest.execute(() => apiClient.getBadges());
  }, [fetchRequest]);

  const issueBadge = useCallback((badgeData: {
    recipientId: string;
    achievementId: string;
    evidence?: string[];
  }) => {
    return issueRequest.execute(() => apiClient.issueBadge(badgeData));
  }, [issueRequest]);

  const revokeBadge = useCallback((badgeId: string, reason?: string) => {
    return revokeRequest.execute(() => apiClient.revokeBadge(badgeId, reason));
  }, [revokeRequest]);

  const validateBadge = useCallback((badgeData: string | object) => {
    return validateRequest.execute(() => apiClient.validateBadge(badgeData));
  }, [validateRequest]);

  return {
    // Data
    badges: fetchRequest.data,
    issuedBadge: issueRequest.data,
    validationResult: validateRequest.data,

    // Loading states
    fetchLoading: fetchRequest.loading,
    issueLoading: issueRequest.loading,
    revokeLoading: revokeRequest.loading,
    validateLoading: validateRequest.loading,

    // Error states
    fetchError: fetchRequest.error,
    issueError: issueRequest.error,
    revokeError: revokeRequest.error,
    validateError: validateRequest.error,

    // Success states
    issueSuccess: issueRequest.success,
    revokeSuccess: revokeRequest.success,

    // Actions
    fetchBadges,
    issueBadge,
    revokeBadge,
    validateBadge,

    // Reset functions
    resetFetch: fetchRequest.reset,
    resetIssue: issueRequest.reset,
    resetRevoke: revokeRequest.reset,
    resetValidate: validateRequest.reset,
  };
}

/**
 * Hook for validation and proof operations
 */
export function useValidation() {
  const verifyRequest = useApiRequest<ValidationResult>();
  const schemaRequest = useApiRequest<{ valid: boolean; errors: string[] }>();
  const proofRequest = useApiRequest<{ proof: object }>();
  const verifyProofRequest = useApiRequest<{ verified: boolean }>();

  const verifyCredential = useCallback((request: ValidationRequest) => {
    return verifyRequest.execute(() => apiClient.verifyCredential(request));
  }, [verifyRequest]);

  const validateSchema = useCallback((credential: string | object) => {
    return schemaRequest.execute(() => apiClient.validateSchema(credential));
  }, [schemaRequest]);

  const generateProof = useCallback((request: { credential: object; options?: object }) => {
    return proofRequest.execute(() => apiClient.generateProof(request));
  }, [proofRequest]);

  const verifyProof = useCallback((proof: object) => {
    return verifyProofRequest.execute(() => apiClient.verifyProof(proof));
  }, [verifyProofRequest]);

  return {
    // Data
    verificationResult: verifyRequest.data,
    schemaValidation: schemaRequest.data,
    proof: proofRequest.data,
    proofVerification: verifyProofRequest.data,

    // Loading states
    verifyLoading: verifyRequest.loading,
    schemaLoading: schemaRequest.loading,
    proofLoading: proofRequest.loading,
    verifyProofLoading: verifyProofRequest.loading,

    // Error states
    verifyError: verifyRequest.error,
    schemaError: schemaRequest.error,
    proofError: proofRequest.error,
    verifyProofError: verifyProofRequest.error,

    // Actions
    verifyCredential,
    validateSchema,
    generateProof,
    verifyProof,

    // Reset functions
    resetVerify: verifyRequest.reset,
    resetSchema: schemaRequest.reset,
    resetProof: proofRequest.reset,
    resetVerifyProof: verifyProofRequest.reset,
  };
}

/**
 * Hook for system operations
 */
export function useSystem() {
  const healthRequest = useApiRequest<{ status: string; timestamp: string }>();
  const versionRequest = useApiRequest<{ version: string; build: string }>();
  const discoveryRequest = useApiRequest<any>();

  const checkHealth = useCallback(() => {
    return healthRequest.execute(() => apiClient.healthCheck());
  }, [healthRequest]);

  const getVersion = useCallback(() => {
    // TODO: Implement getVersion in API client
    throw new Error('getVersion method not implemented in API client');
  }, []);

  const getDiscovery = useCallback(() => {
    return discoveryRequest.execute(() => apiClient.getDiscovery());
  }, [discoveryRequest]);

  return {
    // Data
    health: healthRequest.data,
    version: versionRequest.data,
    discovery: discoveryRequest.data,

    // Loading states
    healthLoading: healthRequest.loading,
    versionLoading: versionRequest.loading,
    discoveryLoading: discoveryRequest.loading,

    // Error states
    healthError: healthRequest.error,
    versionError: versionRequest.error,
    discoveryError: discoveryRequest.error,

    // Actions
    checkHealth,
    getVersion,
    getDiscovery,

    // Reset functions
    resetHealth: healthRequest.reset,
    resetVersion: versionRequest.reset,
    resetDiscovery: discoveryRequest.reset,
  };
}

/**
 * Hook that combines multiple API operations for dashboard use
 */
export function useDashboard() {
  const auth = useAuth();
  const credentials = useCredentials();
  const profile = useProfile();
  const system = useSystem();

  const loadDashboardData = useCallback(async () => {
    if (!auth.isAuthenticated) return;

    await Promise.all([
      credentials.fetchDetailedCredentials(),
      profile.fetchProfile(),
      system.checkHealth(),
    ]);
  }, [auth.isAuthenticated, credentials, profile, system]);

  const isLoading = credentials.detailedFetchLoading || profile.fetchLoading || system.healthLoading;
  const hasError = credentials.detailedFetchError || profile.fetchError || system.healthError;

  return {
    loadDashboardData,
    isLoading,
    hasError,
    dashboardCredentials: credentials.detailedCredentials,
    userProfile: profile.profile,
    systemHealth: system.health,
    ...auth,
    credentialsApi: credentials,
    profileApi: profile,
    systemApi: system,
  };
}
