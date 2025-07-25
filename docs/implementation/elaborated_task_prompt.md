# Elaborated Task Prompt: SmartUnB.ECOS - Decentralized Learning Ecosystem

## Overall Mission Context
The SmartUnB.ECOS project aims to create a truly decentralized learning ecosystem. This involves moving beyond traditional centralized data stores to empower learners with full ownership and control over their educational data. The core of this decentralization will be achieved by leveraging Solana smart contracts for identity, metadata, and access control, combined with IPFS for distributed content storage. This document outlines elaborated tasks for key components 3, 4, and 5, which are fundamental to this new architectural vision.

## Task 1: Decentralized Personal Data Store (Component 3: Replacing "POD server")

### Objective
To design and implement a robust, scalable, and secure decentralized personal data store. This component will serve as the core replacement for the traditional "POD server" concept, allowing learners to host and manage their personal data (including learning records, profiles, and other digital assets) in a completely decentralized manner. The Solana blockchain will manage data references, access permissions, and user identities, while IPFS will handle the actual data content.

### Key Requirements

*   **Solana Program Development (using Anchor Framework):**
    *   Develop a Solana program that acts as the central registry for all user data.
    *   Each user will have an associated account on Solana that stores metadata about their data, rather than the data itself.
    *   **Data Structure:** Define a Solana account structure capable of storing:
        *   IPFS Content Identifiers (CIDs) for each piece of user data.
        *   Logical file paths or resource identifiers (e.g., `/profile/bio.json`, `/learning/xapi_statement_1.json`).
        *   Metadata associated with each CID (e.g., file type, creation timestamp, size, checksum).
        *   Access Control List (ACL) entries for each CID, specifying which Solana public keys (users or applications) have `read`, `write`, `update`, or `delete` permissions.
    *   **Core Functions (Instructions):**
        *   `create_data_record(ipfs_cid: String, path: String, initial_permissions: Vec<PermissionEntry>)`: Allows a user to register a new piece of data stored on IPFS, along with its path and initial access permissions.
        *   `update_data_record_cid(path: String, new_ipfs_cid: String)`: Allows a user to update the IPFS CID for an existing path, effectively updating the data. This will involve invalidating the old CID and associating the new one.
        *   `update_permissions(path: String, new_permissions: Vec<PermissionEntry>)`: Enables the data owner to modify access permissions for a specific data record.
        *   `get_data_record_metadata(path: String) -> (ipfs_cid: String, permissions: Vec<PermissionEntry>)`: Allows querying the smart contract for metadata and permissions associated with a given path. This function must enforce on-chain access checks based on the caller's public key.
        *   `delete_data_record(path: String)`: Marks a data record as inactive on the blockchain. Actual data deletion from IPFS is a more complex topic, but this instruction will remove the blockchain reference and associated permissions.
*   **IPFS Integration:**
    *   Provide clear guidelines and example code for uploading data to IPFS (e.g., using `ipfs-http-client` or a service like Pinata for pinning). Note that this is typically handled off-chain by client applications.
    *   Explain how applications will retrieve data from IPFS using the CIDs obtained from the Solana smart contract.
*   **User Identity:** Solana public keys will serve as the primary decentralized identity for users within this data store.
*   **Security & Consent:**
    *   All write operations to the smart contract must be signed by the data owner.
    *   Implement robust permission checks within the smart contract for all read and write operations, ensuring data access is strictly governed by the defined ACLs.
    *   Consider implementing a mechanism for users to delegate temporary access tokens for specific data records.
*   **Testing:** Comprehensive unit and integration tests for all Solana program instructions, focusing on permission enforcement and data integrity.

## Task 2: Learning Record Store (LRS) on Blockchain (Component 4)

### Objective
To build the Learning Record Store (LRS) functionality directly on the Solana blockchain, leveraging the decentralized personal data store implemented in Task 1. This LRS will enable the secure, immutable, and consent-driven storage of xAPI statements, forming the foundation for decentralized learning analytics.

### Key Requirements

