import { useState } from "react";
import { Link, useLocation } from "wouter";
import { UserPlus, Gift, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/translations";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const urlParams = new URLSearchParams(window.location.search);
  const [referralCode, setReferralCode] = useState(urlParams.get("ref") || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t('error', language),
        description: t('passwordsDoNotMatch', language),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t('error', language),
        description: language === 'ar' ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, referredBy: referralCode || undefined, language }),
      });

      const data = await response.json();

      if (response.ok) {
        const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
        const newNotification = {
          id: Date.now().toString(),
          title: `أهلاً بك ${username}`,
          message: `بريدك الإلكتروني: ${email}\nتاريخ ووقت الانضمام: ${new Date().toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}\n\nحظاً موفقاً 🍀 Good Luck`,
          createdAt: new Date().toISOString(),
          read: false,
        };
        notifications.unshift(newNotification);
        localStorage.setItem("notifications", JSON.stringify(notifications));
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("username", username);
        localStorage.setItem("user", JSON.stringify({ 
          id: data.userId, 
          username: username,
          email: email,
          referralCode: data.referralCode 
        }));
        setLocation("/");
      } else {
        toast({
          title: "Registration failed",
          description: data.message || "Could not create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      <header className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Gift className="h-8 w-8" />
          </div>
          <span className="font-display text-3xl font-bold">Mystery Box</span>
        </div>
        <div className="flex items-center gap-4">
          <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
            <SelectTrigger className="w-[140px]" data-testid="select-language">
              <Languages className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center">
        <Card className="w-full max-w-md" data-testid="register-card">
          <CardHeader>
            <CardTitle className="font-display text-2xl">{t('register', language)}</CardTitle>
            <CardDescription>Register to start playing and winning prizes</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t('username', language)}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={t('username', language)}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('email', language)}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('email', language)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password', language)}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('password', language)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword', language)}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('confirmPassword', language)}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  data-testid="input-confirm-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralCode">{t('referralCode', language)}</Label>
                <Input
                  id="referralCode"
                  type="text"
                  placeholder={t('referralCodePlaceholder', language)}
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  data-testid="input-referral-code"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-register"
              >
                {isLoading ? (
                  `${t('loading', language)}...`
                ) : (
                  <>
                    <UserPlus className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {t('register', language)}
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center text-sm border-t pt-4">
              <span className="text-muted-foreground">{t('alreadyHaveAccount', language)} </span>
              <Link href="/login" className="font-medium text-primary hover:underline" data-testid="link-login">
                {t('signIn', language)}
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
