//! Proof format implementations for Open Badges 3.0
//! 
//! This module provides format-specific implementations for serializing
//! UnifiedCredential to different proof formats (JWT, JSON-LD).

#[cfg(feature = "jwt")]
pub mod jwt;

#[cfg(feature = "jsonld")]
pub mod jsonld;

use crate::AchievementCredential;
use crate::common::errors::ValidationError;

/// Result type alias for format operations
pub type Result<T> = std::result::Result<T, ValidationError>;

/// Supported proof formats
#[derive(Debug, Clone, PartialEq)]
pub enum ProofFormat {
    #[cfg(feature = "jwt")]
    Jwt,
    #[cfg(feature = "jsonld")]
    JsonLd,
}

/// Trait for proof format serialization
pub trait ProofFormatSerializer {
    type Output;
    type Error;
    
    fn serialize(&self, credential: &AchievementCredential) -> std::result::Result<Self::Output, Self::Error>;
    fn verify(&self, data: &[u8], signature: &[u8], public_key: &[u8]) -> std::result::Result<bool, Self::Error>;
}

/// Convert AchievementCredential to JSON-LD format
#[cfg(feature = "jsonld")]
pub fn achievement_to_jsonld(credential: &AchievementCredential) -> Result<String> {
    jsonld::JsonLdBuilder::new().build(credential)
        .map_err(|_| ValidationError::ValidationFailed)
}

/// Convert AchievementCredential to JWT format
#[cfg(feature = "jwt")]
pub fn achievement_to_jwt(credential: &AchievementCredential, signing_key: &[u8]) -> Result<String> {
    jwt::JwtBuilder::new().build(credential, signing_key)
        .map_err(|_| ValidationError::ValidationFailed)
}

/// Verify credential in any supported format
pub fn verify_credential(credential_data: &str, _expected_issuer: &str) -> Result<bool> {
    // Try to detect format and verify accordingly
    if credential_data.starts_with('{') {
        // Likely JSON-LD format
        #[cfg(feature = "jsonld")]
        return jsonld::JsonLdVerifier::new().verify_json(credential_data, expected_issuer)
            .map_err(|_| ValidationError::ValidationFailed);
        
        #[cfg(not(feature = "jsonld"))]
        return Err(ValidationError::UnsupportedFormat);
    } else if credential_data.contains('.') && credential_data.split('.').count() == 3 {
        // Likely JWT format
        #[cfg(feature = "jwt")]
        return jwt::JwtVerifier::new().verify_jwt(credential_data, expected_issuer)
            .map_err(|_| ValidationError::ValidationFailed);
        
        #[cfg(not(feature = "jwt"))]
        return Err(ValidationError::UnsupportedFormat);
    }
    
    Err(ValidationError::UnsupportedFormat)
}
