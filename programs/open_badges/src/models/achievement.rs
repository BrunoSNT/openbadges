//! Open Badges 3.0 Achievement implementation

use anchor_lang::prelude::*;
use crate::common::credential::*;
use serde::{Deserialize, Serialize};

/// Open Badges 3.0 Achievement builder
pub struct AchievementBuilder {
    achievement: Achievement,
}

impl AchievementBuilder {
    /// Create a new achievement builder
    pub fn new(id: String, name: String, description: String, criteria_narrative: String) -> Self {
        let achievement = Achievement {
            id,
            achievement_type: vec!["Achievement".to_string()],
            name,
            description,
            criteria: Criteria {
                id: None,
                narrative: criteria_narrative,
            },
            image: None,
            version: None,
            tags: Vec::new(),
            alignments: Vec::new(),
        };
        
        Self { achievement }
    }
    
    /// Set the achievement image
    pub fn with_image(mut self, image_id: String, caption: Option<String>) -> Self {
        self.achievement.image = Some(Image {
            id: image_id,
            image_type: "Image".to_string(),
            caption,
        });
        self
    }
    
    /// Set the achievement version
    pub fn with_version(mut self, version: String) -> Self {
        self.achievement.version = Some(version);
        self
    }
    
    /// Add tags to the achievement
    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.achievement.tags = tags;
        self
    }
    
    /// Add an alignment to the achievement
    pub fn add_alignment(mut self, alignment: Alignment) -> Self {
        self.achievement.alignments.push(alignment);
        self
    }
    
    /// Set the criteria ID
    pub fn with_criteria_id(mut self, criteria_id: String) -> Self {
        self.achievement.criteria.id = Some(criteria_id);
        self
    }
    
    /// Add achievement type
    pub fn add_achievement_type(mut self, achievement_type: String) -> Self {
        if !self.achievement.achievement_type.contains(&achievement_type) {
            self.achievement.achievement_type.push(achievement_type);
        }
        self
    }
    
    /// Build the achievement
    pub fn build(self) -> Result<Achievement> {
        // Validate required fields
        if self.achievement.id.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if self.achievement.name.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if self.achievement.description.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if self.achievement.criteria.narrative.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if !self.achievement.achievement_type.contains(&"Achievement".to_string()) {
            return Err(error!(crate::common::errors::ValidationError::InvalidAchievementType));
        }
        
        Ok(self.achievement)
    }
}

/// Achievement type classification for Open Badges 3.0
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AchievementType {
    /// A general achievement
    Achievement,
    /// A learning achievement
    LearningAchievement,
    /// A competency achievement
    Competency,
    /// A badge achievement
    Badge,
    /// A certification achievement
    Certification,
    /// A license achievement
    License,
    /// A skill achievement
    Skill,
    /// A custom achievement type
    Custom(String),
}

impl AchievementType {
    /// Convert to string representation
    pub fn to_string(&self) -> String {
        match self {
            AchievementType::Achievement => "Achievement".to_string(),
            AchievementType::LearningAchievement => "LearningAchievement".to_string(),
            AchievementType::Competency => "Competency".to_string(),
            AchievementType::Badge => "Badge".to_string(),
            AchievementType::Certification => "Certification".to_string(),
            AchievementType::License => "License".to_string(),
            AchievementType::Skill => "Skill".to_string(),
            AchievementType::Custom(t) => t.clone(),
        }
    }
    
    /// Parse from string
    pub fn from_string(s: &str) -> Self {
        match s {
            "Achievement" => AchievementType::Achievement,
            "LearningAchievement" => AchievementType::LearningAchievement,
            "Competency" => AchievementType::Competency,
            "Badge" => AchievementType::Badge,
            "Certification" => AchievementType::Certification,
            "License" => AchievementType::License,
            "Skill" => AchievementType::Skill,
            _ => AchievementType::Custom(s.to_string()),
        }
    }
}

/// Achievement criteria builder
pub struct CriteriaBuilder {
    criteria: Criteria,
}

impl CriteriaBuilder {
    /// Create a new criteria builder
    pub fn new(narrative: String) -> Self {
        Self {
            criteria: Criteria {
                id: None,
                narrative,
            },
        }
    }
    
    /// Set the criteria ID
    pub fn with_id(mut self, id: String) -> Self {
        self.criteria.id = Some(id);
        self
    }
    
    /// Build the criteria
    pub fn build(self) -> Result<Criteria> {
        if self.criteria.narrative.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        Ok(self.criteria)
    }
}

/// Achievement alignment builder
pub struct AlignmentBuilder {
    alignment: Alignment,
}

impl AlignmentBuilder {
    /// Create a new alignment builder
    pub fn new(target_name: String, target_url: String) -> Self {
        Self {
            alignment: Alignment {
                alignment_type: vec!["Alignment".to_string()],
                target_name,
                target_url,
                target_description: None,
            },
        }
    }
    
    /// Set the target description
    pub fn with_description(mut self, description: String) -> Self {
        self.alignment.target_description = Some(description);
        self
    }
    
    /// Build the alignment
    pub fn build(self) -> Result<Alignment> {
        if self.alignment.target_name.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        if self.alignment.target_url.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        // Validate URL format (basic check)
        if !self.alignment.target_url.starts_with("http://") && 
           !self.alignment.target_url.starts_with("https://") {
            return Err(error!(crate::common::errors::ValidationError::InvalidUrl));
        }
        
        Ok(self.alignment)
    }
}

/// Validate achievement against Open Badges 3.0 specification
pub fn validate_achievement_ob3(achievement: &Achievement) -> Result<()> {
    // Check required fields
    if achievement.id.is_empty() {
        return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
    }
    
    if achievement.name.is_empty() {
        return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
    }
    
    if achievement.description.is_empty() {
        return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
    }
    
    if achievement.criteria.narrative.is_empty() {
        return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
    }
    
    // Image is optional, but if provided, validate its URL
    if let Some(ref img) = achievement.image {
        if img.id.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::MissingRequiredField));
        }
        
        // Validate image URL format
        if !img.id.starts_with("http://") && 
           !img.id.starts_with("https://") && 
           !img.id.starts_with("data:") {
            return Err(error!(crate::common::errors::ValidationError::InvalidUrl));
        }
    }
    
    // Validate achievement type
    if !achievement.achievement_type.contains(&"Achievement".to_string()) {
        return Err(error!(crate::common::errors::ValidationError::InvalidAchievementType));
    }
    
    // Validate ID format (should be URI)
    if !achievement.id.starts_with("http://") && 
       !achievement.id.starts_with("https://") && 
       !achievement.id.starts_with("urn:") {
        return Err(error!(crate::common::errors::ValidationError::InvalidUri));
    }
    
    // Validate alignments
    for alignment in &achievement.alignments {
        if alignment.target_name.is_empty() || alignment.target_url.is_empty() {
            return Err(error!(crate::common::errors::ValidationError::InvalidAlignment));
        }
        
        if !alignment.target_url.starts_with("http://") && 
           !alignment.target_url.starts_with("https://") {
            return Err(error!(crate::common::errors::ValidationError::InvalidUrl));
        }
    }
    
    Ok(())
}
