// ===================================================================
// SHARED TYPES FOR OPEN BADGES API
// ===================================================================
// Common types used across both Open Badges v3.0 and Extended API routers

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
  credentialData?: any;
  issuerPubkey?: string;
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

// Solana-specific types
export interface UserData {
  authority: any; // PublicKey type from Solana
  registeredAt: any; // BN type from Anchor
  badgeCount: number;
  isActive: boolean;
}

export interface BadgeClassData {
  authority: any; // PublicKey
  achievementId: string;
  name: string;
  description: string;
  criteria: string;
  image?: string;
  tags: string[];
  createdAt: any; // BN
  badgeCount: number;
  isActive: boolean;
}

export interface BadgeInstanceData {
  authority: any; // PublicKey
  recipient: any; // PublicKey
  badgeClass: any; // PublicKey
  issueDate: any; // BN
  evidence?: string;
  narrative?: string;
  expirationDate?: any; // BN
  isRevoked: boolean;
  revocationReason?: string;
  credentialId: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  criteria: string;
  image?: string;
  tags: string[];
  issuer: string;
  createdAt: string;
  badgeCount: number;
}

export interface IssuerProfile {
  id: string;
  name: string;
  url?: string;
  email?: string;
  image?: string;
  publicKey: string;
}

export interface CredentialStatus {
  isRevoked: boolean;
  revokedAt?: string;
  statusListUrl?: string;
  statusListIndex?: number;
}

export interface VerificationResult {
  isValid: boolean;
  checks: {
    proof: boolean;
    revocation: boolean;
    temporal: boolean;
    issuer: boolean;
  };
  errors?: string[];
}
