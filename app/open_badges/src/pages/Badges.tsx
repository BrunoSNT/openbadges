import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Award, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Filter,
  Download,
  Grid,
  List
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSolana } from "@/contexts/SolanaContext";
import { toast } from "sonner";
import type { AchievementCredential } from "@/clients/solana-client";
import { useTranslation } from "@/hooks/useTranslation";

type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'status';
type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'valid' | 'expired' | 'revoked';

export function BadgesPage() {
  const { tBadges } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [badges, setBadges] = useState<AchievementCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced filtering and sorting
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const navigate = useNavigate();
  
  const { publicKey } = useWallet();
  const { solanaClient, isInitialized } = useSolana();

  // Auto-refresh timer
  useEffect(() => {
    if (!isInitialized || !solanaClient || !publicKey) return;

    // Initial fetch
    fetchBadges();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing badges...');
      fetchBadges();
    }, 30000);

    return () => clearInterval(interval);
  }, [isInitialized, solanaClient, publicKey]);

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
    const baseUrl = 'https://explorer.solana.com';
    const network = 'devnet'; // Change based on your environment
    const url = `${baseUrl}/${type}/${address}?cluster=${network}`;
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

  const getStatusIcon = (badge: AchievementCredential) => {
    if (badge.revoked) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    } else if (badge.expirationDate && new Date(badge.expirationDate) < new Date()) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = (badge: AchievementCredential) => {
    if (badge.revoked) {
      return 'bg-red-100 text-red-800';
    } else if (badge.expirationDate && new Date(badge.expirationDate) < new Date()) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (badge: AchievementCredential) => {
    if (badge.revoked) return 'Revoked';
    if (badge.validUntil && new Date(badge.validUntil) < new Date()) return 'Expired';
    return 'Valid';
  };

  // Advanced filtering and sorting functions
  const handleExportBadges = () => {
    try {
      const dataToExport = {
        exportDate: new Date().toISOString(),
        totalBadges: filteredAndSortedBadges.length,
        badges: filteredAndSortedBadges
      };
      
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `badges-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Badges exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export badges');
    }
  };

  const sortBadges = (badges: AchievementCredential[], sortBy: SortOption): AchievementCredential[] => {
    const sortedBadges = [...badges];
    
    switch (sortBy) {
      case 'newest':
        return sortedBadges.sort((a, b) => {
          const dateA = a.validFrom ? new Date(a.validFrom).getTime() : 0;
          const dateB = b.validFrom ? new Date(b.validFrom).getTime() : 0;
          return dateB - dateA;
        });
      case 'oldest':
        return sortedBadges.sort((a, b) => {
          const dateA = a.validFrom ? new Date(a.validFrom).getTime() : 0;
          const dateB = b.validFrom ? new Date(b.validFrom).getTime() : 0;
          return dateA - dateB;
        });
      case 'alphabetical':
        return sortedBadges.sort((a, b) => {
          const nameA = a.credentialSubject?.achievement?.id || a.id || '';
          const nameB = b.credentialSubject?.achievement?.id || b.id || '';
          return nameA.localeCompare(nameB);
        });
      case 'status':
        return sortedBadges.sort((a, b) => {
          const statusA = getStatusText(a);
          const statusB = getStatusText(b);
          return statusA.localeCompare(statusB);
        });
      default:
        return sortedBadges;
    }
  };

  const filterBadges = (badges: AchievementCredential[], status: FilterStatus): AchievementCredential[] => {
    if (status === 'all') return badges;
    
    return badges.filter(badge => {
      const badgeStatus = getStatusText(badge).toLowerCase();
      return badgeStatus === status;
    });
  };

  const fetchBadges = async () => {
    if (!solanaClient || !publicKey) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching badges for user:', publicKey.toBase58());
      
      // Fetch credentials where the current user is the recipient
      const credentials = await solanaClient.getCredentials(publicKey.toBase58());
      console.log('📋 Found badges:', credentials);
      
      setBadges(credentials);
      
      if (credentials.length > 0) {
        toast.success(`Loaded ${credentials.length} badge${credentials.length !== 1 ? 's' : ''}`);
      }
    } catch (err) {
      console.error("Error fetching badges:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch badges";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    toast.info("Refreshing badges...");
    fetchBadges();
  };

  const handleViewBadge = (badgeId: string) => {
    // Navigate to badge detail view  
    navigate(`/badges/${badgeId}`);
  };

  const handleVerifyBadge = async (_badge: AchievementCredential) => {
    try {
      // This would integrate with the verification service
      toast.info("Verifying badge...");
      
      // For now, just show a success message
      // In a real implementation, this would verify the badge's signature, dates, etc.
      setTimeout(() => {
        toast.success("Badge verified successfully!");
      }, 1000);
    } catch (error) {
      console.error("Error verifying badge:", error);
      toast.error("Failed to verify badge");
    }
  };

  const filteredBadges = Array.isArray(badges) ? badges.filter((badge: AchievementCredential) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    
    // Search in badge ID and recipient fields (updated for Solana client structure)
    const badgeId = badge.id?.toLowerCase() || '';
    const recipientId = badge.credentialSubject?.id?.toLowerCase() || '';
    const achievementId = badge.credentialSubject?.achievement?.id?.toLowerCase() || '';
    const issuerId = badge.issuer?.toLowerCase() || '';
    
    return (
      badgeId.includes(searchLower) ||
      recipientId.includes(searchLower) ||
      achievementId.includes(searchLower) ||
      issuerId.includes(searchLower)
    );
  }) : [];

  // Apply status filter, then sort
  const statusFilteredBadges = filterBadges(filteredBadges, filterStatus);
  const filteredAndSortedBadges = sortBadges(statusFilteredBadges, sortBy);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Badges</CardTitle>
            <CardDescription>
              Failed to load badges. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Wallet Required</CardTitle>
            <CardDescription>
              Please connect your wallet to view your badges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Connect your wallet to get started
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tBadges('myBadges')}</h1>
          <p className="text-muted-foreground">
            {tBadges('description')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {tBadges('refreshBadges')}
          </Button>
          <Button onClick={handleExportBadges} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Badges
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={tBadges('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            {/* Status Filter */}
            <Select
              value={filterStatus}
              onValueChange={(value) => setFilterStatus(value as FilterStatus)}
            >
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-3"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'More Filters'}
            </Button>

            {/* View Mode */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
                className="h-10 w-10 p-0"
                title="Grid View"
              >
                <Grid className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className="h-10 w-10 p-0"
                title="List View"
              >
                <List className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters (Hidden by default) */}
        {showFilters && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Issuer Filter */}
              <div>
                <p className="font-medium text-muted-foreground mb-2">Issuer DID</p>
                <Input
                  placeholder="Filter by issuer DID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* Date Range Filter */}
              <div>
                <p className="font-medium text-muted-foreground mb-2">Date Range</p>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="From"
                    className="w-full"
                  />
                  <Input
                    type="date"
                    placeholder="To"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowFilters(false)}>
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(false)}>
                <Filter className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Credentials List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading badges...</span>
        </div>
      ) : filteredAndSortedBadges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No badges found" : "No badges yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery 
                ? "Try adjusting your search criteria" 
                : "You haven't received any achievement badges yet"
              }
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredAndSortedBadges.map((badge: AchievementCredential) => (
            <Card key={badge.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg truncate">
                        {tBadges('title')} {formatAddress(badge.id)}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm truncate">
                        {tBadges('achievementCredential')} • {badge.id.startsWith('did:') ? tBadges('didValid') : tBadges('didLegacy')}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {getStatusIcon(badge)}
                    <Badge className={`${getStatusColor(badge)} text-xs whitespace-nowrap`}>
                      {badge.revoked ? tBadges('revoked') : 
                       badge.validUntil && new Date(badge.validUntil) < new Date() ? tBadges('expired') : 
                       tBadges('valid')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Badge Information Grid */}
                <div className="grid grid-cols-1 gap-3 text-sm">
                  {/* Achievement Information */}
                  {badge.credentialSubject?.achievement && (
                    <div className="space-y-3 pb-3 border-b">
                      {badge.credentialSubject.achievement.name && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">{tBadges('achievementName')}</p>
                          <p className="text-sm font-semibold text-foreground">
                            {badge.credentialSubject.achievement.name}
                          </p>
                        </div>
                      )}
                      
                      {badge.credentialSubject.achievement.description && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">{tBadges('achievementDescription')}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {badge.credentialSubject.achievement.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">{tBadges('badgeDid')}</p>
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-mono text-xs truncate flex-1 bg-muted/30 px-2 py-1 rounded">
                          {formatAddress(badge.id, 12)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(badge.id, tBadges('badgeDid'))}
                          className="h-6 w-6 p-0 flex-shrink-0"
                          title={tBadges('copyTooltip')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {badge.credentialSubject?.id && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">{tBadges('recipientDid')}</p>
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-mono text-xs truncate flex-1 bg-muted/30 px-2 py-1 rounded">
                            {formatAddress(badge.credentialSubject.id, 12)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(badge.credentialSubject.id, tBadges('recipientDid'))}
                            className="h-6 w-6 p-0 flex-shrink-0"
                            title={tBadges('copyTooltip')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openSolanaExplorer(badge.credentialSubject.id, 'address')}
                            className="h-6 w-6 p-0 flex-shrink-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">{tBadges('issuerDid')}</p>
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-mono text-xs truncate flex-1 bg-muted/30 px-2 py-1 rounded">
                          {formatAddress(badge.issuer, 12)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(badge.issuer, tBadges('issuerDid'))}
                          className="h-6 w-6 p-0 flex-shrink-0"
                          title={tBadges('copyTooltip')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSolanaExplorer(badge.issuer, 'address')}
                          className="h-6 w-6 p-0 flex-shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">{tBadges('issuedDate')}</p>
                      <p className="text-xs">{badge.validFrom ? new Date(badge.validFrom).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    
                    {badge.validUntil && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">{tBadges('expires')}</p>
                        <p className="text-xs">{new Date(badge.validUntil).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  
                  {badge.credentialSubject?.achievement?.id && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">{tBadges('achievementDid')}</p>
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-mono text-xs truncate flex-1 bg-muted/30 px-2 py-1 rounded">
                          {formatAddress(badge.credentialSubject.achievement.id, 12)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(badge.credentialSubject.achievement.id, tBadges('achievementDid'))}
                          className="h-6 w-6 p-0 flex-shrink-0"
                          title={tBadges('copyTooltip')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {badge.proof && badge.proof.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="font-medium text-muted-foreground mb-2">{tBadges('cryptographicProof')}</p>
                      <div className="bg-muted/50 p-2 rounded text-xs space-y-1">
                        <div className="flex flex-wrap gap-1">
                          <span className="font-medium">{tBadges('proofType')}:</span> 
                          <span className="truncate">{badge.proof[0].type || 'N/A'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="font-medium">{tBadges('proofPurpose')}:</span> 
                          <span className="truncate">{badge.proof[0].proofPurpose || 'N/A'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="font-medium">{tBadges('proofCreated')}:</span> 
                          <span className="truncate">{badge.proof[0].created ? new Date(badge.proof[0].created).toLocaleString() : 'N/A'}</span>
                        </div>
                        {badge.proof[0].proofValue && (
                          <div>
                            <span className="font-medium">{tBadges('proof')}:</span> 
                            <div className="flex items-center gap-2 mt-1 min-w-0">
                              <span className="font-mono text-xs truncate flex-1 bg-background px-2 py-1 rounded">
                                {formatAddress(badge.proof[0].proofValue, 10)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(badge.proof![0].proofValue!, "Transaction signature")}
                                className="h-4 w-4 p-0 flex-shrink-0"
                                title={tBadges('copyTooltip')}
                              >
                                <Copy className="h-2 w-2" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openSolanaExplorer(badge.proof![0].proofValue!, 'tx')}
                                className="h-4 w-4 p-0 flex-shrink-0"
                              >
                                <ExternalLink className="h-2 w-2" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewBadge(badge.id)}
                    className="flex-1 text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {tBadges('viewDetails')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerifyBadge(badge)}
                    className="flex-1 text-xs"
                  >
                    {tBadges('verifyBadge')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewJsonDialog(badge, `${tBadges('title')} ${formatAddress(badge.id)}`)}
                    className="flex-1 text-xs"
                  >
                    {tBadges('viewJson')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-muted">
          {filteredAndSortedBadges.map((badge: AchievementCredential) => (
            <div key={badge.id} className="py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 min-w-0 flex-1">
                {/* Badge Icon and Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {badge.credentialSubject?.achievement?.name || `${tBadges('title')} ${formatAddress(badge.id, 10)}`}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {badge.credentialSubject?.achievement?.description || 
                       `${tBadges('achievementCredential')} • ${badge.id.startsWith('did:') ? tBadges('didValid') : tBadges('didLegacy')}`}
                    </p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="flex sm:block">
                  <Badge className={`${getStatusColor(badge)} text-xs whitespace-nowrap`}>
                    {badge.revoked ? tBadges('revoked') : 
                     badge.validUntil && new Date(badge.validUntil) < new Date() ? tBadges('expired') : 
                     tBadges('valid')}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewBadge(badge.id)}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {tBadges('viewDetails')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVerifyBadge(badge)}
                  className="text-xs"
                >
                  {tBadges('verifyBadge')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewJsonDialog(badge, `${tBadges('title')} ${formatAddress(badge.id)}`)}
                  className="text-xs"
                >
                  {tBadges('viewJson')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
