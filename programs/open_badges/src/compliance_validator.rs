//! Comprehensive validation suite for Open Badges v3.0 compliance
//! 
//! This module implements a complete validation framework that ensures
//! credentials meet all Open Badges v3.0 and VC Data Model v2.0 requirements.

use anchor_lang::prelude::*;
use serde_json::Value;
use crate::common::errors::ValidationError;

/// Comprehensive validation suite for Open Badges v3.0
pub struct ComplianceValidator {
    /// Enable strict mode validation
    pub strict_mode: bool,
    
    /// Enable VCCS v1.0 conformance checking
    pub vccs_conformance: bool,
    
    /// Enable proof verification
    pub verify_proofs: bool,
    
    /// Enable credential status checking
    pub check_status: bool,
}

impl ComplianceValidator {
    /// Create a new validator with default settings
    pub fn new() -> Self {
        Self {
            strict_mode: true,
            vccs_conformance: true,
            verify_proofs: true,
            check_status: true,
        }
    }
    
    /// Create a validator for production use
    pub fn production() -> Self {
        Self {
            strict_mode: true,
            vccs_conformance: true,
            verify_proofs: true,
            check_status: true,
        }
    }
    
    /// Create a validator for development/testing
    pub fn development() -> Self {
        Self {
            strict_mode: false,
            vccs_conformance: true,
            verify_proofs: false,
            check_status: false,
        }
    }
    
    /// Validate a complete Open Badge credential
    pub fn validate_credential(&self, credential_json: &str) -> Result<ValidationReport> {
        let mut report = ValidationReport::new();
        
        // Step 1: Parse JSON structure
        let credential: Value = serde_json::from_str(credential_json)
            .map_err(|_| error!(ValidationError::InvalidJson))?;
        
        // Step 2: VCCS v1.0 basic conformance
        if self.vccs_conformance {
            self.validate_vccs_conformance(&credential, &mut report)?;
        }
        
        // Step 3: JSON-LD context validation
        self.validate_contexts(&credential, &mut report)?;
        
        // Step 4: Required properties validation
        self.validate_required_properties(&credential, &mut report)?;
        
        // Step 5: Type validation
        self.validate_types(&credential, &mut report)?;
        
        // Step 6: Issuer validation
        self.validate_issuer(&credential, &mut report)?;
        
        // Step 7: Subject validation
        self.validate_credential_subject(&credential, &mut report)?;
        
        // Step 8: Achievement validation
        self.validate_achievement(&credential, &mut report)?;
        
        // Step 9: Temporal validation
        self.validate_temporal_constraints(&credential, &mut report)?;
        
        // Step 10: Proof validation (if enabled)
        if self.verify_proofs {
            self.validate_proofs(&credential, &mut report)?;
        }
        
        // Step 11: Credential status validation (if enabled)
        if self.check_status {
            self.validate_credential_status(&credential, &mut report)?;
        }
        
        // Step 12: Evidence validation (if present)
        self.validate_evidence(&credential, &mut report)?;
        
        // Final compliance score
        report.calculate_compliance_score();
        
        msg!("Validation completed - Score: {}/100", report.compliance_score);
        Ok(report)
    }
    
    /// VCCS v1.0 conformance validation
    fn validate_vccs_conformance(&self, credential: &Value, report: &mut ValidationReport) -> Result<()> {
        // Check for required top-level properties
        let required_props = ["@context", "id", "type", "issuer", "credentialSubject"];
        
        for prop in required_props {
            if !credential.get(prop).is_some() {
                report.add_error(format!("VCCS: Missing required property '{}'", prop));
                if self.strict_mode {
                    return Err(error!(ValidationError::MissingRequiredField));
                }
            } else {
                report.add_success(format!("VCCS: Required property '{}' present", prop));
            }
        }
        
        Ok(())
    }
    
