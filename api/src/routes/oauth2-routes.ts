import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { AuthService } from '../services/auth-service';
import { SolanaService } from '../services/solana-service';

// ===================================================================
// OAUTH 2.0 IMPLEMENTATION - OPEN BADGES V3.0 COMPLIANT
// ===================================================================
// This router implements OAuth 2.0 Authorization Code Grant with PKCE
// as required by Open Badges v3.0 specification Section 7.
// Complies with RFC6749, RFC7636 (PKCE), and RFC7591 (Dynamic Registration)
// ===================================================================

interface ClientRegistration {
  client_id: string;
  client_secret: string;
  client_name: string;
  client_uri?: string;
  logo_uri?: string;
  tos_uri?: string;
  policy_uri?: string;
  software_id?: string;
  software_version?: string;
  redirect_uris: string[];
  token_endpoint_auth_method: string;
  grant_types: string[];
  response_types: string[];
  scope: string;
  client_id_issued_at: number;
  client_secret_expires_at: number;
}

interface AuthorizationCode {
  code: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: string;
  user_id: string;
  expires_at: number;
}

interface RefreshToken {
  token: string;
  client_id: string;
  user_id: string;
  scope: string;
  expires_at: number;
}

// In-memory storage (in production, use database)
const registeredClients = new Map<string, ClientRegistration>();
const authorizationCodes = new Map<string, AuthorizationCode>();
const refreshTokens = new Map<string, RefreshToken>();
const revokedTokens = new Set<string>();

// OAuth 2.0 scopes as defined in Open Badges v3.0
const VALID_SCOPES = [
  'https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly',
  'https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert',
  'https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.readonly',
  'https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.update',
  'offline_access'
];

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

const generateRandomString = (length: number): string => {
  return crypto.randomBytes(length).toString('hex');
};

const generateClientId = (): string => {
  return generateRandomString(8);
};

const generateClientSecret = (): string => {
  return generateRandomString(16);
};

const generateAuthorizationCode = (): string => {
  return generateRandomString(32);
};

const generateRefreshToken = (): string => {
  return generateRandomString(32);
};

const validateScopes = (requestedScopes: string): string[] => {
  const scopes = requestedScopes.split(' ').filter(scope => scope.trim());
  const validScopes = scopes.filter(scope => VALID_SCOPES.includes(scope));
  return validScopes;
};

const validateRedirectUri = (redirectUri: string, registeredUris: string[]): boolean => {
  return registeredUris.includes(redirectUri);
};

const validateCodeChallenge = (codeVerifier: string, codeChallenge: string, method: string): boolean => {
  if (method === 'plain') {
    return codeVerifier === codeChallenge;
  } else if (method === 'S256') {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    const computedChallenge = hash.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return computedChallenge === codeChallenge;
  }
  return false;
};

const createErrorResponse = (error: string, error_description?: string, error_uri?: string) => {
  const response: any = { error };
  if (error_description) response.error_description = error_description;
  if (error_uri) response.error_uri = error_uri;
  return response;
};

// ===================================================================
// OAUTH 2.0 ROUTER
// ===================================================================

