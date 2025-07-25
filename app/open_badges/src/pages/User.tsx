import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useSolana } from "@/contexts/SolanaContext";
import { 
  User, 
  Award, 
  Building2, 
  Copy, 
  ExternalLink, 
  Plus, 
  Edit2, 
  Loader2, 
  Crown,
  TrendingUp,
  Shield,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Download
} from "lucide-react";
import { toast } from "sonner";

interface ProfileAccount {
  authority: { toBase58(): string };
  name?: string;
  description?: string;
  url?: string;
  email?: string;
}

interface BadgeData {
  id: string; // DID format
  name: string;
  description: string;
  image: string;
  issuanceDate: string;
  issuerName: string; // DID format
  transactionSignature?: string;
  achievement?: string; // DID format
  recipient?: string; // DID format
  status: 'valid' | 'expired' | 'revoked';
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue?: string;
    solanaTransaction?: string;
  };
  rawJson?: any; // For viewing the complete JSON object
}

export default function UserImproved() {
  const wallet = useWallet();
  const { publicKey, connected, connect } = wallet;
  const { connection } = useConnection();
  const { solanaClient, isInitialized, initialize } = useSolana();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [issuerProfile, setIssuerProfile] = useState<ProfileAccount | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize Solana client
  useEffect(() => {
    if (connected && wallet && !isInitialized) {
      initialize(wallet as any);
    }
  }, [connected, connection, wallet, isInitialized, initialize]);

  // Auto-refresh user data
  useEffect(() => {
    if (!isInitialized || !solanaClient || !publicKey) return;

    fetchUserData();

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing user data...');
      fetchUserData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isInitialized, solanaClient, publicKey]);

  // Check for createIssuer query parameter
  useEffect(() => {
    const createIssuer = searchParams.get('createIssuer');
    if (createIssuer === 'true' && connected) {
      navigate('/create-issuer');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, connected, navigate]);

  // Handle location state messages
  useEffect(() => {
    const state = location.state as { message?: string; credentialId?: string } | null;
    if (state?.message) {
      toast.success(state.message);
      window.history.replaceState({}, document.title);
      
      if (isInitialized && solanaClient && publicKey) {
        fetchUserData();
      }
    }
  }, [location.state, isInitialized, solanaClient, publicKey]);

  // Utility functions
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const openSolanaExplorer = (address: string, type: 'address' | 'tx' = 'address') => {
    // Extract address from DID if needed
    const cleanAddress = address.startsWith('did:sol:') 
      ? address.split(':').pop() || address 
      : address;
    
    const baseUrl = 'https://explorer.solana.com';
    const network = 'devnet';
    const url = `${baseUrl}/${type}/${cleanAddress}?cluster=${network}`;
    window.open(url, '_blank');
  };

  const formatAddress = (address: string, length = 8) => {
    if (!address) return '';
    
    // Handle DID format
    if (address.startsWith('did:sol:')) {
      const cleanAddress = address.split(':').pop() || address;
      if (cleanAddress.length <= length * 2) return cleanAddress;
      return `${cleanAddress.slice(0, length)}...${cleanAddress.slice(-length)}`;
    }
    
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  };

  const viewJsonDialog = (object: any, title: string) => {
    const jsonString = JSON.stringify(object, null, 2);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${title} - JSON View</title>
            <style>
              body { font-family: monospace; margin: 20px; background: #f5f5f5; }
              pre { background: white; padding: 20px; border-radius: 8px; overflow: auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .copy-btn { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 10px; }
              .copy-btn:hover { background: #0056b3; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${title}</h2>
              <button class="copy-btn" onclick="navigator.clipboard.writeText(document.querySelector('pre').textContent); alert('JSON copied to clipboard!')">Copy JSON</button>
            </div>
            <pre>${jsonString}</pre>
          </body>
        </html>
      `);
    }
  };

  const getStatusIcon = (status: BadgeData['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'revoked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  // Badge analytics functions
  const calculateBadgeStatistics = (badges: BadgeData[]) => {
    const total = badges.length;
    const valid = badges.filter(b => b.status === 'valid').length;
    const expired = badges.filter(b => b.status === 'expired').length;
    const revoked = badges.filter(b => b.status === 'revoked').length;
    
    // Calculate issuer distribution
    const issuerCount = new Set(badges.map(b => b.issuerName)).size;
    
    // Calculate recent badges (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBadges = badges.filter(b => new Date(b.issuanceDate) > thirtyDaysAgo).length;
    
    // Calculate achievement distribution
    const achievementTypes = new Set(badges.map(b => b.achievement)).size;
    
    return {
      total,
      valid,
      expired,
      revoked,
      issuerCount,
      recentBadges,
      achievementTypes,
      validPercentage: total > 0 ? Math.round((valid / total) * 100) : 0
    };
  };

  const getStatusColor = (status: BadgeData['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchUserData = async () => {
    if (!solanaClient || !publicKey) return;
    
    try {
      setLoading(true);
      
      const userBadges = await fetchUserBadges();
      setBadges(userBadges);
      
      const hasProfile = await solanaClient.profileExists();
      if (hasProfile) {
        setIssuerProfile({
          authority: { toBase58: () => publicKey.toBase58() },
          name: "Sample Issuer",
          description: "This is a sample issuer profile",
          url: "https://example.com",
          email: "issuer@example.com"
        });
      }
      
      if (userBadges.length > 0) {
        toast.success(`Profile updated - ${userBadges.length} badge${userBadges.length !== 1 ? 's' : ''} found`);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBadges = async (): Promise<BadgeData[]> => {
    if (!solanaClient || !publicKey) return [];
    
    try {
      console.log('🔍 Fetching credentials for user:', publicKey.toBase58());
      
      // Only fetch credentials for the current user
      const credentials = await solanaClient.getCredentials(publicKey.toBase58());
      
      if (credentials.length === 0) {
        return [];
      }
      
      const badges: BadgeData[] = [];
      
      for (const credential of credentials) {
        try {
          let status: 'valid' | 'expired' | 'revoked' = 'valid';
          if (credential.revoked) {
            status = 'revoked';
          } else if (credential.validUntil && new Date(credential.validUntil) < new Date()) {
            status = 'expired';
          }
          
          badges.push({
            id: credential.id,
            name: `Badge ${credential.id.split(':').pop()?.slice(-8) || 'Unknown'}`,
            description: 'Achievement credential earned',
            image: '',
            issuanceDate: credential.validFrom || new Date().toISOString(), // Use validFrom as issuanceDate
            issuerName: credential.issuer || 'Unknown Issuer',
            transactionSignature: credential.proof?.[0]?.proofValue || 'N/A',
            achievement: credential.credentialSubject?.achievement?.id,
            recipient: credential.credentialSubject?.id,
            status,
            proof: credential.proof?.[0] ? {
              type: credential.proof[0].type || 'DataIntegrityProof',
              created: credential.proof[0].created || new Date().toISOString(),
              verificationMethod: credential.proof[0].verificationMethod || '',
              proofPurpose: credential.proof[0].proofPurpose || 'assertionMethod',
              proofValue: credential.proof[0].proofValue,
              solanaTransaction: credential.proof[0].proofValue // Use proofValue as transaction
            } : undefined,
            rawJson: credential
          });
        } catch (error) {
          console.error('Error processing credential:', credential.id, error);
          badges.push({
            id: credential.id,
            name: `Credential ${credential.id.split(':').pop()?.slice(-8) || 'Unknown'}`,
            description: 'Achievement details unavailable',
            image: '',
            issuanceDate: credential.validFrom || new Date().toISOString(), // Use validFrom as issuanceDate
            issuerName: 'Unknown Issuer',
            transactionSignature: credential.proof?.[0]?.proofValue || 'N/A',
            achievement: credential.credentialSubject?.achievement?.id,
            recipient: credential.credentialSubject?.id,
            status: 'valid',
            proof: credential.proof?.[0] ? {
              type: credential.proof[0].type || 'DataIntegrityProof',
              created: credential.proof[0].created || new Date().toISOString(),
              verificationMethod: credential.proof[0].verificationMethod || '',
              proofPurpose: credential.proof[0].proofPurpose || 'assertionMethod',
              proofValue: credential.proof[0].proofValue,
              solanaTransaction: credential.proof[0].proofValue // Use proofValue as transaction
            } : undefined,
            rawJson: credential
          });
        }
      }
      
      return badges;
    } catch (error) {
      console.error("Error fetching user credentials:", error);
      return [];
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
              <CardDescription className="text-base">
                Connect your wallet to view and manage your digital profile and achievement badges.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted">
                  <Award className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">View Badges</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Secure Profile</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => connect()} size="lg" className="w-full">
                <User className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Your Profile
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mt-2">
              Manage your digital identity and achievement badges
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Public Profile */}
          <div className="xl:col-span-2 space-y-6">
            {/* Wallet Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Public Profile
                </CardTitle>
                <CardDescription>
                  Your public blockchain identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Wallet Address</p>
                      <p className="text-sm font-mono break-all">
                        {formatAddress(publicKey?.toBase58() || '', 12)}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(publicKey?.toBase58() || "", "Wallet address")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSolanaExplorer(publicKey?.toBase58() || "")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Network</p>
                      <p className="text-sm">Solana Devnet</p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Achievement Badges
                    </CardTitle>
                    <CardDescription>
                      Open Badges v3.0 compliant credentials you've earned
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchUserData}
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Badge variant="secondary">
                      {badges.length} Badge{badges.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="ml-2">Loading badges...</span>
                  </div>
                ) : badges.length ? (
                  <div className="grid gap-4">
                    {badges.map((badge) => (
                      <Card key={badge.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{badge.name}</CardTitle>
                              {getStatusIcon(badge.status)}
                            </div>
                            <Badge className={getStatusColor(badge.status)}>
                              {badge.status}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm">
                            {badge.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Badge Information */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-muted-foreground">Issuer DID</p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-xs">
                                  {formatAddress(badge.issuerName)}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(badge.issuerName, "Issuer DID")}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openSolanaExplorer(badge.issuerName, 'address')}
                                  className="h-6 w-6 p-0"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <p className="font-medium text-muted-foreground">Issued Date</p>
                              <p>{badge.issuanceDate ? new Date(badge.issuanceDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            
                            <div>
                              <p className="font-medium text-muted-foreground">Badge DID</p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-xs">
                                  {formatAddress(badge.id)}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(badge.id, "Badge DID")}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {badge.recipient && (
                              <div>
                                <p className="font-medium text-muted-foreground">Recipient DID</p>
                                <div className="flex items-center gap-2">
                                  <p className="font-mono text-xs">
                                    {formatAddress(badge.recipient)}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(badge.recipient!, "Recipient DID")}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openSolanaExplorer(badge.recipient!, 'address')}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {badge.achievement && (
                              <div>
                                <p className="font-medium text-muted-foreground">Achievement DID</p>
                                <div className="flex items-center gap-2">
                                  <p className="font-mono text-xs">
                                    {formatAddress(badge.achievement)}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(badge.achievement!, "Achievement DID")}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {badge.transactionSignature && (
                              <div>
                                <p className="font-medium text-muted-foreground">Transaction Signature</p>
                                <div className="flex items-center gap-2">
                                  <p className="font-mono text-xs">
                                    {formatAddress(badge.transactionSignature)}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(badge.transactionSignature!, "Transaction signature")}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openSolanaExplorer(badge.transactionSignature!, 'tx')}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {badge.proof && (
                              <div className="col-span-full">
                                <p className="font-medium text-muted-foreground mb-2">Cryptographic Proof</p>
                                <div className="bg-muted/50 p-3 rounded text-xs space-y-2">
                                  <div><span className="font-medium">Type:</span> {badge.proof.type || 'N/A'}</div>
                                  <div><span className="font-medium">Purpose:</span> {badge.proof.proofPurpose || 'N/A'}</div>
                                  <div><span className="font-medium">Created:</span> {badge.proof.created ? new Date(badge.proof.created).toLocaleString() : 'N/A'}</div>
                                  {badge.proof.verificationMethod && (
                                    <div><span className="font-medium">Verification Method:</span> {formatAddress(badge.proof.verificationMethod)}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 pt-4">
                            <Button variant="outline" size="sm" className="flex-1">
                              View Details
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              Verify
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => viewJsonDialog(badge.rawJson, `Badge ${badge.name}`)}
                              className="flex-1"
                            >
                              View JSON
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No badges yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't earned any achievement badges yet.
                    </p>
                    <Button variant="outline">
                      Explore Achievements
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats and Issuer Profile */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{badges.length}</div>
                    <p className="text-sm text-muted-foreground">Total Badges</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center pt-4 border-t">
                    {(() => {
                      const stats = calculateBadgeStatistics(badges);
                      return (
                        <>
                          <div>
                            <div className="text-lg font-semibold">{stats.recentBadges}</div>
                            <p className="text-xs text-muted-foreground">This Month</p>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">{stats.valid}</div>
                            <p className="text-xs text-muted-foreground">Valid</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issuer Profile Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Issuer Profile
                </CardTitle>
                <CardDescription>
                  Manage your credential issuing capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {issuerProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">Active Issuer</span>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">Organization Name</p>
                        <p>{issuerProfile.name}</p>
                      </div>
                      
                      {issuerProfile.url && (
                        <div>
                          <p className="font-medium text-muted-foreground">Website</p>
                          <a href={issuerProfile.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {issuerProfile.url}
                          </a>
                        </div>
                      )}
                      
                      {issuerProfile.email && (
                        <div>
                          <p className="font-medium text-muted-foreground">Contact Email</p>
                          <a href={`mailto:${issuerProfile.email}`} className="text-primary hover:underline">
                            {issuerProfile.email}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Issuer Profile
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">No Issuer Profile</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create an issuer profile to issue achievement badges
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate('/create-issuer')}
                      size="sm"
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Issuer Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common badge and profile actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => window.location.href = '/badges'}
                >
                  <Award className="w-4 h-4 mr-2" />
                  View All Badges
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/validate'}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Badge
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/achievements'}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Browse Achievements
                </Button>
                
                {!issuerProfile && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/create-issuer')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Become an Issuer
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    const exportData = {
                      profile: {
                        wallet: publicKey?.toBase58(),
                        issuerProfile: issuerProfile
                      },
                      badges: badges,
                      exportDate: new Date().toISOString()
                    };
                    const jsonString = JSON.stringify(exportData, null, 2);
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `profile-export-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    toast.success('Profile exported successfully');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
