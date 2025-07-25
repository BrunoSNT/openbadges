import { executeTask, engine } from '@dcl/sdk/ecs'
import * as npc from 'dcl-npc-toolkit'
import { Dialog } from 'dcl-npc-toolkit'
import { TransactionManager as SolanaClient } from '../solana-client/transaction'
import { showAchievementNameInputUI } from '../ui/achievement-name-ui'

let dialogNextId = 1
function getNextDialogIndex(): number {
    return dialogNextId++
}

// Global state
let solanaClient: SolanaClient | null = null
let userWalletAddress = ''
let userWalletKey = ''
let currentNpcInstance: any = null // Store the current NPC instance for use in callbacks

// Achievement data
let achievementData = { name: '', description: '', criteria: '' }
let createdAchievement: { signature: string, achievementAddress: string } | null = null
let createdIssuer: { signature: string, issuerAddress: string } | null = null
let issuedCredential: { signature: string, credentialAddress: string } | null = null
let hasWallet = false
let hasCredential = false
let hasAchievement = false
let hasIssuerProfile = false
let isProcessing = false // Guard to prevent double execution
let dialogCompleted = false // Track if dialog has been completed
let dialogInProgress = false // Track if dialog is currently active

// Simple dialog state
let simpleDialogActive = false;
let simpleDialogStep = 0;

async function createWallet(): Promise<{ address: string; privateKey: string }> {
  solanaClient = new SolanaClient()
  const wallet = await solanaClient.generateWallet()
  return wallet
}

async function checkWalletBalance(): Promise<void> {
  executeTask(async () => {
    try {
      if (!solanaClient) throw new Error('Cliente não inicializado')
      if (!userWalletAddress) throw new Error('Endereço da carteira não definido')
      const balance = await solanaClient.getBalanceForAddress(userWalletAddress)
      const issuerAddress = await solanaClient.pdaManager.deriveDeterministicPDA(userWalletAddress)
      const pdaBalance = await solanaClient.getBalanceForAddress(issuerAddress)
      if (pdaBalance > 0) {
        hasIssuerProfile = true
        if (!createdIssuer || createdIssuer.issuerAddress !== issuerAddress) {
          createdIssuer = { signature: 'pre-existing', issuerAddress }
        }
        AchievementCreationDialog[5].text = `✅ Carteira com saldo (${balance} SOL) e perfil de emissor existente!\n\n📍 Emissor: ${issuerAddress}\n\nVamos criar sua conquista!`
        AchievementCreationDialog[5].buttons = [{ label: 'Criar conquista', goToDialog: 7 }]
      } else if (balance >= 0.01) {
        AchievementCreationDialog[5].text = `💰 Saldo suficiente: ${balance} SOL\n\nVamos criar seu perfil de emissor!`
        AchievementCreationDialog[5].buttons = [{ label: 'Criar perfil', goToDialog: 6 }]
      } else {
        AchievementCreationDialog[5].text = `⚠️ Saldo insuficiente: ${balance} SOL\n\n📍 Carteira: ${userWalletAddress}\n\n💰 Deposite pelo menos 0.01 SOL no devnet\n\n🔗 Use: https://faucet.solana.com`
        AchievementCreationDialog[5].buttons = [{ label: 'Verificar novamente', goToDialog: 5, triggeredActions: checkWalletBalance }]
      }
    } catch (error) {
      AchievementCreationDialog[5].text = `❌ Erro: ${(error instanceof Error ? error.message : String(error))}\n\n📍 Carteira: ${userWalletAddress}\n\n💰 Tente novamente em alguns segundos`
      AchievementCreationDialog[5].buttons = [{ label: 'Tentar novamente', goToDialog: 5, triggeredActions: checkWalletBalance }]
    }
  })
}

