import { useState } from "react";
import { Link, useLocation } from "wouter";
import { KeyRound, Gift, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function PasswordRecoveryPage() {
  const [, setLocation] = useLocation();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/password-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast({
          title: "Request submitted",
          description: "Admin will review your request and contact you via email",
        });
      } else {
        toast({
          title: "Submission failed",
          description: data.message || "Could not submit request",
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

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Gift className="h-8 w-8" />
          </div>
          <span className="font-display text-3xl font-bold">Mystery Box</span>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-display text-2xl text-success">Request Submitted</CardTitle>
            <CardDescription>Your password recovery request has been sent to admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              An admin will review your request and contact you via email to help you recover your password.
              Please check your email regularly for updates.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setLocation("/login")} className="flex-1" data-testid="button-go-login">
                Go to Login
              </Button>
              <Button onClick={() => setSubmitted(false)} variant="outline" className="flex-1">
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Gift className="h-8 w-8" />
        </div>
        <span className="font-display text-3xl font-bold">Mystery Box</span>
      </div>

      <Card className="w-full max-w-md" data-testid="password-recovery-card">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Password Recovery</CardTitle>
          <CardDescription>Submit a request to admin for password recovery assistance</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail">Username or Email</Label>
              <Input
                id="usernameOrEmail"
                type="text"
                placeholder="Enter your username or email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                data-testid="input-username-email"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? (
                "Submitting..."
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Submit Recovery Request
                </>
              )}
            </Button>

            <div className="text-center">
              <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary hover:underline" data-testid="link-back-login">
                <ArrowLeft className="h-3 w-3" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
