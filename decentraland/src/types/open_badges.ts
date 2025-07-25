/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `src/idl/open_badges.json`.
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
      "name": "initializeIssuer",
      "docs": [
        "Initialize an issuer profile"
      ],
      "discriminator": [
        130,
        251,
        244,
        63,
        249,
        209,
        190,
        154
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
      "name": "issueAchievementCredential",
      "docs": [
        "Issue an AchievementCredential (the core VC) with Ed25519 signature verification"
      ],
      "discriminator": [
        193,
        206,
        102,
        165,
        13,
        44,
        138,
        98
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
          "name": "achievement",
          "docs": [
            "The achievement being credentialed"
          ]
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
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Achievement",
      "discriminator": [
        118,
        78,
        249,
        147,
        171,
        54,
        186,
        102
      ]
    },
    {
      "name": "AchievementCredential",
      "discriminator": [
        27,
        91,
        30,
        63,
        217,
        60,
        96,
        214
      ]
    },
    {
      "name": "Profile",
      "discriminator": [
        164,
        235,
        200,
        80,
        45,
        187,
        82,
        8
      ]
    }
  ],
  "types": [
    {
      "name": "Achievement",
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
            "name": "type",
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
      "name": "AchievementCredential",
      "docs": [
        "AchievementCredential - the core verifiable credential",
        "Aligned with AchievementCredential class in OB v3.0 spec"
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
              "Unique URI for the credential [1] - REQUIRED"
            ],
            "type": "string"
          },
          {
            "name": "type",
            "docs": [
              "Type array [1..*] - Must include \"VerifiableCredential\" and \"AchievementCredential\""
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "issuer",
            "docs": [
              "The issuer that issued this credential"
            ],
            "type": "pubkey"
          },
          {
            "name": "validFrom",
            "docs": [
              "Timestamp when credential becomes valid (ISO 8601 string)"
            ],
            "type": "string"
          },
          {
            "name": "validUntil",
            "docs": [
              "Timestamp when credential expires (ISO 8601 string) [0..1]"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "credentialSubject",
            "docs": [
              "Subject of the credential"
            ],
            "type": {
              "defined": {
                "name": "credentialSubject"
              }
            }
          },
          {
            "name": "credentialStatus",
            "docs": [
              "Status information for the credential [0..1]"
            ],
            "type": {
              "option": {
                "defined": {
                  "name": "credentialStatus"
                }
              }
            }
          },
          {
            "name": "achievement",
            "docs": [
              "The achievement being credentialed"
            ],
            "type": "pubkey"
          },
          {
            "name": "evidence",
            "docs": [
              "Evidence supporting the credential [0..*]"
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "evidence"
                }
              }
            }
          },
          {
            "name": "results",
            "docs": [
              "Results or outcomes related to the achievement [0..*]"
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "result"
                }
              }
            }
          },
          {
            "name": "issuedAt",
            "docs": [
              "Timestamp when credential was issued (ISO 8601 string)"
            ],
            "type": "string"
          },
          {
            "name": "proof",
            "docs": [
              "Cryptographic proof [0..*]"
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "proof"
                }
              }
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
      "name": "Criteria",
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
              "URI to a page describing the criteria [0..1]"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "narrative",
            "docs": [
              "Narrative description of what is needed to earn the achievement [0..1]"
            ],
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "CredentialSubject",
      "docs": [
        "CredentialSubject - the subject of the credential",
        "Part of AchievementCredential class in OB v3.0 spec"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "docs": [
              "DID of the subject [1] - REQUIRED"
            ],
            "type": "string"
          },
          {
            "name": "type",
            "docs": [
              "Type array [1..*] - Must include \"AchievementSubject\""
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "achievement",
            "docs": [
              "The achievement being asserted"
            ],
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "Profile",
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
              "Unique URI for the Profile [1] - REQUIRED (DID format)"
            ],
            "type": "string"
          },
          {
            "name": "type",
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
    }
  ]
}

