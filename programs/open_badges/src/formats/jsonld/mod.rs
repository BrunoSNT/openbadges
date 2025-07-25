//! JSON-LD proof format implementation for Open Badges 3.0
//! 
//! This module provides JSON-LD with embedded Data Integrity Proofs
//! for Open Badges credentials according to the W3C standards.

pub mod builder;
pub mod verifier;

pub use builder::*;
pub use verifier::*;

use serde::{Deserialize, Serialize};

/// JSON-LD Data Integrity Proof
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonLdProof {
    /// Proof type (DataIntegrityProof for OB 3.0)
    #[serde(rename = "type")]
    pub proof_type: String,
    /// Cryptographic suite used (eddsa-2022 for Solana)
    pub cryptosuite: String,
    /// Creation timestamp (ISO 8601)
    pub created: String,
    /// Verification method (DID with key fragment)
    #[serde(rename = "verificationMethod")]
    pub verification_method: String,
    /// Purpose of the proof (assertionMethod for badges)
    #[serde(rename = "proofPurpose")]
    pub proof_purpose: String,
    /// Proof value (multibase-encoded signature)
    #[serde(rename = "proofValue")]
    pub proof_value: String,
    /// Challenge for anti-replay - optional
    #[serde(skip_serializing_if = "Option::is_none")]
    pub challenge: Option<String>,
    /// Domain for verification - optional
    #[serde(skip_serializing_if = "Option::is_none")]
    pub domain: Option<String>,
}

/// JSON-LD Verifiable Credential with embedded proof
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonLdCredential {
    /// JSON-LD context
    #[serde(rename = "@context")]
    pub context: Vec<String>,
    /// Credential ID
    pub id: String,
    /// Credential types
    #[serde(rename = "type")]
    pub credential_type: Vec<String>,
    /// Issuer information
    pub issuer: JsonLdIssuer,
    /// Valid from timestamp
    #[serde(rename = "validFrom")]
    pub valid_from: String,
    /// Valid until timestamp (optional)
    #[serde(rename = "validUntil", skip_serializing_if = "Option::is_none")]
    pub valid_until: Option<String>,
    /// Credential subject
    #[serde(rename = "credentialSubject")]
    pub credential_subject: JsonLdCredentialSubject,
    /// Evidence (optional)
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub evidence: Vec<JsonLdEvidence>,
    /// Credential status (optional)
    #[serde(rename = "credentialStatus", skip_serializing_if = "Option::is_none")]
    pub credential_status: Option<JsonLdCredentialStatus>,
    /// Refresh service (optional)
    #[serde(rename = "refreshService", skip_serializing_if = "Option::is_none")]
    pub refresh_service: Option<JsonLdRefreshService>,
    /// Embedded cryptographic proof
    pub proof: JsonLdProof,
}

/// JSON-LD Issuer representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonLdIssuer {
    pub id: String,
    #[serde(rename = "type")]
    pub issuer_type: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
}

/// JSON-LD Credential Subject representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonLdCredentialSubject {
    pub id: String,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub subject_type: Option<String>,
    pub achievement: JsonLdAchievement,
}

/// JSON-LD Achievement representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonLdAchievement {
    pub id: String,
    #[serde(rename = "type")]
    pub achievement_type: Vec<String>,
    pub name: String,
    pub description: String,
    pub criteria: JsonLdCriteria,
    pub image: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub alignment: Vec<JsonLdAlignment>,
}

/// JSON-LD Criteria representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonLdCriteria {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub narrative: String,
}

/// JSON-LD Alignment representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonLdAlignment {
    #[serde(rename = "targetName")]
    pub target_name: String,
    #[serde(rename = "targetUrl")]
    pub target_url: String,
    #[serde(rename = "targetDescription", skip_serializing_if = "Option::is_none")]
    pub target_description: Option<String>,
}

/// JSON-LD Evidence representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonLdEvidence {
    pub id: String,
    #[serde(rename = "type")]
    pub evidence_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub narrative: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub genre: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub audience: Option<String>,
}

/// JSON-LD Credential Status representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonLdCredentialStatus {
    pub id: String,
    #[serde(rename = "type")]
    pub status_type: String,
    #[serde(rename = "statusListIndex", skip_serializing_if = "Option::is_none")]
    pub status_list_index: Option<String>,
    #[serde(rename = "statusListCredential", skip_serializing_if = "Option::is_none")]
    pub status_list_credential: Option<String>,
}

/// JSON-LD Refresh Service representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonLdRefreshService {
    pub id: String,
    #[serde(rename = "type")]
    pub service_type: String,
}
