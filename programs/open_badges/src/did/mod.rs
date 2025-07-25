//! DID (Decentralized Identifier) resolution for Open Badges 3.0
//! 
//! This module provides universal DID resolution supporting multiple DID methods
//! including did:sol (Solana), did:key, and did:web.

pub mod resolver;
pub mod methods;

pub use resolver::*;
pub use methods::*;

use anchor_lang::prelude::*;
use serde::{Deserialize, Serialize};

/// Supported DID methods
#[derive(Debug, Clone, PartialEq)]
pub enum DidMethod {
    /// Solana DID method (did:sol:) - Official Identity.com specification
    Sol,
    /// Key-based DID method (did:key:)
    Key,
    /// Web DID method (did:web:)
    Web,
    /// Open Badges Solana method (did:ob-sol:) - Custom for Open Badges
    ObSol,
}

/// DID Document structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DidDocument {
    /// DID identifier
    pub id: String,
    /// Context for JSON-LD processing
    #[serde(rename = "@context")]
    pub context: Vec<String>,
    /// Verification methods (public keys)
    #[serde(rename = "verificationMethod")]
    pub verification_method: Vec<VerificationMethod>,
    /// Authentication methods
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub authentication: Vec<String>,
    /// Assertion methods (for credential signing)
    #[serde(rename = "assertionMethod", skip_serializing_if = "Vec::is_empty")]
    pub assertion_method: Vec<String>,
    /// Key agreement methods
    #[serde(rename = "keyAgreement", skip_serializing_if = "Vec::is_empty")]
    pub key_agreement: Vec<String>,
    /// Service endpoints
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub service: Vec<ServiceEndpoint>,
}

/// Verification method (public key) in DID document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationMethod {
    /// Verification method ID
    pub id: String,
    /// Key type
    #[serde(rename = "type")]
    pub key_type: String,
    /// DID controller
    pub controller: String,
    /// Public key in multibase format
    #[serde(rename = "publicKeyMultibase", skip_serializing_if = "Option::is_none")]
    pub public_key_multibase: Option<String>,
    /// Public key in JWK format
    #[serde(rename = "publicKeyJwk", skip_serializing_if = "Option::is_none")]
    pub public_key_jwk: Option<JsonWebKey>,
}

/// JSON Web Key representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonWebKey {
    /// Key type (e.g., "OKP" for Ed25519)
    pub kty: String,
    /// Curve (e.g., "Ed25519")
    pub crv: String,
    /// X coordinate (base64url encoded)
    pub x: String,
    /// Key use (optional)
    #[serde(rename = "use", skip_serializing_if = "Option::is_none")]
    pub key_use: Option<String>,
    /// Key operations (optional)
    #[serde(rename = "key_ops", skip_serializing_if = "Vec::is_empty")]
    pub key_ops: Vec<String>,
}

/// Service endpoint in DID document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceEndpoint {
    /// Service ID
    pub id: String,
    /// Service type
    #[serde(rename = "type")]
    pub service_type: String,
    /// Service endpoint URL
    #[serde(rename = "serviceEndpoint")]
    pub service_endpoint: String,
}

/// DID URL components
#[derive(Debug, Clone)]
pub struct DidUrl {
    /// Base DID
    pub did: String,
    /// DID method
    pub method: DidMethod,
    /// Method-specific identifier
    pub method_specific_id: String,
    /// Path component (optional)
    pub path: Option<String>,
    /// Query component (optional)
    pub query: Option<String>,
    /// Fragment component (optional)
    pub fragment: Option<String>,
}

impl DidUrl {
    /// Parse a DID URL string
    pub fn parse(did_url: &str) -> Result<Self> {
        if !did_url.starts_with("did:") {
            return Err(error!(crate::common::errors::ValidationError::InvalidDid));
        }
        
        // Split on fragment first
        let (did_part, fragment) = if let Some(pos) = did_url.find('#') {
            (did_url[..pos].to_string(), Some(did_url[pos + 1..].to_string()))
        } else {
            (did_url.to_string(), None)
        };
        
        // Split on query
        let (did_part, query) = if let Some(pos) = did_part.find('?') {
            (did_part[..pos].to_string(), Some(did_part[pos + 1..].to_string()))
        } else {
            (did_part, None)
        };
        
        // Split on path
        let parts: Vec<&str> = did_part.split(':').collect();
        if parts.len() < 3 {
            return Err(error!(crate::common::errors::ValidationError::InvalidDid));
        }
        
        let method = match parts[1] {
            "sol" => DidMethod::Sol,
            "key" => DidMethod::Key,
            "web" => DidMethod::Web,
            "ob-sol" => DidMethod::ObSol,
            _ => return Err(error!(crate::common::errors::ValidationError::UnsupportedDidMethod)),
        };
        
        let method_specific_id = parts[2..].join(":");
        let did = format!("did:{}:{}", parts[1], method_specific_id);
        
        Ok(Self {
            did,
            method,
            method_specific_id,
            path: None, // Simplified for now
            query,
            fragment,
        })
    }
    
    /// Get the full DID URL as string
    pub fn to_string(&self) -> String {
        let mut url = self.did.clone();
        
        if let Some(path) = &self.path {
            url.push('/');
            url.push_str(path);
        }
        
        if let Some(query) = &self.query {
            url.push('?');
            url.push_str(query);
        }
        
        if let Some(fragment) = &self.fragment {
            url.push('#');
            url.push_str(fragment);
        }
        
        url
    }
}
