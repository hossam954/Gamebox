
import { useState, useEffect } from "react";
import { Settings, Key, Gift, Shield, Languages as LanguagesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/translations";

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
  const [referralCount, setReferralCount] = useState<number>(0);
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    if (isOpen && referralCode) {
      const fetchReferralCount = async () => {
        try {
          const response = await fetch(`/api/referrals/${referralCode}/count`);
          if (response.ok) {
            const data = await response.json();
            setReferralCount(data.count);
          }
        } catch (error) {
          console.error("Error fetching referral count:", error);
        }
      };
      fetchReferralCount();
    }
  }, [isOpen, referralCode]);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: t('error', language),
        description: t('passwordsDoNotMatch', language),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('error', language),
        description: language === 'ar' ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters long",
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
          title: t('success', language),
          description: t('passwordChanged', language),
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await response.json();
        toast({
          title: t('error', language),
          description: data.message || t('invalidCurrentPassword', language),
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
          title: t('success', language),
          description: t('promoRedeemed', language),
        });
        setPromoCode("");
        window.location.reload();
      } else {
        toast({
          title: t('error', language),
          description: t('invalidPromo', language),
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
            {t('settings', language)}
          </DialogTitle>
          <DialogDescription>Manage your account settings and preferences</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account" data-testid="tab-account">{t('accountSettings', language)}</TabsTrigger>
            <TabsTrigger value="referral" data-testid="tab-referral">{t('referralProgram', language)}</TabsTrigger>
            <TabsTrigger value="promo" data-testid="tab-promo">{t('promoCode', language)}</TabsTrigger>
            <TabsTrigger value="general" data-testid="tab-general">{t('language', language)}</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-2">{t('accountSettings', language)}</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">{t('username', language)}:</span> {username}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  {t('changePassword', language)}
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="current-password">{t('currentPassword', language)}</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder={t('currentPassword', language)}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    data-testid="input-current-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">{t('newPassword', language)}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder={t('newPassword', language)}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    data-testid="input-new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('confirmNewPassword', language)}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder={t('confirmNewPassword', language)}
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
                  {isLoading ? t('changing', language) : t('changePasswordBtn', language)}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="referral" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Gift className="h-4 w-4" />
                {t('referralProgram', language)}
              </h3>
              
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="referral-code">{t('yourReferralCode', language)}</Label>
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
                            title: t('copied', language),
                            description: t('referralCodeCopied', language),
                          });
                        }
                      }}
                      data-testid="button-copy-referral-code"
                    >
                      {t('copy', language)}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid="text-referral-count">
                    {t('referralsCount', language)}: {referralCount}
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    {t('referralMessage', language)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="promo" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Gift className="h-4 w-4" />
                {t('redeemPromoCode', language)}
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="promo-code">{t('promoCode', language)}</Label>
                <Input
                  id="promo-code"
                  type="text"
                  placeholder={t('promoCodePlaceholder', language)}
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
                {isLoading ? t('redeeming', language) : t('redeemBtn', language)}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <LanguagesIcon className="h-4 w-4" />
                  {t('language', language)}
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="language-select">{t('selectLanguage', language)}</Label>
                  <Select 
                    value={language} 
                    onValueChange={async (value: any) => {
                      setLanguage(value);
                      try {
                        await fetch("/api/users/language", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId, language: value }),
                        });
                      } catch (error) {
                        console.error("Error saving language:", error);
                      }
                    }}
                  >
                    <SelectTrigger id="language-select" data-testid="select-language-settings">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                {isAdmin && onAdminClick && (
                  <Button 
                    onClick={onAdminClick}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                    data-testid="button-admin-panel"
                  >
                    <Shield className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {language === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  onClick={onLogout}
                  className="w-full"
                  data-testid="button-logout"
                >
                  {t('logout', language)}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