export async function checkAllExistenceAndSetFlags() {
  console.log('🔍 Starting comprehensive blockchain state check...')
  
  // Initialize Solana client first
  if (!solanaClient) {
    console.log('🔗 Initializing Solana client...')
    solanaClient = new SolanaClient();
  }
  
  // Initialize wallet from mnemonic if not already done
  if (!userWalletAddress) {
    console.log('� Initializing wallet from mnemonic...')
    const { address, privateKey } = await solanaClient.generateWallet()
    userWalletAddress = address
    userWalletKey = privateKey
    console.log('✅ Wallet initialized from mnemonic:', userWalletAddress)
    console.log('🔑 ========================================')
    console.log('🔑 WALLET PRIVATE KEY FOR IMPORT:')
    console.log('🔑', privateKey)
    console.log('🔑 ADDRESS:', address)
    console.log('🔑 ========================================')
  }

  console.log('💰 Checking wallet funding...')
  // Check wallet funding
  hasWallet = false;
  if (userWalletAddress && solanaClient) {
    try {
      const balance = await solanaClient.getBalanceForAddress(userWalletAddress);
      hasWallet = balance > 0;
      console.log(`✅ Wallet funding check: ${hasWallet ? 'FUNDED' : 'EMPTY'} (${balance} SOL)`)
    } catch (e) {
      console.log('❌ Wallet funding check failed:', e)
      hasWallet = false;
    }
  }

  console.log('🏢 Checking issuer profile...')
  // Issuer check: only set true if PDA is properly initialized by our program
  hasIssuerProfile = false;
  createdIssuer = null;
  if (solanaClient && userWalletAddress) {
    try {
      const issuerAddress = await solanaClient.pdaManager.deriveDeterministicPDA(userWalletAddress);
      console.log(`📍 Issuer PDA: ${issuerAddress}`)
      const issuerAccountInfo = await solanaClient.getAccountInfo(issuerAddress);
      // Check if account exists AND is owned by our program
      if (issuerAccountInfo && issuerAccountInfo.value && 
          issuerAccountInfo.value.owner === solanaClient.programId) {
        hasIssuerProfile = true;
        createdIssuer = { signature: 'pre-existing', issuerAddress };
        console.log(`✅ Issuer profile check: EXISTS and owned by our program (${issuerAccountInfo.value.lamports} lamports)`)
      } else {
        hasIssuerProfile = false;
        createdIssuer = null;
        console.log(`❌ Issuer profile check: MISSING or not owned by our program`)
        if (issuerAccountInfo?.value) {
          console.log(`   Account owner: ${issuerAccountInfo.value.owner}, expected: ${solanaClient.programId}`)
        }
      }
    } catch (e) {
      console.log('❌ Issuer profile check failed:', e)
      hasIssuerProfile = false;
      createdIssuer = null;
    }
  }

  console.log('🏆 Checking achievement existence...')
  // Achievement check: only set true if PDA is properly initialized by our program
  hasAchievement = false;
  createdAchievement = null;
  let possibleAchievementAddress = '';
  
  // For now, let's check with a default achievement name if we don't have one
  const checkAchievementName = achievementData.name || 'Explorador do Campus Virtual';
  
  if (hasIssuerProfile && solanaClient && createdIssuer?.issuerAddress) {
    try {
      possibleAchievementAddress = await solanaClient.pdaManager.deriveDeterministicAchievementPDA(createdIssuer.issuerAddress, checkAchievementName);
      console.log(`📍 Achievement PDA (${checkAchievementName}): ${possibleAchievementAddress}`)
      const achievementAccountInfo = await solanaClient.getAccountInfo(possibleAchievementAddress);
      // Check if account exists AND is owned by our program
      if (achievementAccountInfo && achievementAccountInfo.value && 
          achievementAccountInfo.value.owner === solanaClient.programId) {
        hasAchievement = true;
        createdAchievement = { signature: 'pre-existing', achievementAddress: possibleAchievementAddress };
        console.log(`✅ Achievement check: EXISTS and owned by our program (${achievementAccountInfo.value.lamports} lamports)`)
      } else {
        hasAchievement = false;
        createdAchievement = null;
        console.log(`❌ Achievement check: MISSING or not owned by our program`)
        if (achievementAccountInfo?.value) {
          console.log(`   Account owner: ${achievementAccountInfo.value.owner}, expected: ${solanaClient.programId}`)
        }
      }
      
      // If we found an achievement, set the achievement data
      if (hasAchievement && !achievementData.name) {
        achievementData.name = checkAchievementName;
        achievementData.description = 'Conquista concedida por explorar o campus virtual da UnB no Decentraland';
        achievementData.criteria = 'Interagir com NPCs e explorar diferentes áreas do campus virtual';
      }
    } catch (e) {
      console.log('❌ Achievement check failed:', e)
      hasAchievement = false;
      createdAchievement = null;
    }
  } else {
    console.log('⚠️ Skipping achievement check - issuer profile required first')
  }

  console.log('🎖️ Checking credential existence...')
  // Credential check: only set true if PDA is funded
  hasCredential = false;
  issuedCredential = null;
  if (hasAchievement && userWalletAddress && solanaClient && createdAchievement?.achievementAddress) {
    try {
      const issuerAddress = await solanaClient.pdaManager.deriveDeterministicPDA(userWalletAddress);
      const credentialAddress = await solanaClient.pdaManager.deriveDeterministicCredentialPDA(createdAchievement.achievementAddress, issuerAddress, userWalletAddress);
      console.log(`📍 Credential PDA: ${credentialAddress}`)
      const credentialBalance = await solanaClient.getBalanceForAddress(credentialAddress);
      hasCredential = credentialBalance > 0;
      issuedCredential = hasCredential ? { signature: 'pre-existing', credentialAddress } : null;
      console.log(`✅ Credential check: ${hasCredential ? 'EXISTS' : 'MISSING'} (${credentialBalance} SOL)`)
    } catch (e) {
      console.log('❌ Credential check failed:', e)
      hasCredential = false;
      issuedCredential = null;
    }
  } else {
    console.log('⚠️ Skipping credential check - achievement required first')
  }
  
  console.log('📊 Final state summary:')
  console.log(`  Wallet: ${hasWallet ? '✅' : '❌'} (${userWalletAddress})`)
  console.log(`  Issuer: ${hasIssuerProfile ? '✅' : '❌'} (${createdIssuer?.issuerAddress || 'N/A'})`)
  console.log(`  Achievement: ${hasAchievement ? '✅' : '❌'} (${createdAchievement?.achievementAddress || 'N/A'})`)
  console.log(`  Credential: ${hasCredential ? '✅' : '❌'} (${issuedCredential?.credentialAddress || 'N/A'})`)
}

