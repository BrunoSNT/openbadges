import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Plus, User, Mail, Globe, Edit2, Bug } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSolana } from "@/contexts/SolanaContext";
import type { Profile } from "@/clients/solana-client";

export function ProfileManagementPage() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const { solanaClient, isInitialized } = useSolana();
  
  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Component state
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [debugResult, setDebugResult] = useState<any>(null);

  // Form states for update only
  const [profileName, setProfileName] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  // Fetch profile using direct Solana calls
  const fetchProfile = async () => {
    if (!solanaClient || !publicKey) return;
    
    setFetchLoading(true);
    setFetchError(null);
    try {
      // First, let's debug the profile status
      console.log('🔍 Debugging profile for wallet:', publicKey.toString());
      const debugResult = await solanaClient.debugProfile();
      console.log('📊 Debug result:', debugResult);
      
      if (!debugResult.exists) {
        setFetchError('No issuer profile found. Please create one first.');
        return;
      }
      
      if (debugResult.error) {
        setFetchError(`Profile exists but has issues: ${debugResult.error}`);
        return;
      }
      
      // Now try to get the profile data
      const profileData = await solanaClient.getProfile();
      if (profileData) {
        setProfile(profileData);
        console.log('✅ Profile loaded successfully:', profileData);
      } else {
        setFetchError('Profile exists but could not be loaded. This might be a data format issue.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
      setFetchError(errorMessage);
      console.error('Error fetching profile:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  // Update profile using direct Solana calls
  const updateProfile = async (profileData: { name: string; url?: string; email?: string }) => {
    if (!solanaClient || !publicKey) return;
    
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    try {
      await solanaClient.updateProfile(profileData);
      setUpdateSuccess(true);
      toast.success('Profile updated successfully');
      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setUpdateError(errorMessage);
      toast.error('Update failed', { description: errorMessage });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Debug function
  const debugProfile = async () => {
    if (!solanaClient || !publicKey) return;
    
    try {
      const result = await solanaClient.debugProfile();
      setDebugResult(result);
      console.log('🔍 Manual debug result:', result);
      
      if (result.error) {
        toast.error(`Debug error: ${result.error}`);
      } else {
        toast.success(`Profile debug completed. Check console for details.`);
      }
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Debug failed');
    }
  };

  useEffect(() => {
    if (isInitialized && solanaClient && publicKey) {
      fetchProfile();
    }
  }, [isInitialized, solanaClient, publicKey]);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || "");
      setProfileDescription(profile.description || "");
      setProfileUrl(profile.url || "");
      setProfileEmail(profile.email || "");
    }
  }, [profile]);

  useEffect(() => {
    if (updateSuccess) {
      toast.success("Profile updated successfully!");
      setShowUpdateForm(false);
      fetchProfile(); // Refresh profile data
    }
  }, [updateSuccess]);

  useEffect(() => {
    if (updateError) {
      toast.error(`Failed to update profile: ${updateError}`);
    }
  }, [updateError]);

  // Form handlers
  const handleCreateProfile = () => {
    navigate('/create-issuer');
  };

  const handleUpdateProfile = async () => {
    if (!profileName.trim()) return;
    
    // Clean and validate inputs - only send non-empty, non-placeholder values
    const cleanName = profileName.trim();
    const cleanUrl = profileUrl.trim();
    const cleanEmail = profileEmail.trim();
    
    // Don't send placeholder values or empty strings
    const validUrl = (cleanUrl && 
                     cleanUrl !== "https://your-organization.com" && 
                     cleanUrl !== "https://your-website.com") ? cleanUrl : undefined;
    const validEmail = (cleanEmail && 
                       cleanEmail !== "contact@your-organization.com") ? cleanEmail : undefined;
    
    await updateProfile({
      name: cleanName,
      url: validUrl,
      email: validEmail
    });
    
    if (updateSuccess) {
      setShowUpdateForm(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet to manage your issuer profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!publicKey || !isInitialized) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Connection Required</AlertTitle>
          <AlertDescription>
            Please connect your wallet to access profile management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>
            {fetchError}. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Management</h1>
          <p className="text-muted-foreground">
            Manage your issuer profile for Open Badges v3.0
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={debugProfile}>
            <Bug className="w-4 h-4 mr-2" />
            Debug Profile
          </Button>
          {profile && (
            <Button onClick={() => setShowUpdateForm(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {fetchLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </div>
      ) : profile ? (
        <div className="grid gap-6">
          {/* Current Profile Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Issuer Profile
              </CardTitle>
              <CardDescription>
                Your current issuer profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="mt-1">{profile.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <p className="mt-1">{profile.type}</p>
                </div>
                {profile.email && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="mt-1">{profile.email}</p>
                  </div>
                )}
                {profile.url && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                    <p className="mt-1">
                      <a href={profile.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {profile.url}
                      </a>
                    </p>
                  </div>
                )}
              </div>
              {profile.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="mt-1">{profile.description}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Profile ID</Label>
                <p className="mt-1 font-mono text-sm">{profile.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Debug Results */}
          {debugResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5" />
                  Debug Information
                </CardTitle>
                <CardDescription>
                  Technical details about your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Profile Exists</Label>
                    <p className="mt-1">{debugResult.exists ? '✅ Yes' : '❌ No'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Profile Type</Label>
                    <p className="mt-1">{debugResult.profileType || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Profile Address</Label>
                    <p className="mt-1 font-mono text-sm">{debugResult.profileAddress}</p>
                  </div>
                  {debugResult.error && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Error</Label>
                      <p className="mt-1 text-red-600">{debugResult.error}</p>
                    </div>
                  )}
                </div>
                {debugResult.profileData && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Raw Profile Data</Label>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(debugResult.profileData, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Profile Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your issuer profile to start issuing Open Badges v3.0 credentials
            </p>
            <Button onClick={handleCreateProfile}>
              <Plus className="w-4 h-4 mr-2" />
              Create Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Update Profile Dialog */}
      <Dialog open={showUpdateForm} onOpenChange={setShowUpdateForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Issuer Profile</DialogTitle>
            <DialogDescription>
              Update your issuer profile information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="update-name">Name *</Label>
              <Input
                id="update-name"
                placeholder="Organization or issuer name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-description">Description</Label>
              <Textarea
                id="update-description"
                placeholder="Brief description of your organization"
                value={profileDescription}
                onChange={(e) => setProfileDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-url">Website URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="update-url"
                  type="url"
                  placeholder="https://your-organization.com"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-email">Contact Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="update-email"
                  type="email"
                  placeholder="contact@your-organization.com"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateForm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={updateLoading || !profileName.trim()}
            >
              {updateLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Update Profile
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
