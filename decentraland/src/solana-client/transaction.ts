import { loadCryptoLibraries } from './crypto';
import { borshSerializeString, stringToBytes, encodeLength, bytesToBase64, base58ToBytes } from './utils';
import { WalletManager } from './wallet';
import { PdaManager } from './pda';

export class TransactionManager {
    public rpcUrl: string;
    public programId: string;
    public walletManager: WalletManager;
    public pdaManager: PdaManager;

    constructor(rpcUrl: string = 'https://devnet.helius-rpc.com/?api-key=9956fdea-9608-4dda-9a35-46b60acd303f', programId: string = 'FFQUgGaWxQFGnCe3VBmRZ259wtWHxjkpCqePouiyfzH5', walletManager?: WalletManager) {
        this.rpcUrl = rpcUrl;
        this.programId = programId;
        this.walletManager = walletManager || new WalletManager();
        this.pdaManager = new PdaManager(this.programId);
    }

    async generateWallet(): Promise<{ address: string; privateKey: string }> {
        return this.walletManager.generateWallet();
    }

    async getBalanceForAddress(address: string): Promise<number> {
        try {
            console.log(`🔍 Fetching balance for address: ${address}`)
            console.log(`🌐 RPC URL: ${this.rpcUrl}`)
            
            const response = await fetch(this.rpcUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getBalance',
                params: [address]
              })
            })
      
            console.log(`📡 RPC Response status: ${response.status}`)
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
      
            const data = await response.json()
            console.log(`📊 RPC Response data:`, data)
            
            if (data.error) {
              throw new Error(`RPC Error: ${data.error.message || JSON.stringify(data.error)}`)
            }
      
            let lamports: number
            if (typeof data.result === 'number') {
              lamports = data.result
            } else if (data.result && typeof data.result.value === 'number') {
              lamports = data.result.value
            } else {
              throw new Error(`Invalid balance response format: ${JSON.stringify(data.result)}`)
            }
            
            const solBalance = lamports / 1000000000
            console.log(`💰 Balance for ${address}: ${lamports} lamports (${solBalance} SOL)`)
            return solBalance
          } catch (error) {
            console.error(`❌ Failed to get balance for ${address}:`, error)
            throw error
          }
    }

    async getAccountInfo(address: string): Promise<any> {
        try {
            console.log(`🔍 Fetching account info for: ${address}`)
            
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getAccountInfo',
                    params: [
                        address,
                        {
                            encoding: 'jsonParsed'
                        }
                    ]
                })
            });
            
            console.log(`📡 Account info response status: ${response.status}`)
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            console.log(`📊 Account info response:`, data)
            
            if (data.error) {
                console.log(`Account info error for ${address}:`, data.error.message);
                return null;
            }
            
            // Check if account is actually initialized (has data and balance)
            const accountInfo = data.result?.value;
            if (!accountInfo || !accountInfo.data || accountInfo.lamports === 0) {
                console.log(`Account ${address} exists but is not initialized (no data or balance)`);
                return null;
            }
            
            console.log(`✅ Account ${address} is initialized with data and balance: ${accountInfo.lamports} lamports`);
            return data.result;
        } catch (error) {
            console.error(`❌ Failed to get account info for ${address}:`, error);
            throw error;
        }
    }

    async sendTransaction(instructionName: string, accounts: any[], data: any): Promise<string> {
        console.log(`📤 Sending REAL blockchain transaction: ${instructionName}`);
        
        // For account creation transactions, check if the account doesn't exist yet
        // For other transactions, check if the relevant account has balance
        let shouldProceed = true;
        if (instructionName === 'create_achievement' || instructionName === 'initialize_issuer') {
            // For creation transactions, we expect the target account to NOT exist
            const targetAccount = accounts.find(acc => acc.isWritable && !acc.isSigner);
            if (targetAccount) {
                try {
                    const accountInfo = await this.getAccountInfo(targetAccount.pubkey);
                    if (accountInfo) {
                        throw new Error(`Account ${targetAccount.pubkey} already exists`);
                    }
                } catch (error) {
                    if (!(error as Error).message.includes('already exists')) {
                        // Account doesn't exist, which is what we want for creation
                        console.log(`✅ Target account ${targetAccount.pubkey} doesn't exist - good for creation`);
                    } else {
                        throw error;
                    }
                }
            }
        }

        try {
            console.log('🔗 Getting latest blockhash...')
            const blockhashResponse = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getLatestBlockhash', params: [] })
            });
            const blockhashData = await blockhashResponse.json();
            console.log('📊 Blockhash response:', blockhashData)
            const recentBlockhash = blockhashData.result.value.blockhash;
            console.log('✅ Recent blockhash:', recentBlockhash)

            console.log('🔧 Creating instruction data...')
            const instructionData = this.createRealInstructionData(instructionName, data);
            console.log('✅ Instruction data created, length:', instructionData.length)

            console.log('👥 Processing accounts...')
            const allMetas = [...accounts];
            const uniqueMetas = allMetas.filter((meta, index, self) => index === self.findIndex((m) => m.pubkey === meta.pubkey));
            const sortedMetas = [
                ...uniqueMetas.filter(m => m.isSigner && m.isWritable),
                ...uniqueMetas.filter(m => m.isSigner && !m.isWritable),
                ...uniqueMetas.filter(m => !m.isSigner && m.isWritable),
                ...uniqueMetas.filter(m => !m.isSigner && !m.isWritable)
            ];
            console.log('✅ Sorted account metas:', sortedMetas.map(m => ({ pubkey: m.pubkey, isSigner: m.isSigner, isWritable: m.isWritable })))
            
            const accountKeys = sortedMetas.map(m => m.pubkey);
            if (!accountKeys.includes(this.programId)) {
                accountKeys.push(this.programId);
            }
            console.log('✅ Account keys:', accountKeys)
            
            const instructionAccountIndices = accounts.map(meta => accountKeys.indexOf(meta.pubkey));
            console.log('✅ Instruction account indices:', instructionAccountIndices)

            console.log('📝 Serializing message...')
            const messageBytes = this.serializeMessage({
                header: {
                    numRequiredSignatures: sortedMetas.filter(m => m.isSigner).length,
                    numReadonlySignedAccounts: sortedMetas.filter(m => m.isSigner && !m.isWritable).length,
                    numReadonlyUnsignedAccounts: sortedMetas.filter(m => !m.isSigner && !m.isWritable).length
                },
                accountKeys,
                recentBlockhash,
                instructions: [{
                    programIdIndex: accountKeys.indexOf(this.programId),
                    accounts: instructionAccountIndices,
                    data: instructionData
                }]
            });
            console.log('✅ Message serialized, length:', messageBytes.length)

            console.log('✍️ Creating signature...')
            const signature = await this.createSignature(messageBytes);
            console.log('✅ Signature created, length:', signature.length)
            
            console.log('📦 Creating transaction...')
            const transaction = this.createTransactionFromMessage(messageBytes, [signature]);
            console.log('✅ Transaction created, length:', transaction.length)
            
            const base64Tx = bytesToBase64(transaction);
            console.log('✅ Transaction base64 encoded, length:', base64Tx.length)

            console.log('📤 Sending transaction to RPC...')
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0', id: 1, method: 'sendTransaction',
                    params: [base64Tx, { encoding: 'base64', skipPreflight: false, preflightCommitment: 'processed' }]
                })
            });
            console.log('📡 Send transaction response status:', response.status)
            
            const result = await response.json();
            console.log('📊 Send transaction result:', result)
            
            if (result.error) {
                throw new Error(`Transaction failed: ${result.error.message}`);
            }
            
            console.log('🎉 Transaction successful! Hash:', result.result)
            return result.result;
        } catch (error: any) {
            console.error('❌ Transaction failed:', error);
            throw error;
        }
    }

    async transferSol(fromPubkey: string, toPubkey: string, lamports: number): Promise<string> {
        console.log(`💰 Sending SOL transfer: ${lamports} lamports from ${fromPubkey} to ${toPubkey}`);
        
        const accounts = [
            { pubkey: fromPubkey, isSigner: true, isWritable: true },     // source account
            { pubkey: toPubkey, isSigner: false, isWritable: true },      // destination account
            { pubkey: '11111111111111111111111111111111', isSigner: false, isWritable: false } // system program
        ];

        try {
            console.log('🔗 Getting latest blockhash...')
            const blockhashResponse = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getLatestBlockhash', params: [] })
            });
            const blockhashData = await blockhashResponse.json();
            console.log('📊 Blockhash response:', blockhashData)
            const recentBlockhash = blockhashData.result.value.blockhash;
            console.log('✅ Recent blockhash:', recentBlockhash)

            console.log('🔧 Creating transfer instruction data...')
            // System Program Transfer instruction (instruction type 2)
            const instructionData = new Uint8Array(12);
            // Instruction type (4 bytes): Transfer = 2
            instructionData[0] = 2;
            instructionData[1] = 0;
            instructionData[2] = 0;
            instructionData[3] = 0;
            // Amount in lamports (8 bytes, little endian)
            const lamportsBytes = new ArrayBuffer(8);
            const lamportsView = new DataView(lamportsBytes);
            lamportsView.setBigUint64(0, BigInt(lamports), true); // little endian
            instructionData.set(new Uint8Array(lamportsBytes), 4);
            console.log('✅ Transfer instruction data created, length:', instructionData.length)

            console.log('👥 Processing accounts...')
            const allMetas = [...accounts];
            const uniqueMetas = allMetas.filter((meta, index, self) => index === self.findIndex((m) => m.pubkey === meta.pubkey));
            const sortedMetas = [
                ...uniqueMetas.filter(m => m.isSigner && m.isWritable),
                ...uniqueMetas.filter(m => m.isSigner && !m.isWritable),
                ...uniqueMetas.filter(m => !m.isSigner && m.isWritable),
                ...uniqueMetas.filter(m => !m.isSigner && !m.isWritable)
            ];
            console.log('✅ Sorted account metas:', sortedMetas.map(m => ({ pubkey: m.pubkey, isSigner: m.isSigner, isWritable: m.isWritable })))
            
            const accountKeys = sortedMetas.map(m => m.pubkey);
            const systemProgramId = '11111111111111111111111111111111';
            if (!accountKeys.includes(systemProgramId)) {
                accountKeys.push(systemProgramId);
            }
            console.log('✅ Account keys:', accountKeys)
            
            const instructionAccountIndices = accounts.map(meta => accountKeys.indexOf(meta.pubkey));
            console.log('✅ Instruction account indices:', instructionAccountIndices)

            console.log('📝 Serializing message...')
            const messageBytes = this.serializeMessage({
                header: {
                    numRequiredSignatures: sortedMetas.filter(m => m.isSigner).length,
                    numReadonlySignedAccounts: sortedMetas.filter(m => m.isSigner && !m.isWritable).length,
                    numReadonlyUnsignedAccounts: sortedMetas.filter(m => !m.isSigner && !m.isWritable).length
                },
                accountKeys,
                recentBlockhash,
                instructions: [{
                    programIdIndex: accountKeys.indexOf(systemProgramId),
                    accounts: instructionAccountIndices,
                    data: instructionData
                }]
            });
            console.log('✅ Message serialized, length:', messageBytes.length)

            console.log('✍️ Creating signature...')
            const signature = await this.createSignature(messageBytes);
            console.log('✅ Signature created, length:', signature.length)
            
            console.log('📦 Creating transaction...')
            const transaction = this.createTransactionFromMessage(messageBytes, [signature]);
            console.log('✅ Transaction created, length:', transaction.length)
            
            const base64Tx = bytesToBase64(transaction);
            console.log('✅ Transaction base64 encoded, length:', base64Tx.length)

            console.log('📤 Sending transaction to RPC...')
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0', id: 1, method: 'sendTransaction',
                    params: [base64Tx, { encoding: 'base64', skipPreflight: false, preflightCommitment: 'processed' }]
                })
            });
            console.log('📡 Send transaction response status:', response.status)
            
            const result = await response.json();
            console.log('📊 Send transaction result:', result)
            
            if (result.error) {
                throw new Error(`Transfer failed: ${result.error.message}`);
            }
            
            console.log('🎉 Transfer successful! Hash:', result.result)
            return result.result;
        } catch (error: any) {
            console.error('❌ Transfer failed:', error);
            throw error;
        }
    }

    private createRealInstructionData(instruction: string, data: any): Uint8Array {
        console.log('🏗️ Creating instruction data for:', instruction)
        console.log('📋 Instruction data:', data)
        
        const instructionDiscriminators: { [key: string]: number[] } = {
            'initialize_issuer': [231, 164, 134, 90, 62, 217, 189, 118],
            'create_achievement': [41, 79, 246, 230, 218, 83, 35, 240],
            'issue_achievement_credential': [22, 116, 163, 110, 214, 114, 254, 183],
            'issue_achievement_credential_simple_subject': [16, 205, 50, 88, 128, 8, 13, 228],
            'generate_credential_json_simple_subject': [214, 187, 28, 80, 42, 160, 28, 128]
        };
        const discriminator = instructionDiscriminators[instruction];
        if (!discriminator) {
            console.error('❌ Unknown instruction:', instruction)
            throw new Error(`Unknown instruction: ${instruction}`);
        }
        console.log('✅ Discriminator found:', discriminator)

        const instructionBytes = new Uint8Array(1024); // Increased buffer size
        let offset = 0;
        
        // Write discriminator
        for (let i = 0; i < 8; i++) {
            instructionBytes[offset++] = discriminator[i];
        }
        console.log('✅ Discriminator written at offset:', offset)

        if (instruction === 'initialize_issuer') {
            offset = borshSerializeString(data.name || 'UnB Campus Virtual', instructionBytes, offset);
            instructionBytes[offset++] = 1; // Some
            offset = borshSerializeString(data.url || 'https://unb.br', instructionBytes, offset);
            instructionBytes[offset++] = 1; // Some
            offset = borshSerializeString(data.email || 'campus-virtual@unb.br', instructionBytes, offset);
        } else if (instruction === 'create_achievement') {
            console.log('🏆 Serializing achievement data...')
            offset = borshSerializeString(data.achievement_id, instructionBytes, offset)
            console.log('✅ achievement_id serialized, offset:', offset)
            
            offset = borshSerializeString(data.name, instructionBytes, offset)
            console.log('✅ name serialized, offset:', offset)
            
            offset = borshSerializeString(data.description, instructionBytes, offset)
            console.log('✅ description serialized, offset:', offset)
    
            if (data.criteria_narrative) {
                instructionBytes[offset++] = 1 // Some
                offset = borshSerializeString(data.criteria_narrative, instructionBytes, offset)
                console.log('✅ criteria_narrative serialized, offset:', offset)
            } else {
                instructionBytes[offset++] = 0 // None
                console.log('✅ criteria_narrative set to None, offset:', offset)
            }
    
            if (data.criteria_id) {
                instructionBytes[offset++] = 1 // Some
                offset = borshSerializeString(data.criteria_id, instructionBytes, offset)
                console.log('✅ criteria_id serialized, offset:', offset)
            } else {
                instructionBytes[offset++] = 0 // None
                console.log('✅ criteria_id set to None, offset:', offset)
            }
    
            if (data.creator) {
                instructionBytes[offset++] = 1 // Some
                const creatorBytes = base58ToBytes(data.creator)
                for (let i = 0; i < 32; i++) {
                    instructionBytes[offset++] = creatorBytes[i] || 0
                }
                console.log('✅ creator serialized, offset:', offset)
            } else {
                instructionBytes[offset++] = 0 // None
                console.log('✅ creator set to None, offset:', offset)
            }
        } else if (instruction === 'issue_achievement_credential' || instruction === 'issue_achievement_credential_simple_subject') {
            console.log('🏆 Serializing credential data...')
            console.log('📋 Instruction data full:', data)
            console.log('🔍 Data types:')
            console.log('  - recipient_pubkey type:', typeof data.recipient_pubkey)
            console.log('  - signature_data type:', typeof data.signature_data, 'constructor:', data.signature_data?.constructor.name)
            console.log('  - message_data type:', typeof data.message_data, 'constructor:', data.message_data?.constructor.name)
            console.log('  - timestamp type:', typeof data.timestamp)
            
            // Serialize recipient_pubkey
            if (!data.recipient_pubkey) {
                throw new Error('recipient_pubkey is required for issue_achievement_credential');
            }
            const recipientBytes = base58ToBytes(data.recipient_pubkey);
            for (let i = 0; i < 32; i++) {
                instructionBytes[offset++] = recipientBytes[i] || 0;
            }
            console.log('✅ recipient_pubkey serialized, offset:', offset);
            
            // Serialize signature_data (bytes) - Vec<u8>
            const signatureData = data.signature_data || new Uint8Array(64); // Empty signature for now
            console.log('🔍 signatureData length:', signatureData.length, 'type:', signatureData.constructor.name);
            const sigLen = signatureData.length;
            instructionBytes[offset++] = sigLen & 0xff;
            instructionBytes[offset++] = (sigLen >> 8) & 0xff;
            instructionBytes[offset++] = (sigLen >> 16) & 0xff;
            instructionBytes[offset++] = (sigLen >> 24) & 0xff;
            for (let i = 0; i < signatureData.length; i++) {
                instructionBytes[offset++] = signatureData[i];
            }
            console.log('✅ signature_data serialized, offset:', offset);
            
            // Serialize message_data (bytes) - Vec<u8>
            const messageData = data.message_data || new Uint8Array(0); // Empty message for now
            console.log('🔍 messageData length:', messageData.length, 'type:', messageData.constructor.name);
            const msgLen = messageData.length;
            instructionBytes[offset++] = msgLen & 0xff;
            instructionBytes[offset++] = (msgLen >> 8) & 0xff;
            instructionBytes[offset++] = (msgLen >> 16) & 0xff;
            instructionBytes[offset++] = (msgLen >> 24) & 0xff;
            for (let i = 0; i < messageData.length; i++) {
                instructionBytes[offset++] = messageData[i];
            }
            console.log('✅ message_data serialized, offset:', offset);
            
            // Serialize timestamp (string)
            const timestamp = data.timestamp || new Date().toISOString();
            console.log('🔍 timestamp:', timestamp, 'type:', typeof timestamp);
            offset = borshSerializeString(timestamp, instructionBytes, offset);
            console.log('✅ timestamp serialized, offset:', offset);
        } else if (instruction === 'generate_credential_json_simple_subject') {
            console.log('📋 Serializing generate credential JSON data...')
            console.log('📋 Instruction data full:', data)
            
            // Serialize achievement_address (string)
            if (!data.achievement_address) {
                throw new Error('achievement_address is required for generate_credential_json_simple_subject');
            }
            offset = borshSerializeString(data.achievement_address, instructionBytes, offset);
            console.log('✅ achievement_address serialized, offset:', offset);
            
            // Serialize recipient_address (string)
            if (!data.recipient_address) {
                throw new Error('recipient_address is required for generate_credential_json_simple_subject');
            }
            offset = borshSerializeString(data.recipient_address, instructionBytes, offset);
            console.log('✅ recipient_address serialized, offset:', offset);
            
            // Serialize credential_id (string)
            if (!data.credential_id) {
                throw new Error('credential_id is required for generate_credential_json_simple_subject');
            }
            offset = borshSerializeString(data.credential_id, instructionBytes, offset);
            console.log('✅ credential_id serialized, offset:', offset);
            
            // Serialize timestamp (string)
            const timestamp = data.timestamp || new Date().toISOString();
            console.log('🔍 timestamp:', timestamp, 'type:', typeof timestamp);
            offset = borshSerializeString(timestamp, instructionBytes, offset);
            console.log('✅ timestamp serialized, offset:', offset);
        }
        
        const finalBytes = instructionBytes.slice(0, offset);
        console.log('✅ Instruction data created, final length:', finalBytes.length)
        console.log('🔍 Final instruction bytes (first 50):', Array.from(finalBytes.slice(0, 50)))
        console.log('🔍 Final instruction bytes (last 50):', Array.from(finalBytes.slice(-50)))
        console.log('🔍 Buffer capacity used:', offset, 'out of', instructionBytes.length)
        return finalBytes;
    }

    private serializeMessage(message: any): Uint8Array {
        const buffer: number[] = [];
        buffer.push(message.header.numRequiredSignatures);
        buffer.push(message.header.numReadonlySignedAccounts);
        buffer.push(message.header.numReadonlyUnsignedAccounts);
        encodeLength(buffer, message.accountKeys.length);
        for (const key of message.accountKeys) {
            const keyBytes = base58ToBytes(key);
            for (let i = 0; i < 32; i++) {
                buffer.push(keyBytes[i] || 0);
            }
        }
        const blockhashBytes = base58ToBytes(message.recentBlockhash);
        for (let i = 0; i < 32; i++) {
            buffer.push(blockhashBytes[i] || 0);
        }
        encodeLength(buffer, message.instructions.length);
        for (const instruction of message.instructions) {
            buffer.push(instruction.programIdIndex);
            encodeLength(buffer, instruction.accounts.length);
            for (const accountIndex of instruction.accounts) {
                buffer.push(accountIndex);
            }
            encodeLength(buffer, instruction.data.length);
            for (const byte of instruction.data) {
                buffer.push(byte);
            }
        }
        return new Uint8Array(buffer);
    }

    private createTransactionFromMessage(messageBytes: Uint8Array, signatures: Uint8Array[]): Uint8Array {
        const buffer: number[] = [];
        encodeLength(buffer, signatures.length);
        for (const sig of signatures) {
            for (let i = 0; i < 64; i++) {
                buffer.push(sig[i] || 0);
            }
        }
        for (const byte of messageBytes) {
            buffer.push(byte);
        }
        return new Uint8Array(buffer);
    }

    private async createSignature(messageBytes: Uint8Array): Promise<Uint8Array> {
        console.log('🔑 Getting secret key from wallet manager...')
        const secretKey = this.walletManager.getActualSecretKey();
        if (!secretKey) {
            console.error('❌ Secret key is null or undefined')
            console.log('🔍 Wallet manager state:', {
                hasWalletManager: !!this.walletManager,
                walletAddress: this.walletManager.getWalletAddress()
            })
            throw new Error('Secret key not available for signing.');
        }
        console.log('✅ Secret key obtained, length:', secretKey.length)
        
        console.log('📚 Loading crypto libraries for signing...')
        const { nacl: naclLib, solana: solanaLib } = await loadCryptoLibraries();
        
        if (solanaLib && solanaLib.Keypair) {
            try {
                console.log('🔧 Trying Solana SDK signing...')
                const keypair = solanaLib.Keypair.fromSecretKey(secretKey);
                console.log('✅ Keypair created from secret key')
                // This is where you'd use a proper signMessage if available
                if (keypair.sign) {
                    console.log('🔧 Using Solana SDK sign method...')
                    const signature = keypair.sign(messageBytes);
                    console.log('✅ Solana SDK signature created')
                    return signature;
                }
            } catch (error) {
                console.log('⚠️ Solana SDK signing failed:', error);
            }
        }
        
        if (naclLib && naclLib.sign && naclLib.sign.detached) {
            console.log('🔧 Using NaCl detached signing...')
            const signature = naclLib.sign.detached(messageBytes, secretKey);
            console.log('✅ NaCl signature created')
            return signature;
        }
        
        console.log('🔧 Falling back to deterministic signature...')
        return this.createDeterministicSignature(messageBytes);
    }

    private createDeterministicSignature(messageBytes: Uint8Array): Uint8Array {
        const secretKey = this.walletManager.getActualSecretKey();
        if (!secretKey) throw new Error('Private key not available for signing');
        const sigBytes = new Uint8Array(64);
        let seed = 0;
        for (let i = 0; i < secretKey.length; i++) {
            seed += secretKey[i] * (i + 1);
        }
        for (let i = 0; i < messageBytes.length; i++) {
            seed += messageBytes[i] * (i + 1);
        }
        for (let i = 0; i < 64; i++) {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            sigBytes[i] = seed % 256;
        }
        return sigBytes;
    }

    // High-level business logic methods
    async initializeIssuer(name: string, url?: string, email?: string): Promise<{ signature: string, issuerAddress: string }> {
        try {
            const issuerAddress = await this.pdaManager.deriveDeterministicPDA(this.walletManager.getWalletAddress());
            const systemProgramId = '11111111111111111111111111111111';
            const accounts = [
                { pubkey: issuerAddress, isSigner: false, isWritable: true },
                { pubkey: this.walletManager.getWalletAddress(), isSigner: true, isWritable: true },
                { pubkey: systemProgramId, isSigner: false, isWritable: false }
            ];
            const data = { name, url, email };
            const signature = await this.sendTransaction('initialize_issuer', accounts, data);
            return { signature, issuerAddress };
        } catch (error) {
            console.error('❌ Error in initializeIssuer:', error);
            throw error;
        }
    }

    async createAchievement(
        issuerAddress: string,
        achievementId: string,
        name: string,
        description: string,
        criteriaNarrative: string,
        criteriaId: string,
        creator: string
    ): Promise<{ signature: string, achievementAddress: string }> {
        try {
            const achievementAddress = await this.pdaManager.deriveDeterministicAchievementPDA(issuerAddress, name);
            const systemProgramId = '11111111111111111111111111111111';
            const accounts = [
                { pubkey: achievementAddress, isSigner: false, isWritable: true },  // achievement
                { pubkey: issuerAddress, isSigner: false, isWritable: false },      // issuer
                { pubkey: this.walletManager.getWalletAddress(), isSigner: true, isWritable: true },  // authority
                { pubkey: systemProgramId, isSigner: false, isWritable: false }     // system_program
            ];
            const data = { achievement_id: achievementId, name, description, criteria_narrative: criteriaNarrative, criteria_id: criteriaId, creator };
            const signature = await this.sendTransaction('create_achievement', accounts, data);
            return { signature, achievementAddress };
        } catch (error) {
            console.error('❌ Error in createAchievement:', error);
            throw error;
        }
    }

    async issueCredential(achievementAddress: string, recipientAddress: string): Promise<{ signature: string; credentialAddress: string }> {
        try {
            const issuerAddress = await this.pdaManager.deriveDeterministicPDA(this.walletManager.getWalletAddress());
            
            const credentialAddress = await this.pdaManager.deriveDeterministicCredentialPDA(
                achievementAddress, 
                issuerAddress, 
                recipientAddress
            );
            
            const timestamp = new Date().toISOString();
            
            // Generate the exact credential JSON using the same format as the program
            console.log('📋 Generating credential JSON using exact program format...');
            const context = ["https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"];
            const credentialType = ["VerifiableCredential", "OpenBadgeCredential"];
            const subjectType = ["AchievementSubject"];
            
            const credentialDid = `did:sol:${credentialAddress}`;
            const issuerDid = `did:sol:${issuerAddress}`;
            const recipientSimpleId = `sol:${recipientAddress}`; // Simple format as per program
            const achievementDid = `did:sol:${achievementAddress}`;
            
            // Use exact format string from program (line 1217)
            const credentialJson = `{"@context":${JSON.stringify(context)},"id":"${credentialDid}","type":${JSON.stringify(credentialType)},"issuer":"${issuerDid}","validFrom":"${timestamp}","credentialSubject":{"id":"${recipientSimpleId}","type":${JSON.stringify(subjectType)},"achievement":"${achievementDid}"}}`;
            
            console.log('✅ Generated exact program-format JSON:');
            console.log(credentialJson);
            console.log('📏 JSON length:', credentialJson.length);
            
            const messageData = stringToBytes(credentialJson);
            const signatureData = await this.walletManager.signMessage(messageData);
            console.log('✅ Signature created for program JSON, length:', signatureData.length);
            
            // Step 3: Issue the credential with the exact JSON and signature
            console.log('🔄 Step 3: Issuing credential with program-generated JSON and signature...');
            const systemProgramId = '11111111111111111111111111111111';
            const accounts = [
                { pubkey: credentialAddress, isSigner: false, isWritable: true },    // credential
                { pubkey: achievementAddress, isSigner: false, isWritable: false },  // achievement
                { pubkey: issuerAddress, isSigner: false, isWritable: false },       // issuer
                { pubkey: this.walletManager.getWalletAddress(), isSigner: true, isWritable: true }, // authority
                { pubkey: systemProgramId, isSigner: false, isWritable: false }      // system_program
            ];
            
            const data = { 
                recipient_pubkey: recipientAddress,
                signature_data: signatureData,
                message_data: messageData,
                timestamp: timestamp
            };
            const signature = await this.sendTransaction('issue_achievement_credential_simple_subject', accounts, data);
            
            return { signature, credentialAddress };
        } catch (error) {
            console.error('❌ Error in issueCredential:', error);
            throw error;
        }
    }
}