*   **Solana Program Extension (Leveraging Task 1):**
    *   Extend the Solana program from Task 1 (or create a new, interconnected program) to specifically handle xAPI statements.
    *   **xAPI Statement Storage:**
        *   An instruction `store_xapi_statement(statement_json_cid: String, actor_solana_pubkey: PublicKey, context_activities: Vec<String>)`: This instruction will take an IPFS CID of an xAPI statement (which itself is a JSON object), the Solana public key of the actor, and relevant context (e.g., activity IDs) as parameters. The actual xAPI JSON content will be stored on IPFS.
        *   The smart contract will record the `statement_json_cid`, `actor_solana_pubkey`, and potentially index key elements from the statement (e.g., verb, object ID) on-chain for efficient filtering and querying.
        *   Crucially, this instruction will utilize the `create_data_record` (or similar) instruction from Task 1 to register the xAPI statement's CID under the actor's decentralized data store, applying default or specified permissions.
    *   **xAPI Statement Retrieval:**
        *   An instruction `get_xapi_statements(actor_pubkey: Option<PublicKey>, verb: Option<String>, object_id: Option<String>, start_date: Option<u64>, end_date: Option<u64>) -> Vec<StatementMetadata>`: This instruction will allow authorized parties to query for xAPI statement metadata (including CIDs) based on various filters.
        *   This instruction **must** integrate with the consent management logic from Task 1. Before returning any CIDs, the smart contract must verify that the caller has explicit read permission from the `actor_solana_pubkey` for the respective xAPI statement's data record.
        *   The returned `StatementMetadata` would include the `ipfs_cid` and potentially other indexed on-chain data, allowing the client to fetch the full xAPI JSON from IPFS.
*   **xAPI Standard Compliance:** Ensure the parsing and handling of xAPI statements conform to the xAPI specification (e.g., version 1.0.3).
*   **Immutable Record Keeping:** Emphasize that once an xAPI statement is recorded on the blockchain via its CID, the reference is immutable, guaranteeing the integrity of the learning record.
*   **Learning Analytics Integration:** Provide clear guidelines for how learning analytics applications can query the LRS smart contract and retrieve data (with consent) for analysis.
*   **Testing:** Thorough testing of xAPI statement storage and retrieval, especially focusing on edge cases for filtering and rigorous enforcement of consent mechanisms.

## Task 3: LMS (Learning Management Systems) LTI Consumers (Component 5)

### Objective
To develop an LTI (Learning Tools Interoperability) Consumer application or adapt an existing LMS (e.g., Moodle) to seamlessly integrate with the Solana-based LRS and decentralized personal data store. The goal is to demonstrate how traditional learning platforms can leverage decentralized technologies for enhanced learner data ownership and interoperability.

### Key Requirements

*   **LTI Advantage Implementation:**
    *   Develop or configure the LMS to be a full LTI Advantage 1.3 compliant consumer.
    *   Implement necessary services: Names and Roles Provisioning Services, Assignment and Grade Services, Deep Linking, and Authentication (OpenID Connect).
*   **xAPI Statement Generation and Submission:**
    *   The LMS must be capable of generating xAPI statements for a wide range of learning activities conducted within the platform (e.g., course completion, assignment submission, quiz attempts, forum posts, content views).
    *   Develop a client-side module or plugin for the LMS that interacts with the LRS on Blockchain (Task 2) API.
    *   This module will:
        *   Upload the generated xAPI statement JSON to IPFS.
        *   Obtain the IPFS CID.
        *   Call the `store_xapi_statement` instruction on the Solana smart contract, passing the CID and relevant actor information.
        *   Ensure user consent is managed appropriately before sending data to the LRS.
*   **Comprehensive Learner Record (CLR) Retrieval and Display:**
    *   Implement functionality within the LMS to retrieve a learner's comprehensive xAPI data from the LRS on Blockchain.
    *   This will involve:
        *   Calling the `get_xapi_statements` instruction on the Solana smart contract (Task 2) for the specific learner, applying necessary filters.
        *   Iterating through the returned IPFS CIDs and fetching the full xAPI statements from IPFS.
        *   Aggregating and displaying this data in a user-friendly format within the LMS interface, effectively generating a CLR from decentralized sources.
        *   Strictly adhere to the on-chain consent mechanisms when retrieving and displaying data.
*   **User Identity and Wallet Integration:**
    *   Explore mechanisms for linking LMS user accounts to Solana public keys (wallets).
    *   Consider integrating a Solana wallet connector (e.g., Phantom, Solflare) within the LMS for user authentication and transaction signing.
*   **API Interaction Layer:** Develop a robust API client within the LMS (or a proxy service) to handle secure communication with the Solana blockchain and IPFS gateways.
*   **Testing:**
    *   End-to-end testing of LTI launches and service calls.
    *   Verification of xAPI statement generation and successful submission to the LRS on Blockchain.
    *   Testing of CLR retrieval and display, ensuring correct data aggregation and strict adherence to consent rules.
    *   Security testing for LTI and blockchain interactions. 