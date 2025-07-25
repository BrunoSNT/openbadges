import { loadCryptoLibraries } from './crypto';
import { stringToBytes } from './utils';
import { TransactionManager } from './transaction';
import { getPersistentMnemonic, generateUserSeed } from './mnemonicGenerator';

// Funding wallet uses a fixed mnemonic for consistent funding
export const FUNDING_MNEMONIC = "wallet fund test example seed phrase for development only never use production"

// Lazy-loaded user mnemonic - only generated when first accessed
let _userSeed: string | null = null;
let _mnemonicPhrase: string | null = null;
let _walletGenerated: boolean = false;

function getUserSeed(): string {
    if (!_userSeed) {
        _userSeed = generateUserSeed();
        console.log('🎲 Generated user seed for session');
    }
    return _userSeed;
}

export function getMnemonicPhrase(): string {
    if (!_mnemonicPhrase) {
        _mnemonicPhrase = getPersistentMnemonic(getUserSeed());
        console.log('🔑 Generated/retrieved mnemonic phrase');
    }
    return _mnemonicPhrase;
}

export function hasWalletBeenGenerated(): boolean {
    return _walletGenerated;
}

export class WalletManager {
    protected actualSecretKey: Uint8Array | null = null;
    protected walletPrivateKey: string = '';
    protected walletAddress: string = '';

    public getWalletAddress(): string {
        return this.walletAddress;
    }

    public getActualSecretKey(): Uint8Array | null {
        return this.actualSecretKey;
    }

    public getCurrentMnemonic(): string {
        return getMnemonicPhrase();
    }

    public setWalletAddress(address: string) {
        this.walletAddress = address;
    }

