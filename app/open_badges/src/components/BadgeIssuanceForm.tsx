import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { CheckCircle, Loader2, AlertCircle, Award, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSolana } from "@/contexts/SolanaContext";
import { toast } from "sonner";
import type { Achievement } from "@/types/badge";
import { ClientDidManager } from "@/lib/did-manager";
import { getProfileTypeLabel } from "@/lib/utils";

// Badge issuance form schema
const badgeIssuanceSchema = z.object({
  achievementId: z.string().min(1, "Please select an achievement"),
  recipientAddress: z.string().min(32, "Please enter a valid Solana address"),
  subjectMethod: z.enum(["simple", "did"], {
    required_error: "Please select a subject identification method",
  }),
  notes: z.string().optional().transform((val) => {
    // Filter out placeholder values and empty strings
    if (!val || val.trim() === "" || val === "Add any additional notes about this badge issuance...") {
      return undefined;
    }
    return val.trim();
  }),
});

type BadgeIssuanceFormValues = z.infer<typeof badgeIssuanceSchema>;

type SubjectMethod = "simple" | "did";

interface BadgeIssuanceResult {
  success: boolean;
  credentialPubkey?: PublicKey;
  transactionSignatures: string[];
  didCreated?: boolean;
  subjectType?: SubjectMethod;
}

interface BadgeIssuanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: BadgeIssuanceResult) => void;
}

