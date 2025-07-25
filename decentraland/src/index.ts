import { setupUi } from './npc-dialog-ui'
import { getData} from 'dcl-npc-toolkit'
import { catNpc } from './npcs/cat'
import { robotNpc } from './npcs/robot'
import { computerNpc } from './npcs/computer'
import { WalletManager, getMnemonicPhrase } from './solana-client/wallet'
import { clearStoredMnemonic, generateUserSeed } from './solana-client/mnemonicGenerator'

// Make functions globally available
declare global {
  interface Window {
    setWalletKey: (privateKey: string) => Promise<void>
    showWalletInput: () => void
    getUserMnemonic: () => string
    regenerateWallet: () => Promise<void>
    clearWallet: () => void
  }
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).setWalletKey = async (privateKey: string) => {
    try {
      console.log('✅ Carteira configurada com sucesso!')
      console.log('Chave privada recebida:', privateKey.substring(0, 10) + '...')
    } catch (error) {
      console.error('❌ Erro ao configurar carteira:', error)
    }
  }
  
  (globalThis as any).showWalletInput = () => {
    console.log('💡 Para inserir sua chave privada, use: setWalletKey("sua_chave_aqui")')
    console.log('💡 Ou use uma das opções do diálogo para chave de exemplo')
  }

  (globalThis as any).getUserMnemonic = () => {
    const mnemonic = getMnemonicPhrase();
    console.log('🔑 === YOUR CURRENT WALLET MNEMONIC ===');
    console.log(`Mnemonic: ${mnemonic}`);
    console.log('🔑 === SAVE THIS PHRASE! ===');
    console.log('💡 This mnemonic is unique to your session and will remain the same until you clear it.');
    return mnemonic;
  }

  (globalThis as any).regenerateWallet = async () => {
    try {
      console.log('🔄 Regenerating wallet...');
      const userSeed = generateUserSeed();
      clearStoredMnemonic(userSeed);
      const walletManager = new WalletManager();
      const wallet = await walletManager.generateWallet();
      console.log('✅ New wallet generated successfully!');
      return wallet;
    } catch (error) {
      console.error('❌ Error regenerating wallet:', error);
    }
  }

  (globalThis as any).clearWallet = () => {
    try {
      const userSeed = generateUserSeed();
      clearStoredMnemonic(userSeed);
      console.log('🗑️ Wallet data cleared! Next wallet generation will create a new mnemonic.');
    } catch (error) {
      console.error('❌ Error clearing wallet:', error);
    }
  }
}

export async function main() {
  console.log('🚀 Starting Decentraland scene...')

  // Setup NPC UI (this includes the dialog system)
  setupUi()
  console.log('✅ NPC UI setup complete')

  // Create cat NPC
  console.log('🐱 Initializing cat NPC...')
  getData(catNpc)
  console.log('Cat NPC data:', catNpc)
  
  // Create computer NPC
  console.log('Initializing PC NPC...')
  getData(computerNpc)
  console.log('Computer NPC data:', computerNpc)

  // Create computer NPC
  console.log('Initializing PC NPC...')
  getData(robotNpc)
  console.log('Computer NPC data:', computerNpc)
  // System messages
  console.log('🎯 Sistema Open Badges 3.0 iniciado!')
  console.log('Interaja com os NPCs para criar e verificar conquistas!')
  console.log('📍 NPCs initialized successfully')
  
  // Wallet system information
  console.log('🔐 Wallet system ready - generates on first NPC interaction')
  console.log('Commands: getUserMnemonic(), regenerateWallet(), clearWallet()')
}

// Call main function to initialize the scene
main()
