# Open Badges v3.0 API - Solana Integration

This API provides a complete Open Badges v3.0 compliant implementation using Solana blockchain for credential storage and verification.

## Architecture

The API integrates multiple layers:
- **Open Badges v3.0 API**: Standards-compliant credential management
- **JWT Authentication**: Session management for API access
- **Solana Program**: On-chain credential storage and verification
- **Achievement Management**: Issuer profiles and achievement definitions

## Features

- 🏆 **Open Badges v3.0 Compliance**: Full implementation of the specification
- 🔐 **Wallet-based Authentication**: Solana wallet integration
- 📜 **Verifiable Credentials**: Cryptographically signed achievement credentials
- 👤 **Issuer Management**: Profile creation and management
- 🎯 **Achievement Definitions**: Structured achievement templates
- 🔒 **On-chain Verification**: Tamper-proof credential validation
- 📊 **Batch Operations**: Efficient credential operations
- 🚀 **Rate Limiting**: API protection

## API Endpoints

### Open Badges v3.0 Standard API

- `GET /ims/ob/v3p0/credentials` - Get credentials (OAuth scope: credential.readonly)
- `POST /ims/ob/v3p0/credentials` - Issue credentials (OAuth scope: credential.upsert)
- `GET /ims/ob/v3p0/profile` - Get issuer profile (OAuth scope: profile.readonly)
- `PUT /ims/ob/v3p0/profile` - Update profile (OAuth scope: profile.update)
- `GET /ims/ob/v3p0/discovery` - Service discovery (public)

### Extended Credential Management API

- `GET /api/credentials` - List credentials with filtering
- `GET /api/credentials/:id` - Get specific credential
- `POST /api/credentials` - Issue new credential
- `PUT /api/credentials/:id` - Update credential metadata
- `DELETE /api/credentials/:id` - Revoke credential
- `POST /api/credentials/:id/verify` - Verify credential
- `GET /api/credentials/:id/status` - Check credential status

### Issuer and Achievement Management API

- `POST /api/issuers` - Create issuer profile
- `GET /api/issuers/:authority` - Get issuer profile
- `POST /api/issuers/:authority/achievements` - Create achievement
- `GET /api/issuers/:authority/achievements` - List achievements

## Quick Start

### Prerequisites

1. **Solana CLI**: Install and configure Solana CLI
2. **Anchor Framework**: Install Anchor for program deployment
3. **Node.js**: Version 18 or higher

### Installation

```bash
cd api
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

Key environment variables:
- `SOLANA_RPC_URL`: Solana RPC endpoint
- `SOLANA_WALLET_PATH`: Path to your wallet keypair
- `JWT_SECRET`: Secret for JWT token signing

### Development

```bash
# Start the API server
npm run dev
```

### Testing the Integration

1. **Check program connection**:
```bash
curl http://localhost:3002/test/program
```

2. **Create an issuer profile**:
```bash
curl -X POST http://localhost:3002/api/issuers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "profileId": "urn:uuid:issuer-123",
    "name": "Example University",
    "url": "https://university.example.com",
    "email": "credentials@university.example.com"
  }'
```

3. **Create an achievement**:
```bash
curl -X POST http://localhost:3002/api/issuers/YOUR_WALLET_ADDRESS/achievements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "achievementId": "urn:uuid:achievement-123",
    "name": "Blockchain Development Certificate",
    "description": "Completion of advanced blockchain development course",
    "criteriaNarrative": "Successfully completed all modules and final project"
  }'
```

4. **Issue a credential**:
```bash
curl -X POST http://localhost:3002/api/credentials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "achievementId": "ACHIEVEMENT_PUBLIC_KEY",
    "recipientId": "recipient@example.com"
  }'
```

## API Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/challenge`
Get a signing challenge for wallet authentication.

