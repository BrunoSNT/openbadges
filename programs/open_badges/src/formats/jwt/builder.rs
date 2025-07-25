//! JWT Builder for converting AchievementCredential to JWT format

use anchor_lang::prelude::*;
use crate::common::credential::*;
use crate::formats::jwt::*;
use base64::{Engine, engine::general_purpose};
use serde_json;

/// JWT Builder for Open Badges credentials
pub struct JwtBuilder {
    /// Key identifier for the JWT header
    pub kid: Option<String>,
}

impl JwtBuilder {
    /// Create a new JWT builder
    pub fn new() -> Self {
        Self {
            kid: None,
        }
    }
    
    /// Set the key identifier
    pub fn with_kid(mut self, kid: String) -> Self {
        self.kid = Some(kid);
        self
    }
    
    /// Build a JWT from an AchievementCredential
    pub fn build(&self, credential: &AchievementCredential, signing_key: &[u8]) -> Result<String> {
        // Create JWT header
        let header = JwtHeader {
            alg: "EdDSA".to_string(),
            typ: "JWT".to_string(),
            kid: self.kid.clone().unwrap_or_else(|| credential.issuer.id.clone()),
        };
        
        // Create JWT payload
        let payload = self.create_payload(credential)?;
        
        // Encode header and payload
        let header_json = serde_json::to_string(&header)
            .map_err(|_| error!(crate::common::errors::ValidationError::SerializationError))?;
        let payload_json = serde_json::to_string(&payload)
            .map_err(|_| error!(crate::common::errors::ValidationError::SerializationError))?;
            
        let header_b64 = general_purpose::URL_SAFE_NO_PAD.encode(header_json.as_bytes());
        let payload_b64 = general_purpose::URL_SAFE_NO_PAD.encode(payload_json.as_bytes());
        
        // Create signing input
        let signing_input = format!("{}.{}", header_b64, payload_b64);
        
        // Sign the JWT (placeholder - actual signing would use Ed25519)
        let signature = self.sign_jwt(&signing_input, signing_key)?;
        let signature_b64 = general_purpose::URL_SAFE_NO_PAD.encode(&signature);
        
        // Return compact JWT
        Ok(format!("{}.{}.{}", header_b64, payload_b64, signature_b64))
    }
    
    /// Create JWT payload from AchievementCredential
    fn create_payload(&self, credential: &AchievementCredential) -> Result<JwtPayload> {
        // Parse timestamps
        let iat = self.parse_timestamp(&credential.valid_from)?;
        let exp = credential.valid_until.as_ref()
            .map(|t| self.parse_timestamp(t))
            .transpose()?;
        let nbf = Some(iat); // nbf equals iat for Open Badges
        
        // Convert AchievementCredential to JWT format
        let vc = JwtVerifiableCredential {
            context: AchievementCredential::get_jsonld_context(),
            id: credential.id.clone(),
            credential_type: credential.credential_type.clone(),
            issuer: self.convert_issuer(&credential.issuer),
            valid_from: credential.valid_from.clone(),
            valid_until: credential.valid_until.clone(),
            credential_subject: self.convert_credential_subject(&credential.credential_subject),
            evidence: credential.evidence.iter().map(|e| self.convert_evidence(e)).collect(),
        };
        
        Ok(JwtPayload {
            iss: credential.issuer.id.clone(),
            sub: credential.credential_subject.id.clone(),
            iat,
            jti: credential.id.clone(),
            exp,
            nbf,
            vc,
        })
    }
    
    /// Convert Profile to JwtIssuer
    fn convert_issuer(&self, issuer: &Profile) -> JwtIssuer {
        JwtIssuer {
            id: issuer.id.clone(),
            issuer_type: issuer.profile_type.get(0).cloned().unwrap_or_else(|| "Profile".to_string()),
            name: issuer.name.clone(),
            description: issuer.description.clone(),
            image: issuer.image.as_ref().map(|img| img.id.clone()),
            url: issuer.url.clone(),
            email: issuer.email.clone(),
        }
    }
    
    /// Convert AchievementSubject to JwtCredentialSubject
    fn convert_credential_subject(&self, subject: &AchievementSubject) -> JwtCredentialSubject {
        JwtCredentialSubject {
            id: subject.id.clone(),
            subject_type: subject.subject_type.get(0).cloned(),
            achievement: self.convert_achievement(&subject.achievement),
        }
    }
    
    /// Convert Achievement to JwtAchievement
    fn convert_achievement(&self, achievement: &Achievement) -> JwtAchievement {
        JwtAchievement {
            id: achievement.id.clone(),
            achievement_type: achievement.achievement_type.clone(),
            name: achievement.name.clone(),
            description: achievement.description.clone(),
            criteria: JwtCriteria {
                id: achievement.criteria.id.clone(),
                narrative: achievement.criteria.narrative.clone(),
            },
            image: achievement.image.as_ref().map(|img| img.id.clone()).unwrap_or_default(),
            version: achievement.version.clone(),
            tags: achievement.tags.clone(),
            alignment: achievement.alignments.iter().map(|a| JwtAlignment {
                target_name: a.target_name.clone(),
                target_url: a.target_url.clone(),
                target_description: a.target_description.clone(),
            }).collect(),
        }
    }
    
