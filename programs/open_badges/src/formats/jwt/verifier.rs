//! JWT Verifier for validating JWT format Open Badges credentials

use anchor_lang::prelude::*;
use crate::formats::jwt::*;
use base64::{Engine, engine::general_purpose};
use serde_json;

/// JWT Verifier for Open Badges credentials
pub struct JwtVerifier {
    /// Expected algorithms (defaults to EdDSA)
    pub allowed_algorithms: Vec<String>,
}

impl JwtVerifier {
    /// Create a new JWT verifier
    pub fn new() -> Self {
        Self {
            allowed_algorithms: vec!["EdDSA".to_string()],
        }
    }
    
    /// Verify a JWT credential
    pub fn verify_jwt(&self, jwt: &str, expected_issuer: &str) -> Result<bool> {
        let parts: Vec<&str> = jwt.split('.').collect();
        if parts.len() != 3 {
            return Err(error!(crate::common::errors::ValidationError::InvalidJwtFormat));
        }
        
        // Decode header
        let header = self.decode_header(parts[0])?;
        
        // Validate algorithm
        if !self.allowed_algorithms.contains(&header.alg) {
            return Err(error!(crate::common::errors::ValidationError::UnsupportedAlgorithm));
        }
        
        // Decode payload
        let payload = self.decode_payload(parts[1])?;
        
        // Validate issuer
        if payload.iss != expected_issuer {
            return Err(error!(crate::common::errors::ValidationError::InvalidIssuer));
        }
        
        // Validate JWT claims
        self.validate_jwt_claims(&payload)?;
        
        // Validate DID-specific claims
        self.validate_did_claims(&payload)?;
        
        // Validate embedded VC
        self.validate_embedded_vc(&payload.vc)?;
        
        // Verify signature (placeholder)
        let signing_input = format!("{}.{}", parts[0], parts[1]);
        let signature = general_purpose::URL_SAFE_NO_PAD.decode(parts[2])
            .map_err(|_| error!(crate::common::errors::ValidationError::InvalidSignature))?;
            
        self.verify_signature(&signing_input, &signature, &header.kid)?;
        
        Ok(true)
    }
    
    /// Decode JWT header
    fn decode_header(&self, header_b64: &str) -> Result<JwtHeader> {
        let header_bytes = general_purpose::URL_SAFE_NO_PAD.decode(header_b64)
            .map_err(|_| error!(crate::common::errors::ValidationError::InvalidJwtFormat))?;
            
        let header_json = String::from_utf8(header_bytes)
            .map_err(|_| error!(crate::common::errors::ValidationError::InvalidJwtFormat))?;
            
        serde_json::from_str(&header_json)
            .map_err(|_| error!(crate::common::errors::ValidationError::InvalidJwtFormat))
    }
    
    /// Decode JWT payload with optimized memory usage
    fn decode_payload(&self, payload_b64: &str) -> Result<JwtPayload> {
        let payload_bytes = general_purpose::URL_SAFE_NO_PAD.decode(payload_b64)
            .map_err(|_| error!(crate::common::errors::ValidationError::InvalidJwtFormat))?;
            
        // Use a boxed reader to reduce stack usage
        let reader = std::io::Cursor::new(payload_bytes);
        serde_json::from_reader(reader)
            .map_err(|_| error!(crate::common::errors::ValidationError::InvalidJwtFormat))
    }
    
    /// Validate JWT standard claims
    fn validate_jwt_claims(&self, payload: &JwtPayload) -> Result<()> {
        // Check required claims
        if payload.iss.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if payload.sub.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if payload.jti.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        // Validate timestamps
        let current_time = self.get_current_timestamp();
        
        // Check not before
        if let Some(nbf) = payload.nbf {
            if current_time < nbf {
                return Err(error!(crate::common::errors::ValidationError::CredentialNotYetValid));
            }
        }
        
        // Check expiration
        if let Some(exp) = payload.exp {
            if current_time > exp {
                return Err(error!(crate::common::errors::ValidationError::CredentialExpired));
            }
        }
        
        // Validate iss matches vc.issuer.id
        if payload.iss != payload.vc.issuer.id {
            return Err(error!(crate::common::errors::ValidationError::ClaimMismatch));
        }
        
        // Validate sub matches vc.credentialSubject.id
        if payload.sub != payload.vc.credential_subject.id {
            return Err(error!(crate::common::errors::ValidationError::ClaimMismatch));
        }
        
        // Validate jti matches vc.id
        if payload.jti != payload.vc.id {
            return Err(error!(crate::common::errors::ValidationError::ClaimMismatch));
        }
        
        Ok(())
    }
    
