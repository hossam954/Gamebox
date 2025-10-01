import { useState, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, Download, Upload } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: "win" | "loss" | "deposit";
  amount: number;
  timestamp: string;
}

interface PaymentSettings {
  depositFee: number;
  withdrawFee: number;
  minDeposit: number;
  maxDeposit: number;
  minWithdraw: number;
  maxWithdraw: number;
  depositAddress: string;
  paymentMethod: string;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  transactions: Transaction[];
  userId?: string;
  username?: string;
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

export default function WalletModal({ 
  isOpen, 
  onClose, 
  balance, 
  transactions,
  userId,
  username 
}: WalletModalProps) {
  const [activeTab, setActiveTab] = useState("transactions");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPaymentSettings();
    }
  }, [isOpen]);

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch("/api/payment-settings");
      if (response.ok) {
        const data = await response.json();
        setPaymentSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch payment settings:", error);
    }
  };

  const handleQuickAmount = (amount: number, type: "deposit" | "withdraw") => {
    if (type === "deposit") {
      setDepositAmount(amount.toString());
    } else {
      setWithdrawAmount(amount.toString());
    }
  };

  const handleDeposit = async () => {
    if (!userId || !username || !paymentSettings) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < paymentSettings.minDeposit || amount > paymentSettings.maxDeposit) {
      toast({
        title: "Invalid amount",
        description: `Deposit must be between £${paymentSettings.minDeposit} and £${paymentSettings.maxDeposit}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username, amount }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Deposit request submitted",
          description: `Your deposit of £${amount} is pending admin approval`,
        });
        setDepositAmount("");
        setActiveTab("transactions");
      } else {
        toast({
          title: "Deposit failed",
          description: data.message || "Could not submit deposit request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userId || !username || !paymentSettings) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < paymentSettings.minWithdraw || amount > paymentSettings.maxWithdraw) {
      toast({
        title: "Invalid amount",
        description: `Withdrawal must be between £${paymentSettings.minWithdraw} and £${paymentSettings.maxWithdraw}`,
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    if (!withdrawAddress.trim()) {
      toast({
        title: "Address required",
        description: "Please enter your wallet/bank address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username, amount, address: withdrawAddress }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Withdrawal request submitted",
          description: `Your withdrawal of £${amount} is pending admin approval`,
        });
        setWithdrawAmount("");
        setWithdrawAddress("");
        setActiveTab("transactions");
      } else {
        toast({
          title: "Withdrawal failed",
          description: data.message || "Could not submit withdrawal request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" data-testid="wallet-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Wallet className="h-6 w-6" />
            My Wallet
          </DialogTitle>
          <DialogDescription>Manage your balance and transactions</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg border border-card-border bg-card p-6">
            <div className="mb-2 text-sm text-muted-foreground">Current Balance</div>
            <div className="font-mono text-4xl font-bold" data-testid="wallet-balance">
              £{balance.toLocaleString()}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
              <TabsTrigger value="deposit" data-testid="tab-deposit">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw" data-testid="tab-withdraw">Withdraw</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-3">
              <h3 className="font-display text-lg font-semibold">Recent Transactions</h3>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {transactions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No transactions yet
                  </p>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-md border border-card-border bg-card p-3"
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {transaction.type === "win" && (
                          <div className="rounded-full bg-success/10 p-2">
                            <TrendingUp className="h-4 w-4 text-success" />
                          </div>
                        )}
                        {transaction.type === "loss" && (
                          <div className="rounded-full bg-destructive/10 p-2">
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          </div>
                        )}
                        {transaction.type === "deposit" && (
                          <div className="rounded-full bg-primary/10 p-2">
                            <Wallet className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium capitalize">{transaction.type}</div>
                          <div className="text-xs text-muted-foreground">{transaction.timestamp}</div>
                        </div>
                      </div>
                      <div
                        className={`font-mono text-sm font-semibold ${
                          transaction.type === "win"
                            ? "text-success"
                            : transaction.type === "loss"
                            ? "text-destructive"
                            : "text-primary"
                        }`}
                      >
                        {transaction.type === "win" ? "+" : transaction.type === "loss" ? "-" : "+"}£
                        {transaction.amount.toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="deposit" className="space-y-4">
              {paymentSettings && (
                <div className="rounded-lg border border-card-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-medium">{paymentSettings.paymentMethod}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Deposit Address:</span>
                    <span className="font-mono text-xs">{paymentSettings.depositAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Fee:</span>
                    <span className="font-medium">{paymentSettings.depositFee}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Limits:</span>
                    <span className="font-medium">£{paymentSettings.minDeposit} - £{paymentSettings.maxDeposit}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Quick Amounts</Label>
                <div className="flex gap-2">
                  {QUICK_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(amount, "deposit")}
                      data-testid={`quick-deposit-${amount}`}
                    >
                      £{amount}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Deposit Amount</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  data-testid="input-deposit-amount"
                />
              </div>

              <Button 
                onClick={handleDeposit} 
                disabled={isLoading}
                className="w-full"
                data-testid="button-deposit"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isLoading ? "Submitting..." : "Submit Deposit Request"}
              </Button>
            </TabsContent>

            <TabsContent value="withdraw" className="space-y-4">
              {paymentSettings && (
                <div className="rounded-lg border border-card-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Fee:</span>
                    <span className="font-medium">{paymentSettings.withdrawFee}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Limits:</span>
                    <span className="font-medium">£{paymentSettings.minWithdraw} - £{paymentSettings.maxWithdraw}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="font-mono font-semibold text-success">£{balance.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Quick Amounts</Label>
                <div className="flex gap-2">
                  {QUICK_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(amount, "withdraw")}
                      data-testid={`quick-withdraw-${amount}`}
                    >
                      £{amount}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Withdrawal Amount</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  data-testid="input-withdraw-amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-address">Your Wallet/Bank Address</Label>
                <Input
                  id="withdraw-address"
                  type="text"
                  placeholder="Enter your payment address"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  data-testid="input-withdraw-address"
                />
              </div>

              <Button 
                onClick={handleWithdraw} 
                disabled={isLoading}
                className="w-full"
                data-testid="button-withdraw"
              >
                <Download className="mr-2 h-4 w-4" />
                {isLoading ? "Submitting..." : "Submit Withdrawal Request"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
