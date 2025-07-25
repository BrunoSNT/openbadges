#!/usr/bin/env node

/**
 * Test script for Open Badges v3.0 Compliant API
 * Tests the official Open Badges API endpoints as defined in Section 6
 */

import express from 'express';
import { openBadgesApiRoutes } from '../src/routes/open-badges-api';

// Mock services for testing the compliant API
class MockJWTService {
  verifyToken(token: string) {
    if (token === 'valid-token') {
      return {
        userId: 'test-user',
        walletAddress: '11111111111111111111111111111112',
        permissions: ['read', 'write']
      };
    }
    return null;
  }
}

class MockProgramService {
  async getCredentials(query: any) {
    return [
      {
        id: 'credential-1',
        type: 'AchievementCredential',
        credentialSubject: {
          id: 'did:sol:recipient',
          achievement: {
            id: 'achievement-1',
            name: 'Test Achievement'
          }
        },
        issuer: 'did:sol:issuer',
        issuanceDate: new Date().toISOString()
      }
    ];
  }

  async issueCredential(params: any) {
    return 'new-credential-id';
  }

  async getCredentialById(id: string) {
    return {
      id,
      type: 'AchievementCredential',
      credentialSubject: {
        id: 'did:sol:recipient',
        achievement: {
          id: 'achievement-1',
          name: 'Test Achievement'
        }
      },
      issuer: 'did:sol:issuer',
      issuanceDate: new Date().toISOString()
    };
  }

  async getUserData(walletAddress: string) {
    return {
      authority: walletAddress,
      registeredAt: new Date(),
      badgeCount: 0,
      isActive: true
    };
  }
}

const app = express();
app.use(express.json());
app.use(express.text()); // For JWT text/plain format

const mockJWT = new MockJWTService();
const mockProgram = new MockProgramService();

// Add the Open Badges v3.0 compliant API
app.use('/ims/ob/v3p0', openBadgesApiRoutes(mockJWT as any, mockProgram as any));

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Open Badges v3.0 Compliant API test server is running!',
    compliance: 'Section 6 of Open Badges Specification v3.0'
  });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`🧪 Open Badges v3.0 Compliant Test Server running on port ${PORT}`);
  console.log('📋 Available endpoints (Section 6 compliance):');
  console.log('');
  console.log('🔓 Public endpoints:');
  console.log('  GET /test - Test endpoint');
  console.log('  GET /ims/ob/v3p0/discovery - Service discovery (Section 6.3.1)');
  console.log('');
  console.log('🔐 Protected endpoints (require Authorization: Bearer valid-token):');
  console.log('  GET /ims/ob/v3p0/credentials - Get credentials (Section 6.2.2)');
  console.log('    - Scope: https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.readonly');
  console.log('  POST /ims/ob/v3p0/credentials - Upsert credential (Section 6.2.3)');
  console.log('    - Scope: https://purl.imsglobal.org/spec/ob/v3p0/scope/credential.upsert');
  console.log('  GET /ims/ob/v3p0/profile - Get profile (Section 6.2.4)');
  console.log('    - Scope: https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.readonly');
  console.log('  PUT /ims/ob/v3p0/profile - Update profile (Section 6.2.5)');
  console.log('    - Scope: https://purl.imsglobal.org/spec/ob/v3p0/scope/profile.update');
  console.log('');
  console.log('✅ Compliance features:');
  console.log('  - Correct URL patterns (/ims/ob/v3p0/*)');
  console.log('  - OAuth 2.0 scope validation (simulated)');
  console.log('  - Proper response formats (compactJwsStrings, Profile, etc.)');
  console.log('  - Standard error responses (Imsx_StatusInfo)');
  console.log('  - Pagination headers (X-Total-Count, Link)');
  console.log('  - Service discovery document');
});
