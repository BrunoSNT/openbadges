/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/open_badges.json`.
 */
export type OpenBadges = {
  "address": "6x9DvPXzw8RQimtZzATScuNxnPiYJxRTnnEaK4YmS2o8",
  "metadata": {
    "name": "openBadges",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "batchRevocationOperation",
      "docs": [
        "Perform batch revocation operations for efficiency"
      ],
      "discriminator": [
        202,
        151,
        238,
        29,
        121,
        107,
        172,
        116
      ],
      "accounts": [
        {
          "name": "revocationList",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "revocationList"
          ]
        }
      ],
      "args": [
        {
          "name": "indicesToRevoke",
          "type": {
            "vec": "u32"
          }
        },
        {
          "name": "indicesToReactivate",
          "type": {
            "vec": "u32"
          }
        },
        {
          "name": "reason",
          "type": "string"
        }
      ]
    },
    {
      "name": "createAchievement",
      "docs": [
        "Create an achievement definition"
      ],
      "discriminator": [
        41,
        79,
        246,
        230,
        218,
        83,
        35,
        240
      ],
      "accounts": [
        {
          "name": "achievement",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  99,
                  104,
                  105,
                  101,
                  118,
                  101,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "issuer"
              },
              {
                "kind": "arg",
                "path": "name"
              }
            ]
          }
        },
        {
          "name": "issuer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "achievementId",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "criteriaNarrative",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "criteriaId",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "creator",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "createLinkedDataProof",
      "docs": [
        "Create a Linked Data Proof for an AchievementCredential",
        "Implements Section 8.3 of Open Badges 3.0 specification"
      ],
      "discriminator": [
        25,
        183,
        100,
        128,
        81,
        33,
        52,
        99
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "credentialJson",
          "type": "string"
        },
        {
          "name": "keyId",
          "type": "string"
        },
        {
          "name": "proofPurpose",
          "type": "string"
        }
      ],
      "returns": "string"
    },
    {
      "name": "generateJsonldCredential",
      "docs": [
        "Generate a JSON-LD credential for an achievement",
        "Implements Open Badges 3.0 specification for JSON-LD format"
      ],
      "discriminator": [
        81,
        61,
        208,
        59,
        208,
        91,
        16,
        181
      ],
      "accounts": [
        {
          "name": "issuer"
        },
        {
          "name": "achievement"
        },
        {
          "name": "recipient"
        }
      ],
      "args": [
        {
          "name": "achievementId",
          "type": "string"
        },
        {
          "name": "credentialId",
          "type": "string"
        }
      ],
      "returns": "string"
    },
    {
      "name": "generateJwtCredential",
      "docs": [
        "Generate a JWT credential for an achievement",
        "Implements Open Badges 3.0 specification for JWT format"
      ],
      "discriminator": [
        254,
        131,
        48,
        137,
        164,
        181,
        76,
        157
      ],
      "accounts": [
        {
          "name": "issuer"
        },
        {
          "name": "achievement"
        },
        {
          "name": "recipient"
        }
      ],
      "args": [
        {
          "name": "achievementId",
          "type": "string"
        },
        {
          "name": "credentialId",
          "type": "string"
        }
      ],
      "returns": "string"
    },
    {
      "name": "initializeIssuer",
      "docs": [
        "Initialize an issuer profile (Profile in OB v3.0 spec)"
      ],
      "discriminator": [
        231,
        164,
        134,
        90,
        62,
        217,
        189,
        118
      ],
      "accounts": [
        {
          "name": "issuer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "profileId",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "url",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "email",
          "type": {
            "option": "string"
          }
        }
      ]
    },
    {
      "name": "initializeRevocationList",
      "docs": [
        "Initialize a revocation list for credential status management"
      ],
      "discriminator": [
        139,
        180,
        203,
        202,
        237,
        110,
        164,
        8
      ],
      "accounts": [
        {
          "name": "revocationList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "listId"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "listId",
          "type": "string"
        },
        {
          "name": "capacity",
          "type": "u32"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "statusListUrl",
          "type": "string"
        }
      ]
    },
    {
      "name": "issueAchievementCredential",
      "docs": [
        "Issue an AchievementCredential (the core VC) with Ed25519 signature verification"
      ],
      "discriminator": [
        22,
        116,
        163,
        110,
        214,
        114,
        254,
        183
      ],
      "accounts": [
        {
          "name": "credential",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "achievement"
              },
              {
                "kind": "account",
                "path": "issuer"
              },
              {
                "kind": "arg",
                "path": "recipientPubkey"
              }
            ]
          }
        },
        {
          "name": "achievement"
        },
        {
          "name": "issuer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "recipientPubkey",
          "type": "pubkey"
        },
        {
          "name": "signatureData",
          "type": "bytes"
        },
        {
          "name": "messageData",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "reactivateCredential",
      "docs": [
        "Reactivate a credential by clearing its status bit"
      ],
      "discriminator": [
        94,
        39,
        163,
        171,
        196,
        232,
        242,
        194
      ],
      "accounts": [
        {
          "name": "revocationList",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "revocationList"
          ]
        }
      ],
      "args": [
        {
          "name": "credentialIndex",
          "type": "u32"
        },
        {
          "name": "reason",
          "type": "string"
        }
      ]
    },
    {
      "name": "resolveDidDocument",
      "docs": [
        "Resolve a DID to its document",
        "Supports did:sol, did:key, and did:web methods"
      ],
      "discriminator": [
        168,
        180,
        218,
        211,
        184,
        19,
        102,
        12
      ],
      "accounts": [],
      "args": [
        {
          "name": "did",
          "type": "string"
        }
      ],
      "returns": "string"
    },
    {
      "name": "revokeCredential",
      "docs": [
        "Revoke a credential by setting its status bit"
      ],
      "discriminator": [
        38,
        123,
        95,
        95,
        223,
        158,
        169,
        87
      ],
      "accounts": [
        {
          "name": "revocationList",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "revocationList"
          ]
        }
      ],
      "args": [
        {
          "name": "credentialIndex",
          "type": "u32"
        },
        {
          "name": "reason",
          "type": "string"
        }
      ]
    },
    {
      "name": "revokeCredentialDirect",
      "docs": [
        "Revoke a credential directly (for backward compatibility with tests)",
        "Sets the is_revoked flag on the credential account"
      ],
      "discriminator": [
        49,
        106,
        151,
        219,
        236,
        204,
        67,
        152
      ],
      "accounts": [
        {
          "name": "credential",
          "writable": true
        },
        {
          "name": "issuer",
          "relations": [
            "credential"
          ]
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "issuer"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "validateAchievementCompliance",
      "docs": [
        "Validate an Achievement for VCCS v1.0 compliance"
      ],
      "discriminator": [
        119,
        228,
        71,
        252,
        150,
        132,
        129,
        27
      ],
      "accounts": [
        {
          "name": "achievement"
        }
      ],
      "args": [
        {
          "name": "achievementJson",
          "type": "string"
        }
      ],
      "returns": "bool"
    },
    {
      "name": "validateCredentialCompliance",
      "docs": [
        "Validate an AchievementCredential for VCCS v1.0 compliance"
      ],
      "discriminator": [
        232,
        30,
        70,
        95,
        63,
        211,
        136,
        8
      ],
      "accounts": [
        {
          "name": "credential"
        }
      ],
      "args": [
        {
          "name": "credentialJson",
          "type": "string"
        }
      ],
      "returns": "bool"
    },
    {
      "name": "validateProfileCompliance",
      "docs": [
        "Validate a Profile for VCCS v1.0 compliance"
      ],
      "discriminator": [
        91,
        235,
        168,
        216,
        232,
        191,
        202,
        86
      ],
      "accounts": [
        {
          "name": "profile"
        }
      ],
      "args": [
        {
          "name": "profileJson",
          "type": "string"
        }
      ],
      "returns": "bool"
    },
    {
      "name": "verifyCredential",
      "docs": [
        "Verify an AchievementCredential"
      ],
      "discriminator": [
        139,
        189,
        60,
        127,
        32,
        241,
        162,
        134
      ],
      "accounts": [
        {
          "name": "credential"
        }
      ],
      "args": [],
      "returns": "bool"
    },
    {
      "name": "verifyCredentialFormat",
      "docs": [
        "Verify a credential in any supported format",
        "Supports both JSON-LD and JWT formats"
      ],
      "discriminator": [
        236,
        177,
        10,
        44,
        124,
        23,
        106,
        39
      ],
      "accounts": [],
      "args": [
        {
          "name": "credentialData",
          "type": "string"
        }
      ],
      "returns": "bool"
    },
    {
      "name": "verifyLinkedDataProof",
      "docs": [
        "Verify a Linked Data Proof for an AchievementCredential",
        "Implements Section 8.3 of Open Badges 3.0 specification"
      ],
      "discriminator": [
        196,
        154,
        143,
        193,
        192,
        62,
        3,
        171
      ],
      "accounts": [],
      "args": [
        {
          "name": "credentialJson",
          "type": "string"
        },
        {
          "name": "proofJson",
          "type": "string"
        },
        {
          "name": "publicKeyMultibase",
          "type": "string"
        }
      ],
      "returns": "bool"
    }
  ],
  "accounts": [
    {
      "name": "achievement",
      "discriminator": [
        30,
        253,
        162,
        142,
        30,
        160,
        66,
        62
      ]
    },
    {
      "name": "achievementCredential",
      "discriminator": [
        35,
        218,
        137,
        114,
        8,
        97,
        112,
        152
      ]
    },
    {
      "name": "profile",
      "discriminator": [
        184,
        101,
        165,
        188,
        95,
        63,
        127,
        188
      ]
    },
    {
      "name": "revocationList",
      "discriminator": [
        153,
        67,
        78,
        57,
        216,
        81,
        50,
        213
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidJson",
      "msg": "Invalid JSON format"
    },
    {
      "code": 6001,
      "name": "missingRequiredField",
      "msg": "Missing required field"
    },
    {
      "code": 6002,
      "name": "invalidCredentialType",
      "msg": "Invalid credential type"
    },
    {
      "code": 6003,
      "name": "invalidKey",
      "msg": "Invalid key format"
    },
    {
      "code": 6004,
      "name": "invalidProof",
      "msg": "Invalid proof format"
    },
    {
      "code": 6005,
      "name": "validationFailed",
      "msg": "Validation failed"
    },
    {
      "code": 6006,
      "name": "notImplemented",
      "msg": "Feature not implemented"
    },
    {
      "code": 6007,
      "name": "unsupportedFormat",
      "msg": "Unsupported format"
    },
    {
      "code": 6008,
      "name": "missingKeyFragment",
      "msg": "Missing key fragment"
    },
    {
      "code": 6009,
      "name": "verificationMethodNotFound",
      "msg": "Verification method not found"
    },
    {
      "code": 6010,
      "name": "noPublicKeyFound",
      "msg": "No public key found"
    },
    {
      "code": 6011,
      "name": "unsupportedKeyEncoding",
      "msg": "Unsupported key encoding"
    },
    {
      "code": 6012,
      "name": "unsupportedKeyType",
      "msg": "Unsupported key type"
    },
    {
      "code": 6013,
      "name": "invalidSolanaPublicKey",
      "msg": "Invalid Solana public key"
    },
    {
      "code": 6014,
      "name": "invalidKeyEncoding",
      "msg": "Invalid key encoding"
    },
    {
      "code": 6015,
      "name": "invalidKeyLength",
      "msg": "Invalid key length"
    },
    {
      "code": 6016,
      "name": "invalidDid",
      "msg": "Invalid DID"
    },
    {
      "code": 6017,
      "name": "unsupportedDidMethod",
      "msg": "Unsupported DID method"
    },
    {
      "code": 6018,
      "name": "invalidTimestampFormat",
      "msg": "Invalid timestamp format"
    },
    {
      "code": 6019,
      "name": "serializationError",
      "msg": "Serialization error"
    },
    {
      "code": 6020,
      "name": "invalidCapacity",
      "msg": "Invalid capacity value"
    },
    {
      "code": 6021,
      "name": "unauthorizedAccess",
      "msg": "Unauthorized access"
    },
    {
      "code": 6022,
      "name": "indexOutOfBounds",
      "msg": "Index out of bounds"
    },
    {
      "code": 6023,
      "name": "invalidEncodedList",
      "msg": "Invalid encoded list"
    },
    {
      "code": 6024,
      "name": "invalidProofValue",
      "msg": "Invalid proof value"
    },
    {
      "code": 6025,
      "name": "serializationFailed",
      "msg": "Serialization failed"
    },
    {
      "code": 6026,
      "name": "invalidJwtFormat",
      "msg": "Invalid JWT format"
    },
    {
      "code": 6027,
      "name": "invalidBase64Encoding",
      "msg": "Invalid base64 encoding"
    }
  ],
  "types": [
    {
      "name": "achievement",
      "docs": [
        "Achievement - defines the accomplishment itself",
        "Aligned with Achievement class in OB v3.0 spec"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "context",
            "docs": [
              "@context [1..*] - JSON-LD context URIs - REQUIRED"
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "id",
            "docs": [
              "Unique URI for the Achievement [1] - REQUIRED"
            ],
            "type": "string"
          },
          {
            "name": "r#type",
            "docs": [
              "Type array [1..*] - Must include \"Achievement\""
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "issuer",
            "docs": [
              "The issuer that created this achievement"
            ],
            "type": "pubkey"
          },
          {
            "name": "name",
            "docs": [
              "Name of the achievement [1] - REQUIRED"
            ],
            "type": "string"
          },
          {
            "name": "description",
            "docs": [
              "Description of the achievement [1] - REQUIRED"
            ],
            "type": "string"
          },
          {
            "name": "criteria",
            "docs": [
              "Criteria for earning the achievement"
            ],
            "type": {
              "defined": {
                "name": "criteria"
              }
            }
          },
          {
            "name": "creator",
            "docs": [
              "Creator of the achievement [0..1] - RECOMMENDED"
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "createdAt",
            "docs": [
              "Timestamp when achievement was created (ISO 8601 string)"
            ],
            "type": "string"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "achievementCredential",
      "docs": [
        "AchievementCredential - the core on-chain asset (Verifiable Credential)",
        "Aligned with AchievementCredential class in OB v3.0 spec"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "docs": [
              "Unambiguous reference to the credential [1] - REQUIRED"
            ],
            "type": "string"
          },
          {
            "name": "context",
            "docs": [
              "@context [2..*] - JSON-LD context URIs"
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "r#type",
            "docs": [
              "type [1..*] - Must include VerifiableCredential and AchievementCredential"
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "issuer",
            "docs": [
              "issuer [1] - ProfileRef (using Pubkey for on-chain reference)"
            ],
            "type": "pubkey"
          },
          {
            "name": "validFrom",
            "docs": [
              "validFrom [1] - DateTimeZ (ISO 8601 string)"
            ],
            "type": "string"
          },
          {
            "name": "validUntil",
            "docs": [
              "validUntil [0..1] - DateTimeZ (ISO 8601 string, optional)"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "issuedAt",
            "docs": [
              "Issuance timestamp (ISO 8601 string)"
            ],
            "type": "string"
          },
          {
            "name": "credentialSubject",
            "docs": [
              "The recipient of the achievement [1] - REQUIRED"
            ],
            "type": {
              "defined": {
                "name": "achievementSubject"
              }
            }
          },
          {
            "name": "proof",
            "docs": [
              "Cryptographic proof [0..*] - STRONGLY RECOMMENDED"
            ],
            "type": {
              "option": {
                "defined": {
                  "name": "proof"
                }
              }
            }
          },
          {
            "name": "isRevoked",
            "docs": [
              "Whether the credential is revoked"
            ],
            "type": "bool"
          },
          {
            "name": "revokedAt",
            "docs": [
              "Timestamp when credential was revoked (ISO 8601 string, optional)"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "achievementSubject",
      "docs": [
        "AchievementSubject - represents the recipient of the credential",
        "Aligned with AchievementSubject class in OB v3.0 spec"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "docs": [
              "An identifier for the Credential Subject [0..1]"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "subjectType",
            "docs": [
              "Type array [1..*] - Must include \"AchievementSubject\"",
              "Note: Using subject_type temporarily to avoid r#type deserialization issues in nested structs"
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "achievement",
            "docs": [
              "The achievement being awarded [1] - REQUIRED"
            ],
            "type": "pubkey"
          },
          {
            "name": "identifier",
            "docs": [
              "Other identifiers for the recipient [0..*]"
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "identityObject"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "criteria",
      "docs": [
        "Criteria - describes how the achievement is earned",
        "Part of Achievement class in OB v3.0 spec"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "docs": [
              "URI of a webpage describing criteria [0..1] - RECOMMENDED"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "narrative",
            "docs": [
              "Narrative description of criteria [0..1] - RECOMMENDED"
            ],
            "type": {
              "option": "string"
            }
          }
        ]
      }
    },
    {
      "name": "identityObject",
      "docs": [
        "IdentityObject - represents identity information",
        "Aligned with IdentityObject class in OB v3.0 spec"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "identityType",
            "docs": [
              "Type [1] - Must be \"IdentityObject\""
            ],
            "type": "string"
          },
          {
            "name": "hashed",
            "docs": [
              "Whether identityHash is hashed [1] - REQUIRED"
            ],
            "type": "bool"
          },
          {
            "name": "identityHash",
            "docs": [
              "The identity value or its hash [1] - REQUIRED"
            ],
            "type": "string"
          },
          {
            "name": "identityTypeName",
            "docs": [
              "Type of identity (email, did, etc.) [1] - REQUIRED"
            ],
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "profile",
      "docs": [
        "Profile - represents the entity that issues credentials (Issuer)",
        "Aligned with Profile class in OB v3.0 spec"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "docs": [
              "Unique URI for the Profile [1] - REQUIRED"
            ],
            "type": "string"
          },
          {
            "name": "r#type",
            "docs": [
              "Type array [1..*] - Must include \"Profile\""
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "authority",
            "docs": [
              "Authority that can manage this issuer profile"
            ],
            "type": "pubkey"
          },
          {
            "name": "name",
            "docs": [
              "Name of the issuer [0..1] - RECOMMENDED"
            ],
            "type": "string"
          },
          {
            "name": "url",
            "docs": [
              "Homepage URL of the issuer [0..1] - RECOMMENDED"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "email",
            "docs": [
              "Contact email of the issuer [0..1] - RECOMMENDED"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "proof",
      "docs": [
        "Proof - cryptographic proof for verification",
        "Aligned with Proof class in VC Data Model v2.0 and Open Badges 3.0"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proofType",
            "docs": [
              "Signature suite used [1] - REQUIRED"
            ],
            "type": "string"
          },
          {
            "name": "cryptosuite",
            "docs": [
              "Cryptographic suite identifier [1] - REQUIRED for eddsa-rdfc-2022"
            ],
            "type": "string"
          },
          {
            "name": "created",
            "docs": [
              "Timestamp when proof was created [1] - REQUIRED (ISO 8601 format)"
            ],
            "type": "string"
          },
          {
            "name": "proofPurpose",
            "docs": [
              "Purpose of the proof [1] - Must be \"assertionMethod\""
            ],
            "type": "string"
          },
          {
            "name": "verificationMethod",
            "docs": [
              "URI of public key for verification [1] - REQUIRED"
            ],
            "type": "string"
          },
          {
            "name": "proofValue",
            "docs": [
              "The signature value [1] - REQUIRED"
            ],
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "revocationList",
      "docs": [
        "Account structure for storing revocation lists on-chain"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Authority who can manage this revocation list"
            ],
            "type": "pubkey"
          },
          {
            "name": "listId",
            "docs": [
              "Unique identifier for this revocation list"
            ],
            "type": "string"
          },
          {
            "name": "capacity",
            "docs": [
              "Maximum number of credentials this list can handle"
            ],
            "type": "u32"
          },
          {
            "name": "currentSize",
            "docs": [
              "Current number of credentials in the list"
            ],
            "type": "u32"
          },
          {
            "name": "statusBits",
            "docs": [
              "Bitfield representing revocation status (1 = revoked, 0 = active)",
              "Each bit represents one credential's status"
            ],
            "type": "bytes"
          },
          {
            "name": "metadata",
            "docs": [
              "Metadata about the revocation list"
            ],
            "type": {
              "defined": {
                "name": "revocationListMetadata"
              }
            }
          },
          {
            "name": "createdAt",
            "docs": [
              "Creation timestamp"
            ],
            "type": "string"
          },
          {
            "name": "updatedAt",
            "docs": [
              "Last update timestamp"
            ],
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "revocationListMetadata",
      "docs": [
        "Metadata for a revocation list"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "docs": [
              "Human-readable name for this list"
            ],
            "type": "string"
          },
          {
            "name": "description",
            "docs": [
              "Description of the list's purpose"
            ],
            "type": "string"
          },
          {
            "name": "statusListUrl",
            "docs": [
              "URL where the status list credential can be accessed"
            ],
            "type": "string"
          },
          {
            "name": "version",
            "docs": [
              "Version of the status list format"
            ],
            "type": "string"
          }
        ]
      }
    }
  ]
};
