import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ProfileInitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; url?: string; email?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function ProfileInitDialog({ open, onOpenChange, onSubmit, isLoading }: ProfileInitDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    // Clean and validate inputs - only send non-empty, non-placeholder values
    const cleanUrl = url.trim();
    const cleanEmail = email.trim();
    
    // Don't send placeholder values or empty strings
    const validUrl = (cleanUrl && 
                     cleanUrl !== "https://yourwebsite.com" && 
                     cleanUrl !== "https://your-website.com") ? cleanUrl : undefined;
    const validEmail = (cleanEmail && 
                       cleanEmail !== "contact@yourorganization.com" &&
                       cleanEmail !== "contact@your-organization.com") ? cleanEmail : undefined;

    await onSubmit({
      name: name.trim(),
      url: validUrl,
      email: validEmail,
    });

    // Reset form
    setName("");
    setUrl("");
    setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Initialize Issuer Profile</DialogTitle>
          <DialogDescription>
            Before creating achievements, you need to set up your issuer profile on the blockchain.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your organization or name"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@yourorganization.com"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initialize Profile
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