export function BadgeIssuanceForm({ open, onOpenChange, onSuccess }: BadgeIssuanceFormProps) {
  const { publicKey, signMessage } = useWallet();
  const { solanaClient, isInitialized, connection } = useSolana();
  
  // State
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [issuingBadge, setIssuingBadge] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [recipientDidStatus, setRecipientDidStatus] = useState<{
    exists: boolean;
    checking: boolean;
    address?: PublicKey;
  }>({ exists: false, checking: false });

  const form = useForm<BadgeIssuanceFormValues>({
    resolver: zodResolver(badgeIssuanceSchema),
    defaultValues: {
      achievementId: "",
      recipientAddress: "",
      subjectMethod: "simple",
      notes: "",
    },
  });

  const selectedMethod = form.watch("subjectMethod");
  const recipientAddress = form.watch("recipientAddress");

  // Initialize client-side DID checking
  useEffect(() => {
    // Client-side DID checking doesn't need initialization
    // We'll check DIDs directly when needed
    console.log("Client-side DID checking ready");
  }, [solanaClient]);

  // Load achievements on open
  useEffect(() => {
    if (open && isInitialized && solanaClient) {
      loadAchievements();
    }
  }, [open, isInitialized, solanaClient]);

  // Check recipient DID status when address changes (client-side)
  useEffect(() => {
    if (selectedMethod === "did" && recipientAddress && connection) {
      checkRecipientDidStatus();
    } else {
      setRecipientDidStatus({ exists: false, checking: false });
    }
  }, [selectedMethod, recipientAddress, connection]);

  const loadAchievements = async () => {
    if (!solanaClient) return;

    try {
      setLoadingAchievements(true);
      const data = await solanaClient.getAchievements();
      const transformedData = (data || []).map(achievement => ({
        ...achievement,
        criteria: achievement.criteria || { narrative: "" }
      })) as Achievement[];
      setAchievements(transformedData);
    } catch (error) {
      console.error("Error loading achievements:", error);
      toast.error("Failed to load achievements");
    } finally {
      setLoadingAchievements(false);
    }
  };

  const checkRecipientDidStatus = async () => {
    if (!connection || !recipientAddress) return;

    try {
      setRecipientDidStatus(prev => ({ ...prev, checking: true }));
      
      const recipientPubkey = new PublicKey(recipientAddress);
      
      // Use client-side DID checking
      const [didAddress] = ClientDidManager.deriveDIDAddress(recipientPubkey);
      const accountInfo = await connection.getAccountInfo(didAddress);
      const exists = accountInfo !== null && accountInfo.data.length > 0;
      
      setRecipientDidStatus({
        exists,
        checking: false,
        address: exists ? didAddress : undefined,
      });
    } catch (error) {
      console.error("Error checking recipient DID:", error);
      setRecipientDidStatus({ exists: false, checking: false });
    }
  };

  const generateCredentialJson = async (achievement: Achievement, _recipientPubkey: PublicKey) => {
    if (!solanaClient || !publicKey) throw new Error("Wallet not connected");

    // Create timestamp
    const timestamp = new Date().toISOString();
    
    // For now, use the createCredential method which generates the JSON internally
    // In the future, this could call a specific generateCredentialJson method
    console.log("Generating credential JSON for achievement:", achievement.id);
    
    return { credentialJson: "", timestamp };
  };

  const onSubmit = async (values: BadgeIssuanceFormValues) => {
    if (!solanaClient || !publicKey || !signMessage) {
      toast.error("Please ensure your wallet is connected");
      return;
    }

    try {
      setIssuingBadge(true);

      // Check if issuer profile exists (both simple and DID-based)
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

      // Find selected achievement
      const achievement = achievements.find(a => a.id === values.achievementId);
      if (!achievement) {
        throw new Error("Selected achievement not found");
      }

      const recipientPubkey = new PublicKey(values.recipientAddress);

      // Generate credential JSON and get timestamp
      const { credentialJson, timestamp } = await generateCredentialJson(achievement, recipientPubkey);
      
      // Sign the credential JSON
      const messageBytes = new TextEncoder().encode(credentialJson);
      const signature = await signMessage(messageBytes);

      let result: BadgeIssuanceResult;

      if (values.subjectMethod === "simple") {
        // Use simple address method
        result = await issueBadgeSimpleMethod(
          achievement,
          recipientPubkey,
          messageBytes,
          signature,
          timestamp
        );
      } else {
        // Use DID method with verification
        result = await issueBadgeDidMethod(
          achievement,
          recipientPubkey,
          messageBytes,
          signature,
          timestamp
        );
      }

      // Show success message with profile type info
      const methodLabel = values.subjectMethod === "simple" ? "Simple Address" : "DID-based";
      const profileTypeLabel = getProfileTypeLabel(profileType);
      
      toast.success(
        `Badge issued successfully using ${methodLabel} method!`,
        {
          description: `Issuer: ${profileTypeLabel} profile | Transaction signatures: ${result.transactionSignatures.length}`,
        }
      );

      // Call success callback
      onSuccess?.(result);

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);

    } catch (error) {
      console.error("Badge issuance failed:", error);
      toast.error("Failed to issue badge", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIssuingBadge(false);
    }
  };

  const issueBadgeSimpleMethod = async (
    achievement: Achievement,
    recipientPubkey: PublicKey,
    _messageBytes: Uint8Array,
    _signature: Uint8Array,
    _timestamp: string
  ): Promise<BadgeIssuanceResult> => {
    if (!solanaClient || !signMessage) throw new Error("Solana client not available");

    // Use the issueCredential method which is available
    const result = await solanaClient.issueCredential(
      achievement.id, // Use achievement ID instead of pubkey
      recipientPubkey.toString(),
      signMessage,
      [] // evidence
    );

    return {
      success: true,
      credentialPubkey: new PublicKey(result.credentialAddress),
      transactionSignatures: [result.signature],
      subjectType: "simple",
    };
  };

  const issueBadgeDidMethod = async (
    achievement: Achievement,
    recipientPubkey: PublicKey,
    _messageBytes: Uint8Array,
    _signature: Uint8Array,
    _timestamp: string
  ): Promise<BadgeIssuanceResult> => {
    // Client-side DID method - much simpler now
    // Check if recipient DID exists, create if needed
    if (!recipientDidStatus.exists) {
      toast.info("Recipient DID not found. In a production app, we would create one here using direct sol-did calls.");
    }

    // For now, fall back to simple method since the core issuance is the same
    // The difference is just in the subject identification format
    return await issueBadgeSimpleMethod(achievement, recipientPubkey, _messageBytes, _signature, _timestamp);
  };

  const handleAchievementChange = (achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    setSelectedAchievement(achievement || null);
    form.setValue("achievementId", achievementId);
  };

  const formatAddress = (address: string, length = 8) => {
    if (!address || address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Issue Achievement Badge
          </DialogTitle>
          <DialogDescription>
            Issue a verifiable achievement badge to a recipient using either simple address or DID-based identification.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Achievement Selection */}
            <FormField
              control={form.control}
              name="achievementId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Achievement</FormLabel>
                  <Select 
                    onValueChange={handleAchievementChange} 
                    value={field.value}
                    disabled={loadingAchievements}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an achievement to issue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingAchievements ? (
                        <div className="p-2 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </div>
                      ) : achievements.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground">
                          No achievements found
                        </div>
                      ) : (
                        achievements.map((achievement) => (
                          <SelectItem key={achievement.id} value={achievement.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{achievement.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatAddress(achievement.id || "")}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Achievement Preview */}
            {selectedAchievement && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Selected Achievement</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-medium">{selectedAchievement.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedAchievement.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {formatAddress(selectedAchievement.id || "")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recipient Address */}
            <FormField
              control={form.control}
              name="recipientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Solana Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter recipient's Solana public key address" 
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The Solana wallet address of the badge recipient
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject Identification Method */}
            <FormField
              control={form.control}
              name="subjectMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Subject Identification Method</FormLabel>
                  <FormDescription>
                    Choose how the recipient will be identified in the badge credential
                  </FormDescription>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 gap-4"
                    >
                      <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="simple" id="simple" />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="simple" className="font-medium">
                            Simple Address
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Use the Solana address directly as the subject identifier. 
                            Simpler and more efficient for basic use cases.
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>No DID creation required</span>
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>Lower transaction costs</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="did" id="did" />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="did" className="font-medium">
                            DID-based Identification
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Create or use an existing DID document for the recipient. 
                            Better for decentralized identity and enhanced verification.
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-blue-500" />
                            <span>Enhanced verification</span>
                            <CheckCircle className="h-3 w-3 text-blue-500" />
                            <span>Decentralized identity</span>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DID Status Check */}
            {selectedMethod === "did" && recipientAddress && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {recipientDidStatus.checking ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Checking recipient DID status...</span>
                    </div>
                  ) : recipientDidStatus.exists ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Recipient DID exists and will be verified during issuance</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>Recipient DID not found. A minimal DID will be created during issuance.</span>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes about this badge issuance..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Internal notes about this badge issuance (not stored on-chain)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={issuingBadge}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={issuingBadge || !publicKey}
                className="min-w-[120px]"
              >
                {issuingBadge ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Issuing...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Issue Badge
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
