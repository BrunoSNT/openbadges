import { loadCryptoLibraries } from './crypto';
import { base58ToBytes, stringToBytes } from './utils';

export class PdaManager {
    private programId: string;

    constructor(programId: string) {
        this.programId = programId;
    }

    async deriveDeterministicPDA(authority: string): Promise<string> {
        console.log('🔧 Starting proper PDA derivation...');
        const { solana: solanaLib, sha, bs58 } = await loadCryptoLibraries();

        if (solanaLib && solanaLib.PublicKey && solanaLib.PublicKey.findProgramAddress) {
            try {
                console.log('✅ Using Solana SDK PublicKey.findProgramAddress...');
                const seeds = [
                    stringToBytes("issuer"),
                    base58ToBytes(authority)
                ];
                const programId = new solanaLib.PublicKey(this.programId);
                const [pda, bump] = await solanaLib.PublicKey.findProgramAddress(seeds, programId);
                console.log(`✅ Found PDA using Solana SDK with bump ${bump}: ${pda.toString()}`);
                return pda.toString();
            } catch (error) {
                console.log('⚠️ Solana SDK PDA derivation failed:', error);
            }
        }

        // Fallback manual derivation (not fully implemented)
        throw new Error('Manual PDA derivation not fully implemented.');
    }

    async deriveDeterministicAchievementPDA(issuerAddress: string, achievementName: string): Promise<string> {
        console.log(`🔧 Starting achievement PDA derivation for issuer: ${issuerAddress}, name: ${achievementName}`);
        const { solana: solanaLib, bs58 } = await loadCryptoLibraries();
        
        if (solanaLib && solanaLib.PublicKey && solanaLib.PublicKey.findProgramAddress) {
            try {
                console.log(`✅ Using Solana SDK PublicKey.findProgramAddress for achievement...`);
                const seeds = [
                    stringToBytes("achievement"),
                    base58ToBytes(issuerAddress),
                    stringToBytes(achievementName)
                ];
                console.log(`🔧 Seeds prepared:`, seeds.map(s => Array.from(s)));
                
                const programId = new solanaLib.PublicKey(this.programId);
                console.log(`🔧 Program ID: ${this.programId}`);
                
                const [pda, bump] = await solanaLib.PublicKey.findProgramAddress(seeds, programId);
                console.log(`✅ Found achievement PDA using Solana SDK with bump ${bump}: ${pda.toString()}`);
                return pda.toString();
            } catch (error) {
                console.log('⚠️ Solana SDK achievement PDA derivation failed:', error);
                console.log('⚠️ Error type:', typeof error);
                console.log('⚠️ Error message:', (error as any)?.message || 'No message');
                console.log('⚠️ Error stack:', (error as any)?.stack || 'No stack');
            }
        }
        
        // Fallback manual derivation
        console.log('❌ Falling back to manual derivation (not implemented)');
        throw new Error('Manual achievement PDA derivation not fully implemented.');
    }

    async deriveDeterministicCredentialPDA(achievementAddress: string, issuerAddress: string, recipientPubkey: string): Promise<string> {
        console.log(`🔧 Starting credential PDA derivation for achievement: ${achievementAddress}, issuer: ${issuerAddress}, recipient: ${recipientPubkey}`);
        const { solana: solanaLib } = await loadCryptoLibraries();
        
        if (solanaLib && solanaLib.PublicKey && solanaLib.PublicKey.findProgramAddress) {
            try {
                console.log(`✅ Using Solana SDK PublicKey.findProgramAddress for credential...`);
                const seeds = [
                    stringToBytes("credential"),
                    base58ToBytes(achievementAddress),
                    base58ToBytes(issuerAddress),
                    base58ToBytes(recipientPubkey)
                ];
                console.log(`🔧 Seeds prepared:`, seeds.map(s => Array.from(s)));
                
                const programId = new solanaLib.PublicKey(this.programId);
                console.log(`🔧 Program ID: ${this.programId}`);
                
                const [pda, bump] = await solanaLib.PublicKey.findProgramAddress(seeds, programId);
                console.log(`✅ Found credential PDA using Solana SDK with bump ${bump}: ${pda.toString()}`);
                return pda.toString();
            } catch (error) {
                console.log('⚠️ Solana SDK credential PDA derivation failed:', error);
                console.log('⚠️ Error type:', typeof error);
                console.log('⚠️ Error message:', (error as any)?.message || 'No message');
            }
        }
        
        console.log('❌ Falling back to manual derivation (not implemented)');
        throw new Error('Manual credential PDA derivation not fully implemented.');
    }
}
