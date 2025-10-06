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

// Function to generate a unique 8-character referral code
function generateReferralCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
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

  const loadUserBalance = async (userId: string) => {
    try {
      const response = await fetch(`/api/users`);
      if (response.ok) {
        const users = await response.json();
        const currentUser = users.find((u: any) => u.id === userId);
        
        // إذا لم يتم العثور على المستخدم، فهذا يعني أنه تم حذف حسابه
        if (!currentUser) {
          localStorage.clear();
          toast({
            title: "تم حذف حسابك",
            description: "تم حذف حسابك من قبل المسؤول. سيتم تسجيل خروجك الآن.",
            variant: "destructive",
          });
          setTimeout(() => {
            setLocation("/login");
          }, 2000);
          return;
        }
        
        if (currentUser.balance !== balance) {
          setBalance(currentUser.balance);
        }
      }
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  };

  const loadNotifications = async (userId: string) => {
    try {
      const response = await fetch(`/api/notifications/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const normalizedData = data.map((n: any) => ({
          ...n,
          createdAt: n.createdAt || n.timestamp || new Date().toISOString(),
          title: n.title || 'Notification',
          read: n.read !== undefined ? n.read : false,
        }));
        if (JSON.stringify(normalizedData) !== JSON.stringify(notifications)) {
          setNotifications(normalizedData);
        }
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedUsername = localStorage.getItem("username");
    const storedIsAdmin = localStorage.getItem("isAdmin") === "true";

    if (!storedUserId || !storedUsername) {
      setLocation("/login");
      return;
    }

    setUserId(storedUserId);
    setUsername(storedUsername);
    setIsAdmin(storedIsAdmin);

    // Fetch user data from server to get referral code
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users`);
        if (response.ok) {
          const users = await response.json();
          const currentUser = users.find((u: any) => u.id === storedUserId);
          if (currentUser) {
            const userData = {
              id: currentUser.id,
              username: currentUser.username,
              email: currentUser.email,
              balance: currentUser.balance,
              isAdmin: currentUser.isAdmin,
              referralCode: currentUser.referralCode || ""
            };
            setUser(userData);
            setBalance(currentUser.balance);
            localStorage.setItem("user", JSON.stringify(userData));
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
    loadNotifications(storedUserId);

    // Auto-refresh notifications only every 10 seconds
    const refreshInterval = setInterval(() => {
      loadNotifications(storedUserId);
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [setLocation]);

  // Refresh user data when settings modal opens
  useEffect(() => {
    if (showSettingsModal && userId) {
      const refreshUserData = async () => {
        try {
          const response = await fetch(`/api/users`);
          if (response.ok) {
            const users = await response.json();
            const currentUser = users.find((u: any) => u.id === userId);
            if (currentUser) {
              const userData = {
                id: currentUser.id,
                username: currentUser.username,
                email: currentUser.email,
                balance: currentUser.balance,
                isAdmin: currentUser.isAdmin,
                referralCode: currentUser.referralCode || ""
              };
              setUser(userData);
              localStorage.setItem("user", JSON.stringify(userData));
            }
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      };
      refreshUserData();
    }
  }, [showSettingsModal, userId]);

  // Function to send notification
  const sendNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    toast({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: message,
      variant: type === "error" ? "destructive" : "default",
    });
  };

  const handleOpenBox = async () => {
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

    setIsOpening(true);
    setIsOpen(false);
    setPrize(undefined);

    // الحصول على نسبة الربح من الإعدادات
    let winRate = 50; // القيمة الافتراضية
    try {
      const response = await fetch('/api/win-rate');
      if (response.ok) {
        const data = await response.json();
        winRate = data.winRate;
      }
    } catch (error) {
      console.error('Error fetching win rate:', error);
    }

    setTimeout(() => {
      const random = Math.random() * 100;
      let prizeMultiplier: number | null = null;

      // خوارزمية الربح بناءً على نسبة الربح (0-100)
      const lossThreshold = 100 - winRate; // نسبة الخسارة
      
      if (random < lossThreshold) {
        // خسارة
        prizeMultiplier = null;
      } else {
        // فوز - توزيع الأرباح بشكل واقعي
        const winRandom = Math.random() * 100;
        
        if (winRandom < 70) {
          // ربح صغير (1x - 3x) - 70% من الفوزات
          prizeMultiplier = Math.floor(Math.random() * 3) + 1;
        } else if (winRandom < 90) {
          // ربح متوسط (3x - 10x) - 20% من الفوزات
          prizeMultiplier = Math.floor(Math.random() * 8) + 3;
        } else if (winRandom < 98) {
          // ربح كبير (10x - 50x) - 8% من الفوزات
          prizeMultiplier = Math.floor(Math.random() * 41) + 10;
        } else {
          // ربح ضخم (50x - 100x) - 2% من الفوزات
          prizeMultiplier = Math.floor(Math.random() * 51) + 50;
        }
      }

      setPrize(prizeMultiplier);
      setIsOpening(false);
      setIsOpen(true);

      if (prizeMultiplier) {
        const winnings = selectedBet! * prizeMultiplier;
        const newBalance = balance - selectedBet! + winnings;
        setBalance(newBalance);
        
        // حفظ النتيجة في السيرفر
        if (userId) {
          fetch(`/api/users/${userId}/game-result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance: newBalance, won: true })
          }).catch(err => console.error('Failed to save game result:', err));
        }
        
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
          const referrerUsername = "Friend";
          const bonusAmount = winnings * 0.05;
          if (bonusAmount > 0) {
            sendNotification(`You have earned £${bonusAmount.toLocaleString()} from your friend ${referrerUsername}'s win!`, "success");
          }
          localStorage.removeItem('referredBy');
        }

      } else {
        const newBalance = balance - selectedBet!;
        setBalance(newBalance);
        
        // حفظ النتيجة في السيرفر
        if (userId) {
          fetch(`/api/users/${userId}/game-result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance: newBalance, won: false })
          }).catch(err => console.error('Failed to save game result:', err));
        }
        
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
    localStorage.removeItem("balance"); // Clear balance
    localStorage.removeItem("notifications"); // Clear notifications
    setLocation("/login");
  };

  const handleAdminClick = () => {
    setLocation("/admin");
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        const updatedNotifications = notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        setNotifications(updatedNotifications);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/notifications/${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
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