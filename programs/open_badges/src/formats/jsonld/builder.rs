//! JSON-LD Builder for converting AchievementCredential to JSON-LD format with embedded proofs

use anchor_lang::prelude::*;
use crate::common::credential::*;
use crate::formats::jsonld::*;
use serde_json;

/// JSON-LD Builder for Open Badges credentials
pub struct JsonLdBuilder {
    /// Cryptographic suite to use
    pub cryptosuite: String,
    /// Proof purpose
    pub proof_purpose: String,
    /// Verification method (DID with key fragment)
    pub verification_method: Option<String>,
}

impl JsonLdBuilder {
    /// Create a new JSON-LD builder
    pub fn new() -> Self {
        Self {
            cryptosuite: "eddsa-2022".to_string(),
            proof_purpose: "assertionMethod".to_string(),
            verification_method: None,
        }
    }
    
    /// Set the cryptographic suite
    pub fn with_cryptosuite(mut self, cryptosuite: String) -> Self {
        self.cryptosuite = cryptosuite;
        self
    }
    
    /// Set the proof purpose
    pub fn with_proof_purpose(mut self, proof_purpose: String) -> Self {
        self.proof_purpose = proof_purpose;
        self
    }
    
    /// Set the verification method
    pub fn with_verification_method(mut self, verification_method: String) -> Self {
        self.verification_method = Some(verification_method);
        self
    }
    
    /// Build a JSON-LD credential from an AchievementCredential
    pub fn build(&self, credential: &AchievementCredential) -> crate::formats::Result<String> {
        // Convert to JSON-LD format
        let jsonld_credential = self.convert_to_jsonld(credential)?;
        
        // Serialize to JSON
        serde_json::to_string_pretty(&jsonld_credential)
            .map_err(|_| crate::common::errors::ValidationError::SerializationError)
    }
    
    /// Build a JSON-LD credential with on-chain proof using the proof module
    pub fn build_with_proof(
        &self,
        credential: &AchievementCredential,
        _signer_pubkey: &Pubkey,
        _issuer_controller: &str,
        _key_id: &str,
    ) -> crate::formats::Result<String> {
        // TODO: Integrate with proof module once type compatibility is resolved
        // For now, use the regular build method
        self.build(credential)
        
        /* 
        // Use the proof module to create a real cryptographic proof
        let key_pair = crate::proof::MultikeyPair::from_signer(
            *signer_pubkey,
            issuer_controller.to_string(),
            key_id.to_string(),
        )?;
        
        // Create credential JSON first
        let credential_json = serde_json::to_string(credential)
            .map_err(|_| crate::common::errors::ValidationError::SerializationError)?;
        
        // Create proof using the proof module
        let proof = crate::proof::ProofSuite::create_proof_onchain(
            &credential_json,
            &key_pair,
            &self.proof_purpose,
            signer_pubkey,
        )?;
        
        // Convert to JSON-LD format
        let mut jsonld_credential = self.convert_to_jsonld(credential)?;
        
        // Add the real cryptographic proof
        jsonld_credential.proof = JsonLdProof {
            proof_type: proof.proof_type,
            cryptosuite: proof.cryptosuite,
            created: proof.created,
            verification_method: proof.verification_method,
            proof_purpose: proof.proof_purpose,
            proof_value: proof.proof_value,
            challenge: None,
            domain: None,
        };
        
        // Serialize to JSON
        serde_json::to_string_pretty(&jsonld_credential)
            .map_err(|_| crate::common::errors::ValidationError::SerializationError)
        */
    }
    
    /// Convert AchievementCredential to JsonLdCredential
    fn convert_to_jsonld(&self, credential: &AchievementCredential) -> crate::formats::Result<JsonLdCredential> {
        // Create embedded proof
        let proof = self.create_proof_for_achievement(credential)?;
        
        Ok(JsonLdCredential {
            context: vec![
                "https://www.w3.org/2018/credentials/v1".to_string(), 
                "https://purl.imsglobal.org/spec/ob/v3p0/context.json".to_string()
            ],
            id: credential.id.clone(),
            credential_type: vec!["VerifiableCredential".to_string(), "OpenBadgeCredential".to_string()],
            issuer: self.convert_achievement_issuer(&credential.issuer),
            valid_from: credential.valid_from.clone(),
            valid_until: credential.valid_until.clone(),
            credential_subject: self.convert_achievement_subject(&credential.credential_subject),
            evidence: credential.evidence.iter().map(|e| self.convert_achievement_evidence(e)).collect(),
            credential_status: credential.credential_status.as_ref().map(|s| self.convert_achievement_status(s)),
            refresh_service: credential.refresh_service.as_ref().map(|s| self.convert_achievement_refresh_service(s)),
            proof,
        })
    }
    
