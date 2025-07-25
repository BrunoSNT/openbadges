import { useState, useEffect } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Plus, Search, X } from "lucide-react";
import { AchievementForm } from "@/components/AchievementForm";
import { AchievementList } from "@/components/AchievementList";
import { useNavigate } from "react-router-dom";
import { useSolana } from "@/contexts/SolanaContext";
import { toast } from "sonner";
import type { Achievement as BadgeAchievement } from "@/types/badge";
import { getProfileTypeLabel } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export function AchievementsPage() {
  const { tAchievements, tMessages, tProfile, tWallet } = useTranslation();
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { solanaClient, isInitialized, initialize, connection } = useSolana();
  const navigate = useNavigate();
  
  const [achievements, setAchievements] = useState<BadgeAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);

  useEffect(() => {
    if (anchorWallet && connection && !isInitialized) {
      initialize(anchorWallet);
    }
  }, [anchorWallet, connection, isInitialized, initialize]);

  useEffect(() => {
    if (isInitialized && solanaClient && publicKey) {
      loadAchievements();
      checkProfileStatus();
    }
  }, [isInitialized, solanaClient, publicKey]);

  const loadAchievements = async () => {
    if (!solanaClient || !publicKey) return;

    try {
      setLoading(true);
      const data = await solanaClient.getAchievements();
      console.log("Loaded achievements:", data);
      // Transform achievements to ensure criteria is always defined
      const transformedData = (data || []).map(achievement => ({
        ...achievement,
        criteria: achievement.criteria || { narrative: "" }
      })) as BadgeAchievement[];
      setAchievements(transformedData);
    } catch (error) {
      console.error("Error loading achievements:", error);
      toast.error(tMessages('error.failedToLoadAchievements'));
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const checkProfileStatus = async () => {
    if (!solanaClient || !publicKey || hasCheckedProfile) return;

    try {
      const profileExists = await solanaClient.profileExists();
      if (profileExists) {
        // Get the profile type for better user feedback
        const profileType = await solanaClient.getProfileType();
        console.log('Issuer profile type:', profileType);
      }
      setShowProfileWarning(!profileExists);
      setHasCheckedProfile(true);
    } catch (error) {
      console.error("Error checking profile status:", error);
    }
  };

  const handleCreateAchievement = async (formData: {
    name: string;
    description: string;
    criteria: { narrative: string; id?: string };
    image?: string;
    tags?: string;
  }) => {
    if (!solanaClient || !publicKey) {
      toast.error(tMessages('error.walletNotConnected'));
      return;
    }

    try {
      setIsCreating(true);
      
      // Check if profile exists (both simple and DID-based)
      const profileExists = await solanaClient.profileExists();
      if (!profileExists) {
        toast.error(tMessages('error.profileRequired'));
        setShowCreateForm(false);
        navigate('/profile?createIssuer=true');
        return;
      }

      // Get the profile type for better user feedback
      const profileType = await solanaClient.getProfileType();
      console.log('Creating achievement with profile type:', profileType);
      
      const result = await solanaClient.createAchievement(
        formData.name,
        formData.description,
        { narrative: formData.criteria.narrative },
        formData.image,
        formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : undefined
      );

      const profileTypeLabel = getProfileTypeLabel(profileType);
      toast.success(tMessages('success.achievementCreatedWithProfile', { profileType: profileTypeLabel }));
      console.log("Achievement created:", result);
      
      setShowCreateForm(false);
      await loadAchievements();
    } catch (error) {
      console.error("Error creating achievement:", error);
      const errorMessage = error instanceof Error ? error.message : tMessages('error.failedToCreateAchievement');
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{tWallet('required')}</CardTitle>
            <CardDescription>
              {tWallet('requiredDescription', { action: tWallet('actions.createAchievement') })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Plus className="h-12 w-12" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Warning */}
      {showProfileWarning && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>
            {tProfile('issuerProfileRequired')}
          </AlertTitle>
          <AlertDescription>
            {tProfile('setupRequired')}
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="default"
                onClick={() => navigate('/profile?createIssuer=true')}
              >
                {tProfile('createProfile')}
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setShowProfileWarning(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{tAchievements('pageTitle')}</h1>
          <p className="text-muted-foreground">
            {tAchievements('pageDescription')}
          </p>
        </div>
        
        <Button onClick={async () => {
          if (!solanaClient) {
            toast.error(tMessages('error.walletNotConnected'));
            return;
          }
          
          try {
            const profileExists = await solanaClient.profileExists();
            if (!profileExists) {
              toast.error(tMessages('error.profileRequired'));
              navigate('/profile?createIssuer=true');
              return;
            }
            setShowCreateForm(true);
          } catch (error) {
            console.error("Error checking profile status:", error);
            toast.error(tMessages('error.failedToCheckProfile'));
          }
        }}>
          <Plus className="mr-2 h-4 w-4" />
          {tAchievements('create')}
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={tAchievements('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Create Achievement Form */}
      {showCreateForm && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{tAchievements('createNew')}</CardTitle>
                  <CardDescription>
                    {tAchievements('createDescription')}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AchievementForm
                onSubmit={handleCreateAchievement}
                isLoading={isCreating}
                submitLabel="Create Achievement"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Achievements List */}
      <AchievementList
        achievements={achievements}
        loading={loading}
        searchQuery={searchQuery}
      />
    </div>
  );
}