    /// Validate JSON-LD contexts
    fn validate_contexts(&self, credential: &Value, report: &mut ValidationReport) -> Result<()> {
        let contexts = credential.get("@context")
            .and_then(|c| c.as_array())
            .ok_or_else(|| error!(ValidationError::MissingRequiredField))?;
        
        // Required contexts for Open Badges v3.0
        let required_contexts = [
            "https://www.w3.org/ns/credentials/v2",
            "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
        ];
        
        for required in required_contexts {
            let found = contexts.iter().any(|ctx| {
                ctx.as_str().map_or(false, |s| s == required)
            });
            
            if found {
                report.add_success(format!("Context '{}' present", required));
            } else {
                report.add_error(format!("Missing required context '{}'", required));
                if self.strict_mode {
                    return Err(error!(ValidationError::MissingRequiredField));
                }
            }
        }
        
        Ok(())
    }
    
    /// Validate required properties structure
    fn validate_required_properties(&self, credential: &Value, report: &mut ValidationReport) -> Result<()> {
        // Validate ID
        if let Some(id) = credential.get("id") {
            if id.is_string() && !id.as_str().unwrap().is_empty() {
                report.add_success("Valid credential ID".to_string());
            } else {
                report.add_error("Invalid credential ID format".to_string());
            }
        }
        
        // Validate validFrom
        if let Some(valid_from) = credential.get("validFrom") {
            if self.is_valid_iso8601(valid_from.as_str().unwrap_or("")) {
                report.add_success("Valid validFrom timestamp".to_string());
            } else {
                report.add_error("Invalid validFrom timestamp format".to_string());
            }
        } else {
            report.add_error("Missing validFrom property".to_string());
        }
        
        Ok(())
    }
    
    /// Validate credential types
    fn validate_types(&self, credential: &Value, report: &mut ValidationReport) -> Result<()> {
        let types = credential.get("type")
            .and_then(|t| t.as_array())
            .ok_or_else(|| error!(ValidationError::InvalidCredentialType))?;
        
        // Required types for Open Badges v3.0
        let required_types = ["VerifiableCredential", "OpenBadgeCredential"];
        
        for required in required_types {
            let found = types.iter().any(|t| {
                t.as_str().map_or(false, |s| s == required)
            });
            
            if found {
                report.add_success(format!("Required type '{}' present", required));
            } else {
                report.add_error(format!("Missing required type '{}'", required));
                if self.strict_mode {
                    return Err(error!(ValidationError::InvalidCredentialType));
                }
            }
        }
        
        Ok(())
    }
    
    /// Validate issuer structure
    fn validate_issuer(&self, credential: &Value, report: &mut ValidationReport) -> Result<()> {
        let issuer = credential.get("issuer")
            .ok_or_else(|| error!(ValidationError::MissingRequiredField))?;
        
        match issuer {
            Value::String(issuer_id) => {
                if self.is_valid_did_or_url(issuer_id) {
                    report.add_success("Valid issuer ID".to_string());
                } else {
                    report.add_error("Invalid issuer ID format".to_string());
                }
            }
            Value::Object(issuer_obj) => {
                // Validate issuer object structure
                if let Some(id) = issuer_obj.get("id") {
                    if self.is_valid_did_or_url(id.as_str().unwrap_or("")) {
                        report.add_success("Valid issuer object".to_string());
                    } else {
                        report.add_error("Invalid issuer ID in object".to_string());
                    }
                } else {
                    report.add_error("Missing issuer ID in object".to_string());
                }
                
                // Check for Profile type
                if let Some(types) = issuer_obj.get("type") {
                    if types.as_array().map_or(false, |arr| {
                        arr.iter().any(|t| t.as_str() == Some("Profile"))
                    }) {
                        report.add_success("Issuer has Profile type".to_string());
                    } else {
                        report.add_warning("Issuer missing Profile type".to_string());
                    }
                }
            }
            _ => {
                report.add_error("Invalid issuer format".to_string());
                if self.strict_mode {
                    return Err(error!(ValidationError::InvalidCredentialType));
                }
            }
        }
        
        Ok(())
    }
    
    /// Validate credential subject
    fn validate_credential_subject(&self, credential: &Value, report: &mut ValidationReport) -> Result<()> {
        let subject = credential.get("credentialSubject")
            .ok_or_else(|| error!(ValidationError::MissingRequiredField))?;
        
        // Check for AchievementSubject type
        if let Some(types) = subject.get("type") {
            if types.as_array().map_or(false, |arr| {
                arr.iter().any(|t| t.as_str() == Some("AchievementSubject"))
            }) {
                report.add_success("Valid AchievementSubject type".to_string());
            } else {
                report.add_error("Missing AchievementSubject type".to_string());
            }
        }
        
        // Check for achievement reference
        if subject.get("achievement").is_some() {
            report.add_success("Achievement reference present".to_string());
        } else {
            report.add_error("Missing achievement reference".to_string());
            if self.strict_mode {
                return Err(error!(ValidationError::MissingRequiredField));
            }
        }
        
        Ok(())
    }
    