export function createOAuth2Router(
  authService: AuthService,
  solanaService: SolanaService
): Router {
  const router = Router();

  // ===================================================================
  // RFC7591 - DYNAMIC CLIENT REGISTRATION
  // ===================================================================

  // POST /oauth2/register
  router.post('/register', (req: Request, res: Response) => {
    try {
      const {
        client_name,
        client_uri,
        logo_uri,
        tos_uri,
        policy_uri,
        software_id,
        software_version,
        redirect_uris,
        token_endpoint_auth_method = 'client_secret_basic',
        grant_types = ['authorization_code', 'refresh_token'],
        response_types = ['code'],
        scope
      } = req.body;

      // Validate required fields
      if (!client_name || !redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
        res.status(400).json(createErrorResponse('invalid_client_metadata', 'client_name and redirect_uris are required'));
        return;
      }

      // Validate scopes
      if (scope) {
        const validScopes = validateScopes(scope);
        if (validScopes.length === 0) {
          res.status(400).json(createErrorResponse('invalid_scope', 'No valid scopes provided'));
          return;
        }
      }

      // Generate client credentials
      const client_id = generateClientId();
      const client_secret = generateClientSecret();
      const now = Math.floor(Date.now() / 1000);
      
      const registration: ClientRegistration = {
        client_id,
        client_secret,
        client_name,
        client_uri,
        logo_uri,
        tos_uri,
        policy_uri,
        software_id,
        software_version,
        redirect_uris,
        token_endpoint_auth_method,
        grant_types,
        response_types,
        scope: scope || '',
        client_id_issued_at: now,
        client_secret_expires_at: now + (365 * 24 * 60 * 60) // 1 year
      };

      registeredClients.set(client_id, registration);

      console.log(`✅ OAuth2 client registered: ${client_id} (${client_name})`);
      
      res.status(201).json(registration);
    } catch (error) {
      console.error('OAuth2 registration error:', error);
      res.status(500).json(createErrorResponse('server_error', 'Internal server error'));
    }
  });

  // ===================================================================
  // RFC6749 - AUTHORIZATION ENDPOINT
  // ===================================================================

  // GET /oauth2/authorize
  router.get('/authorize', (req: Request, res: Response) => {
    try {
      const {
        response_type,
        client_id,
        redirect_uri,
        scope = '',
        state,
        code_challenge,
        code_challenge_method = 'S256'
      } = req.query as Record<string, string>;

      // Validate required parameters
      if (!response_type || !client_id || !redirect_uri) {
        res.status(400).json(createErrorResponse('invalid_request', 'Missing required parameters'));
        return;
      }

      if (response_type !== 'code') {
        res.status(400).json(createErrorResponse('unsupported_response_type', 'Only authorization_code flow is supported'));
        return;
      }

      // Validate client
      const client = registeredClients.get(client_id);
      if (!client) {
        res.status(400).json(createErrorResponse('invalid_client', 'Unknown client_id'));
        return;
      }

      // Validate redirect URI
      if (!validateRedirectUri(redirect_uri, client.redirect_uris)) {
        res.status(400).json(createErrorResponse('invalid_request', 'Invalid redirect_uri'));
        return;
      }

      // Validate PKCE (required)
      if (!code_challenge) {
        const errorParams = new URLSearchParams({
          error: 'invalid_request',
          error_description: 'code_challenge is required',
          ...(state && { state })
        });
        res.redirect(`${redirect_uri}?${errorParams.toString()}`);
        return;
      }

      // Validate scopes
      const validScopes = validateScopes(scope);
      if (scope && validScopes.length === 0) {
        const errorParams = new URLSearchParams({
          error: 'invalid_scope',
          error_description: 'No valid scopes provided',
          ...(state && { state })
        });
        res.redirect(`${redirect_uri}?${errorParams.toString()}`);
        return;
      }

      // For demo purposes, auto-approve the authorization
      // In production, redirect to consent screen
      const authCode = generateAuthorizationCode();
      const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

      authorizationCodes.set(authCode, {
        code: authCode,
        client_id,
        redirect_uri,
        scope: validScopes.join(' '),
        state: state || '',
        code_challenge,
        code_challenge_method,
        user_id: `demo-user-${Date.now()}`, // In production, use actual authenticated user
        expires_at: expiresAt
      });

      console.log(`✅ OAuth2 authorization code issued: ${authCode.substring(0, 8)}... for client ${client_id}`);

      // Redirect with authorization code
      const successParams = new URLSearchParams({
        code: authCode,
        ...(state && { state }),
        scope: validScopes.join(' ')
      });

      res.redirect(`${redirect_uri}?${successParams.toString()}`);
    } catch (error) {
      console.error('OAuth2 authorization error:', error);
      res.status(500).json(createErrorResponse('server_error', 'Internal server error'));
    }
  });

  // ===================================================================
  // RFC6749 - TOKEN ENDPOINT
  // ===================================================================

  // POST /oauth2/token
  router.post('/token', (req: Request, res: Response) => {
    try {
      const { grant_type } = req.body;

      if (!grant_type) {
        res.status(400).json(createErrorResponse('invalid_request', 'grant_type is required'));
        return;
      }

      // Handle different grant types
      if (grant_type === 'authorization_code') {
        handleAuthorizationCodeGrant(req, res, authService);
      } else if (grant_type === 'refresh_token') {
        handleRefreshTokenGrant(req, res, authService);
      } else if (grant_type === 'password') {
        // Legacy support for password grant (not in spec but useful for testing)
        handlePasswordGrant(req, res, authService);
      } else {
        res.status(400).json(createErrorResponse('unsupported_grant_type', `Grant type ${grant_type} is not supported`));
      }
    } catch (error) {
      console.error('OAuth2 token error:', error);
      res.status(500).json(createErrorResponse('server_error', 'Internal server error'));
    }
  });

  // ===================================================================
  // RFC7009 - TOKEN REVOCATION
  // ===================================================================

  // POST /oauth2/revoke
  router.post('/revoke', (req: Request, res: Response) => {
    try {
      const { token, token_type_hint } = req.body;

      if (!token) {
        res.status(400).json(createErrorResponse('invalid_request', 'token is required'));
        return;
      }

      // Authenticate client
      const authResult = authenticateClient(req);
      if (!authResult.success) {
        res.status(401).json(createErrorResponse('invalid_client', authResult.error));
        return;
      }

      // Add token to revocation list
      revokedTokens.add(token);

      // Remove from refresh tokens if it's a refresh token
      if (token_type_hint === 'refresh_token' || refreshTokens.has(token)) {
        refreshTokens.delete(token);
      }

      console.log(`✅ OAuth2 token revoked: ${token.substring(0, 8)}...`);
      
      // RFC7009 specifies 200 OK for successful revocation
      res.status(200).json({});
    } catch (error) {
      console.error('OAuth2 revocation error:', error);
      res.status(500).json(createErrorResponse('server_error', 'Internal server error'));
    }
  });

  return router;
}

