import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Gift, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ResetPasswordPage() {
  const [, setLocationPath] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();
  const { language } = useLanguage();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast({
        title: language === 'ar' ? "رابط غير صالح" : "Invalid Link",
        description: language === 'ar' ? "رابط إعادة الضبط غير صالح أو مفقود" : "Reset link is invalid or missing",
        variant: "destructive",
      });
      setLocationPath("/login");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "كلمتا المرور غير متطابقتين" : "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: language === 'ar' ? "تم بنجاح ✅" : "Success ✅",
          description: language === 'ar' ? "تم تغيير كلمة المرور بنجاح" : "Password has been reset successfully",
        });
        setTimeout(() => {
          setLocationPath("/login");
        }, 2000);
      } else {
        toast({
          title: language === 'ar' ? "فشلت العملية" : "Failed",
          description: data.message || (language === 'ar' ? "حدث خطأ" : "An error occurred"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "حدث خطأ. حاول مرة أخرى" : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Gift className="h-8 w-8" />
        </div>
        <span className="font-display text-3xl font-bold">Mystery Box</span>
      </div>

      <Card className="w-full max-w-md" data-testid="reset-password-card">
        <CardHeader>
          <CardTitle className="font-display text-2xl flex items-center gap-2">
            <KeyRound className="h-6 w-6" />
            {language === 'ar' ? 'إعادة ضبط كلمة المرور' : 'Reset Password'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'أدخل كلمة المرور الجديدة' 
              : 'Enter your new password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder={language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                data-testid="input-confirm-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="button-reset-password"
            >
              {isLoading 
                ? (language === 'ar' ? 'جاري التحديث...' : 'Resetting...') 
                : (language === 'ar' ? 'تحديث كلمة المرور' : 'Reset Password')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