    async generateWallet(): Promise<{ address: string; privateKey: string }> {
        try {
            // Mark that wallet generation has been requested
            _walletGenerated = true;
            
            console.log('🔧 Starting wallet generation...');
            const { nacl: naclLib, solana: solanaLib, bs58 } = await loadCryptoLibraries();

            if (solanaLib && solanaLib.Keypair && solanaLib.Keypair.fromSeed) {
                console.log('✅ Using Solana SDK fromSeed() with user-specific mnemonic phrase.');
                try {
                    const mnemonic = getMnemonicPhrase();
                    const seed = mnemonicToSeed(mnemonic);
                    const key = solanaLib.Keypair.fromSeed(seed);
                    this.actualSecretKey = key.secretKey;
                    this.walletPrivateKey = Array.from(key.secretKey as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
                    this.walletAddress = key.publicKey.toString();
                    console.log('✅ Solana SDK wallet generated successfully');
                    console.log('🔑 === YOUR UNIQUE WALLET INFO (SAVE THIS!) ===');
                    console.log(`Mnemonic: ${mnemonic}`);
                    console.log(`Private Key: ${this.walletPrivateKey}`);
                    console.log(`Address: ${this.walletAddress}`);
                    console.log('🔑 === END WALLET INFO ===');
                    console.log('💡 Your mnemonic is unique and will persist during this session!');
                    
                    // Transfer 0.1 SOL from funding wallet
                    await this.receiveFundsFromFunding();
                    
                    return { address: this.walletAddress, privateKey: this.walletPrivateKey };
                } catch (error) {
                    console.log('⚠️ Solana SDK fromSeed failed:', error);
                }
            }

            if (naclLib && naclLib.sign && naclLib.sign.keyPair && naclLib.sign.keyPair.fromSeed) {
                console.log('🔐 Using NaCl fromSeed() with user-specific mnemonic phrase.');
                try {
                    const mnemonic = getMnemonicPhrase();
                    const seed = mnemonicToSeed(mnemonic);
                    const keyPair = naclLib.sign.keyPair.fromSeed(seed);
                    if (keyPair && keyPair.secretKey && keyPair.publicKey) {
                        this.actualSecretKey = keyPair.secretKey;
                        const privateKeyBytes = keyPair.secretKey.slice(0, 32);
                        this.walletPrivateKey = Array.from(privateKeyBytes).map((b) => (b as number).toString(16).padStart(2, '0')).join('');
                        this.walletAddress = bs58.encode(keyPair.publicKey);
                        console.log('✅ NaCl wallet generated successfully');
                        console.log('🔑 === YOUR UNIQUE WALLET INFO (SAVE THIS!) ===');
                        console.log(`Mnemonic: ${mnemonic}`);
                        console.log(`Private Key: ${this.walletPrivateKey}`);
                        console.log(`Address: ${this.walletAddress}`);
                        console.log('🔑 === END WALLET INFO ===');
                        console.log('💡 Your mnemonic is unique and will persist during this session!');
                        
                        // Transfer 0.1 SOL from funding wallet
                        await this.receiveFundsFromFunding();
                        
                        return { address: this.walletAddress, privateKey: this.walletPrivateKey };
                    }
                } catch (error) {
                    console.log('⚠️ NaCl fromSeed failed:', error);
                }
            }

            console.log('🔐 Using pure deterministic key generation as fallback');
            const mnemonic = getMnemonicPhrase();
            const seed = mnemonicToSeed(mnemonic);
            const privateKeyBytes = new Uint8Array(32);
            for (let i = 0; i < 32; i++) {
                privateKeyBytes[i] = seed[i] ^ (seed[(i + 8) % 32] << 1) ^ (seed[(i + 16) % 32] << 2);
            }
            const publicKeyBytes = new Uint8Array(32);
            for (let i = 0; i < 32; i++) {
                publicKeyBytes[i] = privateKeyBytes[i] ^ privateKeyBytes[(i + 1) % 32] ^ 0x55;
            }
            this.actualSecretKey = privateKeyBytes;
            this.walletPrivateKey = Array.from(privateKeyBytes).map((b) => (b as number).toString(16).padStart(2, '0')).join('');
            this.walletAddress = bs58.encode(publicKeyBytes);
            console.log('✅ Fallback wallet generated successfully');
            console.log('🔑 === YOUR UNIQUE WALLET INFO (SAVE THIS!) ===');
            console.log(`Mnemonic: ${mnemonic}`);
            console.log(`Private Key: ${this.walletPrivateKey}`);
            console.log(`Address: ${this.walletAddress}`);
            console.log('🔑 === END WALLET INFO ===');
            console.log('💡 Your mnemonic is unique and will persist during this session!');
            
            // Transfer 0.1 SOL from funding wallet
            await this.receiveFundsFromFunding();
            
            return { address: this.walletAddress, privateKey: this.walletPrivateKey };

        } catch (error: any) {
            console.error('❌ Error generating wallet:', error);
            const enhancedError = new Error(`Wallet generation failed: ${error?.message || error || 'Unknown error'}`);
            (enhancedError as any).originalError = error;
            throw enhancedError;
        }
    }
    
    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        if (!this.actualSecretKey) {
            throw new Error('Wallet not initialized - call generateWallet() first');
        }
        
        try {
            const { nacl: naclLib } = await loadCryptoLibraries();
            
            if (naclLib && naclLib.sign) {
                console.log('✍️ Signing message with NaCl...');
                const signature = naclLib.sign.detached(message, this.actualSecretKey);
                console.log('✅ Message signed successfully, signature length:', signature.length);
                return signature;
            } else {
                throw new Error('NaCl library not available for signing');
            }
        } catch (error) {
            console.error('❌ Error signing message:', error);
            throw error;
        }
    }

    // Transfer 0.1 SOL from funding wallet to this wallet
    async receiveFundsFromFunding(): Promise<boolean> {
        try {
            console.log('💰 Starting funding process...');
            
            // Create funding wallet
            const fundingWallet = new FundingWallet();
            await fundingWallet.generateFundingWallet();
            
            const fromAddress = fundingWallet.getWalletAddress();
            const toAddress = this.walletAddress;
            const amount = 0.1; // 0.1 SOL
            
            console.log(`💰 Transferring ${amount} SOL`);
            console.log(`💰 From: ${fromAddress}`);
            console.log(`💰 To: ${toAddress}`);
            
            // Use TransactionManager for the transfer
            const RPC_URL = 'https://devnet.helius-rpc.com/?api-key=9956fdea-9608-4dda-9a35-46b60acd303f';
            const PROGRAM_ID = 'your_program_id'; // This isn't used for transfers
            const transactionManager = new TransactionManager(RPC_URL, PROGRAM_ID, fundingWallet);
            
            const lamports = Math.floor(amount * 1000000000); // Convert SOL to lamports
            const signature = await transactionManager.transferSol(fromAddress, toAddress, lamports);
            
            console.log('✅ Transfer completed successfully! Signature:', signature);
            return true;
            
        } catch (error) {
            console.error('❌ Error during funding:', error);
            return false;
        }
    }
}

// Simple mnemonic to seed conversion (not BIP39 compliant)
export function mnemonicToSeed(mnemonic: string): Uint8Array {
  // In a real app, use a proper library like bip39
  const seed = new Uint8Array(32)
  const strBytes = stringToBytes(mnemonic)
  for (let i = 0; i < 32; i++) {
    seed[i] = strBytes[i % strBytes.length] ^ (i * 5)
  } 
  return seed
}

