//! Open Badges 3.0 Evidence implementation

use anchor_lang::prelude::*;
use crate::common::credential::Evidence;
use serde::{Deserialize, Serialize};

/// Evidence type classification for Open Badges 3.0
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EvidenceType {
    /// Generic evidence
    Evidence,
    /// Artifact evidence (student work)
    Artifact,
    /// Assessment evidence
    Assessment,
    /// Portfolio evidence
    Portfolio,
    /// Video evidence
    Video,
    /// Audio evidence
    Audio,
    /// Image evidence
    Image,
    /// Document evidence
    Document,
    /// Custom evidence type
    Custom(String),
}

impl EvidenceType {
    /// Convert to string representation
    pub fn to_string(&self) -> String {
        match self {
            EvidenceType::Evidence => "Evidence".to_string(),
            EvidenceType::Artifact => "Artifact".to_string(),
            EvidenceType::Assessment => "Assessment".to_string(),
            EvidenceType::Portfolio => "Portfolio".to_string(),
            EvidenceType::Video => "Video".to_string(),
            EvidenceType::Audio => "Audio".to_string(),
            EvidenceType::Image => "Image".to_string(),
            EvidenceType::Document => "Document".to_string(),
            EvidenceType::Custom(t) => t.clone(),
        }
    }
    
    /// Parse from string
    pub fn from_string(s: &str) -> Self {
        match s {
            "Evidence" => EvidenceType::Evidence,
            "Artifact" => EvidenceType::Artifact,
            "Assessment" => EvidenceType::Assessment,
            "Portfolio" => EvidenceType::Portfolio,
            "Video" => EvidenceType::Video,
            "Audio" => EvidenceType::Audio,
            "Image" => EvidenceType::Image,
            "Document" => EvidenceType::Document,
            _ => EvidenceType::Custom(s.to_string()),
        }
    }
}

/// Evidence genre classification
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EvidenceGenre {
    /// Academic work
    Academic,
    /// Professional work
    Professional,
    /// Creative work
    Creative,
    /// Technical work
    Technical,
    /// Research work
    Research,
    /// Community service
    CommunityService,
    /// Personal project
    Personal,
    /// Custom genre
    Custom(String),
}

impl EvidenceGenre {
    pub fn to_string(&self) -> String {
        match self {
            EvidenceGenre::Academic => "Academic".to_string(),
            EvidenceGenre::Professional => "Professional".to_string(),
            EvidenceGenre::Creative => "Creative".to_string(),
            EvidenceGenre::Technical => "Technical".to_string(),
            EvidenceGenre::Research => "Research".to_string(),
            EvidenceGenre::CommunityService => "CommunityService".to_string(),
            EvidenceGenre::Personal => "Personal".to_string(),
            EvidenceGenre::Custom(g) => g.clone(),
        }
    }
}

/// Evidence audience classification
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EvidenceAudience {
    /// Public audience
    Public,
    /// Educational audience
    Educational,
    /// Professional audience
    Professional,
    /// Peer audience
    Peer,
    /// Expert audience
    Expert,
    /// Custom audience
    Custom(String),
}

impl EvidenceAudience {
    pub fn to_string(&self) -> String {
        match self {
            EvidenceAudience::Public => "Public".to_string(),
            EvidenceAudience::Educational => "Educational".to_string(),
            EvidenceAudience::Professional => "Professional".to_string(),
            EvidenceAudience::Peer => "Peer".to_string(),
            EvidenceAudience::Expert => "Expert".to_string(),
            EvidenceAudience::Custom(a) => a.clone(),
        }
    }
}

/// Evidence builder for Open Badges 3.0
pub struct EvidenceBuilder {
    evidence: Evidence,
}

impl EvidenceBuilder {
    /// Create a new evidence builder
    pub fn new(id: String, evidence_type: EvidenceType) -> Self {
        Self {
            evidence: Evidence {
                id,
                evidence_type: vec![evidence_type.to_string()],
                name: None,
                description: None,
                narrative: None,
                genre: None,
                audience: None,
            },
        }
    }
    
    /// Set the evidence name
    pub fn with_name(mut self, name: String) -> Self {
        self.evidence.name = Some(name);
        self
    }
    
    /// Set the evidence description
    pub fn with_description(mut self, description: String) -> Self {
        self.evidence.description = Some(description);
        self
    }
    
    /// Set the evidence narrative
    pub fn with_narrative(mut self, narrative: String) -> Self {
        self.evidence.narrative = Some(narrative);
        self
    }
    
    /// Set the evidence genre
    pub fn with_genre(mut self, genre: EvidenceGenre) -> Self {
        self.evidence.genre = Some(genre.to_string());
        self
    }
    
    /// Set the evidence audience
    pub fn with_audience(mut self, audience: EvidenceAudience) -> Self {
        self.evidence.audience = Some(audience.to_string());
        self
    }
    
