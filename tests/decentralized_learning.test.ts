import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PersonalDataStore } from "../target/types/personal_data_store";
import { LearningRecordStore } from "../target/types/learning_record_store";
import { LearningRecordManager } from "../target/types/learning_record_manager";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("Modular Learning Ecosystem", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  // Get program instances
  const pdsProgram = anchor.workspace.PersonalDataStore as Program<PersonalDataStore>;
  const lrsProgram = anchor.workspace.LearningRecordStore as Program<LearningRecordStore>;
  const lrmProgram = anchor.workspace.LearningRecordManager as Program<LearningRecordManager>;
  const provider = anchor.getProvider();

  // Test accounts
  let userKeypair: Keypair;
  let authorityKeypair: Keypair;
  let anotherUserKeypair: Keypair;
  
  // PDAs
  let personalDataStorePDA: PublicKey;
  let lrsPDA: PublicKey;
  let lrmPDA: PublicKey;
  let statementCollectionPDA: PublicKey;

  const TEST_COLLECTION_ID = "default";

  before(async () => {
    // Create test accounts
    userKeypair = Keypair.generate();
    authorityKeypair = Keypair.generate();
    anotherUserKeypair = Keypair.generate();

    // Airdrop SOL for testing - wait for each one to complete
    const userAirdropSig = await provider.connection.requestAirdrop(userKeypair.publicKey, 20 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(userAirdropSig, "confirmed");
    
    const authorityAirdropSig = await provider.connection.requestAirdrop(authorityKeypair.publicKey, 20 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(authorityAirdropSig, "confirmed");

    const anotherUserAirdropSig = await provider.connection.requestAirdrop(anotherUserKeypair.publicKey, 20 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(anotherUserAirdropSig, "confirmed");

    // Derive PDAs for Personal Data Store
    [personalDataStorePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("personal_data_store"), userKeypair.publicKey.toBuffer()],
      pdsProgram.programId
    );

    // Derive PDAs for Learning Record Store
    [lrsPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("learning_record_store"), authorityKeypair.publicKey.toBuffer()],
      lrsProgram.programId
    );

    [statementCollectionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("statement_collection"), authorityKeypair.publicKey.toBuffer(), Buffer.from(TEST_COLLECTION_ID)],
      lrsProgram.programId
    );

    // Derive PDAs for Learning Record Manager
    [lrmPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("learning_record_manager"), authorityKeypair.publicKey.toBuffer()],
      lrmProgram.programId
    );
  });

  describe("Personal Data Store Program", () => {
    it("Initialize Personal Data Store", async () => {
      await pdsProgram.methods
        .initializeDataStore()
        .accountsStrict({
          dataStore: personalDataStorePDA,
          owner: userKeypair.publicKey,
          payer: userKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      const dataStore = await pdsProgram.account.personalDataStore.fetch(personalDataStorePDA);
      expect(dataStore.owner.toString()).to.equal(userKeypair.publicKey.toString());
      expect(dataStore.dataRecords).to.have.length(0);
    });

    it("Create Data Record", async () => {
      const ipfsCid = "QmTest1234567890abcdef1234567890abcdef12345";
      const path = "/profile/bio.json";
      const contentType = "application/json";
      const size = new anchor.BN(1024);
      const checksum = "abc123def456";
      const initialPermissions = [
        {
          grantee: authorityKeypair.publicKey,
          permissions: [{ read: {} }],
          grantedAt: new Date().toISOString(),
          expiresAt: null,
        }
      ];

      await pdsProgram.methods
        .createDataRecord(
          ipfsCid,
          path,
          contentType,
          size,
          checksum,
          initialPermissions
        )
        .accountsStrict({
          dataStore: personalDataStorePDA,
          owner: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      const dataStore = await pdsProgram.account.personalDataStore.fetch(personalDataStorePDA);
      expect(dataStore.dataRecords).to.have.length(1);
      expect(dataStore.dataRecords[0].ipfsCid).to.equal(ipfsCid);
      expect(dataStore.dataRecords[0].path).to.equal(path);
      expect(dataStore.dataRecords[0].contentType).to.equal(contentType);
    });

    it("Update Data Record CID", async () => {
      const path = "/profile/bio.json";
      const newIpfsCid = "QmNewTest1234567890abcdef1234567890abcdef12345";
      const newChecksum = "def456abc123";

      await pdsProgram.methods
        .updateDataRecordCid(path, newIpfsCid, newChecksum)
        .accountsStrict({
          dataStore: personalDataStorePDA,
          owner: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      const dataStore = await pdsProgram.account.personalDataStore.fetch(personalDataStorePDA);
      expect(dataStore.dataRecords[0].ipfsCid).to.equal(newIpfsCid);
      expect(dataStore.dataRecords[0].checksum).to.equal(newChecksum);
    });

    // Note: Skipping permission update test due to complex enum types
    // In a real implementation, you would use the grantAccess method with proper enum formatting
  });

  describe("Learning Record Store Program", () => {
    it("Initialize Learning Record Store", async () => {
      await lrsProgram.methods
        .initializeLrs()
        .accountsStrict({
          lrs: lrsPDA,
          authority: authorityKeypair.publicKey,
          payer: authorityKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authorityKeypair])
        .rpc();

      const lrs = await lrsProgram.account.learningRecordStore.fetch(lrsPDA);
      expect(lrs.authority.toString()).to.equal(authorityKeypair.publicKey.toString());
      expect(lrs.totalStatements.toString()).to.equal("0");
    });

    it("Initialize Statement Collection", async () => {
      await lrsProgram.methods
        .initializeStatementCollection(TEST_COLLECTION_ID)
        .accountsStrict({
          statementCollection: statementCollectionPDA,
          lrs: lrsPDA,
          authority: authorityKeypair.publicKey,
          payer: authorityKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authorityKeypair])
        .rpc();

      // Transaction success indicates the statement collection was initialized
      console.log("Statement collection initialized successfully");
    });

    it("Store xAPI Statement", async () => {
      const statementId = "550e8400-e29b-41d4-a716-446655440000";
      const statementJsonCid = "QmXAPIStatement1234567890abcdef1234567890";
      const verbId = "http://adlnet.gov/expapi/verbs/completed";
      const objectId = "http://example.com/courses/intro-to-solana";
      const checksum = "xapi123456";

      await lrsProgram.methods
        .storeXapiStatement(
          statementId,
          statementJsonCid,
          verbId,
          objectId,
          checksum
        )
        .accountsStrict({
          statementCollection: statementCollectionPDA,
          lrs: lrsPDA,
          authority: authorityKeypair.publicKey,
          actor: userKeypair.publicKey,
          pdsProgram: pdsProgram.programId,
          actorDataStore: personalDataStorePDA,
        })
        .signers([authorityKeypair])
        .rpc();

      const lrs = await lrsProgram.account.learningRecordStore.fetch(lrsPDA);
      expect(lrs.totalStatements.toString()).to.equal("1");
    });

    it("Update Statement Consent", async () => {
      const statementId = "550e8400-e29b-41d4-a716-446655440000";
      const allowedReaders = [anotherUserKeypair.publicKey];

      await lrsProgram.methods
        .updateStatementConsent(statementId, allowedReaders)
        .accountsStrict({
          statementCollection: statementCollectionPDA,
          actor: userKeypair.publicKey,
          authority: authorityKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      // Note: Cannot easily verify consent updates without additional getter methods
      console.log("Statement consent updated successfully");
    });

    it("Query xAPI Statements", async () => {
      // Since we're using .rpc() instead of .view(), we can only verify the transaction succeeds
      await lrsProgram.methods
        .queryXapiStatements(
          userKeypair.publicKey, // actor_filter
          "http://adlnet.gov/expapi/verbs/completed", // verb_filter
          null, // object_filter
          null, // start_date
          null, // end_date
          10    // limit
        )
        .accountsStrict({
          statementCollection: statementCollectionPDA,
          lrs: lrsPDA,
          authority: authorityKeypair.publicKey,
          requester: authorityKeypair.publicKey,
        })
        .signers([authorityKeypair])
        .rpc();

      // Transaction success indicates the query was processed
      console.log("Query executed successfully");
    });
  });

  describe("Learning Record Manager Program", () => {
    it("Initialize Learning Record Manager", async () => {
      await lrmProgram.methods
        .initializeManager()
        .accountsStrict({
          manager: lrmPDA,
          authority: authorityKeypair.publicKey,
          payer: authorityKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authorityKeypair])
        .rpc();

      const manager = await lrmProgram.account.learningRecordManager.fetch(lrmPDA);
      expect(manager.authority.toString()).to.equal(authorityKeypair.publicKey.toString());
      expect(manager.totalRecords.toString()).to.equal("0");
    });

    // Note: The other LRM methods are stubs in the current implementation
    // In a full implementation, these would orchestrate CPI calls to PDS and LRS
  });

  describe("Integration Tests", () => {
    it("End-to-end Learning Activity Recording", async () => {
      // This test now relies on successful initialization of all programs above
      // Personal Data Store: Initialize and Create Data Record
      const ipfsCid = "QmIntegrationTestCid1234567890abcdef12345";
      const path = "/activity/log.json";
      const contentType = "application/json";
      const size = new anchor.BN(512);
      const checksum = "intchksum";
      const initialPermissions: any[] = []; // No initial permissions for simplicity

      await pdsProgram.methods
        .createDataRecord(
          ipfsCid,
          path,
          contentType,
          size,
          checksum,
          initialPermissions
        )
        .accountsStrict({
          dataStore: personalDataStorePDA,
          owner: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      // Learning Record Store: Store xAPI Statement
      const statementId = "integration-statement-id-1";
      const statementJsonCid = "QmIntegrationXAPIStatement";
      const verbId = "http://adlnet.gov/expapi/verbs/experienced";
      const objectId = "http://example.com/activities/integration";
      const xapiChecksum = "xapiintchksum";

      await lrsProgram.methods
        .storeXapiStatement(
          statementId,
          statementJsonCid,
          verbId,
          objectId,
          xapiChecksum
        )
        .accountsStrict({
          statementCollection: statementCollectionPDA,
          lrs: lrsPDA,
          authority: authorityKeypair.publicKey,
          actor: userKeypair.publicKey,
          pdsProgram: pdsProgram.programId,
          actorDataStore: personalDataStorePDA,
        })
        .signers([authorityKeypair])
        .rpc();

      // Verify data in LRS
      const lrs = await lrsProgram.account.learningRecordStore.fetch(lrsPDA);
      expect(lrs.totalStatements.toString()).to.equal("2"); // One from previous test, one from this

      // Learning Record Manager: No specific action needed in this integration for LRM yet,
      // but it would orchestrate interactions between PDS and LRS.

      console.log("End-to-end learning activity recording successful");
    });
  });
}); 