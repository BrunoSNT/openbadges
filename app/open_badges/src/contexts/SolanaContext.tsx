import { createContext, useContext, type ReactNode, useState } from 'react';
import { Connection } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import idl from '../idl/open_badges.json';
import type { OpenBadges } from '../types/open_badges';
import  SolanaClient from '@/clients/solana-client';
import ApiClient from '@/clients/api-client';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import { SOLANA_CONFIG } from '@/lib/config';

interface SolanaContextType {
  connection: Connection;
  program: anchor.Program<OpenBadges> | null;
  solanaClient: SolanaClient | null;
  apiClient: ApiClient | null;
  isInitialized: boolean;
  initialize: (wallet: AnchorWallet) => void;
}

const SolanaContext = createContext<SolanaContextType | undefined>(undefined);

// Use the PROGRAM_ID from config
const PROGRAM_ID = SOLANA_CONFIG.PROGRAM_ID;

// Use the RPC URL from config
const CONNECTION_URL = SOLANA_CONFIG.RPC_URL;

export function SolanaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    connection: Connection;
    program: anchor.Program<OpenBadges> | null;
    solanaClient: SolanaClient | null;
    apiClient: ApiClient | null;
    isInitialized: boolean;
  }>({
    connection: new Connection(CONNECTION_URL, {
      commitment: SOLANA_CONFIG.COMMITMENT,
      confirmTransactionInitialTimeout: 120000,
    }),
    program: null,
    solanaClient: null,
    apiClient: null,
    isInitialized: false,
  });

  const initialize = async (wallet: AnchorWallet) => {
    try {
      if (!wallet || !wallet.publicKey) {
        console.error('Cannot initialize Solana context: wallet is not connected');
        return;
      }

      console.log('Initializing with wallet public key:', wallet.publicKey.toBase58());        const provider = new anchor.AnchorProvider(
        state.connection,
        wallet,
        { 
          preflightCommitment: SOLANA_CONFIG.COMMITMENT,
          commitment: SOLANA_CONFIG.COMMITMENT 
        }
      );

      // Set anchor provider globally
      anchor.setProvider(provider);

      console.log('Using program ID:', PROGRAM_ID.toBase58());
      
      // Skip trying to fetch IDL from chain as it's causing errors
      // Directly use the local IDL file which has been updated from target/idl
      console.log("Using local IDL file");
      
      // Make a deep copy of the IDL to avoid modifying the original
      const modifiedIdl = JSON.parse(JSON.stringify(idl));
      
      // Ensure the IDL has the correct program ID
      modifiedIdl.address = PROGRAM_ID.toString();
      
      console.log("Using IDL with program ID:", modifiedIdl.address);
      
      try {
        // Create the program using the modified IDL
        const program = new anchor.Program(
          modifiedIdl as any,
          provider
        ) as anchor.Program<OpenBadges>;
        
        console.log("Program created with ID:", program.programId.toString());
        
        // Create the solana service with the initialized program and wallet
        const solanaClient = new SolanaClient(program, state.connection, provider, wallet);

        // Create the badge service for API interactions
        const apiClient = new ApiClient();

        // Update the state with the initialized components
        setState(prev => ({
          ...prev,
          program,
          solanaClient,
          apiClient,
          isInitialized: true,
        }));
        
        console.log('Solana context initialized successfully');
      } catch (error) {
        console.error('Error initializing program with local IDL:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error initializing Solana context:', error);
    }
  };

  return (
    <SolanaContext.Provider
      value={{
        connection: state.connection,
        program: state.program,
        solanaClient: state.solanaClient,
        apiClient: state.apiClient,
        isInitialized: state.isInitialized,
        initialize,
      }}
    >
      {children}
    </SolanaContext.Provider>
  );
}

export function useSolana() {
  const context = useContext(SolanaContext);
  if (context === undefined) {
    throw new Error('useSolana must be used within a SolanaProvider');
  }
  return context;
}
