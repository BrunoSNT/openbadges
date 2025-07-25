import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import bs58 from 'bs58';
import { apiClient } from '../clients/api-client';
import type { Profile } from '../clients/api-client';

interface User extends Omit<Profile, '@context' | 'type'> {
  // Extends Profile but removes the JSON-LD specific fields for context use
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<boolean>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, connected } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthenticated = !!user && !!apiClient.getAuthToken();

  // Initialize auth state from stored token
  useEffect(() => {
    const initAuth = async () => {
      const token = apiClient.getAuthToken();
      if (token && publicKey) {
        try {
          setIsLoading(true);
          const response = await apiClient.getUserProfile();
          if (response.data && !response.error) {
            setUser(response.data as User);
          } else {
            // Token is invalid, clear it
            apiClient.clearAuthToken();
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          apiClient.setAuthToken('');
        }
      }
      setIsLoading(false);
      setIsInitialized(true);
    };

    initAuth();
  }, [publicKey]);

  // Clear auth when wallet disconnects
  useEffect(() => {
    if (!connected || !publicKey) {
      setUser(null);
      apiClient.setAuthToken('');
    }
  }, [connected, publicKey]);

  const login = async (): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      toast.error('Wallet not connected or does not support message signing');
      return false;
    }

    try {
      setIsLoading(true);

      // Create a message to sign
      const message = `Sign this message to authenticate with Open Badges Platform.\n\nTimestamp: ${Date.now()}\nPublic Key: ${publicKey.toBase58()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Sign the message
      const signature = await signMessage(encodedMessage);
      const signatureBase58 = bs58.encode(signature);

      // Send authentication request to API
      const response = await apiClient.login(
        publicKey.toBase58(),
        signatureBase58,
        message
      );

      if (response.error || !response.data) {
        toast.error(response.error || 'Authentication failed');
        return false;
      }

      // Store the auth token
      apiClient.setAuthToken(response.data.access_token);

      // Get user profile
      const profileResponse = await apiClient.getUserProfile();
      if (profileResponse.data && !profileResponse.error) {
        setUser(profileResponse.data as User);
        toast.success('Successfully authenticated!');
        return true;
      } else {
        toast.error('Failed to load user profile');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      apiClient.clearAuthToken();
      toast.success('Logged out successfully');
    }
  };

  const refreshAuth = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.refreshToken(refreshToken);
      if (response.data && !response.error) {
        apiClient.setAuthToken(response.data.access_token);
        
        // Refresh user profile
        const profileResponse = await apiClient.getUserProfile();
        if (profileResponse.data && !profileResponse.error) {
          setUser(profileResponse.data as User);
        }
      } else {
        // Refresh failed, clear auth
        setUser(null);
        apiClient.clearAuthToken();
        localStorage.removeItem('refresh_token');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      setUser(null);
      apiClient.clearAuthToken();
      localStorage.removeItem('refresh_token');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: isLoading || !isInitialized,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
