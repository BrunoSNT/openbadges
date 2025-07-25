# Decentralized Learning Ecosystem - Solana Implementation

## Overview

The Decentralized Learning Ecosystem is a Solana-based implementation of the SmartUnB.ECOS project specifications. This system provides a truly decentralized learning environment that empowers learners with full ownership and control over their educational data through blockchain technology and IPFS for distributed storage.

## Architecture

The system consists of three main components:

1. **Personal Data Store (PDS)** - Decentralized storage for user data with fine-grained access control
2. **Learning Record Store (LRS)** - Blockchain-based storage for xAPI learning statements
3. **xAPI Integration** - Full compliance with xAPI specification for interoperability

### Key Features

- **Decentralized Data Ownership**: Learners own and control their data through Solana smart contracts
- **IPFS Integration**: Content stored on IPFS with metadata and access control on blockchain
- **Consent-Based Access**: Granular permission system for data sharing
- **xAPI Compliance**: Full support for xAPI 1.0.3 specification
- **Immutable Learning Records**: Tamper-proof storage of learning activities
- **Interoperability**: Open standards support for integration with existing LMS platforms

## Program Structure

### State Accounts

#### PersonalDataStore
```rust
pub struct PersonalDataStore {
    pub owner: Pubkey,                      // Owner of this data store
    pub data_records: Vec<DataRecordMetadata>, // Data records metadata
    pub created_at: String,                 // ISO 8601 timestamp
    pub last_accessed: String,              // ISO 8601 timestamp
    pub bump: u8,                          // PDA bump seed
}
```

#### LearningRecordStore
```rust
pub struct LearningRecordStore {
    pub owner: Pubkey,                        // Owner of this LRS
    pub statements: Vec<XApiStatementMetadata>, // xAPI statement metadata
    pub created_at: String,                   // ISO 8601 timestamp
    pub last_accessed: String,                // ISO 8601 timestamp
    pub bump: u8,                            // PDA bump seed
}
```

#### DataRecordMetadata
```rust
pub struct DataRecordMetadata {
    pub ipfs_cid: String,                  // IPFS Content Identifier
    pub path: String,                      // Logical file path
    pub content_type: String,              // MIME type
    pub size: u64,                         // File size in bytes
    pub checksum: String,                  // Integrity checksum
    pub created_at: String,                // ISO 8601 timestamp
    pub updated_at: String,                // ISO 8601 timestamp
    pub permissions: Vec<PermissionEntry>, // Access control list
    pub is_active: bool,                   // Soft delete flag
}
```

### Instructions

#### Personal Data Store Instructions

1. **initialize_personal_data_store**: Creates a new data store for a user
2. **create_data_record**: Adds a new data record with IPFS CID and permissions
3. **update_data_record_cid**: Updates the IPFS CID for existing data
4. **update_permissions**: Modifies access permissions for data records
5. **get_data_record_metadata**: Retrieves metadata with permission enforcement
6. **delete_data_record**: Soft deletes a data record

#### Learning Record Store Instructions

1. **initialize_learning_record_store**: Creates a new LRS for a user
2. **store_xapi_statement**: Stores xAPI statements with consent management
3. **get_xapi_statements**: Queries statements with filtering and consent enforcement
4. **get_xapi_statement_by_id**: Retrieves specific statements by ID

## Usage Examples

### Setting up a Personal Data Store

```typescript
// Initialize personal data store
await program.methods
  .initializePersonalDataStore()
  .accounts({
    personalDataStore: personalDataStorePDA,
    owner: userKeypair.publicKey,
    payer: userKeypair.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([userKeypair])
  .rpc();

// Create a data record
await program.methods
  .createDataRecord(
    "QmHash123...", // IPFS CID
    "/profile/bio.json", // Path
    "application/json", // Content type
    1024, // Size
    "checksum123", // Checksum
    [] // Initial permissions
  )
  .accounts({
    personalDataStore: personalDataStorePDA,
    owner: userKeypair.publicKey,
  })
  .signers([userKeypair])
  .rpc();
```

### Recording Learning Activities

```typescript
// Initialize learning record store
await program.methods
  .initializeLearningRecordStore()
  .accounts({
    learningRecordStore: learningRecordStorePDA,
    owner: userKeypair.publicKey,
    payer: userKeypair.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([userKeypair])
  .rpc();

// Store xAPI statement
await program.methods
  .storeXapiStatement(
    "QmXAPIHash...", // IPFS CID of xAPI JSON
    userKeypair.publicKey, // Actor (learner)
    "uuid-statement-id", // Unique statement ID
    "http://adlnet.gov/expapi/verbs/completed", // Verb
    "http://example.com/course/intro", // Object
    "statement_checksum" // Checksum
  )
  .accounts({
    learningRecordStore: learningRecordStorePDA,
    actorPubkey: userKeypair.publicKey,
    authority: authorityKeypair.publicKey,
    personalDataStore: personalDataStorePDA,
  })
  .signers([authorityKeypair])
  .rpc();
```

### Querying Learning Records

```typescript
// Query xAPI statements with filters
const query = {
  actorPubkey: userKeypair.publicKey,
  verbId: "http://adlnet.gov/expapi/verbs/completed",
  objectId: null,
  startDate: "2024-01-01T00:00:00Z",
  endDate: null,
  limit: 10,
  offset: 0,
};

const result = await program.methods
  .getXapiStatements(query)
  .accounts({
    learningRecordStore: learningRecordStorePDA,
    dataOwner: userKeypair.publicKey,
    requester: requesterKeypair.publicKey,
    personalDataStore: personalDataStorePDA,
  })
  .signers([requesterKeypair])
  .rpc();
```