    /// Build the evidence
    pub fn build(self) -> Result<Evidence> {
        // Validate required fields
        if self.evidence.id.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if self.evidence.evidence_type.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        // Validate ID format (should be URI)
        if !self.evidence.id.starts_with("http://") && 
           !self.evidence.id.starts_with("https://") && 
           !self.evidence.id.starts_with("urn:") {
            return Err(error!(crate::common::errors::ValidationError::InvalidUri));
        }
        
        Ok(self.evidence)
    }
}

/// Evidence collection for managing multiple evidence items
pub struct EvidenceCollection {
    evidence_items: Vec<Evidence>,
}

impl EvidenceCollection {
    /// Create a new evidence collection
    pub fn new() -> Self {
        Self {
            evidence_items: Vec::new(),
        }
    }
    
    /// Add evidence to the collection
    pub fn add_evidence(&mut self, evidence: Evidence) -> Result<()> {
        // Check for duplicate IDs
        if self.evidence_items.iter().any(|e| e.id == evidence.id) {
            return Err(error!(crate::common::errors::ValidationError::DuplicateEvidenceId));
        }
        
        self.evidence_items.push(evidence);
        Ok(())
    }
    
    /// Remove evidence by ID
    pub fn remove_evidence(&mut self, id: &str) -> Result<()> {
        let initial_len = self.evidence_items.len();
        self.evidence_items.retain(|e| e.id != id);
        
        if self.evidence_items.len() == initial_len {
            return Err(error!(crate::common::errors::ValidationError::EvidenceNotFound));
        }
        
        Ok(())
    }
    
    /// Get evidence by ID
    pub fn get_evidence(&self, id: &str) -> Option<&Evidence> {
        self.evidence_items.iter().find(|e| e.id == id)
    }
    
    /// Get all evidence items
    pub fn get_all_evidence(&self) -> &[Evidence] {
        &self.evidence_items
    }
    
    /// Count evidence items
    pub fn count(&self) -> usize {
        self.evidence_items.len()
    }
    
    /// Check if collection is empty
    pub fn is_empty(&self) -> bool {
        self.evidence_items.is_empty()
    }
    
    /// Filter evidence by type
    pub fn filter_by_type(&self, evidence_type: &EvidenceType) -> Vec<&Evidence> {
        let type_str = evidence_type.to_string();
        self.evidence_items.iter()
            .filter(|e| e.evidence_type.contains(&type_str))
            .collect()
    }
    
    /// Filter evidence by genre
    pub fn filter_by_genre(&self, genre: &EvidenceGenre) -> Vec<&Evidence> {
        let genre_str = genre.to_string();
        self.evidence_items.iter()
            .filter(|e| e.genre.as_ref().map_or(false, |g| g == &genre_str))
            .collect()
    }
    
    /// Validate all evidence in the collection
    pub fn validate_all(&self) -> Result<()> {
        for evidence in &self.evidence_items {
            validate_evidence_ob3(evidence)?;
        }
        Ok(())
    }
}

impl Default for EvidenceCollection {
    fn default() -> Self {
        Self::new()
    }
}

/// Validate evidence against Open Badges 3.0 specification
pub fn validate_evidence_ob3(evidence: &Evidence) -> Result<()> {
    // Check required fields
    if evidence.id.is_empty() {
        return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
    }
    
    if evidence.evidence_type.is_empty() {
        return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
    }
    
    // Validate ID format (should be URI)
    if !evidence.id.starts_with("http://") && 
       !evidence.id.starts_with("https://") && 
       !evidence.id.starts_with("urn:") &&
       !evidence.id.starts_with("data:") {
        return Err(error!(crate::common::errors::ValidationError::InvalidUri));
    }
    
    // Validate evidence type is not empty
    if evidence.evidence_type.is_empty() || evidence.evidence_type.iter().all(|t| t.trim().is_empty()) {
        return Err(error!(crate::common::errors::ValidationError::InvalidEvidenceType));
    }
    
    Ok(())
}

/// Create evidence for different media types
pub mod media_evidence {
    use super::*;
    
    /// Create video evidence
    pub fn create_video_evidence(
        id: String,
        name: String,
        description: String,
        narrative: Option<String>,
    ) -> Result<Evidence> {
        EvidenceBuilder::new(id, EvidenceType::Video)
            .with_name(name)
            .with_description(description)
            .with_narrative(narrative.unwrap_or_default())
            .build()
    }
    
    /// Create document evidence
    pub fn create_document_evidence(
        id: String,
        name: String,
        description: String,
        genre: EvidenceGenre,
    ) -> Result<Evidence> {
        EvidenceBuilder::new(id, EvidenceType::Document)
            .with_name(name)
            .with_description(description)
            .with_genre(genre)
            .build()
    }
    
    /// Create portfolio evidence
    pub fn create_portfolio_evidence(
        id: String,
        name: String,
        narrative: String,
        audience: EvidenceAudience,
    ) -> Result<Evidence> {
        EvidenceBuilder::new(id, EvidenceType::Portfolio)
            .with_name(name)
            .with_narrative(narrative)
            .with_audience(audience)
            .build()
    }
}
