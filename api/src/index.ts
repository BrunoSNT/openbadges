import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { AuthService } from './services/auth-service';
import { SolanaService } from './services/solana-service';
import { createOpenBadgesV3Router } from './routes/obv3-routes';
import { createExtendedApiRouter } from './routes/obv3-ext-routes';
import { createOAuth2Router } from './routes/oauth2-routes';
import { createWalletAuthRouter } from './routes/wallet-auth-routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const authService = new AuthService(
  process.env.JWT_SECRET || 'default-secret-key-for-development-only-change-in-production',
  process.env.JWT_EXPIRES_IN || '24h'
);

const connection = new Connection(
  process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
  'confirmed'
);
const solanaService = new SolanaService(connection);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
});
app.use(limiter);

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    network: process.env.SOLANA_NETWORK || 'devnet',
    anchor_status: 'ready'
  });
});

// Create separate router instances
const openBadgesV3Router = createOpenBadgesV3Router(authService, solanaService);
const extendedApiRouter = createExtendedApiRouter(authService, solanaService);
const oauth2Router = createOAuth2Router(authService, solanaService);
const walletAuthRouter = createWalletAuthRouter(authService, solanaService);

// ===================================================================
// MOUNT API ROUTES
// ===================================================================

// Mount Open Badges v3.0 API endpoints (strict specification compliance)
app.use('/ims/ob/v3p0', openBadgesV3Router);

// Mount Extended Open Badges API endpoints with additional functionality
app.use('/ims/ob/ext', extendedApiRouter);

// Mount OAuth 2.0 endpoints (RFC6749, RFC7591, RFC7636, RFC7009)
app.use('/oauth2', oauth2Router);

// Mount Wallet-based authentication endpoints
app.use('/api/auth', walletAuthRouter);

// Legacy OAuth2 token endpoint (keeping for backward compatibility)
// The new implementation is at /oauth2/token
app.post('/oauth2/token', async (req, res) => {
  try {
    const { grant_type, username, password } = req.body;
    
    if (grant_type !== 'password') {
      res.status(400).json({ error: 'unsupported_grant_type' });
      return;
    }

    if (!username || !password) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }

    // For demo purposes, create token for any valid-looking credentials
    if (username.length > 0 && password.length >= 6) {
      const token = authService.generateToken(
        `user-${username}`,
        username,
        [
          'https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly',
          'https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert',
          'https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.readonly',
          'https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.update'
        ]
      );

      res.json({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.readonly https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.update'
      });
    } else {
      res.status(401).json({ error: 'invalid_grant' });
    }
  } catch (error) {
    console.error('OAuth token error:', error);
    res.status(500).json({ error: 'server_error' });
  }
});

// Legacy compatibility endpoints (redirect to new API)
app.get('/api/issuers', (req, res) => {
  res.status(301).json({
    message: 'This endpoint has moved. Use /ims/ob/v3p0/profile for Open Badges v3.0 or /ims/ob/ext/profiles/:authority for extended API',
    openBadges: `${req.protocol}://${req.get('host')}/ims/ob/v3p0/profile`,
    extendedApi: `${req.protocol}://${req.get('host')}/ims/ob/ext/profiles/{authority}`
  });
});

app.get('/api/credentials', (req, res) => {
  res.status(301).json({
    message: 'This endpoint has moved. Use /ims/ob/v3p0/credentials for Open Badges v3.0 or /ims/ob/ext/credentials for extended API',
    openBadges: `${req.protocol}://${req.get('host')}/ims/ob/v3p0/credentials`,
    extendedApi: `${req.protocol}://${req.get('host')}/ims/ob/ext/credentials`
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ API Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🏆 Open Badges v3.0 API: http://localhost:${PORT}/ims/ob/v3p0/`);
  console.log(`📋 API Discovery: http://localhost:${PORT}/ims/ob/v3p0/discovery`);
  console.log(`🔧 Extended Open Badges API: http://localhost:${PORT}/ims/ob/ext/`);
  console.log(`🔐 OAuth2 API: http://localhost:${PORT}/oauth2/`);
  console.log(`🔗 OAuth2 Registration: http://localhost:${PORT}/oauth2/register`);
  console.log(`🔑 OAuth2 Authorization: http://localhost:${PORT}/oauth2/authorize`);
  console.log(`🎫 OAuth2 Token: http://localhost:${PORT}/oauth2/token`);
  console.log(`💰 Wallet Authentication: http://localhost:${PORT}/api/auth/`);
});

export default app;
