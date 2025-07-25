//! JWT (JSON Web Token) proof format implementation for Open Badges 3.0
//! 
//! This module provides complete JWT/JWS compact serialization support for
//! Open Badges credentials according to the VC-JWT specification and RFC 7519.
//! 
//! Reference: https://www.w3.org/TR/vc-jose-cose/
//! Reference: https://tools.ietf.org/html/rfc7519

pub mod builder;
pub mod verifier;

pub use builder::*;
pub use verifier::*;

use serde::{Deserialize, Serialize};
use crate::common::errors::ValidationError;
use anchor_lang::prelude::*;

/// JWT Header for Open Badges credentials per RFC 7515
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtHeader {
    /// Algorithm used for signing - "EdDSA" for Ed25519 on Solana
    pub alg: String,
    
    /// Token type - always "JWT"
    pub typ: String,
    
    /// Key identifier - DID URL with key fragment
    #[serde(skip_serializing_if = "Option::is_none")]
    pub kid: Option<String>,
    
    /// Content type - "vc" for Verifiable Credentials
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cty: Option<String>,
}

/// JWT Payload for Open Badges credentials per VC-JWT specification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtPayload {
    /// Issuer - DID of the credential issuer
    pub iss: String,
    
    /// Subject - DID of the credential subject (recipient)
    pub sub: String,
    
    /// Issued at - Unix timestamp when JWT was issued
    pub iat: i64,
    
    /// JWT ID - unique identifier for this JWT credential
    pub jti: String,
    
    /// Expiration time - Unix timestamp when credential expires
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exp: Option<i64>,
    
    /// Not before - Unix timestamp when credential becomes valid
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nbf: Option<i64>,
    
    /// Audience - intended audience for the credential
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aud: Option<String>,
    
    /// Embedded Verifiable Credential
    pub vc: JwtVerifiableCredential,
    
    /// Additional custom claims
    #[serde(flatten)]
    pub additional_claims: std::collections::HashMap<String, serde_json::Value>,
}

/// Verifiable Credential structure for JWT embedding per VC-JWT spec
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtVerifiableCredential {
    /// JSON-LD context - required for Open Badges 3.0
    #[serde(rename = "@context")]
    pub context: Vec<String>,
    
    /// Credential types - must include "VerifiableCredential" and "OpenBadgeCredential"
    #[serde(rename = "type")]
    pub credential_type: Vec<String>,
    
    /// Credential subject containing achievement information
    #[serde(rename = "credentialSubject")]
    pub credential_subject: JwtCredentialSubject,
    
    /// Additional properties for Open Badges 3.0
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    
    /// Evidence supporting the credential
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evidence: Option<Vec<JwtEvidence>>,
    
    /// Credential status for revocation checking
    #[serde(skip_serializing_if = "Option::is_none", rename = "credentialStatus")]
    pub credential_status: Option<JwtCredentialStatus>,
    
    /// Terms of use for the credential
    #[serde(skip_serializing_if = "Option::is_none", rename = "termsOfUse")]
    pub terms_of_use: Option<Vec<JwtTermsOfUse>>,
}

/// Credential Subject for JWT format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtCredentialSubject {
    /// Subject type - "AchievementSubject" for Open Badges
    #[serde(rename = "type")]
    pub subject_type: Vec<String>,
    
    /// Achievement information
    pub achievement: JwtAchievement,
    
    /// Additional achievement-specific information
    #[serde(skip_serializing_if = "Option::is_none")]
    pub results: Option<Vec<JwtResult>>,
    
    /// Source of the achievement
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<JwtProfile>,
}

/// Achievement structure for JWT format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtAchievement {
    /// Achievement identifier
    pub id: String,
    
    /// Achievement type
    #[serde(rename = "type")]
    pub achievement_type: Vec<String>,
    
    /// Achievement name
    pub name: String,
    
    /// Achievement description
    pub description: String,
    
    /// Criteria for earning the achievement
    pub criteria: JwtCriteria,
    
    /// Image representing the achievement
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<JwtImage>,
    
    /// Standards alignment
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alignment: Option<Vec<JwtAlignment>>,
    
    /// Tags associated with the achievement
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
}

/// Criteria structure for JWT format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtCriteria {
    /// Narrative description of the criteria
    pub narrative: String,
    
    /// URL with detailed criteria information
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
}

/// Image structure for JWT format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtImage {
    /// Image identifier
    pub id: String,
    
    /// Image type
    #[serde(rename = "type")]
    pub image_type: String,
    
    /// Caption for the image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub caption: Option<String>,
}

/// Result structure for JWT format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtResult {
    /// Result type
    #[serde(rename = "type")]
    pub result_type: Vec<String>,
    
    /// Achieved level
    #[serde(skip_serializing_if = "Option::is_none", rename = "achievedLevel")]
    pub achieved_level: Option<String>,
    
    /// Result description
    #[serde(skip_serializing_if = "Option::is_none", rename = "resultDescription")]
    pub result_description: Option<String>,
    
    /// Numeric value of the result
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
}

/// Profile structure for JWT format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtProfile {
    /// Profile identifier
    pub id: String,
    
    /// Profile type
    #[serde(rename = "type")]
    pub profile_type: Vec<String>,
    
    /// Profile name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    
    /// Profile description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    
    /// Profile URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    
    /// Profile image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<JwtImage>,
}

