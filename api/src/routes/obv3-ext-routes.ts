import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth-service';
import { SolanaService } from '../services/solana-service';
import { PublicKey } from '@solana/web3.js';

// ===================================================================
// EXTENDED OPEN BADGES API - BEYOND SPECIFICATION
// ===================================================================
// This router implements extended functionality beyond the Open Badges
// v3.0 specification, including CRUD operations, verification endpoints,
// achievement management, and enhanced features.
// ===================================================================

// ===================================================================
// TYPES & INTERFACES (Extended API)
// ===================================================================

export interface ExtendedCredentialQuery {
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

export interface ExtendedCredentialResponse {
  id: string;
  format: 'json-ld' | 'jwt';
  credential: any;
  status: 'active' | 'revoked';
  issuedDate: string;
  expirationDate?: string;
  issuer: { id: string; name: string; url?: string; };
  achievement: { id: string; name: string; description: string; };
  recipient: { id: string; type: string; };
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

export interface ProfileCreateRequest {
  profileId: string;
  name: string;
  url?: string;
  email?: string;
}

export interface AchievementCreateRequest {
  achievementId: string;
  name: string;
  description: string;
  criteriaNarrative?: string;
  criteriaId?: string;
}

export interface ExtendedApiContext {
  user: any;
  authService: AuthService;
  solanaService: SolanaService;
}

// ===================================================================
// CONSTANTS (Extended API)
// ===================================================================

const EXTENDED_MAX_LIMIT = 100;
const EXTENDED_DEFAULT_LIMIT = 20;

// ===================================================================
// ERROR HANDLING (Extended API)
// ===================================================================

const createExtendedErrorResponse = (description: string, code?: string) => {
  return { 
    error: description, 
    code,
    apiVersion: 'extended-v1',
    timestamp: new Date().toISOString()
  };
};

const handleAsyncRoute = (handler: (req: Request, res: Response, ctx: ExtendedApiContext) => Promise<void>) => {
  return (authService: AuthService, solanaService: SolanaService) => {
    return async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const ctx: ExtendedApiContext = { user, authService, solanaService };
        
        await handler(req, res, ctx);
      } catch (error) {
        console.error(`Error in ${req.method} ${req.path}:`, error);
        res.status(500).json(createExtendedErrorResponse('Internal server error', 'server_error'));
      }
    };
  };
};

// ===================================================================
// AUTHENTICATION MIDDLEWARE (Extended API)
// ===================================================================

const authenticateExtended = (authService: AuthService) => {
  return (req: Request, res: Response, next: Function): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json(createExtendedErrorResponse('Access token required', 'unauthorized'));
      return;
    }

    const token = authHeader.slice(7);
    const payload = authService.verifyToken(token);
    
    if (!payload) {
      res.status(401).json(createExtendedErrorResponse('Invalid or expired token', 'unauthorized'));
      return;
    }

    (req as any).user = payload;
    next();
  };
};

// ===================================================================
// RESPONSE FORMATTERS (Extended API)
// ===================================================================

const formatExtendedCredentialResponse = (credential: any): ExtendedCredentialResponse => ({
  id: credential.id,
  format: credential.format || 'json-ld',
  credential: credential.data,
  status: credential.isRevoked ? 'revoked' : 'active',
  issuedDate: credential.issuedAt || credential.issued_at,
  expirationDate: credential.validUntil || credential.valid_until,
  issuer: {
    id: credential.issuer.id,
    name: credential.issuer.name,
    url: credential.issuer.url,
  },
  achievement: {
    id: credential.achievement.id,
    name: credential.achievement.name,
    description: credential.achievement.description,
  },
  recipient: {
    id: credential.credentialSubject.id,
    type: credential.credentialSubject.type || 'AchievementSubject',
  },
});

const formatExtendedCredentialsResponse = (credentials: any[], query: ExtendedCredentialQuery) => {
  const formatted = credentials.map(formatExtendedCredentialResponse);
  
  return {
    data: {
      credentials: formatted,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: formatted.length,
        hasMore: formatted.length === query.limit
      },
      filters: query,
      apiVersion: 'extended-v1'
    }
  };
};

const formatExtendedProfileResponse = (profile: any, authority?: string) => {
  return { 
    profile, 
    authority,
    apiVersion: 'extended-v1',
    metadata: {
      lastUpdated: new Date().toISOString(),
      capabilities: ['credential-issuance', 'achievement-management']
    }
  };
};

// ===================================================================
// BUSINESS LOGIC (Extended API)
// ===================================================================

