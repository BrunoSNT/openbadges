//! Credential Status and Revocation Implementation
//! 
//! This module implements the credentialStatus property and revocation
//! mechanisms as defined in the W3C VC Data Model v2.0 and Open Badges v3.0.
//! 
//! Reference: https://www.w3.org/TR/vc-data-model-2.0/#status
//! Reference: https://www.imsglobal.org/spec/ob/v3p0/

use anchor_lang::prelude::*;
use serde::{Deserialize, Serialize};
use crate::common::errors::ValidationError;

/// Credential Status as per W3C VC Data Model v2.0 Section 4.9
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CredentialStatus {
    /// Unique identifier for the credential status
    pub id: String,
    
    /// Type of credential status mechanism
    /// Common types: "RevocationList2020", "StatusList2021"
    pub status_type: String,
    
    /// Purpose of the status check (revocation, suspension, etc.)
    pub status_purpose: String,
    
    /// Index of this credential in the status list
    pub status_list_index: u32,
    
    /// URL to the status list credential
    pub status_list_credential: String,
}

/// Revocation List Entry
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RevocationEntry {
    /// Credential ID that was revoked
    pub credential_id: String,
    
    /// Timestamp when revocation occurred
    pub revoked_at: String,
    
    /// Reason for revocation
    pub reason: Option<String>,
    
    /// Issuer who performed the revocation
    pub revoked_by: String,
    
    /// Status of the revocation (active, pending, etc.)
    pub status: RevocationStatus,
}

/// Status of a revocation entry
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum RevocationStatus {
    /// Credential is revoked and invalid
    Revoked,
    
    /// Credential is temporarily suspended
    Suspended,
    
    /// Credential is active and valid
    Active,
    
    /// Revocation is pending review
    Pending,
}

/// Status List Credential as per StatusList2021 specification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StatusListCredential {
    /// JSON-LD context
    pub context: Vec<String>,
    
    /// Unique identifier for the status list
    pub id: String,
    
    /// Type - must include "VerifiableCredential" and "StatusList2021Credential"
    pub credential_type: Vec<String>,
    
    /// Issuer of the status list
    pub issuer: String,
    
    /// When the status list was issued
    pub issued: String,
    
    /// Subject containing the status list
    pub credential_subject: StatusListSubject,
    
    /// Proof for the status list
    pub proof: Option<crate::proof::DataIntegrityProof>,
}

/// Status List Subject containing the actual status data
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StatusListSubject {
    /// Type - must be "StatusList2021"
    pub subject_type: String,
    
    /// Purpose of this status list
    pub status_purpose: String,
    
    /// Encoded status list (compressed bitstring)
    pub encoded_list: String,
}

/// Account structure for storing revocation lists on-chain
#[account]
pub struct RevocationList {
    /// Authority who can manage this revocation list
    pub authority: Pubkey,
    
    /// Unique identifier for this revocation list
    pub list_id: String,
    
    /// Maximum number of credentials this list can handle
    pub capacity: u32,
    
    /// Current number of credentials in the list
    pub current_size: u32,
    
    /// Bitfield representing revocation status (1 = revoked, 0 = active)
    /// Each bit represents one credential's status
    pub status_bits: Vec<u8>,
    
    /// Metadata about the revocation list
    pub metadata: RevocationListMetadata,
    
    /// Creation timestamp
    pub created_at: String,
    
    /// Last update timestamp
    pub updated_at: String,
}

/// Metadata for a revocation list
#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct RevocationListMetadata {
    /// Human-readable name for this list
    pub name: String,
    
    /// Description of the list's purpose
    pub description: String,
    
    /// URL where the status list credential can be accessed
    pub status_list_url: String,
    
    /// Version of the status list format
    pub version: String,
}

impl RevocationList {
    /// Initialize a new revocation list
    pub fn new(
        authority: Pubkey,
        list_id: String,
        capacity: u32,
        name: String,
        description: String,
        status_list_url: String,
        current_timestamp: String,
    ) -> Result<Self> {
        // Calculate required bytes for bitfield (1 bit per credential)
        let required_bytes = (capacity + 7) / 8; // Round up to nearest byte
        
        Ok(Self {
            authority,
            list_id,
            capacity,
            current_size: 0,
            status_bits: vec![0u8; required_bytes as usize],
            metadata: RevocationListMetadata {
                name,
                description,
                status_list_url,
                version: "1.0".to_string(),
            },
            created_at: current_timestamp.clone(),
            updated_at: current_timestamp,
        })
    }
    
    /// Add a credential to the revocation list
    pub fn add_credential(&mut self, index: u32, current_timestamp: String) -> Result<()> {
        if index >= self.capacity {
            return Err(error!(ValidationError::IndexOutOfBounds));
        }
        
        // Initially, credentials are added as active (bit = 0)
        self.current_size += 1;
        self.updated_at = current_timestamp;
        
        msg!("Added credential at index {} to revocation list {}", index, self.list_id);
        Ok(())
    }
    
    /// Revoke a credential by setting its bit to 1
    pub fn revoke_credential(&mut self, index: u32, current_timestamp: String) -> Result<()> {
        if index >= self.capacity {
            return Err(error!(ValidationError::IndexOutOfBounds));
        }
        
        let byte_index = (index / 8) as usize;
        let bit_index = index % 8;
        
        if byte_index >= self.status_bits.len() {
            return Err(error!(ValidationError::IndexOutOfBounds));
        }
        
        // Set the bit to 1 (revoked)
        self.status_bits[byte_index] |= 1 << bit_index;
        self.updated_at = current_timestamp;
        
        msg!("Revoked credential at index {} in list {}", index, self.list_id);
        Ok(())
    }
    
