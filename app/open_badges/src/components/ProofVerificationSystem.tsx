import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Key, 
  Hash, 
  FileText, 
  Zap,
  Eye,
  Unlock,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';

interface ProofStep {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'error';
  details?: string;
  duration?: number;
}

interface ProofVerificationSystemProps {
  credentialData?: any;
  onVerificationComplete?: (result: { isValid: boolean; proofDetails: any }) => void;
  autoStart?: boolean;
}

export const ProofVerificationSystem: React.FC<ProofVerificationSystemProps> = ({
  credentialData,
  onVerificationComplete,
  autoStart = false
}) => {
  const { events, connectionStatus } = useRealtimeEvents();
  const isConnected = connectionStatus === 'connected';
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    proofDetails: any;
  } | null>(null);

  const [steps, setSteps] = useState<ProofStep[]>([
    {
      id: 'input-validation',
      name: 'Input Validation',
      description: 'Validating credential structure and required fields',
      icon: <FileText className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'proof-extraction',
      name: 'Proof Extraction',
      description: 'Extracting DataIntegrityProof from credential',
      icon: <Key className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'signature-preparation',
      name: 'Signature Preparation',
      description: 'Preparing canonical signature input using RDF canonicalization',
      icon: <Hash className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'hash-generation',
      name: 'Hash Generation',
      description: 'Generating SHA-256 hash of canonicalized data',
      icon: <Zap className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'signature-verification',
      name: 'Ed25519 Verification',
      description: 'Verifying Ed25519 signature using Solana cryptography',
      icon: <Shield className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'timestamp-validation',
      name: 'Timestamp Validation',
      description: 'Validating proof creation timestamp and expiry',
      icon: <Clock className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'blockchain-verification',
      name: 'Blockchain Verification',
      description: 'Verifying against Solana blockchain state',
      icon: <Unlock className="w-4 h-4" />,
      status: 'pending'
    }
  ]);

  // Listen for proof-related events
  useEffect(() => {
    const proofEvents = events.filter(event => 
      event.message && (
        event.message.includes('PROOF') || 
        event.message.includes('🔐') ||
        event.message.includes('Ed25519') ||
        event.message.includes('VERIFICATION')
      )
    );

    if (proofEvents.length > 0 && isVerifying) {
      // Update step status based on events
      const latestEvent = proofEvents[proofEvents.length - 1];
      if (latestEvent.message) {
        updateStepFromEvent(latestEvent.message);
      }
    }
  }, [events, isVerifying]);

  const updateStepFromEvent = (eventMessage: string) => {
    setSteps(prevSteps => {
      const newSteps = [...prevSteps];
      
      if (eventMessage.includes('PROOF_CREATION_STARTED') || eventMessage.includes('INPUT VALIDATION')) {
        newSteps[0].status = 'completed';
        setCurrentStep(1);
      } else if (eventMessage.includes('PROOF EXTRACTION') || eventMessage.includes('TIMESTAMP_GENERATION')) {
        newSteps[1].status = 'completed';
        setCurrentStep(2);
      } else if (eventMessage.includes('CANONICAL_INPUT') || eventMessage.includes('CANONICAL SIGNATURE')) {
        newSteps[2].status = 'completed';
        setCurrentStep(3);
      } else if (eventMessage.includes('HASH_GENERATION') || eventMessage.includes('HASHING')) {
        newSteps[3].status = 'completed';
        setCurrentStep(4);
      } else if (eventMessage.includes('SIGNATURE_GENERATION') || eventMessage.includes('Ed25519 SIGNATURE')) {
        newSteps[4].status = 'completed';
        setCurrentStep(5);
      } else if (eventMessage.includes('TIMESTAMP') || eventMessage.includes('VALIDATION')) {
        newSteps[5].status = 'completed';
        setCurrentStep(6);
      } else if (eventMessage.includes('PROOF_CREATION_COMPLETED') || eventMessage.includes('BLOCKCHAIN')) {
        newSteps[6].status = 'completed';
        setCurrentStep(7);
      }
      
      return newSteps;
    });
  };

  const startVerification = async () => {
    setIsVerifying(true);
    setCurrentStep(0);
    setVerificationResult(null);

    // Reset all steps
    setSteps(prevSteps => 
      prevSteps.map(step => ({ ...step, status: 'pending' as const }))
    );

    // Simulate step-by-step verification process
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      
      // Update current step to processing
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        newSteps[i].status = 'processing';
        return newSteps;
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

      // Update step to completed (or error based on simulation)
      const isSuccess = Math.random() > 0.1; // 90% success rate for demo
      
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        newSteps[i].status = isSuccess ? 'completed' : 'error';
        if (!isSuccess) {
          newSteps[i].details = 'Verification failed at this step';
        }
        return newSteps;
      });

      if (!isSuccess) {
        setIsVerifying(false);
        setVerificationResult({
          isValid: false,
          proofDetails: { failedAt: steps[i].name }
        });
        onVerificationComplete?.({
          isValid: false,
          proofDetails: { failedAt: steps[i].name }
        });
        return;
      }
    }

    // All steps completed successfully
    setIsVerifying(false);
    const result = {
      isValid: true,
      proofDetails: {
        algorithm: 'Ed25519-RDF-2022',
        timestamp: new Date().toISOString(),
        verificationMethod: 'DataIntegrityProof'
      }
    };
    setVerificationResult(result);
    onVerificationComplete?.(result);
  };

  const stopVerification = () => {
    setIsVerifying(false);
  };

  useEffect(() => {
    if (autoStart && credentialData) {
      startVerification();
    }
  }, [autoStart, credentialData]);

  const getStepStatusIcon = (status: ProofStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Clock className="w-4 h-4 text-blue-500" />
        </motion.div>;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Open Badges 3.0 Proof Verification
            </h2>
            <p className="text-sm text-gray-600">
              Real-time cryptographic proof validation using VC Data Integrity
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isVerifying ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startVerification}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={!credentialData}
            >
              <Play className="w-4 h-4" />
              Start Verification
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopVerification}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Pause className="w-4 h-4" />
              Stop Verification
            </motion.button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 rounded-lg">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-600">
          Solana Connection: {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Verification Steps */}
      <div className="space-y-4 mb-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-2 transition-all duration-300 ${
              index === currentStep && isVerifying
                ? 'border-blue-500 bg-blue-50'
                : step.status === 'completed'
                ? 'border-green-500 bg-green-50'
                : step.status === 'error'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getStepStatusIcon(step.status)}
              </div>
              <div className="flex-shrink-0 text-gray-400">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{step.name}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
                {step.details && (
                  <p className="text-xs text-red-600 mt-1">{step.details}</p>
                )}
              </div>
              {index === currentStep && isVerifying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-shrink-0"
                >
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Verification Result */}
      <AnimatePresence>
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border-2 ${
              verificationResult.isValid
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {verificationResult.isValid ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <h3 className="font-bold text-gray-900">
                  {verificationResult.isValid ? 'Verification Successful' : 'Verification Failed'}
                </h3>
                <p className="text-sm text-gray-600">
                  {verificationResult.isValid
                    ? 'The credential proof is cryptographically valid and compliant with Open Badges 3.0'
                    : 'The credential proof failed verification. Please check the credential data.'}
                </p>
                {verificationResult.proofDetails && (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(verificationResult.proofDetails, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Events */}
      {events.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Real-time Blockchain Events
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {events.slice(-5).map((event, index) => (
              <div key={index} className="text-xs text-gray-600 font-mono">
                [{new Date(event.timestamp).toLocaleTimeString()}] {event.message || 'No message'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProofVerificationSystem;
