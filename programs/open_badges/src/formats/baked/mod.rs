/// Baked Badge Format Implementation
/// 
/// This module implements the Open Badges v3.0 specification for baked badges,
/// supporting both PNG and SVG formats with embedded credentials.
/// 
/// Reference: Open Badges Specification v3.0 - Section 4.1 "Baked Badges"
/// https://www.imsglobal.org/spec/ob/v3p0/#baked-badges

use anchor_lang::prelude::*;
use anchor_lang::solana_program::msg;

pub mod png_baking;
pub mod svg_baking;
pub mod validation;

pub use png_baking::*;
pub use svg_baking::*;
pub use validation::*;

/// Supported baked badge formats
#[derive(Debug, Clone, PartialEq)]
pub enum BakedFormat {
    Png,
    Svg,
}

/// Baked badge container for embedded credentials
#[derive(Debug, Clone)]
pub struct BakedBadge {
    /// The format of the baked badge
    pub format: BakedFormat,
    /// The embedded credential data (JSON-LD or JWT)
    pub credential_data: String,
    /// Optional verification information
    pub verification_info: Option<String>,
    /// Badge image data (binary for PNG, text for SVG)
    pub image_data: Vec<u8>,
}

impl BakedBadge {
    /// Create a new baked badge from credential data and image
    pub fn new(
        format: BakedFormat,
        credential_data: String,
        image_data: Vec<u8>,
        verification_info: Option<String>,
    ) -> Self {
        Self {
            format,
            credential_data,
            verification_info,
            image_data,
        }
    }

    /// Extract credential from baked badge
    pub fn extract_credential(&self) -> Result<String> {
        match self.format {
            BakedFormat::Png => {
                png_baking::extract_credential_from_png(&self.image_data)
            }
            BakedFormat::Svg => {
                svg_baking::extract_credential_from_svg(&self.image_data)
            }
        }
    }

    /// Validate the baked badge format and embedded credential
    pub fn validate(&self) -> Result<bool> {
        validation::validate_baked_badge(self)
    }

    /// Get the appropriate MIME type for this baked badge
    pub fn mime_type(&self) -> &'static str {
        match self.format {
            BakedFormat::Png => "image/png",
            BakedFormat::Svg => "image/svg+xml",
        }
    }
}

/// Bake a credential into a badge image
pub fn bake_credential(
    credential_json: &str,
    image_data: &[u8],
    format: BakedFormat,
) -> Result<BakedBadge> {
    match format {
        BakedFormat::Png => {
            let baked_data = png_baking::embed_credential_in_png(credential_json, image_data)?;
            Ok(BakedBadge::new(
                format,
                credential_json.to_string(),
                baked_data,
                None,
            ))
        }
        BakedFormat::Svg => {
            let baked_data = svg_baking::embed_credential_in_svg(credential_json, image_data)?;
            Ok(BakedBadge::new(
                format,
                credential_json.to_string(),
                baked_data,
                None,
            ))
        }
    }
}

/// Extract and validate a credential from a baked badge
pub fn extract_and_validate_credential(image_data: &[u8], format: BakedFormat) -> Result<String> {
    let credential = match format {
        BakedFormat::Png => png_baking::extract_credential_from_png(image_data)?,
        BakedFormat::Svg => svg_baking::extract_credential_from_svg(image_data)?,
    };

    // Validate the extracted credential
    if credential.is_empty() {
        return Err(error!(crate::common::errors::ValidationError::InvalidCredentialType));
    }

    // Basic JSON validation
    if !credential.trim().starts_with('{') {
        return Err(error!(crate::common::errors::ValidationError::InvalidJson));
    }

    msg!("✅ Successfully extracted credential from baked badge");
    Ok(credential)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_baked_badge_creation() {
        let credential = r#"{"@context":["https://www.w3.org/2018/credentials/v1"],"id":"test"}"#;
        let image_data = vec![0x89, 0x50, 0x4E, 0x47]; // PNG header
        
        let badge = BakedBadge::new(
            BakedFormat::Png,
            credential.to_string(),
            image_data,
            None,
        );

        assert_eq!(badge.format, BakedFormat::Png);
        assert_eq!(badge.credential_data, credential);
        assert_eq!(badge.mime_type(), "image/png");
    }

    #[test]
    fn test_svg_mime_type() {
        let badge = BakedBadge::new(
            BakedFormat::Svg,
            "test".to_string(),
            vec![],
            None,
        );
        assert_eq!(badge.mime_type(), "image/svg+xml");
    }
}
