
import { useState } from "react";
import { Settings, Key, Gift, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  onLogout: () => void;
  isAdmin?: boolean;
  onAdminClick?: () => void;
  referralCode?: string;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  userId, 
  username, 
  onLogout,
  isAdmin = false,
  onAdminClick,
  referralCode
}: SettingsModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "Password changed",
          description: "Your password has been updated successfully",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await response.json();
        toast({
          title: "Password change failed",
          description: data.message || "Could not change password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoCodeRedeem = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Enter promo code",
        description: "Please enter a valid promo code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/promo-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          code: promoCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Promo code redeemed!",
          description: `You received ${data.reward}`,
        });
        setPromoCode("");
        // Refresh page to update balance
        window.location.reload();
      } else {
        toast({
          title: "Invalid promo code",
          description: data.message || "Could not redeem promo code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" data-testid="settings-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Settings className="h-6 w-6" />
            Settings
          </DialogTitle>
          <DialogDescription>Manage your account settings and preferences</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account" data-testid="tab-account">Account</TabsTrigger>
            <TabsTrigger value="referral" data-testid="tab-referral">Referral's</TabsTrigger>
            <TabsTrigger value="promo" data-testid="tab-promo">Promo Codes</TabsTrigger>
            <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-2">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Username:</span> {username}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Change Password
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    data-testid="input-current-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    data-testid="input-new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-confirm-password"
                  />
                </div>

                <Button 
                  onClick={handlePasswordChange} 
                  disabled={isLoading}
                  data-testid="button-change-password"
                >
                  {isLoading ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="referral" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Gift className="h-4 w-4" />
                رمز الدعوة
              </h3>
              
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="referral-code">رمز الدعوة الخاص بك</Label>
                  <div className="flex gap-2">
                    <Input
                      id="referral-code"
                      type="text"
                      value={referralCode || ""}
                      readOnly
                      className="font-mono"
                      data-testid="input-referral-code-display"
                    />
                    <Button
                      onClick={() => {
                        if (referralCode) {
                          navigator.clipboard.writeText(referralCode);
                          toast({
                            title: "تم النسخ",
                            description: "تم نسخ رمز الدعوة بنجاح",
                          });
                        }
                      }}
                      data-testid="button-copy-referral-code"
                    >
                      نسخ
                    </Button>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💜 احصل على 5% من كل عملية شحن يقوم بها المستخدمون الذين يسجلون باستخدام رمز الدعوة الخاص بك!
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="promo" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Redeem Promo Code
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="promo-code">Promo Code</Label>
                <Input
                  id="promo-code"
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  data-testid="input-promo-code"
                />
              </div>

              <Button 
                onClick={handlePromoCodeRedeem} 
                disabled={isLoading}
                className="w-full"
                data-testid="button-redeem-promo"
              >
                {isLoading ? "Redeeming..." : "Redeem Promo Code"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Account Actions</h3>
              
              {isAdmin && onAdminClick && (
                <Button 
                  onClick={onAdminClick}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                  data-testid="button-admin-panel"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  لوحة التحكم
                </Button>
              )}
              
              <Button 
                variant="destructive" 
                onClick={onLogout}
                className="w-full"
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
