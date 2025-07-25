/**
 * Runtime production safety checks
 * This file contains utilities to ensure no mock data is used in production
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isTest = import.meta.env.MODE === 'test';

/**
 * Warns if mock data is being used outside of development/test environments
 */
export function warnIfMockInProduction(context: string, data: any): void {
  if (!isDevelopment && !isTest) {
    if (typeof data === 'string' && (data.includes('mock') || data.includes('placeholder') || data.includes('test'))) {
      console.warn(`⚠️ PRODUCTION WARNING: Mock/placeholder data detected in ${context}:`, data);
    }
    
    if (typeof data === 'object' && data !== null) {
      const jsonStr = JSON.stringify(data);
      if (jsonStr.includes('mock') || jsonStr.includes('placeholder') || jsonStr.includes('test')) {
        console.warn(`⚠️ PRODUCTION WARNING: Mock/placeholder data detected in ${context}:`, data);
      }
    }
  }
}

/**
 * Validates that a credential is using real blockchain data
 */
export function validateCredentialRealness(credential: any): boolean {
  // Check for mock signatures in proof array
  const proofs = Array.isArray(credential.proof) ? credential.proof : [credential.proof];
  for (const proof of proofs) {
    if (proof?.proofValue?.includes('placeholder') || proof?.proofValue?.includes('mock')) {
      warnIfMockInProduction('credential proof', proof.proofValue);
      return false;
    }
  }
  
  // Check for test DIDs
  if (credential.issuer?.includes('did:test:') || credential.credentialSubject?.id?.includes('did:test:')) {
    warnIfMockInProduction('credential DID', credential.issuer || credential.credentialSubject?.id);
    return false;
  }
  
  // Check for placeholder URLs (but allow proper credential URIs)
  if (credential.id?.includes('example.com') && !credential.id?.includes('credentials.solana.com')) {
    warnIfMockInProduction('credential ID', credential.id);
    return false;
  }
  
  // Check for unknown or empty addresses in DIDs
  if (credential.issuer?.includes(':unknown') || credential.credentialSubject?.id?.includes(':unknown')) {
    warnIfMockInProduction('unknown address in DID', credential.issuer || credential.credentialSubject?.id);
    return false;
  }
  
  return true;
}

/**
 * Validates that a profile is using real blockchain data
 */
export function validateProfileRealness(profile: any): boolean {
  if (profile.id?.includes('placeholder') || profile.id?.includes('mock')) {
    warnIfMockInProduction('profile ID', profile.id);
    return false;
  }
  
  return true;
}

/**
 * Ensures a Solana PublicKey is real and not a mock
 */
export function validateSolanaPublicKey(publicKey: string): boolean {
  // Check for common mock/test public keys
  const mockKeys = [
    '11111111111111111111111111111111',
    '22222222222222222222222222222222',
    'HezjHrskpwAzT93Rj8x6ufR6cbygApJJhJmW1RjGp1sA', // Common test key
  ];
  
  if (mockKeys.includes(publicKey)) {
    warnIfMockInProduction('Solana public key', publicKey);
    return false;
  }
  
  return true;
}

export default {
  warnIfMockInProduction,
  validateCredentialRealness,
  validateProfileRealness,
  validateSolanaPublicKey
};
