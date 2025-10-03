import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/TopBar";
import MysteryBox from "@/components/MysteryBox";
import BetSelector from "@/components/BetSelector";
import WalletModal from "@/components/WalletModal";
import SettingsModal from "@/components/SettingsModal";
import SupportModal from "@/components/SupportModal";
import NotificationsModal from "@/components/NotificationsModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  isAdmin: boolean;
  referralCode?: string; // Added for referral code
}

export default function GamePage() {
  const [, setLocation] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // State to hold user data including referral code
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedBet, setSelectedBet] = useState<number | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [prize, setPrize] = useState<number | null | undefined>(undefined);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedUsername = localStorage.getItem("username");
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    const storedNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    const storedUser = localStorage.getItem("user"); // Retrieve user data from local storage

    if (!storedUserId) {
      setLocation("/login");
    } else {
      setUserId(storedUserId);
      setUsername(storedUsername || "");
      setIsAdmin(adminStatus);
      setNotifications(storedNotifications);
      if (storedUser) {
        setUser(JSON.parse(storedUser)); // Set user state
      }

      // Check for referral code in URL params on initial load
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref');
      if (referralCode) {
        localStorage.setItem('referredBy', referralCode); // Store referral code for later use
        // Optionally, show a welcome message or redirect to registration with code pre-filled
      }
    }
  }, [setLocation]);

  // Function to send notification
  const sendNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    const newNotification = {
      id: Date.now().toString(),
      message,
      read: false,
      timestamp: new Date().toISOString(),
      type,
    };
    setNotifications((prev) => {
      const updatedNotifications = [newNotification, ...prev];
      localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
      return updatedNotifications;
    });
    toast({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: message,
      variant: type === "error" ? "destructive" : "default",
    });
  };

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

        // Referral bonus logic for the referrer
        const referredBy = localStorage.getItem('referredBy');
        if (referredBy && user?.id) {
          // Here you would typically call an API to get the referrer's username and update their balance
          // For now, we'll simulate getting the referrer's username and sending a notification
          const referrerUsername = "Friend"; // Replace with actual fetched username
          const bonusAmount = winnings * 0.05;
          if (bonusAmount > 0) {
            sendNotification(`You have earned £${bonusAmount.toLocaleString()} from your friend ${referrerUsername}'s win!`, "success");
            // Update referrer's balance via API call
          }
          localStorage.removeItem('referredBy'); // Clear after processing
        }

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
    localStorage.removeItem("user"); // Clear user data
    localStorage.removeItem("referredBy"); // Clear referral code
    setLocation("/login");
  };

  const handleAdminClick = () => {
    setLocation("/admin");
  };

  const handleMarkAsRead = (id: string) => {
    const updatedNotifications = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem("notifications", JSON.stringify([]));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
        onNotificationsClick={() => setShowNotificationsModal(true)}
        hasNotifications={unreadCount > 0}
        isAdmin={isAdmin}
        onAdminClick={handleAdminClick}
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
        isAdmin={isAdmin}
        onAdminClick={handleAdminClick}
        referralCode={user?.referralCode} // Pass referral code to SettingsModal
      />

      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        userId={userId || ""}
        username={username}
      />

      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearAllNotifications}
      />
    </div>
  );
}