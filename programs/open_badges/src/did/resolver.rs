//! Universal DID resolver supporting multiple DID methods

use anchor_lang::prelude::*;
use crate::did::{DidDocument, DidUrl, DidMethod};
use crate::did::methods::{SolanaDidResolver, KeyDidResolver, WebDidResolver};

/// Universal DID resolver
pub struct DidResolver {
    /// Solana DID resolver
    sol_resolver: SolanaDidResolver,
    /// Key DID resolver
    key_resolver: KeyDidResolver,
    /// Web DID resolver
    web_resolver: WebDidResolver,
}

impl DidResolver {
    /// Create a new universal DID resolver
    pub fn new() -> Self {
        Self {
            sol_resolver: SolanaDidResolver::new(),
            key_resolver: KeyDidResolver::new(),
            web_resolver: WebDidResolver::new(),
        }
    }
    
    /// Resolve a DID to a DID document
    pub fn resolve(&self, did: &str) -> Result<DidDocument> {
        let did_url = DidUrl::parse(did)?;
        
        match did_url.method {
            DidMethod::Sol => self.sol_resolver.resolve(&did_url),
            DidMethod::Key => self.key_resolver.resolve(&did_url),
            DidMethod::Web => self.web_resolver.resolve(&did_url),
            DidMethod::ObSol => self.sol_resolver.resolve(&did_url), // Use sol resolver for ob-sol method
        }
    }
    
    /// Resolve a verification method to get public key
    pub fn resolve_verification_method(&self, verification_method: &str) -> Result<Vec<u8>> {
        let did_url = DidUrl::parse(verification_method)?;
        
        // Resolve the DID document
        let did_doc = self.resolve(&did_url.did)?;
        
        // Find the verification method
        let fragment = did_url.fragment.as_ref()
            .ok_or_else(|| error!(crate::common::errors::ValidationError::MissingKeyFragment))?;
        
        let vm_id = format!("{}#{}", did_url.did, fragment);
        
        for vm in &did_doc.verification_method {
            if vm.id == vm_id {
                return self.extract_public_key(vm);
            }
        }
        
        Err(error!(crate::common::errors::ValidationError::VerificationMethodNotFound))
    }
    
    /// Extract public key bytes from verification method
    fn extract_public_key(&self, vm: &crate::did::VerificationMethod) -> Result<Vec<u8>> {
        if let Some(public_key_multibase) = &vm.public_key_multibase {
            return self.decode_multibase_key(public_key_multibase);
        }
        
        if let Some(public_key_jwk) = &vm.public_key_jwk {
            return self.decode_jwk_key(public_key_jwk);
        }
        
        Err(error!(crate::common::errors::ValidationError::NoPublicKeyFound))
    }
    
    /// Decode multibase-encoded public key
    fn decode_multibase_key(&self, multibase_key: &str) -> Result<Vec<u8>> {
        // Placeholder multibase decoding
        // In a real implementation, this would decode the multibase string
        if multibase_key.starts_with('z') {
            // Assume base58btc encoding
            Ok(vec![0u8; 32]) // Placeholder Ed25519 public key
        } else {
            Err(error!(crate::common::errors::ValidationError::UnsupportedKeyEncoding))
        }
    }
    
    /// Decode JWK public key
    fn decode_jwk_key(&self, jwk: &crate::did::JsonWebKey) -> Result<Vec<u8>> {
        if jwk.kty == "OKP" && jwk.crv == "Ed25519" {
            // Decode base64url x coordinate
            // Placeholder decoding
            Ok(vec![0u8; 32]) // Placeholder Ed25519 public key
        } else {
            Err(error!(crate::common::errors::ValidationError::UnsupportedKeyType))
        }
    }
}

impl Default for DidResolver {
    fn default() -> Self {
        Self::new()
    }
}

/// Global DID resolver instance
pub fn resolve_did(did: &str) -> Result<DidDocument> {
    let resolver = DidResolver::new();
    resolver.resolve(did)
}

/// Resolve verification method to public key
pub fn resolve_verification_method(verification_method: &str) -> Result<Vec<u8>> {
    let resolver = DidResolver::new();
    resolver.resolve_verification_method(verification_method)
}
