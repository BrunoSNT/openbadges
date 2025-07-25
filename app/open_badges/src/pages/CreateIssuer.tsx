import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, User, Shield, CheckCircle, AlertCircle, Mail, Globe } from "lucide-react";
import { useSolana } from "@/contexts/SolanaContext";
import { toast } from "sonner";
import { getProfileTypeLabel } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export function CreateIssuerPage() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const { solanaClient } = useSolana();
  const { tProfileCreate } = useTranslation();
  
  // Form states
  const [profileName, setProfileName] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [createWithDid, setCreateWithDid] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const resetForm = () => {
    setProfileName("");
    setProfileDescription("");
    setProfileUrl("");
    setProfileEmail("");
  };

  const handleCreateProfile = async () => {
    if (!profileName.trim()) {
      toast.error("Organization name is required");
      return;
    }
    
    if (!solanaClient || !publicKey) {
      toast.error(tProfileCreate('walletRequiredMessage'));
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Check if a profile already exists
      const existingProfile = await solanaClient.profileExists();
      if (existingProfile) {
        const existingProfileType = await solanaClient.getProfileType();
        const profileTypeLabel = getProfileTypeLabel(existingProfileType);
        toast.info(tProfileCreate('existingProfile', { profileType: profileTypeLabel }));
        navigate('/profile');
        return;
      }
      
      // Clean and validate inputs - only send non-empty, non-placeholder values
      const cleanName = profileName.trim();
      const cleanUrl = profileUrl.trim();
      const cleanEmail = profileEmail.trim();
      
      // Don't send placeholder values or empty strings
      const validUrl = (cleanUrl && 
                       cleanUrl !== tProfileCreate('websiteUrlPlaceholder') && 
                       cleanUrl !== "https://your-website.com") ? cleanUrl : undefined;
      const validEmail = (cleanEmail && 
                         cleanEmail !== tProfileCreate('contactEmailPlaceholder')) ? cleanEmail : undefined;
      
      if (createWithDid) {
        const result = await solanaClient.initializeProfileWithDid(
          cleanName,
          validUrl,
          validEmail
        );
        toast.success(tProfileCreate('didSuccessTitle'), {
          description: tProfileCreate('didSuccessDescription', { didAddress: result?.didAddress.slice(0, 8) })
        });
      } else {
        await solanaClient.initializeProfile(
          cleanName,
          validUrl,
          validEmail
        );
        toast.success(tProfileCreate('simpleSuccessTitle'), {
          description: tProfileCreate('simpleSuccessDescription')
        });
      }
      
      resetForm();
      navigate('/profile');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : tProfileCreate('defaultError');
      toast.error(tProfileCreate('errorTitle'), { description: errorMessage });
    } finally {
      setIsCreating(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tProfileCreate('back')}
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{tProfileCreate('walletRequired')}</h3>
            <p className="text-muted-foreground mb-4">
              {tProfileCreate('walletRequiredMessage')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button onClick={handleBack} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tProfileCreate('back')}
        </Button>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{tProfileCreate('title')}</h1>
          <p className="text-muted-foreground">
            {tProfileCreate('subtitle')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {tProfileCreate('organizationInfo')}
            </CardTitle>
            <CardDescription>
              {tProfileCreate('organizationInfoDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* DID Method Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">{tProfileCreate('identityMethod')}</Label>
              <div className="grid gap-3">
                <div 
                  className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                    createWithDid ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => setCreateWithDid(true)}
                >
                  <input
                    type="radio"
                    checked={createWithDid}
                    onChange={() => setCreateWithDid(true)}
                    className="w-4 h-4 text-primary"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <Label className="font-medium cursor-pointer">
                        {tProfileCreate('didProfile')}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tProfileCreate('didDescription')}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{tProfileCreate('didFeatures.verification')}</span>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{tProfileCreate('didFeatures.futureProof')}</span>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{tProfileCreate('didFeatures.standard')}</span>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                    !createWithDid ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => setCreateWithDid(false)}
                >
                  <input
                    type="radio"
                    checked={!createWithDid}
                    onChange={() => setCreateWithDid(false)}
                    className="w-4 h-4 text-primary"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <Label className="font-medium cursor-pointer">
                        {tProfileCreate('simpleProfile')}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tProfileCreate('simpleDescription')}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-gray-500" />
                      <span>{tProfileCreate('simpleFeatures.quickSetup')}</span>
                      <CheckCircle className="h-3 w-3 text-gray-500" />
                      <span>{tProfileCreate('simpleFeatures.lowerCosts')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{tProfileCreate('organizationNameRequired')}</Label>
              <Input
                id="name"
                placeholder={tProfileCreate('organizationNamePlaceholder')}
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {tProfileCreate('organizationNameHelp')}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{tProfileCreate('descriptionLabel')}</Label>
              <Textarea
                id="description"
                placeholder={tProfileCreate('descriptionPlaceholder')}
                value={profileDescription}
                onChange={(e) => setProfileDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Website URL */}
            <div className="space-y-2">
              <Label htmlFor="url">{tProfileCreate('websiteUrl')}</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="url"
                  type="url"
                  placeholder={tProfileCreate('websiteUrlPlaceholder')}
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{tProfileCreate('contactEmail')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={tProfileCreate('contactEmailPlaceholder')}
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {createWithDid ? (
                  <>
                    <strong>DID Profile:</strong> {tProfileCreate('didAlert')}
                  </>
                ) : (
                  <>
                    <strong>Simple Profile:</strong> {tProfileCreate('simpleAlert')}
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="flex-1"
              >
                {tProfileCreate('cancel')}
              </Button>
              <Button 
                onClick={handleCreateProfile}
                disabled={isCreating || !profileName.trim()}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {tProfileCreate('creating')}
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    {tProfileCreate('createProfile')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
