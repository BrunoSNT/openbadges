import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Upload, FileJson, Link, Search, Loader2, Signature } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useSolana } from '@/contexts/SolanaContext';
import { PublicKey } from '@solana/web3.js';
import type { AchievementCredential, Achievement } from '@/types/badge';
import { useTranslation } from '@/hooks/useTranslation';

// Define validation result interface
interface ValidationResult {
  isValid: boolean;
  message: string;
  details: {
    jsonValid: boolean;
    contextValid: boolean;
    typeValid: boolean;
    signatureValid: boolean;
    issuerValid: boolean;
    notRevoked: boolean;
    achievementValid: boolean;
  };
}

// Define interfaces for address search results using Open Badges v3.0 terminology
interface ProfileResult {
  id: string;
  name: string;
  description?: string;
  authority: string;
  url?: string;
  achievementCount?: number;
}

interface AchievementResult {
  id: string;
  name: string;
  description: string;
  image?: string;
  issuer: string;
  criteria: Achievement['criteria'];
  tags?: string[];
}

// Use the proper Open Badges v3.0 AchievementCredential type with some UI-specific fields
interface BadgeResult {
  id: string;
  type: string[];
  achievement: string;
  credentialSubject: AchievementCredential['credentialSubject'];
  issuer: AchievementCredential['issuer'];
  issuanceDate: string;
  expirationDate?: string;
  credentialStatus?: AchievementCredential['credentialStatus'];
  originalCredential: any; // Store the complete original credential from chain (using any to avoid type conflicts)
}

interface AddressSearchResult {
  profiles: ProfileResult[];
  achievements: AchievementResult[];
  badges: BadgeResult[];
  isLoading: boolean;
  error: string | null;
  debugInfo?: {
    totalCredentialsOnChain: number;
    searchedFormats: string[];
    rawCredentials: any[];
  };
}

interface SignatureSearchResult {
  transaction: any;
  isLoading: boolean;
  error: string | null;
}