// ===================================================================
// GRANT TYPE HANDLERS
// ===================================================================

function handleAuthorizationCodeGrant(req: Request, res: Response, authService: AuthService) {
  const {
    code,
    redirect_uri,
    client_id,
    code_verifier
  } = req.body;

  // Validate required parameters
  if (!code || !redirect_uri || !client_id || !code_verifier) {
    res.status(400).json(createErrorResponse('invalid_request', 'Missing required parameters'));
    return;
  }

  // Authenticate client
  const authResult = authenticateClient(req);
  if (!authResult.success) {
    res.status(401).json(createErrorResponse('invalid_client', authResult.error));
    return;
  }

  if (authResult.client_id !== client_id) {
    res.status(401).json(createErrorResponse('invalid_client', 'Client authentication mismatch'));
    return;
  }

  // Validate authorization code
  const authCodeData = authorizationCodes.get(code);
  if (!authCodeData) {
    res.status(400).json(createErrorResponse('invalid_grant', 'Invalid authorization code'));
    return;
  }

  // Check expiration
  if (Date.now() > authCodeData.expires_at) {
    authorizationCodes.delete(code);
    res.status(400).json(createErrorResponse('invalid_grant', 'Authorization code expired'));
    return;
  }

  // Validate parameters match
  if (authCodeData.client_id !== client_id || authCodeData.redirect_uri !== redirect_uri) {
    res.status(400).json(createErrorResponse('invalid_grant', 'Authorization code parameters mismatch'));
    return;
  }

  // Validate PKCE
  if (!validateCodeChallenge(code_verifier, authCodeData.code_challenge, authCodeData.code_challenge_method)) {
    res.status(400).json(createErrorResponse('invalid_grant', 'Invalid code_verifier'));
    return;
  }

  // Authorization code is single-use
  authorizationCodes.delete(code);

  // Generate tokens
  const scopes = authCodeData.scope.split(' ');
  const accessToken = authService.generateToken(
    authCodeData.user_id,
    `user-${authCodeData.user_id}`,
    scopes
  );

  const refreshToken = generateRefreshToken();
  const refreshTokenData: RefreshToken = {
    token: refreshToken,
    client_id,
    user_id: authCodeData.user_id,
    scope: authCodeData.scope,
    expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
  };
  refreshTokens.set(refreshToken, refreshTokenData);

  console.log(`✅ OAuth2 access token issued for user ${authCodeData.user_id}`);

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: authCodeData.scope
  });
}