/// Evidence structure for JWT format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtEvidence {
    /// Evidence identifier
    pub id: String,
    
    /// Evidence type
    #[serde(rename = "type")]
    pub evidence_type: Vec<String>,
    
    /// Evidence name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    
    /// Evidence description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    
    /// Evidence genre
    #[serde(skip_serializing_if = "Option::is_none")]
    pub genre: Option<String>,
    
    /// Evidence audience
    #[serde(skip_serializing_if = "Option::is_none")]
    pub audience: Option<String>,
}

/// Credential Status for JWT format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtCredentialStatus {
    /// Status identifier
    pub id: String,
    
    /// Status type
    #[serde(rename = "type")]
    pub status_type: String,
    
    /// Status purpose
    #[serde(skip_serializing_if = "Option::is_none", rename = "statusPurpose")]
    pub status_purpose: Option<String>,
    
    /// Status list index
    #[serde(skip_serializing_if = "Option::is_none", rename = "statusListIndex")]
    pub status_list_index: Option<u32>,
    
    /// Status list credential URL
    #[serde(skip_serializing_if = "Option::is_none", rename = "statusListCredential")]
    pub status_list_credential: Option<String>,
}

/// Terms of Use for JWT format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtTermsOfUse {
    /// Terms identifier
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    
    /// Terms type
    #[serde(rename = "type")]
    pub terms_type: String,
}

/// Alignment structure for JWT format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtAlignment {
    /// Target identifier
    #[serde(skip_serializing_if = "Option::is_none", rename = "targetId")]
    pub target_id: Option<String>,
    
    /// Target name
    #[serde(skip_serializing_if = "Option::is_none", rename = "targetName")]
    pub target_name: Option<String>,
    
    /// Target framework
    #[serde(skip_serializing_if = "Option::is_none", rename = "targetFramework")]
    pub target_framework: Option<String>,
    
    /// Target code
    #[serde(skip_serializing_if = "Option::is_none", rename = "targetCode")]
    pub target_code: Option<String>,
}

/// Complete JWT structure with header, payload, and signature
#[derive(Debug, Clone)]
pub struct CompactJwt {
    /// JWT header
    pub header: JwtHeader,
    
    /// JWT payload
    pub payload: JwtPayload,
    
    /// JWT signature (raw bytes)
    pub signature: Vec<u8>,
    
    /// Compact serialization of the JWT
    pub compact: String,
}

impl CompactJwt {
    /// Create a new JWT from components
    pub fn new(
        header: JwtHeader,
        payload: JwtPayload,
        signature: Vec<u8>,
    ) -> Result<Self> {
        let compact = Self::serialize_compact(&header, &payload, &signature)?;
        
        Ok(Self {
            header,
            payload,
            signature,
            compact,
        })
    }
    
    /// Serialize JWT to compact format (header.payload.signature)
    fn serialize_compact(
        header: &JwtHeader,
        payload: &JwtPayload,
        signature: &[u8],
    ) -> Result<String> {
        // Serialize header and payload to JSON
        let header_json = serde_json::to_string(header)
            .map_err(|_| error!(ValidationError::SerializationFailed))?;
        let payload_json = serde_json::to_string(payload)
            .map_err(|_| error!(ValidationError::SerializationFailed))?;
        
        // Base64url encode components
        let header_b64 = base64_url_encode(header_json.as_bytes());
        let payload_b64 = base64_url_encode(payload_json.as_bytes());
        let signature_b64 = base64_url_encode(signature);
        
        Ok(format!("{}.{}.{}", header_b64, payload_b64, signature_b64))
    }
    
    /// Parse JWT from compact format
    pub fn parse(compact: &str) -> Result<Self> {
        let parts: Vec<&str> = compact.split('.').collect();
        if parts.len() != 3 {
            return Err(error!(ValidationError::InvalidJwtFormat));
        }
        
        // Decode components
        let header_bytes = base64_url_decode(parts[0])
            .map_err(|_| error!(ValidationError::InvalidBase64Encoding))?;
        let payload_bytes = base64_url_decode(parts[1])
            .map_err(|_| error!(ValidationError::InvalidBase64Encoding))?;
        let signature = base64_url_decode(parts[2])
            .map_err(|_| error!(ValidationError::InvalidBase64Encoding))?;
        
        // Parse JSON
        let header: JwtHeader = serde_json::from_slice(&header_bytes)
            .map_err(|_| error!(ValidationError::InvalidJson))?;
        let payload: JwtPayload = serde_json::from_slice(&payload_bytes)
            .map_err(|_| error!(ValidationError::InvalidJson))?;
        
        Ok(Self {
            header,
            payload,
            signature,
            compact: compact.to_string(),
        })
    }
    
    /// Get the signing input (header.payload) for verification
    pub fn get_signing_input(&self) -> Result<String> {
        let parts: Vec<&str> = self.compact.split('.').collect();
        if parts.len() != 3 {
            return Err(error!(ValidationError::InvalidJwtFormat));
        }
        
        Ok(format!("{}.{}", parts[0], parts[1]))
    }
}

/// Base64url encoding for JWT components
fn base64_url_encode(input: &[u8]) -> String {
    // Simplified implementation for on-chain constraints
    base64::encode(input)
        .replace('+', "-")
        .replace('/', "_")
        .trim_end_matches('=')
        .to_string()
}

/// Base64url decoding for JWT components
fn base64_url_decode(input: &str) -> std::result::Result<Vec<u8>, &'static str> {
    let mut padded = input.replace('-', "+").replace('_', "/");
    
    // Add padding if needed
    while padded.len() % 4 != 0 {
        padded.push('=');
    }
    
    base64::decode(&padded).map_err(|_| "Invalid base64 encoding")
}
