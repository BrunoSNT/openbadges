// Open Badges v3.0 Compliant Types
// Based on https://www.imsglobal.org/spec/ob/v3p0/
// Aligned with Solana program and API

// ===================================================================
// CORE OPEN BADGES v3.0 TYPES (Matching API exactly)
// ===================================================================

export interface Profile {
  "@context"?: string | string[];
  type: string | string[];
  id: string;
  name: string;
  url?: string;
  phone?: string;
  description?: string;
  image?: Image;
  email?: string;
  address?: Address;
  otherIdentifier?: IdentifierEntry[];
  official?: string;
  familyName?: string;
  givenName?: string;
  additionalName?: string;
  patronymicName?: string;
  honorificPrefix?: string;
  honorificSuffix?: string;
  familyNamePrefix?: string;
  dateOfBirth?: string;
}

export interface Achievement {
  "@context"?: string | string[];
  type: string | string[];
  id: string;
  name: string;
  description: string;
  criteria: Criteria;
  image?: Image;
  issuer: Profile | string;
  creator?: Profile | string;
  achievementType?: string;
  alignment?: Alignment[];
  creditsAvailable?: number;
  fieldOfStudy?: string;
  humanCode?: string;
  otherIdentifier?: IdentifierEntry[];
  related?: Related[];
  resultDescription?: ResultDescription[];
  specialization?: string;
  tags?: string[];
  version?: string;
}

export interface AchievementCredential {
  "@context": string | string[];
  type: string | string[];
  id: string;
  name?: string;
  description?: string;
  image?: Image;
  credentialSubject: AchievementSubject;
  issuer: Profile | string;
  issuanceDate: string;
  expirationDate?: string;
  proof?: Proof[];
  credentialSchema?: CredentialSchema[];
  credentialStatus?: CredentialStatus;
  evidence?: Evidence[];
  awardedDate?: string;
}

export interface AchievementSubject {
  type?: string | string[];
  id?: string;
  achievement: Achievement | string;
  source?: Profile | string;
  narrative?: string;
  identifier?: IdentifierEntry[];
  image?: Image;
  result?: Result[];
  role?: string;
  term?: string;
  activityEndDate?: string;
  activityStartDate?: string;
  creditsEarned?: number;
  licenseNumber?: string;
}

// ===================================================================
// SUPPORTING TYPES
// ===================================================================

export interface Criteria {
  id?: string;
  narrative?: string;
}

export interface Image {
  id?: string;
  type: string;
  caption?: string;
}

export interface Address {
  type?: string | string[];
  addressCountry?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  postOfficeBoxNumber?: string;
  streetAddress?: string;
}

export interface IdentifierEntry {
  type: string;
  identifier: string;
  identifierType: string;
}

export interface Alignment {
  type?: string | string[];
  targetCode?: string;
  targetDescription?: string;
  targetName?: string;
  targetFramework?: string;
  targetType?: string;
  targetUrl?: string;
}

export interface Related {
  id: string;
  type?: string | string[];
  version?: string;
}

export interface ResultDescription {
  id: string;
  type: string | string[];
  name: string;
  resultType: string;
}

export interface Result {
  type?: string | string[];
  achievedLevel?: string;
  resultDescription?: string;
  status?: string;
  value?: string;
}

export interface Evidence {
  id?: string;
  type?: string | string[];
  name?: string;
  description?: string;
  genre?: string;
  audience?: string;
}

export interface Proof {
  type: string;
  created?: string;
  verificationMethod?: string;
  proofPurpose?: string;
  proofValue?: string;
  jws?: string;
  challenge?: string;
  domain?: string;
}

export interface CredentialSchema {
  id: string;
  type: string;
}

export interface CredentialStatus {
  id: string;
  type: string;
  statusListIndex?: string;
  statusListCredential?: string;
  statusPurpose?: string;
}

// ===================================================================
// BACKWARDS COMPATIBILITY ALIASES
// ===================================================================

export type Issuer = Profile;
export type BadgeClass = Achievement;
export type Badge = AchievementCredential;
export type BadgeInstance = AchievementCredential;
export type Credential = AchievementCredential;

// ===================================================================
// UI REQUEST/RESPONSE TYPES
// ===================================================================

export interface CreateProfileRequest {
  name: string;
  description?: string;
  url?: string;
  email?: string;
  image?: string;
}

export interface CreateAchievementRequest {
  name: string;
  description: string;
  criteria: {
    narrative: string;
    id?: string;
  };
  image?: string;
  tags?: string[];
}

export interface IssueCredentialRequest {
  achievementId: string;
  recipientId: string;
  evidence?: Evidence[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  verificationResult: {
    verified: boolean;
    issuerTrusted: boolean;
    signatureValid: boolean;
    notRevoked: boolean;
    notExpired: boolean;
  };
}
