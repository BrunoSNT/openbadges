import Ajv from 'ajv';
import fetch from 'node-fetch';

export interface SchemaValidationResult {
  valid: boolean;
  errors?: string[];
}

export class SchemaValidator {
  private ajv: Ajv;
  private schemas: Map<string, any> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.ajv = new Ajv({
      strict: false,
      allErrors: true,
      loadSchema: this.loadRemoteSchema.bind(this)
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load official Open Badges v3.0 schemas
    const schemaUrls = [
      'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
      'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_profile_schema.json',
      'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_getopenbadgecredentialsresponse_schema.json'
    ];

    console.log('🔍 Initializing Open Badges v3.0 schema validation...');

    for (const url of schemaUrls) {
      try {
        const schema = await this.loadRemoteSchema(url);
        this.schemas.set(url, schema);
        this.ajv.addSchema(schema, url);
        console.log(`✅ Loaded schema: ${url}`);
      } catch (error) {
        console.error(`❌ Failed to load schema: ${url}`, error);
        // Use fallback local schemas if remote loading fails
        this.addFallbackSchema(url);
      }
    }

    this.initialized = true;
    console.log('✅ Schema validator initialized for Open Badges v3.0 compliance');
  }

  private async loadRemoteSchema(uri: string): Promise<any> {
    console.log(`📥 Loading schema from: ${uri}`);
    
    const response = await fetch(uri, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Solana-Open-Badges-v3.0-Validator/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  private addFallbackSchema(schemaUrl: string): void {
    // Add basic fallback schemas for offline operation
    let fallbackSchema: any = {};

    if (schemaUrl.includes('achievementcredential')) {
      fallbackSchema = {
        "$schema": "https://json-schema.org/draft/2019-09/schema",
        "type": "object",
        "properties": {
          "@context": {
            "type": "array",
            "contains": {
              "const": "https://www.w3.org/ns/credentials/v2"
            }
          },
          "type": {
            "type": "array",
            "contains": {
              "const": "VerifiableCredential"
            }
          },
          "issuer": { "type": ["string", "object"] },
          "validFrom": { "type": "string", "format": "date-time" },
          "credentialSubject": { "type": "object" }
        },
        "required": ["@context", "type", "issuer", "validFrom", "credentialSubject"]
      };
    } else if (schemaUrl.includes('profile')) {
      fallbackSchema = {
        "$schema": "https://json-schema.org/draft/2019-09/schema",
        "type": "object",
        "properties": {
          "type": {
            "type": "array",
            "contains": {
              "const": "Profile"
            }
          },
          "id": { "type": "string" },
          "name": { "type": "string" }
        },
        "required": ["type", "id"]
      };
    }

    this.schemas.set(schemaUrl, fallbackSchema);
    this.ajv.addSchema(fallbackSchema, schemaUrl);
    console.log(`⚠️ Using fallback schema for: ${schemaUrl}`);
  }

  validateAchievementCredential(credential: any): SchemaValidationResult {
    const schemaUrl = 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json';
    return this.validateAgainstSchema(credential, schemaUrl, 'AchievementCredential');
  }

  validateProfile(profile: any): SchemaValidationResult {
    const schemaUrl = 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_profile_schema.json';
    return this.validateAgainstSchema(profile, schemaUrl, 'Profile');
  }

  private validateAgainstSchema(data: any, schemaUrl: string, dataType: string): SchemaValidationResult {
    if (!this.initialized) {
      console.warn('⚠️ Schema validator not initialized, skipping validation');
      return { valid: true };
    }

    const validate = this.ajv.getSchema(schemaUrl);
    
    if (!validate) {
      console.error(`❌ Schema not loaded for ${dataType}: ${schemaUrl}`);
      return { 
        valid: false, 
        errors: [`Schema not loaded for ${dataType}`] 
      };
    }

    console.log(`🔍 Validating ${dataType} against Open Badges v3.0 schema...`);
    
    const valid = validate(data);
    
    if (valid) {
      console.log(`✅ ${dataType} schema validation passed`);
      return { valid: true };
    } else {
      const errors = validate.errors?.map(err => 
        `${err.instancePath || 'root'}: ${err.message} (${JSON.stringify(err.data)})`
      ) || ['Unknown validation error'];
      
      console.error(`❌ ${dataType} schema validation failed:`, errors);
      
      return {
        valid: false,
        errors
      };
    }
  }

  /**
   * Validate that required Open Badges v3.0 fields are present
   */
  validateOpenBadgesCompliance(credential: any): SchemaValidationResult {
    const errors: string[] = [];

    // Check required @context
    if (!credential['@context'] || !Array.isArray(credential['@context'])) {
      errors.push('@context must be an array');
    } else {
      const requiredContexts = [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'
      ];
      
      for (const requiredContext of requiredContexts) {
        if (!credential['@context'].includes(requiredContext)) {
          errors.push(`Missing required @context: ${requiredContext}`);
        }
      }
    }

    // Check required type
    if (!credential.type || !Array.isArray(credential.type)) {
      errors.push('type must be an array');
    } else {
      const requiredTypes = ['VerifiableCredential', 'OpenBadgeCredential'];
      for (const requiredType of requiredTypes) {
        if (!credential.type.includes(requiredType)) {
          errors.push(`Missing required type: ${requiredType}`);
        }
      }
    }

    // Check issuer
    if (!credential.issuer) {
      errors.push('issuer is required');
    }

    // Check validFrom
    if (!credential.validFrom) {
      errors.push('validFrom is required');
    }

    // Check credentialSubject
    if (!credential.credentialSubject) {
      errors.push('credentialSubject is required');
    } else {
      if (!credential.credentialSubject.id) {
        errors.push('credentialSubject.id is required');
      }
      if (!credential.credentialSubject.type || !Array.isArray(credential.credentialSubject.type)) {
        errors.push('credentialSubject.type must be an array');
      } else if (!credential.credentialSubject.type.includes('AchievementSubject')) {
        errors.push('credentialSubject.type must include "AchievementSubject"');
      }
    }

    const valid = errors.length === 0;
    
    if (valid) {
      console.log('✅ Open Badges v3.0 compliance validation passed');
    } else {
      console.error('❌ Open Badges v3.0 compliance validation failed:', errors);
    }

    return {
      valid,
      errors: valid ? undefined : errors
    };
  }
}

// Singleton instance
export const schemaValidator = new SchemaValidator();
