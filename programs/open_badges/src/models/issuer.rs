//! Open Badges 3.0 Issuer implementation

use anchor_lang::prelude::*;
use crate::common::credential::{Profile, Image};

/// Issuer builder for Open Badges 3.0
pub struct IssuerBuilder {
    issuer: Profile,
}

impl IssuerBuilder {
    /// Create a new issuer builder
    pub fn new(id: String, name: String) -> Self {
        Self {
            issuer: Profile {
                id,
                profile_type: vec!["Profile".to_string()],
                name,
                description: None,
                image: None,
                url: None,
                email: None,
            },
        }
    }
    
    /// Set the issuer description
    pub fn with_description(mut self, description: String) -> Self {
        self.issuer.description = Some(description);
        self
    }
    
    /// Set the issuer image
    pub fn with_image(mut self, image_id: String, caption: Option<String>) -> Self {
        self.issuer.image = Some(Image {
            id: image_id,
            image_type: "Image".to_string(),
            caption,
        });
        self
    }
    
    /// Set the issuer URL
    pub fn with_url(mut self, url: String) -> Self {
        self.issuer.url = Some(url);
        self
    }
    
    /// Set the issuer email
    pub fn with_email(mut self, email: String) -> Self {
        self.issuer.email = Some(email);
        self
    }
    
    /// Build the issuer
    pub fn build(self) -> Result<Profile> {
        // Validate required fields
        if self.issuer.id.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if self.issuer.name.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        // Validate ID format (should be URI or DID)
        if !self.issuer.id.starts_with("http://") && 
           !self.issuer.id.starts_with("https://") && 
           !self.issuer.id.starts_with("did:") {
            return Err(error!(crate::common::errors::ValidationError::InvalidUri));
        }
        
        Ok(self.issuer)
    }
}
