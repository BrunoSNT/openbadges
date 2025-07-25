import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility functions for profile management
 */

export function getProfileTypeLabel(profileType: 'simple' | 'did' | null): string {
  switch (profileType) {
    case 'did':
      return 'DID-enabled';
    case 'simple':
      return 'Simple';
    default:
      return 'Unknown';
  }
}

export function getProfileTypeDescription(profileType: 'simple' | 'did' | null): string {
  switch (profileType) {
    case 'did':
      return 'Enhanced verification capabilities with decentralized identifier';
    case 'simple':
      return 'Basic profile without DID - can be upgraded later';
    default:
      return 'Profile type unknown';
  }
}

export function isProfileTypeSupported(profileType: 'simple' | 'did' | null, requiredType?: 'simple' | 'did'): boolean {
  if (!profileType) return false;
  if (!requiredType) return true;
  return profileType === requiredType;
}

/**
 * Test function to verify profile checking functionality
 * This can be used for debugging and development
 */
export function testProfileChecking() {
  console.log('Testing profile type utilities:');
  console.log('Simple profile:', getProfileTypeLabel('simple'));
  console.log('DID profile:', getProfileTypeLabel('did'));
  console.log('Null profile:', getProfileTypeLabel(null));
  
  console.log('Profile descriptions:');
  console.log('Simple:', getProfileTypeDescription('simple'));
  console.log('DID:', getProfileTypeDescription('did'));
  
  console.log('Profile support checks:');
  console.log('Simple supports simple:', isProfileTypeSupported('simple', 'simple'));
  console.log('DID supports simple:', isProfileTypeSupported('did', 'simple'));
  console.log('Simple supports DID:', isProfileTypeSupported('simple', 'did'));
  console.log('DID supports DID:', isProfileTypeSupported('did', 'did'));
}
