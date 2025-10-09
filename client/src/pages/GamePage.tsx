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
import { soundManager } from "@/lib/sounds";

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
  const [lastBet, setLastBet] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<'win' | 'loss' | null>(null);
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

        // Check if there are new unread notifications
        const previousUnreadCount = notifications.filter(n => !n.read).length;
        const currentUnreadCount = normalizedData.filter((n: any) => !n.read).length;

        if (currentUnreadCount > previousUnreadCount) {
          // Play notification sound for new notifications
          soundManager.playNotification();
        }

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

    // Start background music
    soundManager.playBackgroundMusic();

    // Auto-refresh notifications only every 10 seconds
    const refreshInterval = setInterval(() => {
      loadNotifications(storedUserId);
    }, 10000);

    return () => {
      clearInterval(refreshInterval);
      soundManager.stopBackgroundMusic();
    };
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

    // Play opening sound
    soundManager.playOpening();

    setIsOpening(true);
    setIsOpen(false);
    setPrize(undefined);

    // الحصول على إعدادات اللعبة المتقدمة من السيرفر
    let gameSettings: any = {
      baseWinRate: 50,
      targetLossRate: 70,
      maxMultiplier: 50,
      strategy: "balanced",
      phase1Rounds: 10,
      phase2Rounds: 20,
      multiplier2to5Chance: 40,
      multiplier5to10Chance: 30,
      multiplier10to25Chance: 20,
      multiplier25to50Chance: 8,
      multiplier50PlusChance: 2,
      highBetThreshold: 5000,
      highBetMaxMultiplier: 20,
    };

    // الحصول على إحصائيات اللاعب الحالية
    let playerStats: any = {
      sessionBetsCount: 0,
      lifetimeProfit: 0,
      currentStreak: 0,
      sessionStartBalance: balance,
    };

    try {
      const [settingsRes, userRes] = await Promise.all([
        fetch('/api/game-settings'),
        userId ? fetch(`/api/users`).then(r => r.json()).then(users => users.find((u: any) => u.id === userId)) : null
      ]);

      if (settingsRes.ok) {
        gameSettings = await settingsRes.json();
      }

      if (userRes) {
        playerStats = {
          sessionBetsCount: userRes.sessionBetsCount || 0,
          lifetimeProfit: userRes.lifetimeProfit || 0,
          currentStreak: userRes.currentStreak || 0,
          sessionStartBalance: userRes.sessionStartBalance || balance,
          totalBetsCount: userRes.totalBetsCount || 0,
        };
      }
    } catch (error) {
      console.error('Error fetching game settings:', error);
    }

    setTimeout(() => {
      const random = Math.random() * 100;
      let prizeMultiplier: number | null = null;

      // ============================================
      // خوارزمية ذكية متطورة - نظام المراحل الثلاث
      // ============================================

      const betsCount = playerStats.sessionBetsCount;
      const sessionProfit = balance - playerStats.sessionStartBalance;

      // تحديد المرحلة الحالية
      let currentPhase: 'hook' | 'oscillate' | 'drain';
      if (betsCount < gameSettings.phase1Rounds) {
        currentPhase = 'hook'; // المرحلة 1: التعليق
      } else if (betsCount < (gameSettings.phase1Rounds + gameSettings.phase2Rounds)) {
        currentPhase = 'oscillate'; // المرحلة 2: التذبذب
      } else {
        currentPhase = 'drain'; // المرحلة 3: الخسارة التدريجية
      }

      // حساب نسبة الربح الديناميكية بناءً على المرحلة
      let adjustedWinRate = gameSettings.baseWinRate;
      let dynamicMaxMultiplier = gameSettings.maxMultiplier;

      // تحديد الحد الأقصى الديناميكي بناءً على قيمة الرهان
      if (selectedBet! >= gameSettings.highBetThreshold) {
        dynamicMaxMultiplier = Math.min(dynamicMaxMultiplier, gameSettings.highBetMaxMultiplier);
      }

      // تطبيق منطق المراحل
      if (currentPhase === 'hook') {
        // المرحلة 1: إعطاء أرباح جيدة لتعليق اللاعب
        adjustedWinRate = gameSettings.baseWinRate + 15; // زيادة 15% فرصة الربح
        // تفضيل المضاعفات المتوسطة (x3-x10)
      } else if (currentPhase === 'oscillate') {
        // المرحلة 2: التذبذب - إذا ربح كثيراً، خفض الفرصة
        const profitRatio = sessionProfit / (playerStats.sessionStartBalance || 1000);

        if (profitRatio > 0.5) {
          // إذا ربح أكثر من 50% من رصيده الأولي، خفض الفرصة
          adjustedWinRate = gameSettings.baseWinRate * 0.6;
        } else if (profitRatio < -0.3) {
          // إذا خسر أكثر من 30%، أعطه فرصة أفضل ليستمر
          adjustedWinRate = gameSettings.baseWinRate + 10;
        } else {
          // تذبذب عادي
          adjustedWinRate = gameSettings.baseWinRate;
        }

        // إذا في سلسلة انتصارات، قلل الفرص
        if (playerStats.currentStreak >= 3) {
          adjustedWinRate *= 0.7;
        }
      } else {
        // المرحلة 3: الخسارة التدريجية
        const drainProgress = (betsCount - (gameSettings.phase1Rounds + gameSettings.phase2Rounds)) / 20;
        adjustedWinRate = gameSettings.baseWinRate * (1 - (drainProgress * 0.4)); // تقليل تدريجي

        // إذا ربح كثيراً، خسره بقوة
        if (sessionProfit > playerStats.sessionStartBalance * 0.3) {
          adjustedWinRate *= 0.5;
        }
      }

      // تطبيق ميزة الموقع (House Edge Boost)
      adjustedWinRate -= gameSettings.houseEdgeBoost || 0;

      // تتبع سلوك اللاعب: إذا ربح وزاد الرهان، قلل الفرص
      if (gameSettings.behaviorTrackingEnabled && lastResult === 'win' && lastBet && selectedBet! > lastBet) {
        const betIncrease = selectedBet! / lastBet;
        const penaltyRate = (gameSettings.betIncreaseAfterWinPenalty || 15) / 100;
        adjustedWinRate *= (1 - (betIncrease - 1) * penaltyRate);

        // تقليل المضاعف الأقصى عند زيادة الرهان بعد الربح
        const maxMultiplierReduction = Math.min(gameSettings.highBetMaxMultiplier || 20, 15);
        dynamicMaxMultiplier = Math.min(dynamicMaxMultiplier, maxMultiplierReduction);
      }

      // عقوبة إضافية للانتصارات المتتالية
      if (gameSettings.behaviorTrackingEnabled && playerStats.currentStreak >= 2) {
        const streakPenalty = (gameSettings.consecutiveWinsPenalty || 10) / 100;
        adjustedWinRate -= playerStats.currentStreak * streakPenalty;
      }

      // التأكد من أن نسبة الربح في حدود منطقية
      adjustedWinRate = Math.max(5, Math.min(95, adjustedWinRate));

      const lossThreshold = 100 - adjustedWinRate;

      if (random < lossThreshold) {
        // خسارة
        prizeMultiplier = null;
      } else {
        // فوز - توزيع المضاعفات الذكي
        const winRandom = Math.random() * 100;
        const totalChance = gameSettings.multiplier2to5Chance + gameSettings.multiplier5to10Chance +
                           gameSettings.multiplier10to25Chance + gameSettings.multiplier25to50Chance +
                           gameSettings.multiplier50PlusChance;

        // توزيع المضاعفات بناءً على الإعدادات والمرحلة
        let chance1 = gameSettings.multiplier2to5Chance;
        let chance2 = chance1 + gameSettings.multiplier5to10Chance;
        let chance3 = chance2 + gameSettings.multiplier10to25Chance;
        let chance4 = chance3 + gameSettings.multiplier25to50Chance;

        // في مرحلة التعليق، زيادة فرص المضاعفات المتوسطة
        if (currentPhase === 'hook') {
          chance1 = 20; // تقليل x2-x5
          chance2 = 60; // زيادة x5-x10
          chance3 = 85;
          chance4 = 97;
        }

        if (winRandom < chance1) {
          // x2 - x5
          prizeMultiplier = Math.floor(Math.random() * 3.5) + 2;
        } else if (winRandom < chance2) {
          // x5 - x10
          prizeMultiplier = Math.floor(Math.random() * 5) + 5;
        } else if (winRandom < chance3) {
          // x10 - x25
          const max = Math.min(25, dynamicMaxMultiplier);
          prizeMultiplier = Math.floor(Math.random() * (max - 10)) + 10;
        } else if (winRandom < chance4) {
          // x25 - x50
          const max = Math.min(50, dynamicMaxMultiplier);
          prizeMultiplier = Math.floor(Math.random() * (max - 25)) + 25;
        } else {
          // x50+
          const max = Math.min(100, dynamicMaxMultiplier);
          prizeMultiplier = Math.floor(Math.random() * (max - 50)) + 50;
        }

        // التأكد من أن المضاعف في الحد المسموح
        prizeMultiplier = Math.min(prizeMultiplier, dynamicMaxMultiplier);
      }

      setPrize(prizeMultiplier);
      setIsOpening(false);
      setIsOpen(true);

      if (prizeMultiplier) {
        const winnings = selectedBet! * prizeMultiplier;
        const newBalance = balance - selectedBet! + winnings;
        setBalance(newBalance);
        setLastBet(selectedBet);
        setLastResult('win');

        // Play win sound
        soundManager.playWin();

        // حفظ النتيجة في السيرفر مع الإحصائيات الكاملة
        if (userId) {
          fetch(`/api/users/${userId}/game-result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              betAmount: selectedBet,
              won: true,
              multiplier: prizeMultiplier,
              newBalance: newBalance
            })
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
        setLastBet(selectedBet);
        setLastResult('loss');

        // Play lose sound
        soundManager.playLose();

        // حفظ النتيجة في السيرفر مع الإحصائيات الكاملة
        if (userId) {
          fetch(`/api/users/${userId}/game-result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              betAmount: selectedBet,
              won: false,
              multiplier: null,
              newBalance: newBalance
            })
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
    }, 1500); // Reduced delay here
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