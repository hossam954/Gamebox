import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/TopBar";
import MysteryBox from "@/components/MysteryBox";
import BetSelector from "@/components/BetSelector";
import WalletModal from "@/components/WalletModal";
import SettingsModal from "@/components/SettingsModal";
import SupportModal from "@/components/SupportModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  isAdmin: boolean;
}

export default function GamePage() {
  const [, setLocation] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [username, setUsername] = useState("");
  const [selectedBet, setSelectedBet] = useState<number | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [prize, setPrize] = useState<number | null | undefined>(undefined);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedUsername = localStorage.getItem("username");
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    
    if (!storedUserId) {
      setLocation("/login");
    } else if (isAdmin) {
      setLocation("/admin");
    } else {
      setUserId(storedUserId);
      setUsername(storedUsername || "");
    }
  }, [setLocation]);

  const handleOpenBox = () => {
    if (!selectedBet) {
      toast({
        title: "Select a bet amount",
        description: "Please choose a bet amount before opening the box",
        variant: "destructive",
      });
      return;
    }

    if (balance < selectedBet) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance for this bet",
        variant: "destructive",
      });
      return;
    }

    setBalance((prev) => prev - selectedBet);
    setIsOpening(true);
    setIsOpen(false);
    setPrize(undefined);

    setTimeout(() => {
      const random = Math.random();
      let prizeMultiplier: number | null = null;

      if (random < 0.4) {
        prizeMultiplier = null;
      } else if (random < 0.7) {
        prizeMultiplier = Math.floor(Math.random() * 10) + 1;
      } else if (random < 0.9) {
        prizeMultiplier = Math.floor(Math.random() * 100) + 10;
      } else if (random < 0.98) {
        prizeMultiplier = Math.floor(Math.random() * 1000) + 100;
      } else {
        prizeMultiplier = Math.floor(Math.random() * 4000) + 1000;
      }

      setPrize(prizeMultiplier);
      setIsOpening(false);
      setIsOpen(true);

      if (prizeMultiplier) {
        const winnings = selectedBet! * prizeMultiplier;
        setBalance((prev) => prev + winnings);
        setTransactions((prev) => [
          {
            id: Date.now().toString(),
            type: "win",
            amount: winnings,
            timestamp: "Just now",
          },
          ...prev,
        ]);
        const { dismiss } = toast({
          title: `You won ${prizeMultiplier}x!`,
          description: `+£${winnings.toLocaleString()}`,
          className: "bg-success text-success-foreground",
        });
        setTimeout(() => dismiss(), 1500);
      } else {
        setTransactions((prev) => [
          {
            id: Date.now().toString(),
            type: "loss",
            amount: selectedBet!,
            timestamp: "Just now",
          },
          ...prev,
        ]);
        const { dismiss } = toast({
          title: "Better luck next time!",
          description: `Lost £${selectedBet!.toLocaleString()}`,
          variant: "destructive",
        });
        setTimeout(() => dismiss(), 1500);
      }
    }, 3500);
  };

  const handleReset = () => {
    setIsOpen(false);
    setIsOpening(false);
    setPrize(undefined);
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setLocation("/login");
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        balance={balance}
        onWalletClick={() => setShowWalletModal(true)}
        onSupportClick={() => setShowSupportModal(true)}
        onSettingsClick={() => setShowSettingsModal(true)}
        onNotificationsClick={() => toast({ title: "Notifications", description: "No new notifications" })}
        hasNotifications={false}
      />

      <div className="flex flex-col items-center justify-center gap-8 px-4 py-12 md:min-h-[calc(100vh-4rem)]">
        <MysteryBox isOpening={isOpening} isOpen={isOpen} prize={prize} />

        <div className="w-full max-w-2xl space-y-6">
          <BetSelector
            selectedBet={selectedBet}
            onSelectBet={setSelectedBet}
            disabled={isOpening || isOpen}
          />

          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              className="px-12 text-lg font-bold"
              onClick={handleOpenBox}
              disabled={isOpening || isOpen || !selectedBet}
              data-testid="button-open-box"
            >
              {isOpening ? "Opening..." : "Open Box"}
            </Button>
            {isOpen && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleReset}
                data-testid="button-play-again"
              >
                Play Again
              </Button>
            )}
          </div>
        </div>
      </div>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        balance={balance}
        transactions={transactions}
        userId={userId}
        username={username}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        userId={userId || ""}
        username={username}
        onLogout={handleLogout}
      />

      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        userId={userId || ""}
        username={username}
      />
    </div>
  );
}
