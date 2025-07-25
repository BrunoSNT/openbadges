import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';

// Sol-DID Program ID
const SOL_DID_PROGRAM_ID = new PublicKey("CN7hHnABU21savvQvz7sZsfpgfAKm8sFd3XxocPP9AuH");

export interface DidCheckResult {
    exists: boolean;
    didAddress?: PublicKey;
    needsCreation: boolean;
}

export interface DidCreationResult {
    success: boolean;
    signature: string;
    didAddress: PublicKey;
}

/**
 * Client-side DID utilities for checking and creating DIDs
 * This approach is more efficient than on-chain checking
 */
export class ClientDidManager {
    constructor(
        private connection: Connection,
        private provider: AnchorProvider
    ) {}

    /**
     * Derive the DID account address for a given authority
     */
    static deriveDIDAddress(authority: PublicKey): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("did-account"), authority.toBuffer()],
            SOL_DID_PROGRAM_ID
        );
    }

    /**
     * Check if a DID exists for the given authority
     */
    async checkDidExists(authority: PublicKey): Promise<DidCheckResult> {
        try {
            const [didAddress] = ClientDidManager.deriveDIDAddress(authority);

            // Check if the account exists and has data
            const accountInfo = await this.connection.getAccountInfo(didAddress);
            const exists = accountInfo !== null && accountInfo.data.length > 0;

            return {
                exists,
                didAddress: exists ? didAddress : undefined,
                needsCreation: !exists
            };
        } catch (error) {
            console.warn("Error checking DID:", error);
            return {
                exists: false,
                needsCreation: true
            };
        }
    }

    /**
     * Create a DID document directly using sol-did program
     * This bypasses the open-badges program for better efficiency
     */
    async createDid(
        authority: PublicKey,
        size: number = 512
    ): Promise<DidCreationResult> {
        try {
            const [didAddress] = ClientDidManager.deriveDIDAddress(authority);

            // Check if DID already exists
            const check = await this.checkDidExists(authority);
            if (check.exists) {
                return {
                    success: true,
                    signature: "already-exists",
                    didAddress: check.didAddress!
                };
            }

            // Create the DID using sol-did program directly
            const transaction = new Transaction();
            
            // Calculate rent for the account
            const rentExemption = await this.connection.getMinimumBalanceForRentExemption(size);

            // Add create account instruction
            transaction.add(
                SystemProgram.createAccount({
                    fromPubkey: this.provider.wallet.publicKey,
                    newAccountPubkey: didAddress,
                    lamports: rentExemption,
                    space: size,
                    programId: SOL_DID_PROGRAM_ID,
                })
            );

            // Note: We would need to add the sol-did initialize instruction here
            // For now, this is a placeholder for the direct sol-did integration
            console.warn("Direct sol-did integration not fully implemented yet");
            
            throw new Error("Direct sol-did integration needs to be completed");

        } catch (error) {
            console.error("Failed to create DID:", error);
            throw error;
        }
    }

    /**
     * Ensure a DID exists for the authority, create if needed
     */
    async ensureDidExists(authority: PublicKey): Promise<DidCheckResult> {
        const check = await this.checkDidExists(authority);
        
        if (!check.exists) {
            console.log(`DID does not exist for ${authority.toString()}, would need to create`);
            // In a real implementation, we would create the DID here
            // For now, just return the check result
        }
        
        return check;
    }
}

/**
 * Check if a DID exists for the given authority (utility function)
 */
export async function checkDidExists(
    connection: Connection,
    authority: PublicKey
): Promise<boolean> {
    try {
        const [didAddress] = ClientDidManager.deriveDIDAddress(authority);
        const accountInfo = await connection.getAccountInfo(didAddress);
        return accountInfo !== null && accountInfo.data.length > 0;
    } catch (error) {
        console.warn("Error checking DID existence:", error);
        return false;
    }
}

/**
 * Get the DID identifier string for a given authority
 */
export function getDidIdentifier(authority: PublicKey): string {
    return `did:sol:${authority.toString()}`;
}
