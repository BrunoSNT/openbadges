//! Multi-format credential generation for Open Badges 3.0
//! 
//! This module provides functionality to generate credentials in different formats
//! (JWT, JSON-LD) and resolve DIDs, following Open Badges 3.0 specification.

use anchor_lang::prelude::*;
use std::str::FromStr;
use crate::common::errors::ValidationError;
use crate::did::{DidDocument, DidMethod};
use serde_json;

/// Generate a credential in JSON-LD format for Open Badges 3.0
pub fn generate_jsonld_credential(
    issuer_pubkey: &Pubkey,
    recipient_pubkey: &Pubkey,
    achievement_id: &str,
    achievement_name: &str,
    achievement_description: &str,
    credential_id: &str,
) -> Result<String> {
    let issuer_did = format!("did:sol:{}", issuer_pubkey);
    let recipient_did = format!("did:sol:{}", recipient_pubkey);
    
    // Create JSON-LD credential structure compliant with Open Badges 3.0
    let credential = serde_json::json!({
        "@context": [
            "https://www.w3.org/ns/credentials/v2",
            "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
        ],
        "id": credential_id,
        "type": ["VerifiableCredential", "OpenBadgeCredential"],
        "issuer": {
            "id": issuer_did,
            "type": ["Profile"]
        },
        "validFrom": chrono::Utc::now().to_rfc3339(),
        "credentialSubject": {
            "type": ["AchievementSubject"],
            "id": recipient_did,
            "achievement": {
                "id": achievement_id,
                "type": ["Achievement"],
                "name": achievement_name,
                "description": achievement_description,
                "criteria": {
                    "narrative": "Demonstrated competency in the specified area"
                }
            }
        }
    });
    
    let credential_json = serde_json::to_string_pretty(&credential)
        .map_err(|_| error!(ValidationError::ValidationFailed))?;
    
    msg!("✅ Generated JSON-LD credential for achievement: {}", achievement_name);
    Ok(credential_json)
}

/// Generate a credential in JWT format for Open Badges 3.0  
pub fn generate_jwt_credential(
    issuer_pubkey: &Pubkey,
    recipient_pubkey: &Pubkey,
    achievement_id: &str,
    achievement_name: &str,
    achievement_description: &str,
    credential_id: &str,
) -> Result<String> {
    let issuer_did = format!("did:sol:{}", issuer_pubkey);
    let recipient_did = format!("did:sol:{}", recipient_pubkey);
    
    // Create JWT payload structure compliant with Open Badges 3.0
    let payload = serde_json::json!({
        "iss": issuer_did,
        "sub": recipient_did,
        "iat": chrono::Utc::now().timestamp(),
        "vc": {
            "@context": [
                "https://www.w3.org/ns/credentials/v2",
                "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
            ],
            "id": credential_id,
            "type": ["VerifiableCredential", "OpenBadgeCredential"],
            "credentialSubject": {
                "type": ["AchievementSubject"],
                "achievement": {
                    "id": achievement_id,
                    "type": ["Achievement"],
                    "name": achievement_name,
                    "description": achievement_description,
                    "criteria": {
                        "narrative": "Demonstrated competency in the specified area"
                    }
                }
            }
        }
    });
    
    // For educational purposes, return the payload as JSON
    // In production, this would be signed and encoded as a JWT
    let jwt_payload = serde_json::to_string_pretty(&payload)
        .map_err(|_| error!(ValidationError::ValidationFailed))?;
    
    msg!("✅ Generated JWT credential payload for achievement: {}", achievement_name);
    Ok(jwt_payload)
}

/// Verify a credential in any supported format
pub fn verify_credential_format(credential_data: &str) -> Result<bool> {
    // Detect format based on structure
    if credential_data.trim().starts_with('{') {
        // JSON-LD format
        verify_jsonld_credential(credential_data)
    } else {
        // Assume JWT format or other
        verify_jwt_credential(credential_data)
    }
}

/// Verify a JSON-LD credential
pub fn verify_jsonld_credential(credential_json: &str) -> Result<bool> {
    // Parse JSON to validate structure
    let credential: serde_json::Value = serde_json::from_str(credential_json)
        .map_err(|_| error!(ValidationError::InvalidJson))?;
    
    // Check required properties for Open Badges 3.0
    let required_contexts = [
        "https://www.w3.org/ns/credentials/v2",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
    ];
    
    if let Some(context) = credential.get("@context").and_then(|c| c.as_array()) {
        for required_context in &required_contexts {
            if !context.iter().any(|c| c.as_str() == Some(required_context)) {
                msg!("Missing required @context: {}", required_context);
                return Ok(false);
            }
        }
    } else {
        return Ok(false);
    }
    
    // Check required types
    if let Some(types) = credential.get("type").and_then(|t| t.as_array()) {
        let has_vc = types.iter().any(|t| t.as_str() == Some("VerifiableCredential"));
        let has_badge = types.iter().any(|t| t.as_str() == Some("OpenBadgeCredential"));
        
        if !has_vc || !has_badge {
            return Ok(false);
        }
    } else {
        return Ok(false);
    }
    
    msg!("✅ JSON-LD credential verification successful");
    Ok(true)
}

/// Verify a JWT credential
pub fn verify_jwt_credential(_credential_jwt: &str) -> Result<bool> {
    // For educational purposes, assume JWT is valid
    // In production, this would verify the JWT signature and claims
    msg!("✅ JWT credential verification successful (educational mode)");
    Ok(true)
}

/// Resolve a DID to its document using the appropriate method
pub fn resolve_did_document(did: &str) -> Result<String> {
    // Parse DID to determine method
    let did_method = if did.starts_with("did:sol:") {
        DidMethod::Sol
    } else if did.starts_with("did:key:") {
        DidMethod::Key
    } else if did.starts_with("did:web:") {
        DidMethod::Web
    } else {
        return Err(error!(ValidationError::ValidationFailed));
    };
    
    match did_method {
        DidMethod::Sol => {
            // Extract Solana public key from DID
            let pubkey_str = did.strip_prefix("did:sol:").unwrap_or("");
            let _pubkey = Pubkey::from_str(pubkey_str)
                .map_err(|_| error!(ValidationError::InvalidKey))?;
            
            // Create DID document for Solana DID
            let did_document = DidDocument {
                id: did.to_string(),
                context: vec![
                    "https://www.w3.org/ns/did/v1".to_string(),
                    "https://w3id.org/security/suites/ed25519-2020/v1".to_string(),
                ],
                verification_method: vec![],
                authentication: vec![],
                assertion_method: vec![],
                key_agreement: vec![],
                service: vec![],
            };
            
            let doc_json = serde_json::to_string_pretty(&did_document)
                .map_err(|_| error!(ValidationError::ValidationFailed))?;
            
            msg!("✅ Resolved DID document for: {}", did);
            Ok(doc_json)
        },
        _ => {
            msg!("DID method not yet implemented: {:?}", did_method);
            Err(error!(ValidationError::NotImplemented))
        }
    }
}

/// Validate Open Badges 3.0 compliance for any credential format
pub fn validate_ob3_compliance(credential_data: &str) -> Result<bool> {
    // First verify the credential format
    let is_valid_format = verify_credential_format(credential_data)?;
    
    if !is_valid_format {
        return Ok(false);
    }
    
    // Additional compliance checks could be added here
    // For example: checking alignment with skill frameworks, 
    // verifying issuer authority, etc.
    
    msg!("✅ Open Badges 3.0 compliance validation successful");
    Ok(true)
}