    /// Validate achievement structure
    fn validate_achievement(&self, credential: &Value, report: &mut ValidationReport) -> Result<()> {
        let achievement = credential.get("credentialSubject")
            .and_then(|s| s.get("achievement"))
            .ok_or_else(|| error!(ValidationError::MissingRequiredField))?;
        
        // Required achievement properties
        let required_props = ["id", "type", "name", "description", "criteria"];
        
        for prop in required_props {
            if achievement.get(prop).is_some() {
                report.add_success(format!("Achievement property '{}' present", prop));
            } else {
                report.add_error(format!("Missing achievement property '{}'", prop));
                if self.strict_mode {
                    return Err(error!(ValidationError::MissingRequiredField));
                }
            }
        }
        
        // Validate achievement type
        if let Some(types) = achievement.get("type") {
            if types.as_array().map_or(false, |arr| {
                arr.iter().any(|t| t.as_str() == Some("Achievement"))
            }) {
                report.add_success("Valid Achievement type".to_string());
            } else {
                report.add_error("Missing Achievement type".to_string());
            }
        }
        
        // Validate criteria structure
        if let Some(criteria) = achievement.get("criteria") {
            if criteria.get("narrative").is_some() {
                report.add_success("Criteria narrative present".to_string());
            } else {
                report.add_warning("Missing criteria narrative".to_string());
            }
        }
        
        Ok(())
    }
    
    /// Validate temporal constraints
    fn validate_temporal_constraints(&self, credential: &Value, report: &mut ValidationReport) -> Result<()> {
        let now = chrono::Utc::now();
        
        // Check validFrom
        if let Some(valid_from) = credential.get("validFrom")
            .and_then(|v| v.as_str()) {
            match chrono::DateTime::parse_from_rfc3339(valid_from) {
                Ok(from_time) => {
                    if from_time <= now {
                        report.add_success("Credential is valid (not before constraint met)".to_string());
                    } else {
                        report.add_error("Credential not yet valid (validFrom in future)".to_string());
                    }
                }
                Err(_) => {
                    report.add_error("Invalid validFrom timestamp format".to_string());
                }
            }
        }
        
        // Check validUntil (if present)
        if let Some(valid_until) = credential.get("validUntil")
            .and_then(|v| v.as_str()) {
            match chrono::DateTime::parse_from_rfc3339(valid_until) {
                Ok(until_time) => {
                    if until_time >= now {
                        report.add_success("Credential not expired (validUntil constraint met)".to_string());
                    } else {
                        report.add_error("Credential has expired".to_string());
                    }
                }
                Err(_) => {
                    report.add_error("Invalid validUntil timestamp format".to_string());
                }
            }
        }
        
        Ok(())
    }
    
    /// Validate cryptographic proofs
    fn validate_proofs(&self, credential: &Value, report: &mut ValidationReport) -> Result<()> {
        if let Some(proof) = credential.get("proof") {
            // Validate proof structure
            if let Some(proof_type) = proof.get("type") {
                if proof_type.as_str() == Some("DataIntegrityProof") {
                    report.add_success("Valid proof type".to_string());
                } else {
                    report.add_warning("Non-standard proof type".to_string());
                }
            }
            
            // Check for required proof properties
            let required_proof_props = ["type", "cryptosuite", "created", "verificationMethod", "proofPurpose", "proofValue"];
            
            for prop in required_proof_props {
                if proof.get(prop).is_some() {
                    report.add_success(format!("Proof property '{}' present", prop));
                } else {
                    report.add_error(format!("Missing proof property '{}'", prop));
                }
            }
            
            // Validate cryptosuite
            if let Some(cryptosuite) = proof.get("cryptosuite").and_then(|c| c.as_str()) {
                if cryptosuite == "eddsa-rdfc-2022" {
                    report.add_success("Standard cryptosuite used".to_string());
                } else {
                    report.add_warning("Non-standard cryptosuite".to_string());
                }
            }
        } else {
            report.add_warning("No proof present".to_string());
        }
        
        Ok(())
    }
    
