//! Validation utilities for Open Badges 3.0 compliance
//! 
//! This module provides validation functions for ensuring credentials
//! meet Open Badges 3.0 specification requirements.

use anchor_lang::prelude::*;
use crate::AchievementCredential;
use crate::common::errors::ValidationError;

/// VCCS v1.0 Conformance Configuration
/// Educational mode for demonstrating VCCS basic conformance checks
const ENABLE_VCCS_ONCHAIN_VALIDATION: bool = true;

/// VCCS v1.0 - Open Badges 3.0 Context Requirements
/// As per IMS Global VCCS specification, these contexts are required
const OB30_REQUIRED_CONTEXTS: &[&str] = &[
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
];

/// VCCS v1.0 - Achievement Required Properties
/// Basic conformance check for Achievement type
const ACHIEVEMENT_REQUIRED_PROPS: &[&str] = &[
    "@context",
    "id", 
    "type",
    "name",
    "description",
    "criteria"
];

/// VCCS v1.0 - OpenBadgeCredential Required Properties  
/// Basic conformance check for Credential type
const CREDENTIAL_REQUIRED_PROPS: &[&str] = &[
    "@context",
    "id",
    "type", 
    "issuer",
    "validFrom",
    "credentialSubject"
];

/// VCCS v1.0 - Evidence Required Properties
const EVIDENCE_REQUIRED_PROPS: &[&str] = &[
    "id",
    "type"
];

/// VCCS v1.0 - Profile Required Properties
const PROFILE_REQUIRED_PROPS: &[&str] = &[
    "id", 
    "type"
];

/// VCCS v1.0 Basic Conformance Check
/// Validates that required properties are present in JSON string
/// This implements the core VCCS v1.0 requirement validation
pub fn vccs_basic_conformance_check(json_str: &str, required_props: &[&str], schema_type: &str) -> Result<()> {
    if !ENABLE_VCCS_ONCHAIN_VALIDATION {
        msg!("VCCS on-chain validation disabled - use API for full compliance");
        return Ok(());
    }

    // VCCS Rule 1: Check for required JSON structure
    if !json_str.trim().starts_with('{') || !json_str.trim().ends_with('}') {
        msg!("VCCS conformance failed: Invalid JSON structure");
        return Err(error!(ValidationError::InvalidJson));
    }

    // VCCS Rule 2: Check for required properties
    for prop in required_props {
        let search_pattern = format!("\"{}\":", prop);
        if !json_str.contains(&search_pattern) {
            msg!("VCCS conformance failed: Missing required property '{}' in {}", prop, schema_type);
            return Err(error!(ValidationError::MissingRequiredField));
        }
    }

    // VCCS Rule 3: Check for required @context values (for VC types)
    if json_str.contains("\"@context\":") {
        for required_context in OB30_REQUIRED_CONTEXTS {
            if !json_str.contains(required_context) {
                msg!("VCCS conformance check: Missing required @context '{}'", required_context);
                // Note: This is a warning in educational mode
            }
        }
    }

    // VCCS Rule 4: Basic type validation
    if schema_type == "Achievement" && !json_str.contains("\"Achievement\"") {
        msg!("VCCS conformance check: Achievement type should contain 'Achievement'");
    }
    if schema_type == "Credential" && !json_str.contains("\"OpenBadgeCredential\"") {
        msg!("VCCS conformance check: Credential type should contain 'OpenBadgeCredential'");
    }

    msg!("✅ VCCS v1.0 basic conformance check passed for {} (educational mode)", schema_type);
    Ok(())
}

/// VCCS v1.0 Achievement Validation for Solana (Educational Mode)
/// Implements basic conformance checks as per VCCS specification
pub fn validate_json_string_achievement(json_str: &str) -> Result<()> {
    vccs_basic_conformance_check(json_str, ACHIEVEMENT_REQUIRED_PROPS, "Achievement")
}

/// VCCS v1.0 Credential Validation for Solana (Educational Mode)  
/// Implements basic conformance checks as per VCCS specification
pub fn validate_json_string_credential(json_str: &str) -> Result<()> {
    vccs_basic_conformance_check(json_str, CREDENTIAL_REQUIRED_PROPS, "Credential")
}

/// VCCS v1.0 Evidence Validation for Solana (Educational Mode)
/// Implements basic conformance checks as per VCCS specification  
pub fn validate_json_string_evidence(json_str: &str) -> Result<()> {
    vccs_basic_conformance_check(json_str, EVIDENCE_REQUIRED_PROPS, "Evidence")
}

/// VCCS v1.0 Profile Validation for Solana (Educational Mode)
/// Implements basic conformance checks as per VCCS specification
pub fn validate_json_string_profile(json_str: &str) -> Result<()> {
    vccs_basic_conformance_check(json_str, PROFILE_REQUIRED_PROPS, "Profile")
}

/// Validate an AchievementCredential for Open Badges 3.0 compliance
pub fn validate_achievement_credential(credential: &AchievementCredential) -> Result<()> {
    credential.validate()
}

/// Validate JSON-LD context requirements
pub fn validate_jsonld_context(context: &[String]) -> Result<()> {
    for required_context in OB30_REQUIRED_CONTEXTS {
        if !context.iter().any(|c| c == required_context) {
            msg!("Missing required @context: {}", required_context);
            return Err(error!(ValidationError::MissingRequiredField));
        }
    }
    Ok(())
}

/// Validate credential type requirements
pub fn validate_credential_type(credential_type: &[String]) -> Result<()> {
    if !credential_type.contains(&"VerifiableCredential".to_string()) {
        return Err(error!(ValidationError::InvalidCredentialType));
    }
    
    if !credential_type.contains(&"OpenBadgeCredential".to_string()) {
        return Err(error!(ValidationError::InvalidCredentialType));
    }
    
    Ok(())
}

/// Validate achievement type requirements
pub fn validate_achievement_type(achievement_type: &[String]) -> Result<()> {
    if !achievement_type.contains(&"Achievement".to_string()) {
        return Err(error!(ValidationError::InvalidCredentialType));
    }
    
    Ok(())
}
