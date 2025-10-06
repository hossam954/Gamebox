import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, Gift, Bell, Wallet, LifeBuoy, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/translations";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();

  const generateReferralCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in",
        });
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("username", data.username);
        localStorage.setItem("isAdmin", data.isAdmin ? "true" : "false");
        localStorage.setItem("user", JSON.stringify({
          id: data.userId,
          username: data.username,
          email: data.email,
          referralCode: data.referralCode
        }));
        setLocation("/");
      } else {
        toast({
          title: "Login failed",
          description: data.message || "Invalid credentials",
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
        <Card className="w-full max-w-md" data-testid="login-card">
          <CardHeader>
            <CardTitle className="font-display text-2xl">{t('login', language)}</CardTitle>
            <CardDescription>Login to continue playing and winning</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usernameOrEmail">{t('username', language)} / {t('email', language)}</Label>
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder={`${t('username', language)} / ${t('email', language)}`}
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                  autoComplete="username"
                  data-testid="input-username-email"
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
                  autoComplete="current-password"
                  data-testid="input-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  `${t('loading', language)}...`
                ) : (
                  <>
                    <LogIn className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {t('login', language)}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 space-y-2 text-center text-sm">
              <div>
                <Link href="/password-recovery" className="text-muted-foreground hover:text-primary hover:underline" data-testid="link-password-recovery">
                  {t('forgotPassword', language)}
                </Link>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-center text-sm text-muted-foreground">
              {t('dontHaveAccount', language)}{" "}
              <Link href="/register" className="text-primary hover:underline" data-testid="link-register">
                {t('signUp', language)}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}