export const IDL: OpenBadges = {
  "address": "6x9DvPXzw8RQimtZzATScuNxnPiYJxRTnnEaK4YmS2o8",
  "metadata": {
    "name": "openBadges",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
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
      "name": "initializeIssuer",
      "docs": [
        "Initialize an issuer profile"
      ],
      "discriminator": [
        130,
        251,
        244,
        63,
        249,
        209,
        190,
        154
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
      "name": "issueAchievementCredential",
      "docs": [
        "Issue an AchievementCredential (the core VC) with Ed25519 signature verification"
      ],
      "discriminator": [
        193,
        206,
        102,
        165,
        13,
        44,
        138,
        98
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
          "name": "achievement",
          "docs": [
            "The achievement being credentialed"
          ]
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
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Achievement",
      "discriminator": [
        118,
        78,
        249,
        147,
        171,
        54,
        186,
        102
      ]
    },
    {
      "name": "AchievementCredential",
      "discriminator": [
        27,
        91,
        30,
        63,
        217,
        60,
        96,
        214
      ]
    },
    {
      "name": "Profile",
      "discriminator": [
        164,
        235,
        200,
        80,
        45,
        187,
        82,
        8
      ]
    }
  ],
  "types": [
    {
      "name": "Achievement",
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
            "name": "type",
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
      "name": "AchievementCredential",
      "docs": [
        "AchievementCredential - the core verifiable credential",
        "Aligned with AchievementCredential class in OB v3.0 spec"
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
              "Unique URI for the credential [1] - REQUIRED"
            ],
            "type": "string"
          },
          {
            "name": "type",
            "docs": [
              "Type array [1..*] - Must include \"VerifiableCredential\" and \"AchievementCredential\""
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "issuer",
            "docs": [
              "The issuer that issued this credential"
            ],
            "type": "pubkey"
          },
          {
            "name": "validFrom",
            "docs": [
              "Timestamp when credential becomes valid (ISO 8601 string)"
            ],
            "type": "string"
          },
          {
            "name": "validUntil",
            "docs": [
              "Timestamp when credential expires (ISO 8601 string) [0..1]"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "credentialSubject",
            "docs": [
              "Subject of the credential"
            ],
            "type": {
              "defined": {
                "name": "credentialSubject"
              }
            }
          },
          {
            "name": "credentialStatus",
            "docs": [
              "Status information for the credential [0..1]"
            ],
            "type": {
              "option": {
                "defined": {
                  "name": "credentialStatus"
                }
              }
            }
          },
          {
            "name": "achievement",
            "docs": [
              "The achievement being credentialed"
            ],
            "type": "pubkey"
          },
          {
            "name": "evidence",
            "docs": [
              "Evidence supporting the credential [0..*]"
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "evidence"
                }
              }
            }
          },
          {
            "name": "results",
            "docs": [
              "Results or outcomes related to the achievement [0..*]"
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "result"
                }
              }
            }
          },
          {
            "name": "issuedAt",
            "docs": [
              "Timestamp when credential was issued (ISO 8601 string)"
            ],
            "type": "string"
          },
          {
            "name": "proof",
            "docs": [
              "Cryptographic proof [0..*]"
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "proof"
                }
              }
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
      "name": "Criteria",
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
              "URI to a page describing the criteria [0..1]"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "narrative",
            "docs": [
              "Narrative description of what is needed to earn the achievement [0..1]"
            ],
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "CredentialSubject",
      "docs": [
        "CredentialSubject - the subject of the credential",
        "Part of AchievementCredential class in OB v3.0 spec"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "docs": [
              "DID of the subject [1] - REQUIRED"
            ],
            "type": "string"
          },
          {
            "name": "type",
            "docs": [
              "Type array [1..*] - Must include \"AchievementSubject\""
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "achievement",
            "docs": [
              "The achievement being asserted"
            ],
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "Profile",
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
              "Unique URI for the Profile [1] - REQUIRED (DID format)"
            ],
            "type": "string"
          },
          {
            "name": "type",
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
    }
  ]
} 