const BadgeValidationPage = () => {
  const { tValidation } = useTranslation();
  const [badgeJson, setBadgeJson] = useState<string>('');
  const [badgeUrl, setBadgeUrl] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [badgeData, setBadgeData] = useState<AchievementCredential | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Address search state
  const [addressInput, setAddressInput] = useState<string>('');
  const [addressSearchPerformed, setAddressSearchPerformed] = useState<boolean>(false);
  const [addressSearchResult, setAddressSearchResult] = useState<AddressSearchResult>({
    profiles: [],
    achievements: [],
    badges: [],
    isLoading: false,
    error: null,
    debugInfo: {
      totalCredentialsOnChain: 0,
      searchedFormats: [],
      rawCredentials: []
    }
  });
  
  // Signature search state
  const [signatureInput, setSignatureInput] = useState<string>('');
  const [signatureSearchResult, setSignatureSearchResult] = useState<SignatureSearchResult>({
    transaction: null,
    isLoading: false,
    error: null
  });
  
  // Hook to connect to Solana
  const { solanaClient, connection, isInitialized } = useSolana();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setBadgeJson(content);
        // Try to parse the JSON to make sure it's valid
        JSON.parse(content);
      } catch (error) {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const validateBadgeJson = async () => {
    setIsValidating(true);
    try {
      // Parse the JSON
      const parsedJson = JSON.parse(badgeJson);
      setBadgeData(parsedJson);

      // Perform Open Badges 3.0 verification (cryptographic and on-chain)
      const result = await performOB30Verification(parsedJson);
      setValidationResult(result);

      if (result.isValid) {
        toast.success('Credential validation and verification successful!');
      } else {
        toast.error('Credential validation or verification failed.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setValidationResult({
        isValid: false,
        message: 'Invalid JSON format',
        details: {
          jsonValid: false,
          contextValid: false,
          typeValid: false,
          signatureValid: false,
          issuerValid: false,
          notRevoked: false,
          achievementValid: false
        }
      });
      toast.error('Failed to parse JSON');
    } finally {
      setIsValidating(false);
    }
  };

  const fetchBadgeFromUrl = async () => {
    if (!badgeUrl) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Validate URL format first
    const urlValidation = validateCredentialURL(badgeUrl);
    if (!urlValidation.valid) {
      toast.error(`Invalid URL: ${urlValidation.error}`);
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch(badgeUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch badge: ${response.status}`);
      }
      const data = await response.text();
      setBadgeJson(data);
      toast.success('Badge fetched successfully from validated URL');
    } catch (error) {
      console.error('Error fetching badge:', error);
      toast.error('Failed to fetch badge from URL');
    } finally {
      setIsValidating(false);
    }
  };
  
  // Search by Solana address
  const searchByAddress = async () => {
    if (!addressInput || !isInitialized || !solanaClient || !connection) {
      toast.error('Please enter a valid Solana address or DID and ensure wallet is connected');
      return;
    }
    
    setAddressSearchPerformed(true); // Mark that a search has been performed
    
    // Clear previous results
    setAddressSearchResult({
      profiles: [],
      achievements: [],
      badges: [],
      isLoading: true,
      error: null,
      debugInfo: {
        totalCredentialsOnChain: 0,
        searchedFormats: [],
        rawCredentials: []
      }
    });
    
    try {
      // Extract the actual address from DID format if provided
      let searchAddress = addressInput.trim();
      
      // Handle DID formats: did:sol:address or did:key:address
      if (searchAddress.startsWith('did:sol:')) {
        searchAddress = searchAddress.replace('did:sol:', '');
      } else if (searchAddress.startsWith('did:key:')) {
        searchAddress = searchAddress.replace('did:key:', '');
      }
      
      // Validate the extracted address is a valid Solana public key
      const pubkey = new PublicKey(searchAddress);
      console.log('🔍 Searching for address:', pubkey.toString(), 'from input:', addressInput);
      
      // Search for profile where address is authority
      let profileResult: ProfileResult[] = [];
      try {
        // Check if there's a profile for this specific address
        const profile = await solanaClient.getProfile(pubkey.toString());
        if (profile && profile.authority === pubkey.toString()) {
          profileResult = [{
            id: profile.id || pubkey.toString(),
            name: profile.name,
            description: profile.description,
            authority: profile.authority,
            url: profile.url,
            achievementCount: 0 // Would need to count achievements in a real implementation
          }];
        }
      } catch (error) {
        console.log('No profile found for this address');
      }
      
      // Search for achievements created by this address
      let achievementResults: AchievementResult[] = [];
      try {
        const achievements = await solanaClient.getAchievements(pubkey.toString());
        // Achievements are already filtered by the issuer address in the method
        achievementResults = achievements.map((achievement): AchievementResult => ({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            image: achievement.image || undefined,
            issuer: achievement.issuer?.toString() || '',
            criteria: achievement.criteria || { narrative: undefined },
            tags: achievement.tags
          }));
      } catch (error) {
        console.log('Error fetching achievements:', error);
      }
      
      // Search for badges/credentials issued to this address
      let badgeResults: BadgeResult[] = [];
      let debugInfo = {
        totalCredentialsOnChain: 0,
        searchedFormats: [] as string[],
        rawCredentials: [] as any[]
      };
      
      try {
        console.log('🏆 Fetching all credentials for filtering...');
        console.log('🔗 Connection status:', !!connection);
        console.log('🔗 SolanaClient status:', !!solanaClient);
        console.log('🔗 Is initialized:', isInitialized);
        
        const allCredentials = await solanaClient.getCredentials(); // Get ALL credentials first
        console.log('📋 Total credentials on chain:', allCredentials.length);
        console.log('📋 First credential sample:', allCredentials[0]);
        
        debugInfo.totalCredentialsOnChain = allCredentials.length;
        debugInfo.rawCredentials = allCredentials.slice(0, 3); // Store first 3 for debugging
        
        // Filter credentials where recipient matches this address (multiple formats)
        const addressFormats = [
          pubkey.toString(),
          `did:key:${pubkey.toString()}`,
          `did:sol:${pubkey.toString()}`
        ];
        
        debugInfo.searchedFormats = addressFormats;
        console.log('🔍 Looking for credentials with recipient in formats:', addressFormats);
        
        badgeResults = allCredentials
          .filter((credential) => {
            const recipient = credential.credentialSubject?.id || credential.recipient;
            const credentialId = credential.id;
            
            // Check if recipient matches any format
            const recipientMatches = addressFormats.some(format => 
              recipient === format || recipient?.includes(pubkey.toString())
            );
            
            // Check if credential ID matches any format  
            const idMatches = addressFormats.some(format =>
              credentialId === format || credentialId?.includes(pubkey.toString())
            );
            
            const matches = recipientMatches || idMatches;
            
            if (matches) {
              console.log('✅ Found matching credential:', credential.id, 'recipient:', recipient, 'matched by:', recipientMatches ? 'recipient' : 'credential ID');
            }
            
            return matches;
          })
          .map((credential): BadgeResult => ({
            id: credential.id,
            type: Array.isArray(credential.type) ? credential.type : [credential.type],
            achievement: typeof credential.achievement === 'string' 
              ? credential.achievement 
              : credential.achievement || '',
            credentialSubject: {
              id: credential.credentialSubject?.id || credential.recipient,
              achievement: typeof credential.achievement === 'string' 
                ? credential.achievement 
                : (credential.achievement || 
                   (typeof credential.credentialSubject?.achievement === 'string' 
                     ? credential.credentialSubject.achievement 
                     : ''))
            },
            issuer: credential.issuer,
            issuanceDate: credential.issuanceDate || credential.validFrom || new Date().toISOString(),
            expirationDate: credential.expirationDate || credential.validUntil,
            credentialStatus: credential.revoked ? { 
              id: `status_${credential.id}`, 
              type: 'revoked' 
            } : undefined,
            originalCredential: credential // Store the complete original credential from chain
          }));
          
        console.log('🏆 Badge search result:', badgeResults.length, 'badges found for address');
      } catch (error) {
        console.error('❌ Error fetching credentials:', error);
        debugInfo.totalCredentialsOnChain = -1; // Indicate error occurred
      }
      
      setAddressSearchResult({
        profiles: profileResult,
        achievements: achievementResults,
        badges: badgeResults,
        isLoading: false,
        error: null,
        debugInfo: debugInfo
      });
      
      if (profileResult.length === 0 && achievementResults.length === 0 && badgeResults.length === 0) {
        toast.info('No badge data found for this address');
      } else {
        toast.success('Badge data retrieved successfully');
      }
    } catch (error) {
      console.error('Error searching by address:', error);
      let errorMessage = 'Failed to search by address. ';
      if (error instanceof Error && error.message.includes('Invalid public key input')) {
        errorMessage += 'Please enter a valid Solana public key or DID format (did:sol:address or did:key:address).';
      } else {
        errorMessage += 'Ensure you entered a valid Solana public key or DID.';
      }
      
      setAddressSearchResult({
        profiles: [],
        achievements: [],
        badges: [],
        isLoading: false,
        error: errorMessage,
        debugInfo: {
          totalCredentialsOnChain: 0,
          searchedFormats: [],
          rawCredentials: []
        }
      });
      toast.error('Failed to search by address');
    }
  };
  
  // Search by transaction signature
  const searchBySignature = async () => {
    if (!signatureInput || !connection) {
      toast.error('Please enter a valid transaction signature');
      return;
    }
    
    setSignatureSearchResult({
      transaction: null,
      isLoading: true,
      error: null
    });
    
    try {
      console.log('🔍 === VALIDATING TRANSACTION SIGNATURE ===');
      console.log('📍 Signature:', signatureInput.trim());
      
      // Use our verification function
      const verificationResult = await verifyTransactionSignature(signatureInput.trim());
      
      if (!verificationResult.verified) {
        setSignatureSearchResult({
          transaction: null,
          isLoading: false,
          error: verificationResult.error || 'Transaction verification failed'
        });
        toast.error(`Transaction verification failed: ${verificationResult.error}`);
        return;
      }
      
      const transaction = verificationResult.transaction;
      
      if (transaction) {
        console.log('✅ Transaction verified and valid');
        console.log('📊 Transaction details:');
        console.log('   → Slot:', transaction.slot);
        console.log('   → Block Time:', transaction.blockTime);
        console.log('   → Fee:', transaction.meta?.fee);
        console.log('   → Success:', !transaction.meta?.err);
        console.log('🎖️ Is credential transaction:', verificationResult.isCredentialIssuance);
        
        setSignatureSearchResult({
          transaction: {
            signature: signatureInput.trim(),
            slot: transaction.slot,
            blockTime: transaction.blockTime,
            fee: transaction.meta?.fee,
            success: !transaction.meta?.err,
            isCredentialTransaction: verificationResult.isCredentialIssuance,
            issuerAddress: verificationResult.issuerAddress,
            recipientAddress: verificationResult.recipientAddress,
            accountsInvolved: transaction.transaction.message.accountKeys?.length || 0,
            computeUnitsConsumed: transaction.meta?.computeUnitsConsumed
          },
          isLoading: false,
          error: null
        });
        
        toast.success('Transaction signature verified successfully!');
      }
    } catch (error) {
      console.error('❌ Error validating signature:', error);
      setSignatureSearchResult({
        transaction: null,
        isLoading: false,
        error: 'Failed to validate transaction signature. Ensure you entered a valid signature.'
      });
      toast.error('Failed to validate signature');
    }
  };

  // Direct on-chain verification using Solana client
  const performOB30Verification = async (badgeData: AchievementCredential): Promise<ValidationResult> => {
    console.log('🔍 === STARTING ON-CHAIN VERIFICATION ===');
    console.log('📍 Credential ID:', badgeData.id);
    
    const validationDetails = {
      jsonValid: true, // JSON parsed successfully if we got here
      contextValid: false,
      typeValid: false,
      signatureValid: false,
      issuerValid: false,
      notRevoked: false,
      achievementValid: false
    };

    try {
      // STEP 1: Validate against Open Badges 3.0 specification
      console.log('📋 Step 1: Validating against Open Badges 3.0 specification...');
      const specValidation = await validateOpenBadges30Credential(badgeData);
      
      if (!specValidation.valid) {
        console.log('❌ Specification validation failed:', specValidation.errors);
        return {
          isValid: false,
          message: `Specification validation failed: ${specValidation.errors.join(', ')}`,
          details: validationDetails
        };
      }
      
      // Update validation details based on spec validation
      validationDetails.contextValid = true;
      validationDetails.typeValid = true;
      validationDetails.achievementValid = true;
      
      console.log('✅ Specification validation passed');
      if (specValidation.warnings.length > 0) {
        console.log('⚠️ Warnings:', specValidation.warnings);
      }

      // STEP 2: Verify addresses exist on-chain
      console.log('🏠 Step 2: Verifying addresses on-chain...');
      
      let credentialAddress: string | null = null;
      let issuerAddress: string | null = null;
      
      // Extract credential address from ID using verification function
      if (badgeData.id) {
        const verification = await extractAndVerifyAddress(badgeData.id);
        credentialAddress = verification.address;
        
        if (verification.verified && verification.exists) {
          console.log('   → Credential address verified and exists on-chain:', credentialAddress);
        } else if (verification.verified) {
          console.log('   → Credential address format valid but not found on-chain:', credentialAddress);
        } else {
          console.log('   → Invalid credential address format');
        }
      }

      // Extract and verify issuer address
      if (badgeData.issuer) {
        const issuerStr = typeof badgeData.issuer === 'string' ? badgeData.issuer : badgeData.issuer.id;
        if (issuerStr) {
          const verification = await extractAndVerifyAddress(issuerStr);
          issuerAddress = verification.address;
          
          if (verification.verified && verification.exists) {
            validationDetails.issuerValid = true;
            console.log('   → Issuer address verified and exists on-chain:', issuerAddress);
          } else if (verification.verified) {
            console.log('   → Issuer address format valid but not found on-chain:', issuerAddress);
          } else {
            console.log('   → Invalid issuer address format');
          }
        }
      }

      // STEP 3: Verify credential exists on-chain
      console.log('⛓️ Step 3: Verifying credential exists on-chain...');
      
      if (credentialAddress && solanaClient && isInitialized) {
        try {
          const accountInfo = await connection.getAccountInfo(new PublicKey(credentialAddress));
          const existsOnChain = accountInfo !== null;
          
          console.log('   → Credential exists on-chain:', existsOnChain);
          
          if (existsOnChain) {
            // Check if account is not revoked (has data and is owned by our program)
            const programId = new PublicKey('FFQUgGaWxQFGnCe3VBmRZ259wtWHxjkpCqePouiyfzH5'); // Use config program ID
            const isOwnedByProgram = accountInfo.owner.equals(programId);
            validationDetails.notRevoked = isOwnedByProgram;
            
            console.log('   → Owned by program:', isOwnedByProgram);
            console.log('   → Not revoked:', isOwnedByProgram);
          }
        } catch (error) {
          console.log('   → Error checking on-chain existence:', error);
        }
      }

      // STEP 4: Verify cryptographic proof/signature
      console.log('🔐 Step 4: Verifying cryptographic proof...');
      
      if (badgeData.proof && Array.isArray(badgeData.proof) && badgeData.proof.length > 0) {
        const proof = badgeData.proof[0];
        
        if (proof.type && proof.proofValue && proof.verificationMethod) {
          try {
            // Basic proof structure validation
            const hasValidProofStructure = Boolean(
              proof.type &&
              proof.proofValue &&
              proof.verificationMethod &&
              proof.created &&
              proof.proofPurpose
            );
            
            if (hasValidProofStructure) {
              // Verify verification method points to valid address using verification function
              const verification = await extractAndVerifyAddress(proof.verificationMethod.split('#')[0]);
              
              if (verification.verified && verification.exists) {
                validationDetails.signatureValid = true;
                console.log('   → Proof structure and verification method verified on-chain');
              } else if (verification.verified) {
                console.log('   → Verification method format valid but not found on-chain');
              } else {
                console.log('   → Invalid verification method address');
              }
            }
          } catch (error) {
            console.log('   → Error validating proof:', error);
          }
        }
      }

      const isValid = validationDetails.jsonValid && 
        validationDetails.contextValid && 
        validationDetails.typeValid && 
        validationDetails.issuerValid && 
        validationDetails.achievementValid;

      console.log('✅ Verification completed:', isValid ? 'VERIFIED' : 'NOT VERIFIED');
      
      return {
        isValid: isValid,
        message: isValid ? 
          'This credential passes Open Badges 3.0 validation and is cryptographically verified on the Solana blockchain.' : 
          'This credential failed validation or could not be fully verified through on-chain checks.',
        details: validationDetails
      };

    } catch (error) {
      console.error('❌ Validation/verification error:', error);
      
      return {
        isValid: false,
        message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: validationDetails
      };
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const renderValidationResult = () => {
    if (!validationResult) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validationResult.isValid ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            {validationResult.isValid ? tValidation('results.validTitle') : tValidation('results.invalidTitle')}
          </CardTitle>
          <CardDescription>
            {validationResult.message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{tValidation('results.complianceTitle')}</h4>
              <p className="text-xs text-gray-500">
                {tValidation('results.complianceDescription')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidationItem 
                title={tValidation('results.checks.jsonFormat.title')} 
                isValid={validationResult.details.jsonValid}
                description={tValidation('results.checks.jsonFormat.description')}
              />
              <ValidationItem 
                title={tValidation('results.checks.context.title')} 
                isValid={validationResult.details.contextValid}
                description={tValidation('results.checks.context.description')}
              />
              <ValidationItem 
                title={tValidation('results.checks.credentialType.title')} 
                isValid={validationResult.details.typeValid}
                description={tValidation('results.checks.credentialType.description')}
              />
              <ValidationItem 
                title={tValidation('results.checks.cryptographicProof.title')} 
                isValid={validationResult.details.signatureValid}
                description={tValidation('results.checks.cryptographicProof.description')}
              />
              <ValidationItem 
                title={tValidation('results.checks.issuerOnChain.title')} 
                isValid={validationResult.details.issuerValid}
                description={tValidation('results.checks.issuerOnChain.description')}
              />
              <ValidationItem 
                title={tValidation('results.checks.notRevoked.title')} 
                isValid={validationResult.details.notRevoked}
                description={tValidation('results.checks.notRevoked.description')}
              />
              <ValidationItem 
                title={tValidation('results.checks.achievement.title')} 
                isValid={validationResult.details.achievementValid}
                description={tValidation('results.checks.achievement.description')}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderBadgeDisplay = () => {
    if (!badgeData) return null;

    // Extract key information from the badge
    const issuer = badgeData.issuer ? 
      (typeof badgeData.issuer === 'string' ? badgeData.issuer : badgeData.issuer.name || badgeData.issuer.id) : 
      'Unknown Issuer';
    const recipient = badgeData.credentialSubject ? 
      (badgeData.credentialSubject.id || 'Unspecified Recipient') : 
      'Unknown Recipient';
    const achievement = badgeData.credentialSubject?.achievement ? 
      (typeof badgeData.credentialSubject.achievement === 'string' ? 
        badgeData.credentialSubject.achievement : 
        badgeData.credentialSubject.achievement.name) || 'Unnamed Achievement' : 
      'Unnamed Achievement';
    const description = badgeData.credentialSubject?.achievement ? 
      (typeof badgeData.credentialSubject.achievement === 'string' ? 
        'No description available' : 
        badgeData.credentialSubject.achievement.description) || 'No description available' : 
      'No description available';
    const imageUrl = badgeData.credentialSubject?.achievement && 
      typeof badgeData.credentialSubject.achievement !== 'string' ? 
      (typeof badgeData.credentialSubject.achievement.image === 'string' ? 
        badgeData.credentialSubject.achievement.image : 
        badgeData.credentialSubject.achievement.image?.id) || null : null;
    const issuanceDate = badgeData.issuanceDate || 'Unknown Date';

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tValidation('search.badges')}</CardTitle>
          <CardDescription>{tValidation('about.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {imageUrl && (
              <div className="flex justify-center items-start">
                <img 
                  src={imageUrl} 
                  alt="Badge Image" 
                  className="w-32 h-32 object-contain border rounded-md shadow-sm"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/200x200?text=No+Image';
                  }}
                />
              </div>
            )}
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div>
                <h3 className="text-lg font-medium">{achievement}</h3>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Issuer</h4>
                  <p>{issuer}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Recipient</h4>
                  <p>{recipient}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Issue Date</h4>
                  <p>{new Date(issuanceDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Render the address search results
  const renderAddressSearchResults = () => {
    const { profiles, achievements, badges, isLoading, error, debugInfo } = addressSearchResult;
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p>Buscando dados de emblemas...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{tValidation('search.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    const hasResults = profiles.length > 0 || achievements.length > 0 || badges.length > 0;
    
    if (!hasResults && addressInput && addressSearchPerformed) {
      return (
        <div className="space-y-4 mt-4">
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{tValidation('search.noResults')}</AlertTitle>
            <AlertDescription>Nenhum dado de emblema encontrado para o endereço: {addressInput}</AlertDescription>
          </Alert>
          
          {/* Debug Information */}
          {debugInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Debug Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs">
                  <p><strong>Total credentials on chain:</strong> {debugInfo.totalCredentialsOnChain === -1 ? 'Error occurred' : debugInfo.totalCredentialsOnChain}</p>
                  <p><strong>Searched formats:</strong></p>
                  <ul className="list-disc ml-4">
                    {debugInfo.searchedFormats.map((format, idx) => (
                      <li key={idx} className="font-mono">{format}</li>
                    ))}
                  </ul>
                  {debugInfo.rawCredentials.length > 0 && (
                    <div>
                      <p><strong>Sample credentials found:</strong></p>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(debugInfo.rawCredentials.map(c => ({
                          id: c.id,
                          recipient: c.credentialSubject?.id || c.recipient,
                          issuer: c.issuer
                        })), null, 2)}
                      </pre>
                    </div>
                  )}
                  {debugInfo.totalCredentialsOnChain === -1 && (
                    <div className="text-red-600">
                      <p><strong>Error:</strong> Failed to fetch credentials from blockchain. Check console for details.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }
    
    if (!hasResults) return null;
    
    // Only show results if a search has been performed
    if (!addressSearchPerformed) return null;
    
    return (
      <div className="space-y-6 mt-6">
        {/* Profile Results */}
        {profiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Badge variant="outline" className="mr-2">{profiles.length}</Badge>
                {tValidation('search.profiles')}
              </CardTitle>
              <CardDescription>Perfis de emissores onde este endereço é a autoridade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profiles.map((profile: ProfileResult) => (
                  <Card key={profile.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{profile.name || `Profile ${profile.id.slice(0, 8)}...`}</CardTitle>
                      <CardDescription>{profile.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">ID</p>
                          <p className="text-xs truncate">{profile.id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Authority</p>
                          <p className="text-xs truncate">{profile.authority}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Achievement Results */}
        {achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Badge variant="outline" className="mr-2">{achievements.length}</Badge>
                {tValidation('search.achievements')}
              </CardTitle>
              <CardDescription>Modelos de conquistas criados por este endereço</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement: AchievementResult) => (
                  <Card key={achievement.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{achievement.name || `Achievement ${achievement.id.slice(0, 8)}...`}</CardTitle>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <CardDescription>{achievement.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Achievement ID</p>
                          <p className="text-xs truncate">{achievement.id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Issuer</p>
                          <p className="text-xs truncate">{achievement.issuer}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Badge (Credential) Results */}
        {badges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Badge variant="outline" className="mr-2">{badges.length}</Badge>
                {tValidation('search.badges')}
              </CardTitle>
              <CardDescription>Credenciais de emblemas emitidas para este endereço</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {badges.map((badge: BadgeResult) => (
                  <Card key={badge.id} className={`overflow-hidden ${badge.credentialStatus?.type === 'revoked' ? 'border-destructive opacity-70' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium">Emblema {badge.id.slice(0, 8)}...</CardTitle>
                        {badge.credentialStatus?.type === 'revoked' ? (
                          <Badge variant="destructive" className="text-xs">Revogado</Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">Ativo</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">ID do Emblema</p>
                          <p className="text-xs font-mono truncate bg-muted/30 px-2 py-1 rounded">{badge.id}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Conquista</p>
                          <p className="text-xs truncate">{badge.achievement}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Emitido em</p>
                          <p className="text-xs">{new Date(badge.issuanceDate).toLocaleDateString()}</p>
                        </div>
                        {badge.expirationDate && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Expira em</p>
                            <p className="text-xs">{new Date(badge.expirationDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            setBadgeJson(JSON.stringify(badge.originalCredential, null, 2));
                            toast.success('Credencial completa carregada para validação');
                          }}
                          disabled={badge.credentialStatus?.type === 'revoked'}
                        >
                          Carregar para Validação
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };
  
  // Render signature search results
  const renderSignatureSearchResults = () => {
    const { transaction, isLoading, error } = signatureSearchResult;
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p>Fetching transaction details...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{tValidation('search.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (!transaction) return null;
    
    // Extract relevant information from transaction
    const blockTime = transaction.blockTime 
      ? new Date(transaction.blockTime * 1000).toLocaleString()
      : 'Unknown';
    
    const slot = transaction.slot;
    const fee = transaction.meta?.fee ? `${transaction.meta.fee / 1_000_000_000} SOL` : 'Unknown';
    const status = transaction.meta?.err ? 'Failed' : 'Success';
    
    // Get badge-related info if available
    let badgeInfo: any = null;
    
    try {
      // Look through transaction for badge program instructions
      if (transaction.transaction?.message?.instructions) {
        const instructions = transaction.transaction.message.instructions;
        for (const ix of instructions) {
          if (ix.programId?.toString() === 'YOUR_BADGE_PROGRAM_ID') {
            badgeInfo = ix.parsed;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error parsing badge info from transaction:', error);
    }
    
    return (
      <div className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Information about the transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Transaction Signature</p>
                  <p className="text-xs truncate">{signatureInput}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Block Time</p>
                  <p>{blockTime}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Slot</p>
                  <p>{slot}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fee</p>
                  <p>{fee}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p>
                    {status === 'Success' ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" /> Success
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-1" /> Failed
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {badgeInfo && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium mb-2">Badge Operation Details</h3>
                  <Card className="bg-slate-50 dark:bg-slate-900">
                    <CardContent className="py-4">
                      <pre className="text-xs overflow-auto whitespace-pre-wrap font-mono">
                        {JSON.stringify(badgeInfo, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Show a truncated version of the full transaction */}
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium mb-2">Transaction Data</h3>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-sm">Transaction Details</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const json = JSON.stringify(transaction, null, 2);
                          navigator.clipboard.writeText(json);
                          toast.success('Transaction data copied to clipboard');
                        }}
                      >
                        Copy Full Data
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap font-mono">
                      {JSON.stringify(
                        {
                          signature: signatureInput,
                          slot: transaction.slot,
                          blockTime: blockTime,
                          fee: fee,
                          status: status,
                          // Show only essential data to avoid overwhelming the UI
                          accounts: transaction.transaction?.message?.accountKeys?.map((key: string | PublicKey) => key.toString()),
                        }, 
                        null, 
                        2
                      )}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ===================================================================
  // CREDENTIAL VALIDATION FUNCTIONS (Open Badges 3.0 Specification)
  // ===================================================================

  // Validate Open Badges 3.0 credential against specification standards
  const validateOpenBadges30Credential = async (credentialData: any): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('📋 === VALIDATING OPEN BADGES 3.0 CREDENTIAL ===');

      // 1. JSON Structure Validation
      if (!credentialData || typeof credentialData !== 'object') {
        errors.push('Invalid JSON structure - credential must be an object');
        return { valid: false, errors, warnings };
      }

      // 2. Required @context validation
      if (!credentialData['@context']) {
        errors.push('Missing required @context property');
      } else if (Array.isArray(credentialData['@context'])) {
        const hasOB30Context = credentialData['@context'].some((ctx: any) => 
          typeof ctx === 'string' && ctx.includes('purl.imsglobal.org/spec/ob/v3p0')
        );
        if (!hasOB30Context) {
          errors.push('@context must include Open Badges v3.0 context URI');
        }
      } else if (typeof credentialData['@context'] === 'string') {
        if (!credentialData['@context'].includes('purl.imsglobal.org/spec/ob/v3p0')) {
          errors.push('@context must include Open Badges v3.0 context URI');
        }
      }

      // 3. Required type validation
      if (!credentialData.type) {
        errors.push('Missing required type property');
      } else {
        const types = Array.isArray(credentialData.type) ? credentialData.type : [credentialData.type];
        if (!types.includes('VerifiableCredential')) {
          errors.push('type must include "VerifiableCredential"');
        }
        if (!types.includes('OpenBadgeCredential') && !types.includes('AchievementCredential')) {
          errors.push('type must include "OpenBadgeCredential" or "AchievementCredential"');
        }
      }

      // 4. Required id validation
      if (!credentialData.id) {
        errors.push('Missing required id property');
      } else if (typeof credentialData.id !== 'string') {
        errors.push('id must be a string (URI)');
      }

      // 5. Required credentialSubject validation
      if (!credentialData.credentialSubject) {
        errors.push('Missing required credentialSubject property');
      } else {
        if (!credentialData.credentialSubject.achievement) {
          errors.push('credentialSubject must contain an achievement property');
        }
        // Either id or identifier must be present
        if (!credentialData.credentialSubject.id && !credentialData.credentialSubject.identifier) {
          warnings.push('credentialSubject should have either id or identifier property');
        }
      }

      // 6. Required issuer validation
      if (!credentialData.issuer) {
        errors.push('Missing required issuer property');
      } else {
        const issuerObj = typeof credentialData.issuer === 'string' 
          ? { id: credentialData.issuer } 
          : credentialData.issuer;
        
        if (!issuerObj.id) {
          errors.push('issuer must have an id property');
        }
      }

      // 7. Required validFrom validation
      if (!credentialData.validFrom) {
        errors.push('Missing required validFrom property');
      } else {
        try {
          new Date(credentialData.validFrom);
        } catch (error) {
          errors.push('validFrom must be a valid ISO 8601 date');
        }
      }

      // 8. Proof validation (strongly recommended)
      if (!credentialData.proof || !Array.isArray(credentialData.proof) || credentialData.proof.length === 0) {
        warnings.push('Missing cryptographic proof - strongly recommended for Open Badges 3.0');
      } else {
        const proof = credentialData.proof[0];
        if (!proof.type || !proof.proofValue || !proof.verificationMethod) {
          warnings.push('Proof structure incomplete - should include type, proofValue, and verificationMethod');
        }
      }

      // 9. Achievement validation (if present)
      if (credentialData.credentialSubject?.achievement) {
        const achievement = credentialData.credentialSubject.achievement;
        if (typeof achievement === 'object') {
          if (!achievement.type || !Array.isArray(achievement.type) || !achievement.type.includes('Achievement')) {
            warnings.push('Achievement type should include "Achievement"');
          }
          if (!achievement.criteria) {
            warnings.push('Achievement should include criteria property');
          }
          if (!achievement.description) {
            warnings.push('Achievement should include description property');
          }
          if (!achievement.name) {
            warnings.push('Achievement should include name property');
          }
        }
      }

      console.log(`📋 Validation completed: ${errors.length} errors, ${warnings.length} warnings`);
      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('❌ Validation error:', error);
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors, warnings };
    }
  };

  // ===================================================================
  // EXISTING VERIFICATION HELPER FUNCTIONS
  // ===================================================================

  // Verify Solana address exists and has data
  const verifySolanaAddress = async (address: string): Promise<{
    exists: boolean;
    hasData: boolean;
    isOwnedByProgram: boolean;
    balance?: number;
  }> => {
    try {
      if (!connection) return { exists: false, hasData: false, isOwnedByProgram: false };
      
      const pubkey = new PublicKey(address);
      const accountInfo = await connection.getAccountInfo(pubkey);
      
      if (!accountInfo) {
        return { exists: false, hasData: false, isOwnedByProgram: false };
      }

      const programId = new PublicKey('FFQUgGaWxQFGnCe3VBmRZ259wtWHxjkpCqePouiyfzH5');
      const isOwnedByProgram = accountInfo.owner.equals(programId);
      const balance = await connection.getBalance(pubkey);

      return {
        exists: true,
        hasData: accountInfo.data.length > 0,
        isOwnedByProgram,
        balance
      };
    } catch (error) {
      return { exists: false, hasData: false, isOwnedByProgram: false };
    }
  };

  // Verify transaction signature cryptographically and check issuance
  const verifyTransactionSignature = async (signature: string): Promise<{
    verified: boolean;
    isCredentialIssuance: boolean;
    issuerAddress?: string;
    recipientAddress?: string;
    transaction?: any;
    error?: string;
  }> => {
    try {
      if (!connection) {
        return { verified: false, isCredentialIssuance: false, error: 'No connection available' };
      }

      console.log('� Verifying transaction signature:', signature);
      
      const txInfo = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!txInfo) {
        return { verified: false, isCredentialIssuance: false, error: 'Transaction not found on chain' };
      }

      // Verify transaction was successful
      if (txInfo.meta?.err) {
        return { 
          verified: false, 
          isCredentialIssuance: false,
          error: `Transaction failed: ${JSON.stringify(txInfo.meta.err)}`,
          transaction: txInfo 
        };
      }

      // Check if this is a credential issuance transaction
      const programId = new PublicKey('FFQUgGaWxQFGnCe3VBmRZ259wtWHxjkpCqePouiyfzH5');
      
      let isCredentialIssuance = false;
      let issuerAddress: string | undefined;
      let recipientAddress: string | undefined;

      try {
        // Handle both legacy and versioned transactions
        const message = txInfo.transaction.message;
        let accountKeys: PublicKey[] = [];
        let instructions: any[] = [];

        // Get account keys
        if ('accountKeys' in message) {
          // Legacy transaction
          accountKeys = message.accountKeys;
          instructions = message.instructions;
        } else {
          // Versioned transaction
          const accountKeysResult = message.getAccountKeys({ accountKeysFromLookups: txInfo.meta?.loadedAddresses });
          accountKeys = accountKeysResult.keySegments().flat();
          instructions = message.compiledInstructions || [];
        }

        // Check if any instruction calls our program
        for (const ix of instructions) {
          try {
            const programIdKey = accountKeys[ix.programIdIndex];
            if (programIdKey && programIdKey.equals(programId)) {
              isCredentialIssuance = true;
              
              // Extract issuer and recipient from accounts
              if (ix.accounts && ix.accounts.length > 0) {
                issuerAddress = accountKeys[ix.accounts[0]]?.toString();
                recipientAddress = ix.accounts.length > 1 ? 
                  accountKeys[ix.accounts[1]]?.toString() : undefined;
              }
              break;
            }
          } catch (error) {
            console.log('Error parsing instruction:', error);
          }
        }
      } catch (error) {
        console.log('Error parsing transaction structure:', error);
        // Fallback: just check if program ID appears in account keys
        try {
          const message = txInfo.transaction.message;
          if ('accountKeys' in message) {
            isCredentialIssuance = message.accountKeys.some(key => key.equals(programId));
          }
        } catch (fallbackError) {
          console.log('Fallback parsing also failed:', fallbackError);
        }
      }

      console.log(isCredentialIssuance ? '✅ Transaction verified - credential issuance' : '⚠️ Transaction verified - not credential related');

      return { 
        verified: true, 
        isCredentialIssuance,
        issuerAddress,
        recipientAddress,
        transaction: txInfo 
      };

    } catch (error) {
      console.error('❌ Transaction verification error:', error);
      return { 
        verified: false, 
        isCredentialIssuance: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  // Extract and verify addresses from DID format
  const extractAndVerifyAddress = async (did: string): Promise<{
    address: string | null;
    verified: boolean;
    exists: boolean;
  }> => {
    try {
      let address: string | null = null;
      
      if (did.startsWith('did:sol:')) {
        address = did.split(':')[2];
      } else if (did.length >= 32) {
        address = did;
      }

      if (!address) {
        return { address: null, verified: false, exists: false };
      }

      // Verify address format
      try {
        new PublicKey(address);
      } catch (error) {
        return { address, verified: false, exists: false };
      }

      // Verify address exists on-chain
      const verification = await verifySolanaAddress(address);
      
      return {
        address,
        verified: true,
        exists: verification.exists
      };
    } catch (error) {
      return { address: null, verified: false, exists: false };
    }
  };

  // Validate URL format for credential fetching
  const validateCredentialURL = (url: string): { valid: boolean; error?: string } => {
    try {
      const urlObj = new URL(url);
      
      // Check for secure protocols
      if (!['https:', 'http:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
      }
      
      // Check for reasonable URL structure
      if (!urlObj.hostname) {
        return { valid: false, error: 'URL must have a valid hostname' };
      }
      
      // Warn about HTTP (not HTTPS)
      if (urlObj.protocol === 'http:' && !urlObj.hostname.includes('localhost')) {
        console.warn('⚠️ Using HTTP instead of HTTPS - credentials should be served over secure connections');
      }
      
      console.log('✅ URL format valid:', url);
      return { valid: true };
      
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  };

  // ===================================================================
  // EXISTING VALIDATION FUNCTIONS
  // ===================================================================
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">{tValidation('title')}</h1>
      <p className="text-gray-500 mb-6">
        {tValidation('description')}
      </p>

      <Tabs defaultValue="json" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="json">{tValidation('tabs.json')}</TabsTrigger>
          <TabsTrigger value="url">{tValidation('tabs.url')}</TabsTrigger>
          <TabsTrigger value="address">{tValidation('tabs.address')}</TabsTrigger>
          <TabsTrigger value="signature">{tValidation('tabs.signature')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="json" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tValidation('jsonTab.title')}</CardTitle>
              <CardDescription>
                {tValidation('jsonTab.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea 
                  placeholder={tValidation('jsonTab.placeholder')} 
                  className="h-[200px] font-mono"
                  value={badgeJson}
                  onChange={(e) => setBadgeJson(e.target.value)}
                />
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={triggerFileInput} 
                    variant="outline" 
                    type="button" 
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {tValidation('jsonTab.uploadButton')}
                  </Button>
                  <Input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".json" 
                    onChange={handleFileUpload} 
                    className="hidden"
                  />
                  <Button 
                    onClick={validateBadgeJson} 
                    disabled={!badgeJson.trim() || isValidating}
                    className="gap-2"
                  >
                    <FileJson className="h-4 w-4" />
                    {isValidating ? tValidation('jsonTab.validating') : tValidation('jsonTab.validateButton')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tValidation('urlTab.title')}</CardTitle>
              <CardDescription>
                {tValidation('urlTab.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="badge-url">{tValidation('urlTab.label')}</Label>
                  <div className="flex w-full space-x-2">
                    <Input 
                      id="badge-url"
                      placeholder={tValidation('urlTab.placeholder')} 
                      value={badgeUrl}
                      onChange={(e) => setBadgeUrl(e.target.value)}
                    />
                    <Button 
                      onClick={fetchBadgeFromUrl} 
                      disabled={!badgeUrl.trim() || isValidating}
                      className="gap-2 whitespace-nowrap"
                    >
                      <Link className="h-4 w-4" />
                      {tValidation('urlTab.fetchButton')}
                    </Button>
                  </div>
                </div>
                {badgeJson && (
                  <div className="flex justify-end">
                    <Button 
                      onClick={validateBadgeJson} 
                      disabled={!badgeJson.trim() || isValidating}
                      className="gap-2"
                    >
                      <FileJson className="h-4 w-4" />
                      {isValidating ? tValidation('jsonTab.validating') : tValidation('jsonTab.validateButton')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="address" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tValidation('addressTab.title')}</CardTitle>
              <CardDescription>
                {tValidation('addressTab.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="solana-address">{tValidation('addressTab.label')}</Label>
                  <div className="flex w-full space-x-2">
                    <Input 
                      id="solana-address"
                      placeholder={tValidation('addressTab.placeholder')} 
                      value={addressInput}
                      onChange={(e) => {
                        setAddressInput(e.target.value);
                        setAddressSearchPerformed(false); // Reset search flag when input changes
                      }}
                    />
                    <Button 
                      onClick={searchByAddress} 
                      disabled={!addressInput.trim() || addressSearchResult.isLoading}
                      className="gap-2 whitespace-nowrap"
                    >
                      <Search className="h-4 w-4" />
                      {addressSearchResult.isLoading ? tValidation('search.loading') : tValidation('addressTab.searchButton')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="signature" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tValidation('signatureTab.title')}</CardTitle>
              <CardDescription>
                {tValidation('signatureTab.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="transaction-signature">{tValidation('signatureTab.label')}</Label>
                  <div className="flex w-full space-x-2">
                    <Input 
                      id="transaction-signature"
                      placeholder={tValidation('signatureTab.placeholder')} 
                      value={signatureInput}
                      onChange={(e) => setSignatureInput(e.target.value)}
                    />
                    <Button 
                      onClick={searchBySignature} 
                      disabled={!signatureInput.trim() || signatureSearchResult.isLoading}
                      className="gap-2 whitespace-nowrap"
                    >
                      <Signature className="h-4 w-4" />
                      {signatureSearchResult.isLoading ? tValidation('search.loading') : tValidation('signatureTab.searchButton')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Show badge data if available */}
      {badgeData && renderBadgeDisplay()}
      
      {/* Show validation results if available */}
      {renderValidationResult()}
      
      {/* Render address search results */}
      {renderAddressSearchResults()}
      
      {/* Render signature search results */}
      {renderSignatureSearchResults()}
    </div>
  );
};

// Validation item component
const ValidationItem = ({ 
  title, 
  isValid, 
  description 
}: { 
  title: string, 
  isValid: boolean, 
  description: string 
}) => {
  return (
    <div className={`p-4 rounded-md flex items-start gap-3 ${
      isValid ? 'bg-green-50' : 'bg-red-50'
    }`}>
      {isValid ? (
        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      )}
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default BadgeValidationPage;