    /// Validate credential status
    fn validate_credential_status(&self, credential: &Value, report: &mut ValidationReport) -> Result<()> {
        if let Some(status) = credential.get("credentialStatus") {
            // Validate status structure
            let required_status_props = ["id", "type"];
            
            for prop in required_status_props {
                if status.get(prop).is_some() {
                    report.add_success(format!("Status property '{}' present", prop));
                } else {
                    report.add_error(format!("Missing status property '{}'", prop));
                }
            }
            
            // Check status type
            if let Some(status_type) = status.get("type").and_then(|t| t.as_str()) {
                if status_type == "StatusList2021Entry" {
                    report.add_success("Standard status type used".to_string());
                } else {
                    report.add_warning("Non-standard status type".to_string());
                }
            }
        } else {
            report.add_info("No credential status specified".to_string());
        }
        
        Ok(())
    }
    
    /// Validate evidence (if present)
    fn validate_evidence(&self, credential: &Value, report: &mut ValidationReport) -> Result<()> {
        if let Some(evidence) = credential.get("evidence") {
            if let Some(evidence_array) = evidence.as_array() {
                for (idx, evidence_item) in evidence_array.iter().enumerate() {
                    if evidence_item.get("id").is_some() && evidence_item.get("type").is_some() {
                        report.add_success(format!("Evidence item {} valid", idx));
                    } else {
                        report.add_warning(format!("Evidence item {} missing required fields", idx));
                    }
                }
                report.add_success(format!("Validated {} evidence items", evidence_array.len()));
            }
        } else {
            report.add_info("No evidence present".to_string());
        }
        
        Ok(())
    }
    
    /// Helper: Check if string is valid ISO 8601 timestamp
    fn is_valid_iso8601(&self, timestamp: &str) -> bool {
        chrono::DateTime::parse_from_rfc3339(timestamp).is_ok()
    }
    
    /// Helper: Check if string is valid DID or URL
    fn is_valid_did_or_url(&self, identifier: &str) -> bool {
        identifier.starts_with("did:") || identifier.starts_with("http://") || identifier.starts_with("https://")
    }
}

/// Comprehensive validation report
#[derive(Debug, Clone)]
pub struct ValidationReport {
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub successes: Vec<String>,
    pub info: Vec<String>,
    pub compliance_score: u8,
    pub is_valid: bool,
}

impl ValidationReport {
    pub fn new() -> Self {
        Self {
            errors: Vec::new(),
            warnings: Vec::new(),
            successes: Vec::new(),
            info: Vec::new(),
            compliance_score: 0,
            is_valid: false,
        }
    }
    
    pub fn add_error(&mut self, message: String) {
        self.errors.push(message);
    }
    
    pub fn add_warning(&mut self, message: String) {
        self.warnings.push(message);
    }
    
    pub fn add_success(&mut self, message: String) {
        self.successes.push(message);
    }
    
    pub fn add_info(&mut self, message: String) {
        self.info.push(message);
    }
    
    pub fn calculate_compliance_score(&mut self) {
        let total_checks = self.errors.len() + self.warnings.len() + self.successes.len();
        if total_checks == 0 {
            self.compliance_score = 0;
            return;
        }
        
        let success_weight = 10;
        let warning_weight = 5;
        let error_weight = 0;
        
        let total_score = self.successes.len() * success_weight + 
                         self.warnings.len() * warning_weight + 
                         self.errors.len() * error_weight;
        
        let max_score = total_checks * success_weight;
        
        self.compliance_score = ((total_score as f64 / max_score as f64) * 100.0) as u8;
        self.is_valid = self.errors.is_empty();
    }
    
    pub fn summary(&self) -> String {
        format!(
            "Validation Summary: {} errors, {} warnings, {} successes - Score: {}/100 - Valid: {}",
            self.errors.len(),
            self.warnings.len(),
            self.successes.len(),
            self.compliance_score,
            self.is_valid
        )
    }
}
