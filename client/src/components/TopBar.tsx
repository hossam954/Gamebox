import { Wallet, Settings, HelpCircle, Bell, Shield, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { soundManager } from "@/lib/sounds";

interface TopBarProps {
  balance: number;
  onWalletClick: () => void;
  onSupportClick: () => void;
  onSettingsClick: () => void;
  onNotificationsClick: () => void;
  hasNotifications?: boolean;
  isAdmin?: boolean;
  onAdminClick?: () => void;
}

export default function TopBar({
  balance,
  onWalletClick,
  onSupportClick,
  onSettingsClick,
  onNotificationsClick,
  hasNotifications = false,
  isAdmin = false,
  onAdminClick,
}: TopBarProps) {
  const [isMuted, setIsMuted] = useState(soundManager.getMuteState());

  const handleToggleMute = () => {
    const newMuteState = soundManager.toggleMute();
    setIsMuted(newMuteState);
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="font-display text-xl font-bold">MB</span>
          </div>
          <span className="hidden font-display text-xl font-bold md:inline">Mystery Box</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isAdmin && onAdminClick && (
            <Button
              onClick={onAdminClick}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              size="sm"
            >
              لوحة التحكم
            </Button>
          )}
          <div 
            className="flex items-center gap-2 rounded-md border border-card-border bg-card px-3 py-2 md:px-4"
            data-testid="balance-display"
          >
            <Wallet className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className="font-mono text-sm font-semibold md:text-base">£{balance.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={onWalletClick}
            data-testid="button-wallet"
            className="relative p-2 hover:opacity-70 transition-opacity"
          >
            <Wallet className="h-5 w-5" />
          </button>

          <button
            onClick={onNotificationsClick}
            data-testid="button-notifications"
            className="relative p-2 hover:opacity-70 transition-opacity"
          >
            <Bell className="h-5 w-5" />
            {hasNotifications && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            )}
          </button>

          <button
            onClick={handleToggleMute}
            data-testid="button-sound-toggle"
            className="p-2 hover:opacity-70 transition-opacity"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={onSupportClick}
            data-testid="button-support"
            className="p-2 hover:opacity-70 transition-opacity"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          <button
            onClick={onSettingsClick}
            data-testid="button-settings"
            className="p-2 hover:opacity-70 transition-opacity"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}