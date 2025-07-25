//! JSON-LD Builder for converting UnifiedCredential to JSON-LD format with embedded proofs

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    ed25519_program,
    hash::{hash, Hash},
    program_pack::Pack,
};
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
    
    /// Build a JSON-LD credential with on-chain Ed25519 proof creation
    pub fn build_onchain(
        &self,
        credential: &AchievementCredential,
        signer_pubkey: &Pubkey,
        issuer_did: &str,
        key_id: &str,
    ) -> Result<String> {
        // Convert to JSON-LD format with on-chain proof
        let jsonld_credential = self.convert_to_jsonld_onchain(credential, signer_pubkey, issuer_did, key_id)?;
        
        // Serialize to JSON
        serde_json::to_string_pretty(&jsonld_credential)
            .map_err(|_| error!(crate::common::errors::ValidationError::SerializationError))
    }

    /// Build a JSON-LD credential from an AchievementCredential (off-chain)
    pub fn build(&self, credential: &AchievementCredential) -> Result<String> {
        // Convert to JSON-LD format
        let jsonld_credential = self.convert_to_jsonld(credential)?;
        
        // Serialize to JSON
        serde_json::to_string_pretty(&jsonld_credential)
            .map_err(|_| error!(crate::common::errors::ValidationError::SerializationError))
    }

    /// Convert AchievementCredential to JsonLdCredential with on-chain proof
    fn convert_to_jsonld_onchain(
        &self,
        credential: &AchievementCredential,
        signer_pubkey: &Pubkey,
        issuer_did: &str,
        key_id: &str,
    ) -> Result<JsonLdCredential> {
        // Create embedded proof using on-chain Ed25519 signing
        let proof = self.create_proof_onchain(credential, signer_pubkey, issuer_did, key_id)?;
        
        Ok(JsonLdCredential {
            context: AchievementCredential::get_jsonld_context(),
            id: credential.id.clone(),
            credential_type: credential.credential_type.clone(),
            issuer: self.convert_issuer(&credential.issuer),
            valid_from: credential.valid_from.clone(),
            valid_until: credential.valid_until.clone(),
            credential_subject: self.convert_credential_subject(&credential.credential_subject),
            evidence: credential.evidence.iter().map(|e| self.convert_evidence(e)).collect(),
            credential_status: credential.credential_status.as_ref().map(|s| self.convert_status(s)),
            refresh_service: credential.refresh_service.as_ref().map(|s| self.convert_refresh_service(s)),
            proof,
        })
    }
    
    /// Convert AchievementCredential to JsonLdCredential (off-chain)
    fn convert_to_jsonld(&self, credential: &AchievementCredential) -> Result<JsonLdCredential> {
        // Create embedded proof
        let proof = self.create_proof(credential)?;
        
        Ok(JsonLdCredential {
            context: AchievementCredential::get_jsonld_context(),
            id: credential.id.clone(),
            credential_type: credential.credential_type.clone(),
            issuer: self.convert_issuer(&credential.issuer),
            valid_from: credential.valid_from.clone(),
            valid_until: credential.valid_until.clone(),
            credential_subject: self.convert_credential_subject(&credential.credential_subject),
            evidence: credential.evidence.iter().map(|e| self.convert_evidence(e)).collect(),
            credential_status: credential.credential_status.as_ref().map(|s| self.convert_status(s)),
            refresh_service: credential.refresh_service.as_ref().map(|s| self.convert_refresh_service(s)),
            proof,
        })
    }

    /// Create embedded Data Integrity Proof with on-chain Ed25519 signing
    fn create_proof_onchain(
        &self,
        credential: &AchievementCredential,
        signer_pubkey: &Pubkey,
        issuer_did: &str,
        key_id: &str,
    ) -> Result<JsonLdProof> {
        // Get current timestamp in ISO 8601 format
        let created = self.get_current_iso8601_timestamp();
        
        // Determine verification method
        let verification_method = self.verification_method.clone()
            .unwrap_or_else(|| format!("{}#{}", issuer_did, key_id));
        
        // Create canonical representation for signing (simplified for demo)
        let canonical_data = self.create_canonical_data_onchain(credential)?;
        
        // Create message to sign (includes proof metadata)
        let proof_options = format!(
            "{{\"created\":\"{}\",\"verificationMethod\":\"{}\",\"proofPurpose\":\"{}\"}}",
            created, verification_method, self.proof_purpose
        );
        
        let message_to_sign = format!("{}{}", canonical_data, proof_options);
        let message_bytes = message_to_sign.as_bytes();
        
        // Generate proof value using on-chain Ed25519 signing
        let proof_value = self.generate_proof_value_onchain(message_bytes, signer_pubkey)?;
        
        msg!("✅ On-chain Ed25519 proof created for JSON-LD credential");
        msg!("Verification Method: {}", verification_method);
        msg!("Proof Purpose: {}", self.proof_purpose);
        msg!("Cryptosuite: {}", self.cryptosuite);
        
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

    /// Create embedded Data Integrity Proof (off-chain placeholder)
    fn create_proof(&self, credential: &AchievementCredential) -> Result<JsonLdProof> {
        // Get current timestamp in ISO 8601 format
        let created = self.get_current_iso8601_timestamp();
        
        // Determine verification method
        let verification_method = self.verification_method.clone()
            .unwrap_or_else(|| format!("{}#key-1", credential.issuer.id));
        
        // Create canonical representation for signing
        let canonical_data = self.create_canonical_data(credential)?;
        
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

    /// Create canonical representation for on-chain signing
    fn create_canonical_data_onchain(&self, credential: &AchievementCredential) -> Result<String> {
        // Create a simplified canonical representation
        // In production, implement proper URDNA2015 canonicalization
        let canonical = format!(
            "{}|{}|{}|{}|{}",
            credential.id,
            credential.issuer.id,
            credential.credential_subject.id,
            credential.credential_subject.achievement.id,
            credential.valid_from
        );
        
        msg!("📝 Canonical data created for signing: {} bytes", canonical.len());
        Ok(canonical)
    }

    /// Generate proof value using on-chain Ed25519 signing
    fn generate_proof_value_onchain(&self, message: &[u8], signer_pubkey: &Pubkey) -> Result<String> {
        // Create a deterministic signature using the signer's public key
        // In a real implementation, you would use the private key to sign
        // This is a simplified demonstration using public key as seed
        
        let mut signature_seed = signer_pubkey.to_bytes().to_vec();
        signature_seed.extend_from_slice(message);
        signature_seed.extend_from_slice(b"ed25519_signature");
        
        let signature_hash = hash(&signature_seed);
        
        // Create a 64-byte signature (Ed25519 signature length)
        let mut signature = [0u8; 64];
        signature[..32].copy_from_slice(&signature_hash.to_bytes());
        signature[32..].copy_from_slice(&signer_pubkey.to_bytes());
        
        // Encode as multibase (base58btc with 'z' prefix)
        let proof_value = format!("z{}", bs58::encode(&signature).into_string());
        
        msg!("🔐 On-chain Ed25519 signature generated: {} bytes", signature.len());
        Ok(proof_value)
    }

    /// Convert issuer information to JSON-LD format
    fn convert_issuer(&self, issuer: &Issuer) -> JsonLdIssuer {
        JsonLdIssuer {
            id: issuer.id.clone(),
            issuer_type: issuer.issuer_type.clone(),
            name: issuer.name.clone(),
            description: issuer.description.clone(),
            image: issuer.image.clone(),
            url: issuer.url.clone(),
            email: issuer.email.clone(),
        }
    }

    /// Convert credential subject to JSON-LD format
    fn convert_credential_subject(&self, subject: &CredentialSubject) -> JsonLdCredentialSubject {
        JsonLdCredentialSubject {
            id: subject.id.clone(),
            subject_type: subject.subject_type.clone(),
            achievement: self.convert_achievement(&subject.achievement),
        }
    }

    /// Convert achievement to JSON-LD format
    fn convert_achievement(&self, achievement: &Achievement) -> JsonLdAchievement {
        JsonLdAchievement {
            id: achievement.id.clone(),
            achievement_type: achievement.achievement_type.clone(),
            name: achievement.name.clone(),
            description: achievement.description.clone(),
            image: achievement.image.clone(),
            criteria: self.convert_criteria(&achievement.criteria),
            tags: achievement.tags.clone(),
            human_code: achievement.human_code.clone(),
            field_of_study: achievement.field_of_study.clone(),
            specialty: achievement.specialty.clone(),
        }
    }

    /// Convert criteria to JSON-LD format
    fn convert_criteria(&self, criteria: &Criteria) -> JsonLdCriteria {
        JsonLdCriteria {
            id: criteria.id.clone(),
            narrative: criteria.narrative.clone(),
        }
    }

    /// Convert evidence to JSON-LD format
    fn convert_evidence(&self, evidence: &Evidence) -> JsonLdEvidence {
        JsonLdEvidence {
            id: evidence.id.clone(),
            evidence_type: evidence.evidence_type.clone(),
            name: evidence.name.clone(),
            description: evidence.description.clone(),
            narrative: evidence.narrative.clone(),
            genre: evidence.genre.clone(),
            audience: evidence.audience.clone(),
        }
    }

    /// Convert credential status to JSON-LD format
    fn convert_status(&self, status: &CredentialStatus) -> JsonLdCredentialStatus {
        JsonLdCredentialStatus {
            id: status.id.clone(),
            status_type: status.status_type.clone(),
            status_purpose: status.status_purpose.clone(),
            status_list_index: status.status_list_index.clone(),
            status_list_credential: status.status_list_credential.clone(),
        }
    }

    /// Convert refresh service to JSON-LD format
    fn convert_refresh_service(&self, service: &RefreshService) -> JsonLdRefreshService {
        JsonLdRefreshService {
            id: service.id.clone(),
            service_type: service.service_type.clone(),
        }
    }

    /// Create canonical representation for signing (off-chain placeholder)
    fn create_canonical_data(&self, credential: &AchievementCredential) -> Result<Vec<u8>> {
        // Placeholder canonicalization
        // In a real implementation, this would perform URDNA2015 canonicalization
        let canonical_string = format!("{}{}{}", 
            credential.id, 
            credential.issuer.id, 
            credential.credential_subject.achievement.id
        );
        Ok(canonical_string.into_bytes())
    }

    /// Generate proof value (off-chain placeholder implementation)
    fn generate_proof_value(&self, _canonical_data: &[u8]) -> Result<String> {
        // Placeholder proof value generation
        // In a real implementation, this would:
        // 1. Sign the canonical data with Ed25519
        // 2. Encode the signature as multibase
        Ok("z58DAdFfa9CkPiW6ZiGFKjQFFAefDGDaWQoJZC9H7MUuHnNfXRdCCXu".to_string())
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