// Funding wallet that uses the funding mnemonic
export class FundingWallet extends WalletManager {
    async generateFundingWallet(): Promise<{ address: string; privateKey: string }> {
        try {
            const { nacl: naclLib, solana: solanaLib, bs58 } = await loadCryptoLibraries();

            if (solanaLib && solanaLib.Keypair && solanaLib.Keypair.fromSeed) {
                console.log('💰 Using Solana SDK for funding wallet generation.');
                try {
                    const seed = mnemonicToSeed(FUNDING_MNEMONIC);
                    const key = solanaLib.Keypair.fromSeed(seed);
                    this.actualSecretKey = key.secretKey;
                    this.walletPrivateKey = Array.from(key.secretKey as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
                    this.walletAddress = key.publicKey.toString();
                    console.log('✅ Funding wallet generated successfully');
                    console.log('💰 === FUNDING WALLET INFO ===');
                    console.log(`Mnemonic: ${FUNDING_MNEMONIC}`);
                    console.log(`Private Key: ${this.walletPrivateKey}`);
                    console.log(`Address: ${this.walletAddress}`);
                    console.log('💰 === END FUNDING WALLET ===');
                    return { address: this.walletAddress, privateKey: this.walletPrivateKey };
                } catch (error) {
                    console.log('⚠️ Solana SDK fromSeed failed for funding wallet:', error);
                }
            }

            if (naclLib && naclLib.sign && naclLib.sign.keyPair && naclLib.sign.keyPair.fromSeed) {
                console.log('💰 Using NaCl for funding wallet generation.');
                try {
                    const seed = mnemonicToSeed(FUNDING_MNEMONIC);
                    const keyPair = naclLib.sign.keyPair.fromSeed(seed);
                    if (keyPair && keyPair.secretKey && keyPair.publicKey) {
                        this.actualSecretKey = keyPair.secretKey;
                        const privateKeyBytes = keyPair.secretKey.slice(0, 32);
                        this.walletPrivateKey = Array.from(privateKeyBytes).map((b) => (b as number).toString(16).padStart(2, '0')).join('');
                        this.walletAddress = bs58.encode(keyPair.publicKey);
                        console.log('✅ Funding wallet generated successfully');
                        console.log('💰 === FUNDING WALLET INFO ===');
                        console.log(`Mnemonic: ${FUNDING_MNEMONIC}`);
                        console.log(`Private Key: ${this.walletPrivateKey}`);
                        console.log(`Address: ${this.walletAddress}`);
                        console.log('💰 === END FUNDING WALLET ===');
                        return { address: this.walletAddress, privateKey: this.walletPrivateKey };
                    }
                } catch (error) {
                    console.log('⚠️ NaCl fromSeed failed for funding wallet:', error);
                }
            }

            console.log('💰 Using fallback method for funding wallet generation');
            const seed = mnemonicToSeed(FUNDING_MNEMONIC);
            const privateKeyBytes = new Uint8Array(32);
            for (let i = 0; i < 32; i++) {
                privateKeyBytes[i] = seed[i] ^ (seed[(i + 8) % 32] << 1) ^ (seed[(i + 16) % 32] << 2);
            }
            const publicKeyBytes = new Uint8Array(32);
            for (let i = 0; i < 32; i++) {
                publicKeyBytes[i] = privateKeyBytes[i] ^ privateKeyBytes[(i + 1) % 32] ^ 0x55;
            }
            this.actualSecretKey = privateKeyBytes;
            this.walletPrivateKey = Array.from(privateKeyBytes).map((b) => (b as number).toString(16).padStart(2, '0')).join('');
            this.walletAddress = bs58.encode(publicKeyBytes);
            console.log('✅ Funding wallet generated successfully');
            console.log('💰 === FUNDING WALLET INFO ===');
            console.log(`Mnemonic: ${FUNDING_MNEMONIC}`);
            console.log(`Private Key: ${this.walletPrivateKey}`);
            console.log(`Address: ${this.walletAddress}`);
            console.log('💰 === END FUNDING WALLET ===');
            return { address: this.walletAddress, privateKey: this.walletPrivateKey };

        } catch (error: any) {
            console.error('❌ Error generating funding wallet:', error);
            const enhancedError = new Error(`Funding wallet generation failed: ${error?.message || error || 'Unknown error'}`);
            (enhancedError as any).originalError = error;
            throw enhancedError;
        }
    }
}