function handleRefreshTokenGrant(req: Request, res: Response, authService: AuthService) {
  const { refresh_token, scope } = req.body;

  if (!refresh_token) {
    res.status(400).json(createErrorResponse('invalid_request', 'refresh_token is required'));
    return;
  }

  // Authenticate client
  const authResult = authenticateClient(req);
  if (!authResult.success) {
    res.status(401).json(createErrorResponse('invalid_client', authResult.error));
    return;
  }

  // Validate refresh token
  const refreshTokenData = refreshTokens.get(refresh_token);
  if (!refreshTokenData) {
    res.status(400).json(createErrorResponse('invalid_grant', 'Invalid refresh token'));
    return;
  }

  // Check expiration
  if (Date.now() > refreshTokenData.expires_at) {
    refreshTokens.delete(refresh_token);
    res.status(400).json(createErrorResponse('invalid_grant', 'Refresh token expired'));
    return;
  }

  // Check client ownership
  if (refreshTokenData.client_id !== authResult.client_id) {
    res.status(400).json(createErrorResponse('invalid_grant', 'Refresh token does not belong to client'));
    return;
  }

  // Validate scope (optional, can reduce but not increase)
  let finalScope = refreshTokenData.scope;
  if (scope) {
    const requestedScopes = validateScopes(scope);
    const originalScopes = refreshTokenData.scope.split(' ');
    const reducedScopes = requestedScopes.filter(s => originalScopes.includes(s));
    if (reducedScopes.length > 0) {
      finalScope = reducedScopes.join(' ');
    }
  }

  // Generate new access token
  const accessToken = authService.generateToken(
    refreshTokenData.user_id,
    `user-${refreshTokenData.user_id}`,
    finalScope.split(' ')
  );

  console.log(`✅ OAuth2 access token refreshed for user ${refreshTokenData.user_id}`);

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: finalScope
  });
}

function handlePasswordGrant(req: Request, res: Response, authService: AuthService) {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json(createErrorResponse('invalid_request', 'username and password are required'));
    return;
  }

  // For demo purposes, accept any valid-looking credentials
  if (username.length > 0 && password.length >= 6) {
    const scopes = [
      'https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly',
      'https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert',
      'https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.readonly',
      'https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.update'
    ];

    const token = authService.generateToken(
      `user-${username}`,
      username,
      scopes
    );

    console.log(`✅ OAuth2 password grant token issued for ${username}`);

    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: scopes.join(' ')
    });
  } else {
    res.status(401).json(createErrorResponse('invalid_grant', 'Invalid username or password'));
  }
}

// ===================================================================
// CLIENT AUTHENTICATION
// ===================================================================

function authenticateClient(req: Request): { success: boolean; client_id?: string; error?: string } {
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Basic ')) {
    // Basic authentication
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
    const [client_id, client_secret] = credentials.split(':');
    
    const client = registeredClients.get(client_id);
    if (!client || client.client_secret !== client_secret) {
      return { success: false, error: 'Invalid client credentials' };
    }
    
    return { success: true, client_id };
  } else {
    // Client credentials in body (alternative method)
    const { client_id, client_secret } = req.body;
    
    if (!client_id || !client_secret) {
      return { success: false, error: 'Missing client credentials' };
    }
    
    const client = registeredClients.get(client_id);
    if (!client || client.client_secret !== client_secret) {
      return { success: false, error: 'Invalid client credentials' };
    }
    
    return { success: true, client_id };
  }
}
