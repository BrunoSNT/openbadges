import { PublicKey } from '@solana/web3.js';

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REFRESH: '/api/auth/refresh',
      LOGOUT: '/api/auth/logout',
    },
    USER: {
      PROFILE: '/api/user/profile',
      UPDATE: '/api/user/update',
    },
    BADGE: {
      ISSUE: '/api/badge/issue',
      REVOKE: '/api/badge/revoke',
      LIST: '/api/badge/list',
      VALIDATE: '/api/badge/validate',
    },
    VALIDATION: {
      VERIFY: '/api/validate/verify',
      SCHEMA: '/api/validate/schema',
    },
    PROOF: {
      GENERATE: '/api/proof/generate',
      VERIFY: '/api/proof/verify',
    },
  },
};

// Solana Configuration
export const SOLANA_CONFIG = {
  NETWORK: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',
  RPC_URL: 'https://devnet.helius-rpc.com/?api-key=9956fdea-9608-4dda-9a35-46b60acd303f',
  PROGRAM_ID: new PublicKey(
    import.meta.env.VITE_PROGRAM_ID || 'FFQUgGaWxQFGnCe3VBmRZ259wtWHxjkpCqePouiyfzH5'
  ),
  COMMITMENT: 'confirmed' as const,
};

// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Open Badges',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
};
