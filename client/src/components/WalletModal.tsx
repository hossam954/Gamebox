import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  type: "win" | "loss" | "deposit";
  amount: number;
  timestamp: string;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  transactions: Transaction[];
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

export default function WalletModal({ isOpen, onClose, balance, transactions }: WalletModalProps) {
  const [depositAmount, setDepositAmount] = useState("");

  const handleQuickDeposit = (amount: number) => {
    setDepositAmount(amount.toString());
  };

  const handleDeposit = () => {
    console.log("Deposit:", depositAmount);
    setDepositAmount("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" data-testid="wallet-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Wallet className="h-6 w-6" />
            My Wallet
          </DialogTitle>
          <DialogDescription>Manage your balance and view transaction history</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg border border-card-border bg-card p-6">
            <div className="mb-2 text-sm text-muted-foreground">Current Balance</div>
            <div className="font-mono text-4xl font-bold" data-testid="wallet-balance">
              £{balance.toLocaleString()}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Add Funds</Label>
            <div className="flex gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDeposit(amount)}
                  data-testid={`quick-deposit-${amount}`}
                >
                  £{amount}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Custom amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                data-testid="input-deposit-amount"
              />
              <Button onClick={handleDeposit} data-testid="button-deposit">
                Deposit
              </Button>
            </div>
          </div>

          <div className="space-y-3">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