const extendedBusinessLogic = {
  async getCredentials(query: ExtendedCredentialQuery, ctx: ExtendedApiContext) {
    // Validate limits for extended API
    const limit = Math.min(query.limit || EXTENDED_DEFAULT_LIMIT, EXTENDED_MAX_LIMIT);
    
    const credentials = await ctx.solanaService.getCredentials({
      ...query,
      limit
    });

    return formatExtendedCredentialsResponse(credentials, { ...query, limit });
  },

  async getCredentialById(id: string, format: 'json-ld' | 'jwt' | undefined, ctx: ExtendedApiContext) {
    if (!id) {
      throw new Error('Credential ID is required');
    }

    const credential = await ctx.solanaService.getCredentialById(id, format);
    
    if (!credential) {
      throw new Error('Credential not found');
    }

    return formatExtendedCredentialResponse(credential);
  },

  async createCredential(credentialRequest: CredentialCreateRequest, ctx: ExtendedApiContext) {
    if (!credentialRequest.achievementId || !credentialRequest.recipientId) {
      throw new Error('achievementId and recipientId are required');
    }

    const credentialId = await ctx.solanaService.issueCredential({
      ...credentialRequest,
      issuerPubkey: ctx.user.walletAddress
    });

    const credential = await ctx.solanaService.getCredentialById(credentialId);
    
    return {
      message: 'Credential issued successfully',
      credential: formatExtendedCredentialResponse(credential)
    };
  },

  async updateCredential(id: string, updates: any, ctx: ExtendedApiContext) {
    if (!id) {
      throw new Error('Credential ID is required');
    }

    const credential = await ctx.solanaService.getCredentialById(id);
    if (!credential) {
      throw new Error('Credential not found');
    }

    const issuerPubkey = new PublicKey(ctx.user.walletAddress);
    const canUpdate = await ctx.solanaService.verifyCredentialOwnership(id, issuerPubkey);
    
    if (!canUpdate) {
      throw new Error('Unauthorized to update this credential');
    }

    const updatedCredential = await ctx.solanaService.updateCredential(id, updates);
    
    return {
      message: 'Credential updated successfully',
      credential: formatExtendedCredentialResponse(updatedCredential)
    };
  },

  async revokeCredential(id: string, reason: string, ctx: ExtendedApiContext) {
    if (!id) {
      throw new Error('Credential ID is required');
    }

    const issuerPubkey = new PublicKey(ctx.user.walletAddress);
    const canRevoke = await ctx.solanaService.verifyCredentialOwnership(id, issuerPubkey);
    
    if (!canRevoke) {
      throw new Error('Unauthorized to revoke this credential');
    }

    await ctx.solanaService.revokeCredential(id, issuerPubkey, reason);
    
    return {
      message: 'Credential revoked successfully',
      credentialId: id,
      reason,
      revokedAt: new Date().toISOString()
    };
  },

  async verifyCredential(id: string, options: any, ctx: ExtendedApiContext) {
    if (!id) {
      throw new Error('Credential ID is required');
    }

    const verificationResult = await ctx.solanaService.verifyCredential(id, {
      includeRevocationCheck: options.includeRevocationCheck,
      includeProofVerification: true,
      includeTemporalValidation: true,
    });

    return {
      credentialId: id,
      isValid: verificationResult.isValid,
      checks: verificationResult.checks,
      verifiedAt: new Date().toISOString(),
      errors: verificationResult.errors || []
    };
  },

  async getCredentialStatus(id: string, ctx: ExtendedApiContext) {
    if (!id) {
      throw new Error('Credential ID is required');
    }

    const status = await ctx.solanaService.getCredentialStatus(id);
    
    return {
      credentialId: id,
      status: status.isRevoked ? 'revoked' : 'active',
      isRevoked: status.isRevoked,
      revokedAt: status.revokedAt,
      statusListUrl: status.statusListUrl,
      statusListIndex: status.statusListIndex,
      checkedAt: new Date().toISOString()
    };
  },

  async getProfile(authority: string, ctx: ExtendedApiContext) {
    if (!authority) {
      throw new Error('Authority is required');
    }

    const authorityPubkey = new PublicKey(authority);
    const profile = await ctx.solanaService.getIssuerProfile(authorityPubkey);
    
    if (!profile) {
      throw new Error('Profile not found');
    }

    return formatExtendedProfileResponse(profile, authority);
  },

  async createProfile(data: ProfileCreateRequest, ctx: ExtendedApiContext) {
    if (!data.profileId || !data.name) {
      throw new Error('profileId and name are required');
    }

    const existingProfile = await ctx.solanaService.getIssuerProfile(ctx.user.walletAddress);
    
    if (existingProfile) {
      throw new Error('Profile already exists');
    }

    await ctx.solanaService.initializeIssuer(
      ctx.user.walletAddress,
      data.profileId,
      data.name,
      data.url,
      data.email
    );

    const profile = await ctx.solanaService.getIssuerProfile(ctx.user.walletAddress);
    
    return {
      message: 'Profile created successfully',
      profileId: profile?.id || data.profileId,
      authority: ctx.user.walletAddress
    };
  },

  async createAchievement(createRequest: AchievementCreateRequest, ctx: ExtendedApiContext) {
    if (!createRequest.achievementId || !createRequest.name || !createRequest.description) {
      throw new Error('achievementId, name, and description are required');
    }

    const authorityPubkey = new PublicKey(ctx.user.walletAddress);

    const txSignature = await ctx.solanaService.createAchievement(
      authorityPubkey,
      createRequest.achievementId,
      createRequest.name,
      createRequest.description,
      createRequest.criteriaNarrative,
      createRequest.criteriaId
    );

    return {
      message: 'Achievement created successfully',
      achievementId: createRequest.achievementId,
      txSignature,
      issuer: ctx.user.walletAddress
    };
  },

  async getAchievements(authority: string, ctx: ExtendedApiContext) {
    if (!authority) {
      throw new Error('Authority is required');
    }

    const authorityPubkey = new PublicKey(authority);
    const achievements = await ctx.solanaService.getIssuerAchievements(authorityPubkey);
    
    return {
      achievements,
      issuer: authority,
      count: achievements.length
    };
  }
};