export async function startAchievementDialog(npcInstance: any) {
  console.log('[Dialog] startAchievementDialog called for NPC:', npcInstance)
  
  // Store the NPC instance for use in callbacks
  currentNpcInstance = npcInstance
  
  // Prevent multiple simultaneous dialogs, but allow restart if dialog was completed
  if (dialogInProgress && !dialogCompleted) {
    console.log('⚠️ Dialog already in progress and not completed, ignoring activation');
    return;
  }
  
  // Force cleanup if we detect a stuck state (dialog in progress but everything is completed)
  if (dialogInProgress && hasWallet && hasIssuerProfile && hasAchievement && hasCredential) {
    console.log('🔄 Detected stuck dialog state with completed process, forcing cleanup...');
    cleanupDialogState();
  }
  
  // If dialog was completed, reset it for a fresh start but keep completed flag
  if (dialogCompleted) {
    console.log('✅ Dialog was completed, allowing restart. Showing completion status...');
    // Reset progress flag but keep completed flag to show final message
    dialogInProgress = true;
    // Use the existing completion dialog instead of creating a new array
    AchievementCreationDialog[14].text = '🎉 Você já completou todo o processo!\n\n📍 Sua carteira: ' + userWalletAddress;
    try {
      npc.talk(npcInstance, AchievementCreationDialog, 14);
      // Immediate cleanup since this is just a status message
      cleanupDialogState();
    } catch (error) {
      console.error('❌ Error showing completion dialog:', error);
      cleanupDialogState();
    }
    return;
  }
  
  dialogInProgress = true;
  
  try {
    // Reset any previous dialog state
    if (dialogCompleted) {
      console.log('🔄 Resetting completed dialog state for new interaction');
    }
    
    await checkAllExistenceAndSetFlags();
    
    // Update dialog dynamically based on current state
    updateDialogBasedOnState();
    
    // If everything is complete, start from the completion dialog
    let startIndex = 1;
    if (hasWallet && hasIssuerProfile && hasAchievement && hasCredential) {
      startIndex = 13; // Start from completion dialog
      dialogCompleted = true; // Mark as completed since everything is done
      console.log('🎉 All steps completed, starting from completion dialog');
    } else {
      startIndex = getNextDialogIndex();
    }

    npc.talk(npcInstance, AchievementCreationDialog, startIndex);
    console.log('🔄 Starting achievement dialog from index:', startIndex)

    // For completion dialogs, ensure cleanup happens
    if (startIndex === 13) {
      executeTask(async () => {
        // Mark as completed when we show the completion dialog
        dialogCompleted = true;
        console.log('✅ Dialog marked as completed after showing completion sequence');
      });
    }
    
  } catch (error) {
    console.error('❌ Error starting dialog:', error);
    cleanupDialogState();
  }
}

