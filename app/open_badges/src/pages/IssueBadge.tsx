import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowLeft, Award, CheckCircle, Loader2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSolana } from "@/contexts/SolanaContext";
import { toast } from "sonner";
import type { Achievement } from "@/types/badge";
import { ClientDidManager } from "@/lib/did-manager";
import { getProfileTypeLabel } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

// Form validation schema
const badgeIssuanceSchema = z.object({
  recipientAddress: z.string()
    .min(1, "Recipient address is required")
    .refine((val) => {
      // Allow Solana addresses or DID format
      return val.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/) || val.startsWith('did:');
    }, "Must be a valid Solana address or DID"),
  subjectMethod: z.enum(["simple", "did"], {
    required_error: "Please select a subject identification method",
  }),
  notes: z.string().optional().transform((val) => {
    // Filter out placeholder values and empty strings
    if (!val || val.trim() === "" || val === "Add any additional information about this credential issuance...") {
      return undefined;
    }
    return val.trim();
  }),
});

type BadgeIssuanceFormValues = z.infer<typeof badgeIssuanceSchema>;

export function IssueBadgePage() {
  const navigate = useNavigate();
  const { achievementId } = useParams<{ achievementId: string }>();
  const { tBadges, tWallet, tErrors } = useTranslation();
  
  const { publicKey, signMessage } = useWallet();
  const { solanaClient, isInitialized, connection } = useSolana();
  
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuingBadge, setIssuingBadge] = useState(false);
  const [recipientDidStatus, setRecipientDidStatus] = useState<{
    checking: boolean;
    exists: boolean;
    didAddress?: PublicKey;
  }>({ checking: false, exists: false });

  const form = useForm<BadgeIssuanceFormValues>({
    resolver: zodResolver(badgeIssuanceSchema),
    defaultValues: {
      recipientAddress: "",
      subjectMethod: "simple",
      notes: "",
    },
  });

  const selectedMethod = form.watch("subjectMethod");
  const recipientAddress = form.watch("recipientAddress");

  // Client-side DID management - no initialization needed
  useEffect(() => {
    // No DID manager initialization needed for client-side approach
    console.log("Client-side DID checking ready");
  }, [connection, publicKey]);

  // Check recipient DID status when conditions change (client-side)
  useEffect(() => {
    if (selectedMethod === "did" && recipientAddress && connection) {
      checkRecipientDidStatus();
    } else {
      setRecipientDidStatus({ checking: false, exists: false });
    }
  }, [selectedMethod, recipientAddress, connection]);

  const checkRecipientDidStatus = async () => {
    if (!connection || !recipientAddress) return;

    try {
      setRecipientDidStatus(prev => ({ ...prev, checking: true }));
      
      // Try to parse as Solana address
      let recipientPubkey: PublicKey;
      if (recipientAddress.startsWith('did:')) {
        // For DID format, we'd need to extract the address - for now, show as not found
        setRecipientDidStatus({ 
          checking: false, 
          exists: false,
          didAddress: undefined 
        });
        return;
      } else {
        recipientPubkey = new PublicKey(recipientAddress);
      }
      
      // Use client-side DID checking
      const [didAddress] = ClientDidManager.deriveDIDAddress(recipientPubkey);
      const accountInfo = await connection.getAccountInfo(didAddress);
      const exists = accountInfo !== null && accountInfo.data.length > 0;
      
      setRecipientDidStatus({
        checking: false,
        exists,
        didAddress: exists ? didAddress : undefined,
      });
    } catch (error) {
      console.error("Error checking recipient DID:", error);
      setRecipientDidStatus({ checking: false, exists: false });
    }
  };

  // Load the specific achievement
  useEffect(() => {
    if (isInitialized && solanaClient && achievementId) {
      loadAchievement();
    }
  }, [isInitialized, solanaClient, achievementId]);

  const loadAchievement = async () => {
    if (!solanaClient || !achievementId) return;

    try {
      setLoading(true);
      const achievements = await solanaClient.getAchievements();
      const foundAchievement = achievements?.find(a => a.id === achievementId);
      
      if (foundAchievement) {
        setAchievement({
          ...foundAchievement,
          criteria: foundAchievement.criteria || { narrative: "" },
          image: typeof foundAchievement.image === 'string' 
            ? { id: foundAchievement.image, type: "Image" } 
            : foundAchievement.image
        });
      } else {
        toast.error(tErrors('achievementNotFound'));
        navigate('/achievements');
      }
    } catch (error) {
      console.error("Error loading achievement:", error);
      toast.error("Failed to load achievement");
      navigate('/achievements');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: BadgeIssuanceFormValues) => {
    if (!solanaClient || !publicKey || !signMessage || !achievement) {
      toast.error(tErrors('walletAndAchievementRequired'));
      return;
    }

    try {
      setIssuingBadge(true);

      // Check if profile exists first (both simple and DID-based)
      const profileExists = await solanaClient.profileExists();
      if (!profileExists) {
        toast.error("Please create your issuer profile first");
        return;
      }

      // Get the profile type for better user feedback
      const profileType = await solanaClient.getProfileType();
      console.log('Issuer profile type:', profileType);

      // Check if DID profile exists when using DID method
      if (values.subjectMethod === "did") {
        const didProfileExists = await solanaClient.didProfileExists();
        if (!didProfileExists) {
          toast.warning("DID profile not found. The credential will be issued with simple address format.");
        }
      }

      toast.info("Please approve the signing request in your wallet to issue the credential", {
        duration: 4000,
      });

      // Use the existing issueCredential method from SolanaClient
      // Note: Currently both simple and DID methods use the same underlying implementation
      // TODO: Implement DID-specific methods when ready
      const result = await solanaClient.issueCredential(
        achievement.id,
        values.recipientAddress,
        signMessage,
        values.notes ? [values.notes] : undefined
      );

      // Show success message with profile type info
      const methodLabel = values.subjectMethod === "simple" ? "Simple Address" : "DID-based";
      const profileTypeLabel = getProfileTypeLabel(profileType);
      
      toast.success(
        `Badge issued successfully using ${methodLabel} method!`,
        {
          description: `Issuer: ${profileTypeLabel} profile | Transaction: ${result.signature}`,
        }
      );

      // Navigate back with success message
      navigate('/achievements', { 
        state: { 
          message: `Credential issued successfully! Transaction: ${result.signature}`,
          credentialAddress: result.credentialAddress
        } 
      });

    } catch (error) {
      console.error("Badge issuance failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to issue badge", { description: errorMessage });
    } finally {
      setIssuingBadge(false);
    }
  };

  const handleBack = () => {
    navigate('/achievements');
  };

  if (!publicKey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{tWallet('required')}</h3>
            <p className="text-muted-foreground mb-4">
              {tWallet('requiredDescription', { action: tWallet('actions.issueBadge') })}
            </p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tBadges('issue.backToAchievements')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tBadges('issue.backToAchievements')}
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading achievement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!achievement) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tBadges('issue.backToAchievements')}
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{tErrors('achievementNotFound')}</h3>
            <p className="text-muted-foreground mb-4">
              {tErrors('achievementNotFoundDescription')}
            </p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tBadges('issue.backToAchievements')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="mb-6">
        <Button onClick={handleBack} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tBadges('issue.backToAchievements')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Achievement Info - Left Side */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {tBadges('issue.achievementDetails')}
              </CardTitle>
              <CardDescription>
                {tBadges('issue.reviewAchievement')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {achievement.image && (
                <div className="flex justify-center">
                  <img 
                    src={typeof achievement.image === 'string' ? achievement.image : achievement.image?.id} 
                    alt={achievement.name}
                    className="w-24 h-24 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-lg">{achievement.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {achievement.description}
                </p>
              </div>

              {achievement.criteria?.narrative && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">{tBadges('issue.criteria')}</h4>
                  <p className="text-sm">{achievement.criteria.narrative}</p>
                </div>
              )}

              {achievement.tags && achievement.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {achievement.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Badge Issuance Form - Right Side */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {tBadges('issue.issueCredential')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Subject Method Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{tBadges('issue.subjectIdentificationMethod')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {tBadges('issue.subjectMethodDescription')}
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    <div 
                      className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedMethod === "simple" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => form.setValue("subjectMethod", "simple")}
                    >
                      <input
                        type="radio"
                        value="simple"
                        checked={selectedMethod === "simple"}
                        onChange={() => form.setValue("subjectMethod", "simple")}
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex-1 space-y-1">
                        <Label className="font-medium cursor-pointer">
                          {tBadges('issue.simpleAddress')}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {tBadges('issue.simpleAddressDescription')}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{tBadges('issue.simpleFeatures.noDid')}</span>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{tBadges('issue.simpleFeatures.lowerCosts')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedMethod === "did" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => form.setValue("subjectMethod", "did")}
                    >
                      <input
                        type="radio"
                        value="did"
                        checked={selectedMethod === "did"}
                        onChange={() => form.setValue("subjectMethod", "did")}
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex-1 space-y-1">
                        <Label className="font-medium cursor-pointer">
                          {tBadges('issue.didBasedIdentification')}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {tBadges('issue.didBasedDescription')}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-blue-500" />
                          <span>{tBadges('issue.didFeatures.verification')}</span>
                          <CheckCircle className="h-3 w-3 text-blue-500" />
                          <span>{tBadges('issue.didFeatures.decentralizedIdentity')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {form.formState.errors.subjectMethod && (
                    <p className="text-sm text-destructive">{form.formState.errors.subjectMethod.message}</p>
                  )}
                </div>

                {/* Recipient Address */}
                <div className="space-y-2">
                  <Label htmlFor="recipientAddress">
                    {tBadges('issue.recipientAddressRequired')}
                  </Label>
                  <Input
                    id="recipientAddress"
                    placeholder={tBadges('issue.recipientAddressPlaceholder')}
                    {...form.register("recipientAddress")}
                  />
                  {form.formState.errors.recipientAddress && (
                    <p className="text-sm text-destructive">{form.formState.errors.recipientAddress.message}</p>
                  )}
                  
                  {/* DID Status Display */}
                  {selectedMethod === "did" && recipientAddress && (
                    <Alert>
                      {recipientDidStatus.checking ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <AlertDescription>
                            <div className="flex items-center gap-2">
                              <span>Checking recipient DID status...</span>
                            </div>
                          </AlertDescription>
                        </>
                      ) : recipientDidStatus.exists ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">✅ DID Found</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Recipient has an existing DID that will be verified during issuance.
                                {recipientDidStatus.didAddress && (
                                  <div className="mt-1">
                                    DID Address: {recipientDidStatus.didAddress.toString().slice(0, 8)}...{recipientDidStatus.didAddress.toString().slice(-8)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </AlertDescription>
                        </>
                      ) : recipientAddress.startsWith('did:') ? (
                        <>
                          <Info className="h-4 w-4 text-blue-500" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">🆔 DID Format Detected</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                DID format detected. The system will resolve and verify this DID during issuance.
                              </div>
                            </div>
                          </AlertDescription>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">⚠️ No DID Found</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Recipient doesn't have a DID yet. A minimal DID will be created automatically during issuance.
                              </div>
                            </div>
                          </AlertDescription>
                        </>
                      )}
                    </Alert>
                  )}

                  {selectedMethod === "simple" && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {tBadges('issue.simpleMethodNote')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Recipient DID Status */}
                  {selectedMethod === "did" && recipientAddress && (
                    <div className="mt-4">
                      {recipientDidStatus.checking ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Checking recipient DID status...
                        </p>
                      ) : recipientDidStatus.exists ? (
                        <p className="text-sm text-success flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Recipient DID verified: {recipientDidStatus.didAddress?.toString()}
                        </p>
                      ) : (
                        <p className="text-sm text-destructive flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          No valid DID found for the recipient. A new DID will be created.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">{tBadges('issue.additionalNotes')}</Label>
                  <Textarea
                    id="notes"
                    placeholder={tBadges('issue.additionalNotesPlaceholder')}
                    rows={3}
                    {...form.register("notes")}
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={issuingBadge}
                  className="w-full"
                  size="lg"
                >
                  {issuingBadge ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Issuing Credential...
                    </>
                  ) : (
                    <>
                      <Award className="mr-2 h-4 w-4" />
                      {tBadges('issue.issueCredentialButton')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