## Integration with IPFS

The system uses IPFS for storing actual content while keeping metadata and access control on the blockchain. Here's the typical workflow:

1. **Upload to IPFS**: Content is uploaded to IPFS using a client or service
2. **Get CID**: IPFS returns a Content Identifier (CID)
3. **Store Metadata**: CID and metadata are stored on Solana with access controls
4. **Retrieve Content**: Applications query blockchain for CID, then fetch from IPFS

### IPFS Integration Example

```javascript
// Example using ipfs-http-client
import { create } from 'ipfs-http-client';

const ipfs = create({ url: 'https://ipfs.infura.io:5001' });

// Upload content to IPFS
const result = await ipfs.add(JSON.stringify(xapiStatement));
const ipfsCid = result.cid.toString();

// Store metadata on blockchain
await program.methods
  .createDataRecord(ipfsCid, path, contentType, size, checksum, permissions)
  .accounts({ /* ... */ })
  .rpc();

// Retrieve content
const metadata = await program.methods
  .getDataRecordMetadata(path)
  .accounts({ /* ... */ })
  .rpc();

const content = await ipfs.cat(metadata.ipfsCid);
```

## xAPI Compliance

The system fully supports xAPI 1.0.3 specification with the following features:

- Complete xAPI statement structure
- Actor identification (including Solana public keys)
- Verb taxonomy support
- Activity objects and definitions
- Results and scoring
- Context information
- Statement validation

### xAPI Statement Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "actor": {
    "objectType": "Agent",
    "solana_pubkey": "3vZ4qZ...ABC123",
    "name": "John Doe"
  },
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/completed",
    "display": "completed"
  },
  "object": {
    "objectType": "Activity",
    "id": "http://example.com/courses/blockchain-basics",
    "definition": {
      "name": "Introduction to Blockchain",
      "description": "Basic concepts of blockchain technology"
    }
  },
  "result": {
    "completion": true,
    "success": true,
    "score": {
      "scaled": 0.85
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Security and Privacy

### Access Control

The system implements fine-grained access control through:

- **Owner Permissions**: Data owners have full control over their data
- **Granular ACLs**: Specific permissions (read, write, update, delete) for each user
- **Expiration Support**: Time-based permission expiration
- **Consent Enforcement**: On-chain validation of permissions before data access

### Privacy Features

- **Data Minimization**: Only metadata stored on-chain, content on IPFS
- **Selective Disclosure**: Users control which data is shared with whom
- **Immutable Consent**: Permission grants/revocations are permanently recorded
- **Decentralized Identity**: Solana public keys serve as identity anchors

## Deployment

### Prerequisites

- Solana CLI tools
- Anchor framework 0.31.1+
- Node.js and TypeScript
- IPFS node or service (Infura, Pinata, etc.)

### Build and Deploy

```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Generate TypeScript types
anchor idl parse --file target/idl/decentralized_learning.json --out app/src/idl/

# Run tests
anchor test
```

### Environment Setup

```bash
# Set up Solana CLI for devnet
solana config set --url devnet

# Create and fund a keypair
solana-keygen new --outfile ~/.config/solana/id.json
solana airdrop 2

# Build and deploy
anchor build
anchor deploy
```

## Integration with Existing LMS

The system can integrate with existing Learning Management Systems through:

1. **LTI (Learning Tools Interoperability)** compliance
2. **RESTful APIs** for data exchange
3. **Webhook notifications** for real-time updates
4. **SDK libraries** for popular platforms

### LTI Integration Example

```javascript
// LMS generates xAPI statement
const xapiStatement = {
  actor: { solana_pubkey: studentWallet },
  verb: { id: "http://adlnet.gov/expapi/verbs/experienced" },
  object: { id: courseUrl },
  result: { score: { raw: 85 } }
};

// Upload to IPFS
const ipfsCid = await uploadToIPFS(xapiStatement);

// Store on blockchain
await storeXAPIStatement(ipfsCid, studentWallet, statementId);
```

## API Reference

### RPC Methods

All program methods are available as RPC calls through Anchor's generated client:

```typescript
// Personal Data Store
await program.methods.initializePersonalDataStore()
await program.methods.createDataRecord(...)
await program.methods.updateDataRecordCid(...)
await program.methods.updatePermissions(...)
await program.methods.getDataRecordMetadata(...)
await program.methods.deleteDataRecord(...)

// Learning Record Store
await program.methods.initializeLearningRecordStore()
await program.methods.storeXapiStatement(...)
await program.methods.getXapiStatements(...)
await program.methods.getXapiStatementById(...)
```

### Account Structures

See the type definitions in `target/types/decentralized_learning.ts` for complete account structures and method signatures.

## Roadmap

### Phase 1 (Current)
- ✅ Core personal data store functionality
- ✅ Learning record store with xAPI support
- ✅ Basic access control and permissions
- ✅ IPFS integration architecture

### Phase 2 (Next)
- 🔄 Enhanced query capabilities with indexing
- 🔄 Comprehensive Learner Record (CLR) generation
- 🔄 LTI Advantage 1.3 consumer implementation
- 🔄 Real-time event notifications

### Phase 3 (Future)
- 📋 Advanced analytics and reporting
- 📋 Multi-chain interoperability
- 📋 AI-powered learning insights
- 📋 Mobile SDK development

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests for any improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please:

1. Check the documentation and examples
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Join our Discord community for real-time help

---

*This implementation fulfills the requirements specified in the SmartUnB.ECOS project documentation, providing a complete decentralized learning ecosystem with personal data ownership, consent management, and xAPI compliance.* 