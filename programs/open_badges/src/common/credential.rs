use anchor_lang::prelude::*;
use crate::common::errors::ValidationError;

/// Validation trait for Open Badges v3.0 compliance
pub trait OpenBadgesValidation {
    fn validate_ob3(&self) -> Result<()>;
}

/// Validation functions for credential compliance
pub mod validation_utils {
    use super::*;
    
    /// Validate that required contexts are present
    pub fn validate_required_contexts(context: &[String]) -> Result<()> {
        if !context.contains(&"https://www.w3.org/2018/credentials/v1".to_string()) {
            return Err(error!(ValidationError::MissingRequiredField));
        }

        if !context.contains(&"https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json".to_string()) {
            return Err(error!(ValidationError::MissingRequiredField));
        }

        Ok(())
    }

    /// Validate that required credential types are present
    pub fn validate_required_credential_types(credential_type: &[String]) -> Result<()> {
        if !credential_type.contains(&"VerifiableCredential".to_string()) {
            return Err(error!(ValidationError::InvalidCredentialType));
        }

        if !credential_type.contains(&"AchievementCredential".to_string()) {
            return Err(error!(ValidationError::InvalidCredentialType));
        }

        Ok(())
    }

    /// Validate that achievement types are present
    pub fn validate_achievement_types(achievement_type: &[String]) -> Result<()> {
        if !achievement_type.contains(&"Achievement".to_string()) {
            return Err(error!(ValidationError::InvalidCredentialType));
        }

        Ok(())
    }

    /// Validate that subject types are present
    pub fn validate_subject_types(subject_type: &[String]) -> Result<()> {
        if !subject_type.contains(&"AchievementSubject".to_string()) {
            return Err(error!(ValidationError::InvalidCredentialType));
        }

        Ok(())
    }
}