function updateDialogBasedOnState() {
  console.log('🔄 Updating dialog based on cached state...')
  
  // Update dialog index 2 based on current wallet state
  if (hasWallet) {
    if (hasIssuerProfile && hasAchievement && hasCredential) {
      // All complete - show completion dialog
      AchievementCreationDialog[2].text = `🎉 Processo completo!\n\n📍 ${userWalletAddress}\n\n✅ Perfil: ${createdIssuer?.issuerAddress}\n✅ Conquista: ${createdAchievement?.achievementAddress}\n✅ Credencial: ${issuedCredential?.credentialAddress}`;
      AchievementCreationDialog[2].buttons = [
        {
          label: 'Nova conquista',
          goToDialog: 7
        },
        {
          label: 'Finalizar',
          goToDialog: 14
        }
      ];
    } else if (hasIssuerProfile && hasAchievement) {
      // Has achievement, need credential
      AchievementCreationDialog[2].text = `✅ Conquista existente!\n\n📍 ${createdAchievement?.achievementAddress}\n\nReceber credencial?`;
      AchievementCreationDialog[2].buttons = [
        {
          label: 'Receber credencial',
          goToDialog: 11
        },
        {
          label: 'Nova conquista',
          goToDialog: 7
        }
      ];
    } else if (hasIssuerProfile) {
      // Has issuer, need achievement
      AchievementCreationDialog[2].text = `✅ Perfil de emissor existente!\n\n📍 ${createdIssuer?.issuerAddress}\n\nCriar conquista?`;
      AchievementCreationDialog[2].buttons = [
        {
          label: 'Criar conquista',
          goToDialog: 7 // Go to the special handling index
        },
        {
          label: 'Ver perfil',
          goToDialog: 15
        }
      ];
    } else {
      // Has wallet, need issuer
      AchievementCreationDialog[2].text = `✅ Carteira configurada!\n\n📍 ${userWalletAddress}\n\nCriar perfil de emissor?`;
      AchievementCreationDialog[2].buttons = [
        {
          label: 'Criar perfil',
          goToDialog: 6
        },
        {
          label: 'Ver carteira',
          goToDialog: 15
        }
      ];
    }
  } else {
    AchievementCreationDialog[2].text = 'Para começar você precisa de uma carteira.\n\nPosso criar uma para você?';
    AchievementCreationDialog[2].buttons = [
      {
        label: 'Criar',
        goToDialog: 3,
        fontSize: 14
      },
      {
        label: 'O que é uma carteira?',
        goToDialog: 15,
        fontSize: 14
      }
    ];
  }
}

