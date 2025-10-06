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
  withdrawFee: number;
  minDeposit: number;
  maxDeposit: number;
  minWithdraw: number;
  maxWithdraw: number;
  depositAddress: string;
  paymentMethod: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: "deposit" | "withdraw" | "both";
  fee: number;
  minAmount: number;
  maxAmount: number;
  note: string | null;
  isActive: boolean;
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
  const [transactionNumber, setTransactionNumber] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedDepositMethod, setSelectedDepositMethod] = useState<string | null>(null);
  const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPaymentSettings();
      fetchPaymentMethods();
    }
  }, [isOpen]);

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch("/api/payment-settings");
      if (response.ok) {
        const settings = await response.json();
        setPaymentSettings(settings);
      }
    } catch (error) {
      console.error("Failed to fetch payment settings:", error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/payment-methods");
      if (response.ok) {
        const methods = await response.json();
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
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
    if (!userId || !username || !selectedDepositMethod || !transactionNumber) {
      toast({
        title: "Missing information",
        description: "Please select a payment method, enter an amount, and provide a transaction number.",
        variant: "destructive",
      });
      return;
    }

    const method = paymentMethods.find(m => m.id === selectedDepositMethod);
    if (!method) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < method.minAmount || amount > method.maxAmount) {
      toast({
        title: "Invalid amount",
        description: `Deposit must be between £${method.minAmount} and £${method.maxAmount}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username, amount, paymentMethodId: selectedDepositMethod, transactionNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Deposit request submitted",
          description: `Your deposit of £${amount} is pending admin approval`,
        });
        setDepositAmount("");
        setTransactionNumber("");
        setSelectedDepositMethod(null);
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
    if (!userId || !username || !selectedWithdrawMethod) {
      toast({
        title: "Missing information",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    const method = paymentMethods.find(m => m.id === selectedWithdrawMethod);
    if (!method) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < method.minAmount || amount > method.maxAmount) {
      toast({
        title: "Invalid amount",
        description: `Withdrawal must be between £${method.minAmount} and £${method.maxAmount}`,
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
        title: "Missing address",
        description: "Please enter your withdrawal address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          username,
          amount,
          paymentMethodId: selectedWithdrawMethod,
          address: withdrawAddress
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const fee = Math.floor((amount * method.fee) / 100);
        const netAmount = amount - fee;
        
        toast({
          title: "Withdrawal request submitted",
          description: `Your withdrawal of £${amount} (net: £${netAmount} after ${method.fee}% fee) is pending admin approval`,
        });
        setWithdrawAmount("");
        setWithdrawAddress("");
        setSelectedWithdrawMethod(null);
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                Add funds to your account
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <select
                    id="payment-method"
                    className="w-full p-2 border rounded-md"
                    value={selectedDepositMethod || ""}
                    onChange={(e) => setSelectedDepositMethod(e.target.value || null)}
                    disabled={isLoading}
                  >
                    <option value="">Select payment method</option>
                    {paymentMethods
                      .filter(method => method.isActive && (method.type === "deposit" || method.type === "both"))
                      .map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name} (Fee: {method.fee}%)
                        </option>
                      ))}
                  </select>
                </div>

                {selectedDepositMethod && (
                  <div className="p-3 bg-muted rounded-lg">
                    {paymentMethods.find(m => m.id === selectedDepositMethod)?.note && (
                      <p className="text-sm">{paymentMethods.find(m => m.id === selectedDepositMethod)?.note}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="deposit-amount">Amount (£)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={isLoading || !selectedDepositMethod}
                    min={selectedDepositMethod ? paymentMethods.find(m => m.id === selectedDepositMethod)?.minAmount : 0}
                    max={selectedDepositMethod ? paymentMethods.find(m => m.id === selectedDepositMethod)?.maxAmount : 0}
                  />
                  {selectedDepositMethod && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: £{paymentMethods.find(m => m.id === selectedDepositMethod)?.minAmount.toLocaleString()} |
                      Max: £{paymentMethods.find(m => m.id === selectedDepositMethod)?.maxAmount.toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="transaction-number">Transaction Number</Label>
                  <Input
                    id="transaction-number"
                    type="text"
                    placeholder="Enter transaction number"
                    value={transactionNumber}
                    onChange={(e) => setTransactionNumber(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={handleDeposit}
                  disabled={isLoading || !depositAmount || !selectedDepositMethod || !transactionNumber}
                  className="w-full"
                >
                  {isLoading ? "Processing..." : "Submit Deposit Request"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="withdraw" className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Download className="h-4 w-4" />
                Withdraw funds from your account
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="withdraw-method">Withdrawal Method</Label>
                  <select
                    id="withdraw-method"
                    className="w-full p-2 border rounded-md"
                    value={selectedWithdrawMethod || ""}
                    onChange={(e) => setSelectedWithdrawMethod(e.target.value || null)}
                    disabled={isLoading}
                  >
                    <option value="">Select withdrawal method</option>
                    {paymentMethods
                      .filter(method => method.isActive && (method.type === "withdraw" || method.type === "both"))
                      .map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name} (Fee: {method.fee}%)
                        </option>
                      ))}
                  </select>
                </div>

                {selectedWithdrawMethod && (
                  <div className="p-3 bg-muted rounded-lg">
                    {paymentMethods.find(m => m.id === selectedWithdrawMethod)?.note && (
                      <p className="text-sm">{paymentMethods.find(m => m.id === selectedWithdrawMethod)?.note}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="withdraw-amount">Amount (£)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={isLoading || !selectedWithdrawMethod}
                    min={selectedWithdrawMethod ? paymentMethods.find(m => m.id === selectedWithdrawMethod)?.minAmount : 0}
                    max={selectedWithdrawMethod ? Math.min(balance, paymentMethods.find(m => m.id === selectedWithdrawMethod)?.maxAmount || balance) : balance}
                  />
                  {selectedWithdrawMethod && withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                    <>
                      <p className="text-xs text-muted-foreground mt-1">
                        Min: £{paymentMethods.find(m => m.id === selectedWithdrawMethod)?.minAmount.toLocaleString()} |
                        Max: £{Math.min(balance, paymentMethods.find(m => m.id === selectedWithdrawMethod)?.maxAmount || balance).toLocaleString()}
                      </p>
                      {(() => {
                        const method = paymentMethods.find(m => m.id === selectedWithdrawMethod);
                        const amount = parseFloat(withdrawAmount);
                        const fee = Math.floor((amount * (method?.fee || 0)) / 100);
                        const netAmount = amount - fee;
                        return (
                          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                              سيتم سحب: £{netAmount.toLocaleString()}
                            </p>
                            {fee > 0 && (
                              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                (المبلغ المطلوب: £{amount.toLocaleString()} - الرسوم {method?.fee}%: £{fee.toLocaleString()})
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}
                  {selectedWithdrawMethod && (!withdrawAmount || isNaN(parseFloat(withdrawAmount))) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: £{paymentMethods.find(m => m.id === selectedWithdrawMethod)?.minAmount.toLocaleString()} |
                      Max: £{Math.min(balance, paymentMethods.find(m => m.id === selectedWithdrawMethod)?.maxAmount || balance).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="withdraw-address">Receiving Address</Label>
                  <Input
                    id="withdraw-address"
                    type="text"
                    placeholder="Enter your receiving address"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={isLoading || !withdrawAmount || !withdrawAddress || !selectedWithdrawMethod}
                  className="w-full"
                >
                  {isLoading ? "Processing..." : "Submit Withdrawal Request"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}