    /// Create embedded Data Integrity Proof for AchievementCredential
    fn create_proof_for_achievement(&self, credential: &AchievementCredential) -> crate::formats::Result<JsonLdProof> {
        // Get current timestamp in ISO 8601 format
        let created = self.get_current_iso8601_timestamp();
        
        // Determine verification method
        let verification_method = self.verification_method.clone()
            .unwrap_or_else(|| format!("{}#key-1", credential.issuer.id));
        
        // Create canonical representation for signing
        let canonical_data = self.create_canonical_data_for_achievement(credential)?;
        
        // Generate proof value (placeholder)
        let proof_value = self.generate_proof_value(&canonical_data)?;
        
        Ok(JsonLdProof {
            proof_type: "DataIntegrityProof".to_string(),
            cryptosuite: self.cryptosuite.clone(),
            created,
            verification_method,
            proof_purpose: self.proof_purpose.clone(),
            proof_value,
            challenge: None,
            domain: None,
        })
    }
    
    /// Convert Profile to JsonLdIssuer
    fn convert_achievement_issuer(&self, issuer: &Profile) -> JsonLdIssuer {
        JsonLdIssuer {
            id: issuer.id.clone(),
            issuer_type: "Profile".to_string(),
            name: issuer.name.clone(),
            description: issuer.description.clone(),
            image: issuer.image.as_ref().map(|img| img.id.clone()),
            url: issuer.url.clone(),
            email: issuer.email.clone(),
        }
    }
    
    /// Convert AchievementSubject to JsonLdCredentialSubject
    fn convert_achievement_subject(&self, subject: &AchievementSubject) -> JsonLdCredentialSubject {
        JsonLdCredentialSubject {
            id: subject.id.clone(),
            subject_type: Some("AchievementSubject".to_string()),
            achievement: self.convert_achievement(&subject.achievement),
        }
    }
    
    /// Convert Achievement to JsonLdAchievement
    fn convert_achievement(&self, achievement: &Achievement) -> JsonLdAchievement {
        JsonLdAchievement {
            id: achievement.id.clone(),
            achievement_type: vec!["Achievement".to_string()],
            name: achievement.name.clone(),
            description: achievement.description.clone(),
            criteria: JsonLdCriteria {
                id: achievement.criteria.id.clone(),
                narrative: achievement.criteria.narrative.clone(),
            },
            image: achievement.image.as_ref().map(|img| img.id.clone()).unwrap_or_default(),
            version: achievement.version.clone(),
            tags: achievement.tags.clone(),
            alignment: achievement.alignments.iter().map(|a| JsonLdAlignment {
                target_name: a.target_name.clone(),
                target_url: a.target_url.clone(),
                target_description: a.target_description.clone(),
            }).collect(),
        }
    }
    
    /// Convert Evidence to JsonLdEvidence
    fn convert_achievement_evidence(&self, evidence: &Evidence) -> JsonLdEvidence {
        JsonLdEvidence {
            id: evidence.id.clone(),
            evidence_type: evidence.evidence_type.first().cloned().unwrap_or_else(|| "Evidence".to_string()),
            name: evidence.name.clone(),
            description: evidence.description.clone(),
            narrative: evidence.narrative.clone(),
            genre: evidence.genre.clone(),
            audience: evidence.audience.clone(),
        }
    }
    
    /// Convert CredentialStatus to JsonLdCredentialStatus
    fn convert_achievement_status(&self, status: &CredentialStatus) -> JsonLdCredentialStatus {
        JsonLdCredentialStatus {
            id: status.id.clone(),
            status_type: status.status_type.clone(),
            status_list_index: status.status_list_index.clone(),
            status_list_credential: status.status_list_credential.clone(),
        }
    }
    
    /// Convert RefreshService to JsonLdRefreshService
    fn convert_achievement_refresh_service(&self, service: &RefreshService) -> JsonLdRefreshService {
        JsonLdRefreshService {
            id: service.id.clone(),
            service_type: service.service_type.clone(),
        }
    }
    
    /// Create canonical representation for signing (placeholder)
    fn create_canonical_data_for_achievement(&self, credential: &AchievementCredential) -> crate::formats::Result<Vec<u8>> {
        // Placeholder for RDF Dataset Canonicalization
        // In a real implementation, this would perform URDNA2015 canonicalization
        let data = format!("{}:{}:{}", credential.id, credential.issuer.id, credential.valid_from);
        Ok(data.into_bytes())
    }
    
    /// Generate proof value (placeholder implementation)
    fn generate_proof_value(&self, _canonical_data: &[u8]) -> crate::formats::Result<String> {
        // Placeholder proof value generation
        // In a real implementation, this would:
        // 1. Hash the canonical data
        // 2. Sign with Ed25519
        // 3. Encode as multibase
        Ok("z3MzkD9NzXh5a1D2L8c9fH6bE7wX8vQ9pY2cR5nT4gF1mK".to_string())
    }
    
    /// Get current timestamp in ISO 8601 format
    fn get_current_iso8601_timestamp(&self) -> String {
        // Placeholder timestamp - would use chrono in real implementation
        "2024-01-01T00:00:00Z".to_string()
    }
}

impl Default for JsonLdBuilder {
    fn default() -> Self {
        Self::new()
    }
}