import { Wallet, HelpCircle, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  balance: number;
  onWalletClick: () => void;
  onSupportClick: () => void;
  onSettingsClick: () => void;
  onNotificationsClick: () => void;
  hasNotifications?: boolean;
}

export default function TopBar({
  balance,
  onWalletClick,
  onSupportClick,
  onSettingsClick,
  onNotificationsClick,
  hasNotifications = false,
}: TopBarProps) {
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

          <Button
            size="icon"
            variant="ghost"
            onClick={onWalletClick}
            data-testid="button-wallet"
            className="relative"
          >
            <Wallet className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onSupportClick}
            data-testid="button-support"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onSettingsClick}
            data-testid="button-settings"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onNotificationsClick}
            data-testid="button-notifications"
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {hasNotifications && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