export let AchievementCreationDialog: Dialog[] = [
  {
    text: 'Olá! Bem-vindo ao Sistema de Credenciamento e Conquistas!'
  },
  {
    text: 'Aqui você pode criar conquistas e credenciais verificáveis'
  },
  {
    text: 'Para começar você precisa de uma carteira.\n\nPosso criar uma para você?', // Will be updated dynamically
    isQuestion: true,
    buttons: [ // Will be updated dynamically
      {
        label: 'Criar',
        goToDialog: 3,
        fontSize: 14
      },
      {
        label: 'O que é uma carteira?',
        goToDialog: 15,
        fontSize: 14
      }
    ]
  },
  {
    text: '🔧 Criando nova carteira...\nAguarde um momento!',
    isQuestion: true,
    buttons: [
      {
        label: 'Criar',
        goToDialog: 4,
        triggeredActions: async () => {
          executeTask(async () => {
            try {
              const wallet = await createWallet()
              userWalletAddress = wallet.address
              userWalletKey = wallet.privateKey
              hasWallet = true
              
              // Print private key for manual funding
              console.log('🔑 PRIVATE KEY:', wallet.privateKey)
              console.log('📍 ADDRESS:', wallet.address)
              console.log('💰 Please manually fund this wallet on Solana devnet')
              
              // Update dialog with beautiful formatting
              AchievementCreationDialog[4].text = `🎉 Carteira criada com sucesso!\n\n📍 Endereço:\n${wallet.address}\n\n🔑 Chave Privada:\n${wallet.privateKey}\n\n💰 Deposite SOL no devnet\n\n🔗 Ver no Explorer\n\n⚠️ Salve a chave privada!`
              
              await checkAllExistenceAndSetFlags();
              // Jump to the correct next dialog
              if (
                AchievementCreationDialog[3] &&
                Array.isArray(AchievementCreationDialog[3].buttons) &&
                AchievementCreationDialog[3].buttons.length > 0
              ) {
                const nextIndex = getNextDialogIndex();
                AchievementCreationDialog[3].buttons[0].goToDialog = nextIndex;
              }
            } catch (error: any) {
              console.error('❌ Erro ao criar carteira:', error)
              const errorMsg = error instanceof Error ? error.message : 
                              error && typeof error === 'object' ? JSON.stringify(error) :
                              String(error) || 'Erro desconhecido'
              
              AchievementCreationDialog[4].text = `❌ Erro ao criar carteira:\n\n${errorMsg}\n\nVerifique a conexão com a rede Solana devnet.\n\n🔍 Verifique o console para mais detalhes.`
            }
          })
        }
      }
    ]
  },
  {
    text: '⏳ Processando...',
    isQuestion: true,
    buttons: [
      {
        label: 'Continuar',
        goToDialog: 5
      }
    ]
  },
  {
    text: '✅ Carteira criada!\n\nVerificando saldo antes de prosseguir...',
    isQuestion: true,
    buttons: [
      {
        label: 'Verificar saldo',
        goToDialog: 5,
        triggeredActions: checkWalletBalance
      }
    ]
  },
  {
    text: 'Criando perfil de emissor...',
    isQuestion: true,
    buttons: [
      {
        label: 'Criar',
        goToDialog: 7,
        triggeredActions: async () => {
          executeTask(async () => {
            try {
              if (!solanaClient) {
                throw new Error('Cliente não inicializado')
              }
              
              // Use cached results instead of checking again
              if (hasIssuerProfile && createdIssuer) {
                console.log('ℹ️ Using cached issuer profile!')
                AchievementCreationDialog[7].text = `✅ Perfil já existe!\n\n📍 ${createdIssuer.issuerAddress}\n\n✅ Continuando...`
              } else {
                console.log('🔄 Creating new issuer profile...')
                const result = await solanaClient.initializeIssuer(
                  'UnB Campus Virtual',
                  'https://unb.br',
                  'campus-virtual@unb.br'
                )
                
                createdIssuer = result
                hasIssuerProfile = true
                console.log('✅ Perfil de emissor criado!')
                console.log('🔗 Transação:', result.signature)
                console.log('📍 Endereço do Emissor:', result.issuerAddress)
                
                AchievementCreationDialog[7].text = `🎉 Perfil de emissor criado!\n\n📍 ${result.issuerAddress}\n\n🔗 Ver transação no Explorer\n\n✅ Registrado na blockchain!`
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : (error ? String(error) : 'Erro desconhecido')
              
              if (errorMsg.includes('INSUFFICIENT_BALANCE')) {
                const balance = errorMsg.split(':')[1]
                AchievementCreationDialog[7].text = `💰 Saldo insuficiente: ${balance} SOL\n\n📍 Deposite mais SOL e tente novamente`
                AchievementCreationDialog[7].buttons = [
                  {
                    label: 'Verificar saldo',
                    goToDialog: 5
                  }
                ]
              } else if (errorMsg.includes('Transaction failed')) {
                AchievementCreationDialog[7].text = `❌ Transação falhou: ${errorMsg}\n\n💡 Verifique se o programa está ativo no devnet`
              } else {
                AchievementCreationDialog[7].text = `❌ Erro: ${errorMsg}\n\n📍 Tente novamente em alguns segundos`
                AchievementCreationDialog[7].buttons = [
                  {
                    label: 'Tentar novamente',
                    goToDialog: 7
                  }
                ]
              }
            }
          })
        }
      }
    ],
  },
  {
    text: '🏆 Vamos criar sua primeira conquista!\n\nQual será o nome?',
    isQuestion: true,
    buttons: [
      {
        label: 'Padrão',
        goToDialog: 8,
        triggeredActions: () => {
          achievementData.name = 'Explorador do Campus Virtual'
        }
      },
      {
        label: 'Digitar',
        goToDialog: 8, // Go directly to next step, but first show input
        triggeredActions: () => {
          console.log('🔧 Will show custom input UI')
          // Set a temporary name first
          achievementData.name = 'Custom Achievement'
          // Show the input UI immediately
          showAchievementNameInputUI((value: string) => {
            console.log('🔧 Input received from custom UI:', value)
            achievementData.name = value
            // Update the description for the custom achievement
            achievementData.description = `Conquista personalizada: ${value}`
            achievementData.criteria = 'Conquista criada pelo usuário com nome personalizado'
            console.log('🔧 Achievement data updated:', achievementData)
          })
        }
      }
    ]
  },
  {
    text: 'Agora vou definir a descrição da conquista baseada no nome escolhido.',
    isQuestion: true,
    buttons: [
      {
        label: 'Continuar',
        goToDialog: 9,
        triggeredActions: () => {
          switch (achievementData.name) {
            case 'Explorador do Campus Virtual':
              achievementData.description = 'Conquista concedida por explorar o campus virtual da UnB no Decentraland'
              achievementData.criteria = 'Interagir com NPCs e explorar diferentes áreas do campus virtual'
              break
            case 'Primeiro Contato com Blockchain':
              achievementData.description = 'Conquista concedida por aprender sobre tecnologia blockchain e carteiras digitais'
              achievementData.criteria = 'Completar a introdução sobre blockchain e criar uma carteira digital'
              break
            case 'Criador de Conquistas':
              achievementData.description = 'Conquista concedida por criar sua primeira conquista no sistema Open Badges'
              achievementData.criteria = 'Criar com sucesso uma conquista usando o sistema Open Badges 3.0'
              break
          }
        }
      }
    ]
  },
  {
    text: 'Perfeito! Agora vou criar a conquista na blockchain usando o programa Open Badges...',
    isQuestion: true,
    buttons: [
      {
        label: 'Criar conquista',
        goToDialog: 10,
        triggeredActions: async () => {
          if (isProcessing) {
            console.log('⚠️ Achievement creation already in progress, skipping...')
            return
          }
          isProcessing = true
          
          executeTask(async () => {
            let possibleAchievementAddress: string = ''; // Declare outside try block
            try {
              console.log('🔄 Criando conquista na blockchain...')
              console.log('Dados da conquista:', achievementData)
              
              if (!solanaClient) {
                throw new Error('Cliente não inicializado')
              }
              
              if (!createdIssuer || !createdIssuer.issuerAddress) {
                AchievementCreationDialog[10].text = `❌ Erro: Perfil de emissor não encontrado.\n\n💡 Por favor, crie seu perfil de emissor primeiro.`
                AchievementCreationDialog[10].buttons = [
                  {
                    label: 'Criar perfil',
                    goToDialog: 6
                  }
                ]
                return // Exit early
              }

              if (!achievementData.name || !achievementData.description) {
                throw new Error('Dados da conquista inválidos')
              }
              
              // Use cached results from checkAllExistenceAndSetFlags instead of re-deriving
              if (hasAchievement && createdAchievement?.achievementAddress) {
                console.log('ℹ️ Using cached achievement result!')
                possibleAchievementAddress = createdAchievement.achievementAddress;
                AchievementCreationDialog[10].text = `✅ Conquista já existe!\n\n📍 Endereço da conquista: ${possibleAchievementAddress}\n\n✅ Continuando...`;
                AchievementCreationDialog[10].buttons = [
                  {
                    label: 'Continuar',
                    goToDialog: 11 // Go to the next step, which is credential issuance
                  }
                ];
              } else {
                console.log('🔄 Creating new achievement on blockchain...')
                // Achievement doesn't exist, create it
                const result = await solanaClient.createAchievement(
                  createdIssuer?.issuerAddress || '',
                  achievementData.name, // achievementId
                  achievementData.name, // name
                  achievementData.description, // description
                  achievementData.criteria, // criteriaNarrative
                  '', // criteriaId (if you have one)
                  userWalletAddress // creator
                )
                
                createdAchievement = {
                  signature: result.signature,
                  achievementAddress: result.achievementAddress
                }
                
                hasAchievement = true
                
                console.log('🎉 Conquista criada com sucesso!')
                console.log('🔗 Transação:', result.signature)
                console.log('📍 Endereço da conquista:', result.achievementAddress)
                
                AchievementCreationDialog[10].text = `🎉 Conquista criada!\n\n📍 ${result.achievementAddress}\n\n🔗 Ver no Explorer\n\n✅ Registrada na blockchain!`
                AchievementCreationDialog[10].buttons = [
                  {
                    label: 'Continuar',
                    goToDialog: 11
                  }
                ];
              }

            } catch (error: any) {
              console.error('Erro ao criar conquista:', error)
              let errorMsg = error instanceof Error ? error.message : (error ? String(error) : 'Erro desconhecido')

              if (error && error.data && error.data.logs) {
                  const logs = error.data.logs as string[];
                  const accountInUseLog = logs.find(log => log.includes('already in use'));
                  if (accountInUseLog) {
                      errorMsg = `Conquista já existente no endereço: ${possibleAchievementAddress}. Por favor, use um nome diferente ou continue.`;
                  } else if (logs.some(log => log.includes('custom program error'))) {
                      errorMsg = `Erro no programa Solana: ${logs.join('\n')}`; // Join logs for better detail
                  }
              }

              if (errorMsg.includes('INSUFFICIENT_BALANCE')) {
                const balance = errorMsg.split(':')[1]
                AchievementCreationDialog[10].text = `💰 Saldo insuficiente: ${balance} SOL\n\n📍 Deposite mais SOL e tente novamente`
                AchievementCreationDialog[10].buttons = [
                  {
                    label: 'Verificar saldo',
                    goToDialog: 5
                  }
                ]
              } else if (errorMsg.includes('Transaction failed') || errorMsg.includes('Erro no programa Solana') || errorMsg.includes('Conquista já existente')) {
                AchievementCreationDialog[10].text = `❌ Transação falhou: ${errorMsg}\n\n💡 Verifique a conexão e o saldo.`
                AchievementCreationDialog[10].buttons = [
                  {
                    label: 'Tentar novamente',
                    goToDialog: 9, // Go back to the prompt to create achievement
                    triggeredActions: async () => {
                      console.log('Retrying achievement creation...');
                    }
                  }
                ]
              } else if (errorMsg.includes('Client not initialized')) {
                AchievementCreationDialog[10].text = `❌ Erro: Cliente Solana não inicializado.\n\n💡 Tente recarregar a cena.`
                AchievementCreationDialog[10].buttons = [
                  {
                    label: 'Tentar novamente',
                    goToDialog: 9,
                    triggeredActions: async () => {
                      console.log('Retrying achievement creation...');
                    }
                  }
                ]
              } else if (errorMsg.includes('Dados da conquista inválidos')) {
                AchievementCreationDialog[10].text = `❌ Erro: Dados da conquista inválidos.\n\n💡 Por favor, escolha um nome e descrição válidos.`
                AchievementCreationDialog[10].buttons = [
                  {
                    label: 'Tentar novamente',
                    goToDialog: 7, // Go back to the prompt to choose achievement name
                    triggeredActions: async () => {
                                           console.log('Retrying achievement creation - invalid data...');
                    }
                  }
                ]
              }
              else {
                AchievementCreationDialog[10].text = `❌ Erro ao criar conquista:\n\n${errorMsg}\n\n💡 Verifique a conexão e o saldo.`
                AchievementCreationDialog[10].buttons = [
                  {
                    label: 'Tentar novamente',
                    goToDialog: 9,
                    triggeredActions: async () => {
                      console.log('Retrying achievement creation...');
                    }
                  }
                ]
              }
            } finally {
              isProcessing = false
            }
          })
        }
      }
    ]
  },
  {
    text: 'Processando criação da conquista...',
    isQuestion: true,
    buttons: [
      {
        label: 'Continuar',
        goToDialog: 11
      }
    ]
  },
  {
    text: 'Agora, como recompensa por criar sua conquista, vou emitir uma credencial para você!',
    isQuestion: true,
    buttons: [
      {
        label: 'Receber credencial',
        goToDialog: 12,
        triggeredActions: async () => {
          executeTask(async () => {
            try {
              console.log('🔄 Emitindo credencial na blockchain...')
              if (!solanaClient) throw new Error('Cliente não inicializado')
              
              // Use cached results instead of checking again
              if (hasCredential && issuedCredential) {
                console.log('ℹ️ Using cached credential result!')
                AchievementCreationDialog[12].text = `✅ Credencial já existe!\n\n📍 ${issuedCredential.credentialAddress}\n\n✅ Continuando...`
              } else if (!hasAchievement || !createdAchievement?.achievementAddress) {
                AchievementCreationDialog[12].text = `❌ Erro: Conquista não encontrada.\n\n💡 Por favor, crie uma conquista primeiro.`
                AchievementCreationDialog[12].buttons = [
                  {
                    label: 'Criar conquista',
                    goToDialog: 7
                  }
                ]
                return // Exit early
              } else {
                console.log('🔄 Creating new credential...')
                const result = await solanaClient.issueCredential(
                  createdAchievement.achievementAddress,
                  userWalletAddress
                )
                issuedCredential = {
                  signature: result.signature,
                  credentialAddress: result.credentialAddress
                }
                hasCredential = true
                console.log('🏆 Credencial emitida com sucesso!')
                console.log('🔗 Transação:', result.signature)
                console.log('📍 Endereço da credencial:', result.credentialAddress)
                AchievementCreationDialog[12].text = `🏆 Parabéns! Primeira credencial recebida!\n\n📍 Carteira: ${userWalletAddress}\n\n🎖️ Credencial: ${result.credentialAddress}\n\n🔗 Ver no Explorer\n\n✅ Verificável na blockchain!`
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
              if (errorMsg.includes('Issuer information is missing')) {
                AchievementCreationDialog[12].text = `❌ Erro: Informações do emissor não encontradas.\n\n💡 Por favor, crie seu perfil de emissor primeiro.`
                AchievementCreationDialog[12].buttons = [
                  {
                    label: 'Criar perfil',
                    goToDialog: 6
                  }
                ]
                return
              }
              if (errorMsg.includes('INSUFFICIENT_BALANCE')) {
                const balance = errorMsg.split(':')[1]
                AchievementCreationDialog[12].text = `💰 Saldo insuficiente: ${balance} SOL\n\n📍 Deposite mais SOL e tente novamente`
                AchievementCreationDialog[12].buttons = [
                  {
                    label: 'Verificar saldo',
                    goToDialog: 5
                  }
                ]
              } else if (errorMsg.includes('NEED_SDK_IMPLEMENTATION')) {
                AchievementCreationDialog[12].text = `✅ Validação passou!\n\n💡 Para transações reais, implemente SDK do Solana\n\n🔧 Simulando sucesso por agora...`
                hasCredential = true
                issuedCredential = {
                  signature: 'demo-credential-' + Date.now(),
                  credentialAddress: 'demo-credential-address-' + Date.now()
                }
              } else {
                AchievementCreationDialog[12].text = `❌ Erro: ${errorMsg}\n\n💡 Verifique conexão e saldo`
              }
            }
          })
        }
      }
    ]
  },
  {
    text: 'Processando emissão da credencial...',
    isQuestion: true,
    buttons: [
      {
        label: 'Continuar',
        goToDialog: 13
      }
    ]
  },
  {
    text: 'Excelente! Você completou todo o processo de criação de conquistas e recebimento de credenciais.',
    isQuestion: true,
    buttons: [
      {
        label: 'Nova conquista',
        goToDialog: 7
      },
      {
        label: 'Finalizar',
        goToDialog: 14,
        triggeredActions: async () => {
          dialogCompleted = true;
          cleanupDialogState();
          console.log('✅ Dialog marked as completed and state cleaned');
        }
      }
    ]
  },
  {
    text: 'Parabéns por completar sua jornada no sistema! Você usou a blockchain, criou conquistas e recebeu credenciais verificáveis.\n\nAgora você pode usar suas conquistas ou credenciais para interagir com NPCs e acessar novas áreas.',
    isEndOfDialog: true,
    buttons: []
  },
  {
    text: 'Uma carteira é chave/caneta que assina alterações no estado da blockchain. Ela permite que você autorize armazenamento, envie e receba informações digitais de forma segura, sem que ninguem se passe por você ou altere o que você fez.',
    isQuestion: true,
    buttons: [
      {
        label: 'Entendi, criar',
        goToDialog: 3
      }
    ]
  }
];

// Add cleanup function to reset dialog state
function cleanupDialogState() {
  console.log('🧹 Cleaning up dialog state...')
  dialogInProgress = false
  isProcessing = false
  console.log('✅ Dialog state cleaned up')
}

// Force reset function for when dialogs get stuck
export function forceResetDialogState() {
  console.log('🔄 Force resetting all dialog state...')
  dialogInProgress = false
  dialogCompleted = false
  isProcessing = false
  console.log('✅ All dialog state force reset')
}

// Export cleanup function for external use if needed
export { cleanupDialogState }

export function startSimpleAchievementDialog() {
    if (simpleDialogActive) {
        console.log("Dialog already in progress.");
        return;
    }
    simpleDialogActive = true;
    simpleDialogStep = 0;
    console.log("Starting simple dialog...");
    // Here you would typically show some UI to the user
    // For now, we'll just log the steps
    runSimpleDialogStep();
}

function runSimpleDialogStep() {
    if (!simpleDialogActive) return;

    switch (simpleDialogStep) {
        case 0:
            console.log("Step 0: Welcome! Do you want to create a wallet?");
            // In a real scenario, you'd wait for user input
            // For this example, we'll just proceed
            engine.addSystem((dt: number) => {
                if (simpleDialogStep === 0) {
                    simpleDialogStep = 1;
                    runSimpleDialogStep();
                    engine.removeSystem(runSimpleDialogStep)
                }
            })
            break;
        case 1:
            console.log("Step 1: Creating wallet...");
            executeTask(async () => {
                const wallet = await createWallet();
                userWalletAddress = wallet.address;
                userWalletKey = wallet.privateKey;
                hasWallet = true;
                console.log(`Step 1 Complete: Wallet created! Address: ${userWalletAddress}`);
                simpleDialogStep = 2;
                runSimpleDialogStep();
            });
            break;
        case 2:
            console.log("Step 2: Wallet created. Dialog finished.");
            simpleDialogActive = false;
            break;
    }
}