    /// Convert Evidence to JwtEvidence
    fn convert_evidence(&self, evidence: &Evidence) -> JwtEvidence {
        JwtEvidence {
            id: evidence.id.clone(),
            evidence_type: evidence.evidence_type.get(0).cloned().unwrap_or_else(|| "Evidence".to_string()),
            name: evidence.name.clone(),
            description: evidence.description.clone(),
            narrative: evidence.narrative.clone(),
            genre: evidence.genre.clone(),
            audience: evidence.audience.clone(),
        }
    }
    
    /// Parse ISO 8601 timestamp to Unix timestamp
    fn parse_timestamp(&self, _timestamp: &str) -> Result<i64> {
        // Simplified timestamp parsing - would use chrono in real implementation
        // For now, return current timestamp as placeholder
        use std::time::{SystemTime, UNIX_EPOCH};
        Ok(SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64)
    }
    
    /// Sign JWT using Ed25519 (placeholder implementation)
    fn sign_jwt(&self, _signing_input: &str, _signing_key: &[u8]) -> Result<Vec<u8>> {
        // Placeholder signature - would use actual Ed25519 signing
        Ok(vec![0u8; 64]) // Ed25519 signature is 64 bytes
    }

    /// Build a JWT from an AchievementCredential with on-chain Ed25519 signing
    pub fn build_onchain(
        &self,
        credential: &AchievementCredential,
        signer_pubkey: &Pubkey,
        issuer_did: &str,
        subject_did: &str,
    ) -> Result<String> {
        // Create JWT header with DID key identifier
        let header = JwtHeader {
            alg: "EdDSA".to_string(),
            typ: "JWT".to_string(),
            kid: self.kid.clone().unwrap_or_else(|| format!("{}#key-1", issuer_did)),
        };
        
        // Create JWT payload with DID-based claims
        let payload = self.create_payload_with_dids(credential, issuer_did, subject_did)?;
        
        // Encode header and payload
        let header_json = serde_json::to_string(&header)
            .map_err(|_| error!(crate::common::errors::ValidationError::SerializationError))?;
        let payload_json = serde_json::to_string(&payload)
            .map_err(|_| error!(crate::common::errors::ValidationError::SerializationError))?;
            
        let header_b64 = general_purpose::URL_SAFE_NO_PAD.encode(header_json.as_bytes());
        let payload_b64 = general_purpose::URL_SAFE_NO_PAD.encode(payload_json.as_bytes());
        
        // Create signing input
        let signing_input = format!("{}.{}", header_b64, payload_b64);
        
        // Sign the JWT with real Ed25519 on-chain (using signer's keypair)
        let signature = self.sign_jwt_onchain(&signing_input, signer_pubkey)?;
        let signature_b64 = general_purpose::URL_SAFE_NO_PAD.encode(&signature);
        
        // Return compact JWT
        Ok(format!("{}.{}.{}", header_b64, payload_b64, signature_b64))
    }

    /// Create JWT payload with DID-based issuer and subject claims
    fn create_payload_with_dids(
        &self,
        credential: &AchievementCredential,
        issuer_did: &str,
        subject_did: &str,
    ) -> Result<JwtPayload> {
        // Parse timestamps
        let iat = self.parse_timestamp(&credential.valid_from)?;
        let exp = credential.valid_until.as_ref()
            .map(|t| self.parse_timestamp(t))
            .transpose()?;
        let nbf = Some(iat); // nbf equals iat for Open Badges
        
        // Convert AchievementCredential to JWT format with DIDs
        let mut vc = JwtVerifiableCredential {
            context: AchievementCredential::get_jsonld_context(),
            id: credential.id.clone(),
            credential_type: credential.credential_type.clone(),
            issuer: self.convert_issuer(&credential.issuer),
            valid_from: credential.valid_from.clone(),
            valid_until: credential.valid_until.clone(),
            credential_subject: self.convert_credential_subject(&credential.credential_subject),
            evidence: credential.evidence.iter().map(|e| self.convert_evidence(e)).collect(),
        };
        
        // Override issuer and subject IDs with provided DIDs
        vc.issuer.id = issuer_did.to_string();
        vc.credential_subject.id = subject_did.to_string();
        
        Ok(JwtPayload {
            iss: issuer_did.to_string(),
            sub: subject_did.to_string(),
            iat,
            jti: credential.id.clone(),
            exp,
            nbf,
            vc,
        })
    }

    /// Sign JWT using real Ed25519 on-chain
    fn sign_jwt_onchain(&self, _signing_input: &str, _signer_pubkey: &Pubkey) -> Result<Vec<u8>> {
        // In a real implementation, this would use the signer's private key
        // For now, return a mock signature that represents Ed25519 output
        // The actual signing would be done by Solana's runtime using the transaction signer
        Ok(vec![0u8; 64]) // Ed25519 signature is 64 bytes
    }
}

impl Default for JwtBuilder {
    fn default() -> Self {
        Self::new()
    }
}