**Response:**
```json
{
  "challenge": "Please sign this message...",
  "nonce": "random_string",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### POST `/api/auth/login`
Login with wallet signature.

**Request:**
```json
{
  "walletAddress": "11111111111111111111111111111111",
  "signature": "base58_or_base64_signature",
  "message": "challenge_message",
  "userId": "optional_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "userId": "user_id",
    "walletAddress": "wallet_address",
    "permissions": ["READ_PROFILE", "BADGE_VIEW"]
  },
  "expiresIn": "24h"
}
```

#### POST `/api/auth/refresh`
Refresh JWT token.

#### POST `/api/auth/verify`
Verify JWT token validity.

#### POST `/api/auth/logout`
Logout (client-side token removal).

### User Management (`/api/user`)

#### GET `/api/user/profile`
Get user profile with onchain data.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "user_id",
    "walletAddress": "wallet_address",
    "permissions": ["READ_PROFILE"],
    "onchain": {
      "authority": "wallet_address",
      "registeredAt": "timestamp",
      "badgeCount": 5,
      "isActive": true
    },
    "userExists": true
  }
}
```

#### POST `/api/user/create`
Create user account onchain.

#### GET `/api/user/badges`
Get user's badges.

#### GET `/api/user/exists/:walletAddress`
Check if user exists onchain.

### Badge Management (`/api/badge`)

#### POST `/api/badge/issue`
Issue a badge to a user.

**Request:**
```json
{
  "registryAddress": "registry_pubkey",
  "badgeClassId": 1,
  "recipientAddress": "recipient_wallet",
  "evidence": "optional_evidence_url"
}
```

#### GET `/api/badge/class/:registryAddress/:badgeClassId`
Get badge class information.

#### POST `/api/badge/revoke`
Revoke a badge.

#### GET `/api/badge/recipient/:walletAddress`
Get badges for a specific recipient.

#### POST `/api/badge/batch-issue`
Issue multiple badges in batch.

## Authentication Flow

1. **Client** requests challenge from `/api/auth/challenge`
2. **Client** signs the challenge message with wallet
3. **Client** sends signature to `/api/auth/login`
4. **Server** verifies signature and returns JWT token
5. **Client** includes JWT token in subsequent requests
6. **Server** validates JWT and executes onchain operations

## Permissions

The API uses a permission-based system:

- `READ_PROFILE`: View user profile
- `BADGE_VIEW`: View badges
- `BADGE_RECEIVE`: Receive badges
- `BADGE_ISSUE`: Issue badges
- `BADGE_REVOKE`: Revoke badges
- `USER_ACTIONS`: Create/modify user accounts
- `ADMIN`: Administrative actions

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

Default limits:
- 100 requests per 15 minutes per IP
- Configurable via environment variables

## Security Considerations

- JWT tokens expire after 24 hours (configurable)
- All wallet operations require signature verification
- CORS configured for allowed origins
- Helmet.js for security headers
- Input validation on all endpoints

## Development

### Project Structure

```
api/
├── src/
│   ├── index.ts              # Main application entry
│   ├── middleware/           # Express middleware
│   │   ├── auth-middleware.ts
│   │   └── error-handler.ts
│   ├── routes/               # API routes
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── badge.ts
│   ├── services/             # Business logic
│   │   ├── jwt-auth.ts
│   │   └── program-service.ts
│   └── types/                # TypeScript types
│       └── index.ts
├── package.json
├── tsconfig.json
└── .env.example
```

### Scripts

- `npm run dev`: Development with auto-reload
- `npm run build`: Build TypeScript
- `npm run start`: Start production server
- `npm run test`: Run tests
- `npm run lint`: Lint code
- `npm run format`: Format code

## Integration with Frontend

The frontend can integrate with this API using standard HTTP requests:

```typescript
// Login flow
const challenge = await fetch('/api/auth/challenge').then(r => r.json());
const signature = await wallet.signMessage(challenge.challenge);
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: wallet.publicKey.toString(),
    signature: bs58.encode(signature),
    message: challenge.challenge
  })
});

// Authenticated requests
const userProfile = await fetch('/api/user/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());
```

## Testing

Use the test file `tests/22-jwt-tests.ts` to test the integration between JWT authentication and onchain program operations.

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Include input validation
4. Write tests for new features
5. Update documentation