// ===================================================================
// EXTENDED API ROUTER
// ===================================================================

export function createExtendedApiRouter(
  authService: AuthService,
  solanaService: SolanaService
): Router {
  const router = Router();

  // ===================================================================
  // CREDENTIALS ENDPOINTS (Extended)
  // ===================================================================

  // GET /credentials (with extended query parameters)
  router.get('/credentials', 
    authenticateExtended(authService),
    handleAsyncRoute(async (req: Request, res: Response, ctx: ExtendedApiContext) => {
      const query: ExtendedCredentialQuery = {
        issuer: req.query.issuer as string,
        recipient: req.query.recipient as string,
        achievement: req.query.achievement as string,
        status: (req.query.status as 'active' | 'revoked' | 'all') || 'all',
        format: (req.query.format as 'json-ld' | 'jwt' | 'all') || 'all',
        limit: parseInt(req.query.limit as string) || EXTENDED_DEFAULT_LIMIT,
        offset: parseInt(req.query.offset as string) || 0,
        since: req.query.since as string,
        sortBy: (req.query.sortBy as any) || 'issued_date',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      try {
        const result = await extendedBusinessLogic.getCredentials(query, ctx);
        res.json(result);
      } catch (error: any) {
        res.status(400).json(createExtendedErrorResponse(error.message, 'invalid_parameter'));
      }
    })(authService, solanaService)
  );

  // GET /credentials/:id
  router.get('/credentials/:id',
    authenticateExtended(authService),
    handleAsyncRoute(async (req: Request, res: Response, ctx: ExtendedApiContext) => {
      const { id } = req.params;
      const format = req.query.format as 'json-ld' | 'jwt' | undefined;

      try {
        const result = await extendedBusinessLogic.getCredentialById(id, format, ctx);
        res.json(result);
      } catch (error: any) {
        const status = error.message.includes('not found') ? 404 : 400;
        const code = error.message.includes('not found') ? 'not_found' : 'invalid_parameter';
        res.status(status).json(createExtendedErrorResponse(error.message, code));
      }
    })(authService, solanaService)
  );

  // POST /credentials (Extended credential creation)
  router.post('/credentials',
    authenticateExtended(authService),
    handleAsyncRoute(async (req: Request, res: Response, ctx: ExtendedApiContext) => {
      try {
        const result = await extendedBusinessLogic.createCredential(req.body, ctx);
        res.status(201).json(result);
      } catch (error: any) {
        res.status(400).json(createExtendedErrorResponse(error.message, 'invalid_format'));
      }
    })(authService, solanaService)
  );

  // PUT /credentials/:id (Update credential)
  router.put('/credentials/:id',
    authenticateExtended(authService),
    handleAsyncRoute(async (req: Request, res: Response, ctx: ExtendedApiContext) => {
      const { id } = req.params;
      const updates = req.body;

      try {
        const result = await extendedBusinessLogic.updateCredential(id, updates, ctx);
        res.json(result);
      } catch (error: any) {
        const status = error.message.includes('not found') ? 404 : 
                       error.message.includes('Unauthorized') ? 403 : 400;
        const code = error.message.includes('not found') ? 'not_found' : 
                     error.message.includes('Unauthorized') ? 'unauthorized' : 'invalid_parameter';
        res.status(status).json(createExtendedErrorResponse(error.message, code));
      }
    })(authService, solanaService)
  );

  // DELETE /credentials/:id (Revoke credential)
  router.delete('/credentials/:id',
    authenticateExtended(authService),
    handleAsyncRoute(async (req: Request, res: Response, ctx: ExtendedApiContext) => {
      const { id } = req.params;
      const reason = req.body.reason || 'Revoked by issuer';

      try {
        const result = await extendedBusinessLogic.revokeCredential(id, reason, ctx);
        res.json(result);
      } catch (error: any) {
        const status = error.message.includes('Unauthorized') ? 403 : 400;
        const code = error.message.includes('Unauthorized') ? 'unauthorized' : 'invalid_parameter';
        res.status(status).json(createExtendedErrorResponse(error.message, code));
      }
    })(authService, solanaService)
  );

  // POST /credentials/:id/verify (Verify credential)
  router.post('/credentials/:id/verify',
    handleAsyncRoute(async (req: Request, res: Response, ctx: ExtendedApiContext) => {
      const { id } = req.params;
      const { includeRevocationCheck = true } = req.body;

      try {
        const result = await extendedBusinessLogic.verifyCredential(id, { includeRevocationCheck }, ctx);
        res.json(result);
      } catch (error: any) {
        res.status(400).json(createExtendedErrorResponse(error.message, 'verification_error'));
      }
    })(authService, solanaService)
  );

  // GET /credentials/:id/status (Get credential status)
  router.get('/credentials/:id/status',
    handleAsyncRoute(async (req: Request, res: Response, ctx: ExtendedApiContext) => {
      const { id } = req.params;

      try {
        const result = await extendedBusinessLogic.getCredentialStatus(id, ctx);
        res.json(result);
      } catch (error: any) {
        res.status(400).json(createExtendedErrorResponse(error.message, 'status_error'));
      }
    })(authService, solanaService)
  );

  // ===================================================================
  // PROFILE ENDPOINTS (Extended)
  // ===================================================================

  // GET /profiles/:authority
  router.get('/profiles/:authority',
    authenticateExtended(authService),
    handleAsyncRoute(async (req: Request, res: Response, ctx: ExtendedApiContext) => {
      const { authority } = req.params;

      try {
        const result = await extendedBusinessLogic.getProfile(authority, ctx);
        res.json(result);
      } catch (error: any) {
        const status = error.message.includes('not found') ? 404 : 400;
        const code = error.message.includes('not found') ? 'not_found' : 'invalid_parameter';
        res.status(status).json(createExtendedErrorResponse(error.message, code));
      }
    })(authService, solanaService)
  );

  // POST /profiles (Create profile)
  router.post('/profiles',
    authenticateExtended(authService),
    handleAsyncRoute(async (req: Request, res: Response, ctx: ExtendedApiContext) => {
      try {
        const result = await extendedBusinessLogic.createProfile(req.body, ctx);
        res.status(201).json(result);
      } catch (error: any) {
        const status = error.message.includes('already exists') ? 409 : 400;
        const code = error.message.includes('already exists') ? 'conflict' : 'invalid_format';
        res.status(status).json(createExtendedErrorResponse(error.message, code));
      }
    })(authService, solanaService)
  );

  // ===================================================================
  // ACHIEVEMENT ENDPOINTS (Extended)
  // ===================================================================

  // POST /achievements (Create achievement)
  router.post('/achievements',
    authenticateExtended(authService),
    handleAsyncRoute(async (req: Request, res: Response, ctx: ExtendedApiContext) => {
      try {
        const result = await extendedBusinessLogic.createAchievement(req.body, ctx);
        res.status(201).json(result);
      } catch (error: any) {
        res.status(400).json(createExtendedErrorResponse(error.message, 'creation_error'));
      }
    })(authService, solanaService)
  );

  // GET /achievements/:authority (Get achievements for authority)
  router.get('/achievements/:authority',
    handleAsyncRoute(async (req: Request, res: Response, ctx: ExtendedApiContext) => {
      const { authority } = req.params;

      try {
        const result = await extendedBusinessLogic.getAchievements(authority, ctx);
        res.json(result);
      } catch (error: any) {
        res.status(400).json(createExtendedErrorResponse(error.message, 'fetch_error'));
      }
    })(authService, solanaService)
  );

  return router;
}
