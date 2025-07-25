import { useEffect, useState, useCallback, useRef } from 'react';
import { PublicKey, type Logs } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

// ===================================================================
// REAL-TIME EVENT TYPES
// ===================================================================

export interface BlockchainEvent {
  id: string;
  type: 'ISSUER_CREATED' | 'ACHIEVEMENT_CREATED' | 'CREDENTIAL_ISSUED' | 'CREDENTIAL_VERIFIED' | 'TRANSACTION_STARTED' | 'TRANSACTION_CONFIRMED' | 'TRANSACTION_FAILED';
  timestamp: number;
  data: any;
  signature?: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  progress?: number;
  message?: string;
}

export interface RealtimeState {
  events: BlockchainEvent[];
  activeEvents: BlockchainEvent[];
  isListening: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

// ===================================================================
// REAL-TIME EVENTS HOOK
// ===================================================================

export const useRealtimeEvents = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  
  const [state, setState] = useState<RealtimeState>({
    events: [],
    activeEvents: [],
    isListening: false,
    connectionStatus: 'disconnected'
  });

  const listenersRef = useRef<number[]>([]);
  const eventTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // ===================================================================
  // EVENT MANAGEMENT
  // ===================================================================

  const addEvent = useCallback((event: Omit<BlockchainEvent, 'id' | 'timestamp'>) => {
    const newEvent: BlockchainEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      ...event
    };

    setState(prev => ({
      ...prev,
      events: [newEvent, ...prev.events].slice(0, 100), // Keep last 100 events
      activeEvents: event.status === 'pending' || event.status === 'processing' 
        ? [newEvent, ...prev.activeEvents] 
        : prev.activeEvents
    }));

    // Auto-remove completed events after 5 seconds
    if (event.status === 'success' || event.status === 'error') {
      const timeoutId = setTimeout(() => {
        setState(prev => ({
          ...prev,
          activeEvents: prev.activeEvents.filter(e => e.id !== newEvent.id)
        }));
        eventTimeoutRef.current.delete(newEvent.id);
      }, 5000);
      
      eventTimeoutRef.current.set(newEvent.id, timeoutId);
    }

    return newEvent.id;
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<BlockchainEvent>) => {
    setState(prev => ({
      ...prev,
      events: prev.events.map(event => 
        event.id === id ? { ...event, ...updates } : event
      ),
      activeEvents: prev.activeEvents.map(event => 
        event.id === id ? { ...event, ...updates } : event
      )
    }));

    // Handle completion
    if (updates.status === 'success' || updates.status === 'error') {
      const timeoutId = setTimeout(() => {
        setState(prev => ({
          ...prev,
          activeEvents: prev.activeEvents.filter(e => e.id !== id)
        }));
        eventTimeoutRef.current.delete(id);
      }, 5000);
      
      eventTimeoutRef.current.set(id, timeoutId);
    }
  }, []);

  const removeEvent = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      activeEvents: prev.activeEvents.filter(e => e.id !== id)
    }));
    
    const timeoutId = eventTimeoutRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      eventTimeoutRef.current.delete(id);
    }
  }, []);

  // ===================================================================
  // BLOCKCHAIN EVENT LISTENERS
  // ===================================================================

  const startListening = useCallback(async () => {
    if (!connection || !publicKey) return;

    try {
      setState(prev => ({ ...prev, isListening: true, connectionStatus: 'connected' }));

      // Listen to all logs for our program
      const programId = new PublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"); // Replace with your program ID
      
      const listenerId = connection.onLogs(
        programId,
        (logs: Logs) => {
          console.log('🔗 Blockchain Event Received:', logs);
          
          // Parse program logs for events
          logs.logs.forEach(log => {
            if (log.includes('Program log: 🏆 ISSUER_CREATED')) {
              addEvent({
                type: 'ISSUER_CREATED',
                status: 'success',
                message: 'Issuer profile created successfully!',
                data: { signature: logs.signature },
                signature: logs.signature
              });
            }
            
            if (log.includes('Program log: 🎯 ACHIEVEMENT_CREATED')) {
              addEvent({
                type: 'ACHIEVEMENT_CREATED',
                status: 'success',
                message: 'Achievement created successfully!',
                data: { signature: logs.signature },
                signature: logs.signature
              });
            }
            
            if (log.includes('Program log: 🏅 CREDENTIAL_ISSUED')) {
              addEvent({
                type: 'CREDENTIAL_ISSUED',
                status: 'success',
                message: 'Credential issued successfully!',
                data: { signature: logs.signature },
                signature: logs.signature
              });
            }
            
            if (log.includes('Program log: ✅ CREDENTIAL_VERIFIED')) {
              addEvent({
                type: 'CREDENTIAL_VERIFIED',
                status: 'success',
                message: 'Credential verified successfully!',
                data: { signature: logs.signature },
                signature: logs.signature
              });
            }
          });
        },
        'confirmed'
      );

      listenersRef.current.push(listenerId);

    } catch (error) {
      console.error('Failed to start listening:', error);
      setState(prev => ({ ...prev, isListening: false, connectionStatus: 'disconnected' }));
    }
  }, [connection, publicKey, addEvent]);

  const stopListening = useCallback(() => {
    listenersRef.current.forEach(listenerId => {
      connection.removeOnLogsListener(listenerId);
    });
    listenersRef.current = [];
    
    // Clear all timeouts
    eventTimeoutRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    eventTimeoutRef.current.clear();
    
    setState(prev => ({ 
      ...prev, 
      isListening: false, 
      connectionStatus: 'disconnected',
      activeEvents: []
    }));
  }, [connection]);

  // ===================================================================
  // LIFECYCLE
  // ===================================================================

  useEffect(() => {
    if (publicKey && connection) {
      startListening();
    }

    return () => {
      stopListening();
    };
  }, [publicKey, connection, startListening, stopListening]);

  // ===================================================================
  // HELPER FUNCTIONS
  // ===================================================================

  const emitTransactionStarted = useCallback((type: BlockchainEvent['type'], message: string, data?: any) => {
    return addEvent({
      type: 'TRANSACTION_STARTED',
      status: 'pending',
      message,
      data: { ...data, originalType: type }
    });
  }, [addEvent]);

  const emitTransactionProgress = useCallback((eventId: string, progress: number, message?: string) => {
    updateEvent(eventId, {
      status: 'processing',
      progress,
      message: message || `Processing... ${progress}%`
    });
  }, [updateEvent]);

  const emitTransactionSuccess = useCallback((eventId: string, signature: string, data?: any) => {
    updateEvent(eventId, {
      status: 'success',
      progress: 100,
      signature,
      message: 'Transaction confirmed!',
      data
    });
  }, [updateEvent]);

  const emitTransactionError = useCallback((eventId: string, error: string) => {
    updateEvent(eventId, {
      status: 'error',
      message: `Transaction failed: ${error}`
    });
  }, [updateEvent]);

  return {
    ...state,
    addEvent,
    updateEvent,
    removeEvent,
    startListening,
    stopListening,
    emitTransactionStarted,
    emitTransactionProgress,
    emitTransactionSuccess,
    emitTransactionError
  };
};