    /// Validate embedded Verifiable Credential
    fn validate_embedded_vc(&self, vc: &JwtVerifiableCredential) -> Result<()> {
        // Validate context
        crate::common::validation::validate_jsonld_context(&vc.context)?;
        
        // Validate credential type
        crate::common::validation::validate_credential_type(&vc.credential_type)?;
        
        // Validate achievement type
        crate::common::validation::validate_achievement_type(&vc.credential_subject.achievement.achievement_type)?;
        
        // Validate required fields
        if vc.id.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if vc.issuer.name.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if vc.credential_subject.achievement.name.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if vc.credential_subject.achievement.description.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if vc.credential_subject.achievement.criteria.narrative.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        Ok(())
    }
    
    /// Verify JWT signature (placeholder implementation)
    fn verify_signature(&self, _signing_input: &str, _signature: &[u8], _kid: &str) -> Result<()> {
        // Placeholder signature verification - would use actual Ed25519 verification
        // with key resolution via DID
        Ok(())
    }
    
    /// Get current Unix timestamp
    fn get_current_timestamp(&self) -> i64 {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64
    }

    /// Verify a JWT credential with on-chain validation
    pub fn verify_jwt_onchain(
        &self,
        jwt: &str,
        expected_issuer_did: &str,
        _public_key_multibase: &str,
        _verifier_pubkey: &Pubkey,
    ) -> Result<bool> {
        let parts: Vec<&str> = jwt.split('.').collect();
        if parts.len() != 3 {
            return Err(error!(crate::common::errors::ValidationError::InvalidJwtFormat));
        }
        
        // Decode header
        let header = self.decode_header(parts[0])?;
        
        // Validate algorithm
        if !self.allowed_algorithms.contains(&header.alg) {
            return Err(error!(crate::common::errors::ValidationError::UnsupportedAlgorithm));
        }
        
        // Decode payload
        let payload = self.decode_payload(parts[1])?;
        
        // Validate issuer DID
        if payload.iss != expected_issuer_did {
            return Err(error!(crate::common::errors::ValidationError::InvalidIssuer));
        }
        
        // Validate JWT claims
        self.validate_jwt_claims(&payload)?;
        
        // Validate embedded VC
        self.validate_embedded_vc(&payload.vc)?;
        
        // Verify signature with on-chain key resolution
        let signing_input = format!("{}.{}", parts[0], parts[1]);
        let signature = general_purpose::URL_SAFE_NO_PAD.decode(parts[2])
            .map_err(|_| error!(crate::common::errors::ValidationError::InvalidSignature))?;
            
        self.verify_signature_onchain(&signing_input, &signature, &header.kid)?;
        
        Ok(true)
    }

    /// Verify JWT signature with on-chain key resolution
    fn verify_signature_onchain(&self, _signing_input: &str, _signature: &[u8], _kid: &str) -> Result<()> {
        // In a real implementation, this would:
        // 1. Resolve the DID to get the public key
        // 2. Verify the Ed25519 signature on-chain
        // 3. Validate that the key is authorized for the issuer
        
        // For now, return success to demonstrate the flow
        Ok(())
    }

    /// Validate DID-based claims in JWT payload
    fn validate_did_claims(&self, payload: &JwtPayload) -> Result<()> {
        // Validate DID format for issuer
        if !payload.iss.starts_with("did:") {
            return Err(error!(crate::common::errors::ValidationError::InvalidIssuer));
        }
        
        // Validate DID format for subject
        if !payload.sub.starts_with("did:") {
            return Err(error!(crate::common::errors::ValidationError::ClaimMismatch));
        }
        
        // Validate consistency between JWT claims and VC
        if payload.iss != payload.vc.issuer.id {
            return Err(error!(crate::common::errors::ValidationError::ClaimMismatch));
        }
        
        if payload.sub != payload.vc.credential_subject.id {
            return Err(error!(crate::common::errors::ValidationError::ClaimMismatch));
        }
        
        Ok(())
    }
}

impl Default for JwtVerifier {
    fn default() -> Self {
        Self::new()
    }
}
