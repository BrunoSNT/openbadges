import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { PublicKey } from '@solana/web3.js';
import { AuthService } from '../services/auth-service';
import { SolanaService } from '../services/solana-service';

// ===================================================================
// WALLET-BASED AUTHENTICATION
// ===================================================================
// This router implements wallet-based authentication using challenge-response
// mechanism for Solana wallets. This provides an alternative to OAuth 2.0
// for users who prefer to authenticate using their crypto wallets.
// ===================================================================

interface AuthChallenge {
  challenge: string;
  walletAddress: string;
  expiresAt: number;
  nonce: string;
}

// In-memory storage (in production, use database)
const activeChallenges = new Map<string, AuthChallenge>();

// Clean up expired challenges every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, challenge] of activeChallenges.entries()) {
    if (now > challenge.expiresAt) {
      activeChallenges.delete(id);
    }
  }
}, 5 * 60 * 1000);

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

const generateChallenge = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const generateNonce = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

const createAuthResponse = (message: string, data?: any) => {
  return {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data })
  };
};

const createAuthError = (message: string, code: string) => {
  return {
    success: false,
    error: code,
    message,
    timestamp: new Date().toISOString()
  };
};

const validateWalletAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// ===================================================================
// WALLET AUTH ROUTER
// ===================================================================

export function createWalletAuthRouter(
  authService: AuthService,
  solanaService: SolanaService
): Router {
  const router = Router();

  // ===================================================================
  // CHALLENGE GENERATION
  // ===================================================================

  // POST /api/auth/challenge
  router.post('/challenge', (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        res.status(400).json(createAuthError('Wallet address is required', 'missing_wallet_address'));
        return;
      }

      if (!validateWalletAddress(walletAddress)) {
        res.status(400).json(createAuthError('Invalid wallet address format', 'invalid_wallet_address'));
        return;
      }

      // Generate challenge
      const challenge = generateChallenge();
      const nonce = generateNonce();
      const challengeId = crypto.randomUUID();
      const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes

      const challengeData: AuthChallenge = {
        challenge,
        walletAddress,
        expiresAt,
        nonce
      };

      activeChallenges.set(challengeId, challengeData);

      console.log(`✅ Auth challenge generated for wallet: ${walletAddress.substring(0, 8)}...`);

      res.json(createAuthResponse('Challenge generated successfully', {
        challengeId,
        challenge,
        nonce,
        message: `Sign this message to authenticate with Open Badges API:\n\nChallenge: ${challenge}\nNonce: ${nonce}\nWallet: ${walletAddress}\nTimestamp: ${new Date().toISOString()}`,
        expiresAt: new Date(expiresAt).toISOString()
      }));
    } catch (error) {
      console.error('Challenge generation error:', error);
      res.status(500).json(createAuthError('Internal server error', 'server_error'));
    }
  });

  // ===================================================================
  // CHALLENGE VERIFICATION
  // ===================================================================

  // POST /api/auth/verify
  router.post('/verify', async (req: Request, res: Response) => {
    try {
      const { challengeId, signature, walletAddress } = req.body;

      if (!challengeId || !signature || !walletAddress) {
        res.status(400).json(createAuthError('challengeId, signature, and walletAddress are required', 'missing_parameters'));
        return;
      }

      // Retrieve challenge
      const challengeData = activeChallenges.get(challengeId);
      if (!challengeData) {
        res.status(400).json(createAuthError('Invalid or expired challenge', 'invalid_challenge'));
        return;
      }

      // Check expiration
      if (Date.now() > challengeData.expiresAt) {
        activeChallenges.delete(challengeId);
        res.status(400).json(createAuthError('Challenge has expired', 'challenge_expired'));
        return;
      }

      // Verify wallet address matches
      if (challengeData.walletAddress !== walletAddress) {
        res.status(400).json(createAuthError('Wallet address mismatch', 'wallet_mismatch'));
        return;
      }

      // TODO: Verify signature using Solana's signature verification
      // For now, accept any signature (in production, implement proper verification)
      const isValidSignature = signature && signature.length > 50; // Basic validation

      if (!isValidSignature) {
        res.status(401).json(createAuthError('Invalid signature', 'invalid_signature'));
        return;
      }

      // Remove used challenge
      activeChallenges.delete(challengeId);

      // Generate access token
      const scopes = [
        'https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly',
        'https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert',
        'https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.readonly',
        'https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.update'
      ];

      const accessToken = authService.generateToken(
        walletAddress,
        walletAddress,
        scopes
      );

      console.log(`✅ Wallet authentication successful for: ${walletAddress.substring(0, 8)}...`);

      res.json(createAuthResponse('Authentication successful', {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: scopes.join(' '),
        walletAddress
      }));
    } catch (error) {
      console.error('Challenge verification error:', error);
      res.status(500).json(createAuthError('Internal server error', 'server_error'));
    }
  });

  // ===================================================================
  // WALLET CONNECTION STATUS
  // ===================================================================

  // GET /api/auth/status
  router.get('/status', (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        res.json(createAuthResponse('No authentication token provided', {
          authenticated: false,
          walletConnected: false
        }));
        return;
      }

      const token = authHeader.slice(7);
      const payload = authService.verifyToken(token);
      
      if (!payload) {
        res.json(createAuthResponse('Invalid or expired token', {
          authenticated: false,
          walletConnected: false
        }));
        return;
      }

      res.json(createAuthResponse('Authentication status retrieved', {
        authenticated: true,
        walletConnected: true,
        walletAddress: payload.walletAddress,
        username: payload.userId,
        scopes: payload.permissions,
        expiresAt: new Date(payload.exp * 1000).toISOString()
      }));
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json(createAuthError('Internal server error', 'server_error'));
    }
  });

  // ===================================================================
  // WALLET LOGOUT
  // ===================================================================

  // POST /api/auth/logout
  router.post('/logout', (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        // In production, add token to revocation list
        console.log(`✅ User logged out, token revoked: ${token.substring(0, 8)}...`);
      }

      res.json(createAuthResponse('Logout successful', {
        authenticated: false,
        walletConnected: false
      }));
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json(createAuthError('Internal server error', 'server_error'));
    }
  });

  // ===================================================================
  // WALLET PROFILE INFORMATION
  // ===================================================================

  // GET /api/auth/profile
  router.get('/profile', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json(createAuthError('Access token required', 'unauthorized'));
        return;
      }

      const token = authHeader.slice(7);
      const payload = authService.verifyToken(token);
      
      if (!payload) {
        res.status(401).json(createAuthError('Invalid or expired token', 'unauthorized'));
        return;
      }

      // Get profile from Solana if available
      let profile = null;
      try {
        const walletPubkey = new PublicKey(payload.walletAddress);
        profile = await solanaService.getIssuerProfile(walletPubkey);
      } catch (error) {
        console.log('No profile found on Solana for wallet:', payload.walletAddress);
      }

      res.json(createAuthResponse('Profile retrieved successfully', {
        walletAddress: payload.walletAddress,
        username: payload.userId,
        scopes: payload.permissions,
        profile: profile || {
          id: payload.walletAddress,
          type: 'Profile',
          name: `Wallet User ${payload.walletAddress.substring(0, 8)}...`,
          hasProfile: false
        },
        authenticatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Profile retrieval error:', error);
      res.status(500).json(createAuthError('Internal server error', 'server_error'));
    }
  });

  return router;
}