    /// Reactivate a credential by setting its bit to 0
    pub fn reactivate_credential(&mut self, index: u32, current_timestamp: String) -> Result<()> {
        if index >= self.capacity {
            return Err(error!(ValidationError::IndexOutOfBounds));
        }
        
        let byte_index = (index / 8) as usize;
        let bit_index = index % 8;
        
        if byte_index >= self.status_bits.len() {
            return Err(error!(ValidationError::IndexOutOfBounds));
        }
        
        // Set the bit to 0 (active)
        self.status_bits[byte_index] &= !(1 << bit_index);
        self.updated_at = current_timestamp;
        
        msg!("Reactivated credential at index {} in list {}", index, self.list_id);
        Ok(())
    }
    
    /// Check if a credential is revoked
    pub fn is_revoked(&self, index: u32) -> Result<bool> {
        if index >= self.capacity {
            return Err(error!(ValidationError::IndexOutOfBounds));
        }
        
        let byte_index = (index / 8) as usize;
        let bit_index = index % 8;
        
        if byte_index >= self.status_bits.len() {
            return Err(error!(ValidationError::IndexOutOfBounds));
        }
        
        let is_revoked = (self.status_bits[byte_index] & (1 << bit_index)) != 0;
        Ok(is_revoked)
    }
    
    /// Get the encoded status list for the StatusList2021 credential
    pub fn get_encoded_list(&self) -> String {
        // In a full implementation, this would use GZIP compression
        // For simplicity, we'll use hex encoding
        hex::encode(&self.status_bits)
    }
    
    /// Generate a complete StatusList2021 credential
    pub fn generate_status_list_credential(
        &self,
        issuer_did: &str,
        current_timestamp: &str,
    ) -> Result<StatusListCredential> {
        Ok(StatusListCredential {
            context: vec![
                "https://www.w3.org/ns/credentials/v2".to_string(),
                "https://w3id.org/vc/status-list/2021/v1".to_string(),
            ],
            id: format!("{}/status-lists/{}", issuer_did, self.list_id),
            credential_type: vec![
                "VerifiableCredential".to_string(),
                "StatusList2021Credential".to_string(),
            ],
            issuer: issuer_did.to_string(),
            issued: current_timestamp.to_string(),
            credential_subject: StatusListSubject {
                subject_type: "StatusList2021".to_string(),
                status_purpose: "revocation".to_string(),
                encoded_list: self.get_encoded_list(),
            },
            proof: None, // Would be added during signing
        })
    }
}

/// Batch revocation operations for efficiency
#[derive(Clone, Debug)]
pub struct BatchRevocationOperation {
    /// List of credential indices to revoke
    pub indices_to_revoke: Vec<u32>,
    
    /// List of credential indices to reactivate
    pub indices_to_reactivate: Vec<u32>,
    
    /// Reason for the batch operation
    pub reason: Option<String>,
    
    /// Timestamp for the operation
    pub timestamp: String,
}

impl RevocationList {
    /// Perform batch revocation operations
    pub fn batch_operation(&mut self, operation: BatchRevocationOperation) -> Result<()> {
        let revoke_count = operation.indices_to_revoke.len();
        let reactivate_count = operation.indices_to_reactivate.len();
        
        // Revoke credentials
        for index in &operation.indices_to_revoke {
            self.revoke_credential(*index, operation.timestamp.clone())?;
        }
        
        // Reactivate credentials
        for index in &operation.indices_to_reactivate {
            self.reactivate_credential(*index, operation.timestamp.clone())?;
        }
        
        msg!(
            "Batch operation completed: {} revoked, {} reactivated",
            revoke_count,
            reactivate_count
        );
        
        Ok(())
    }
}

/// Utility functions for credential status management
pub mod status_utils {
    use super::*;
    
    /// Create a credential status object for a new credential
    pub fn create_credential_status(
        credential_id: &str,
        revocation_list_id: &str,
        index: u32,
        issuer_did: &str,
    ) -> CredentialStatus {
        CredentialStatus {
            id: format!("{}#credential-status-{}", credential_id, index),
            status_type: "StatusList2021Entry".to_string(),
            status_purpose: "revocation".to_string(),
            status_list_index: index,
            status_list_credential: format!("{}/status-lists/{}", issuer_did, revocation_list_id),
        }
    }
    
    /// Verify a credential's status by checking the revocation list
    pub fn verify_credential_status(
        revocation_list: &RevocationList,
        status: &CredentialStatus,
    ) -> Result<bool> {
        // Check if the credential is revoked
        let is_revoked = revocation_list.is_revoked(status.status_list_index)?;
        
        // For revocation purpose, credential is valid if NOT revoked
        Ok(!is_revoked)
    }
    
    /// Parse encoded status list from external sources
    pub fn parse_encoded_list(encoded: &str) -> Result<Vec<u8>> {
        // In a full implementation, this would handle GZIP decompression
        hex::decode(encoded)
            .map_err(|_| error!(ValidationError::InvalidEncodedList))
    }
}

/// Error types specific to credential status
#[error_code]
pub enum StatusError {
    #[msg("Credential index is out of bounds")]
    IndexOutOfBounds,
    
    #[msg("Invalid encoded status list format")]
    InvalidEncodedList,
    
    #[msg("Unauthorized revocation attempt")]
    UnauthorizedRevocation,
    
    #[msg("Status list is at capacity")]
    StatusListFull,
    
    #[msg("Invalid status list credential")]
    InvalidStatusListCredential,
}
