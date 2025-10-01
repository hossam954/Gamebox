import { useState } from "react";
import { X } from "lucide-react";
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

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (usernameOrEmail: string, password: string) => void;
  onRegister: (username: string, email: string, password: string) => void;
}

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      onLogin(username, password);
    } else {
      onRegister(username, email, password);
    }
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Login to continue playing"
              : "Register to start winning"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">
              {mode === "login" ? "Username or Email" : "Username"}
            </Label>
            <Input
              id="username"
              type="text"
              placeholder={mode === "login" ? "Enter username or email" : "Choose a username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              data-testid="input-username"
            />
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="input-password"
            />
          </div>

          <Button type="submit" className="w-full" data-testid="button-submit">
            {mode === "login" ? "Login" : "Register"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                resetForm();
              }}
              data-testid="button-toggle-mode"
            >
              {mode === "login" ? "Register" : "Login"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
