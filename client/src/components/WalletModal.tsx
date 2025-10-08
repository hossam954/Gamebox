
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
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/translations";

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
  usdDepositRate: number;
  usdWithdrawRate: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: "deposit" | "withdraw" | "both";
  currency: "SYP" | "USD" | "both";
  fee: number;
  minAmount: number;
  maxAmount: number;
  noteEn: string;
  noteAr: string;
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
  const [selectedDepositCurrency, setSelectedDepositCurrency] = useState<"SYP" | "USD">("SYP");
  const [selectedWithdrawCurrency, setSelectedWithdrawCurrency] = useState<"SYP" | "USD">("SYP");
  const { toast } = useToast();
  const { language } = useLanguage();

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
        title: language === 'ar' ? "معلومات ناقصة" : "Missing information",
        description: language === 'ar' ? "يرجى اختيار طريقة دفع وإدخال المبلغ ورقم العملية" : "Please select a payment method, enter an amount, and provide a transaction number.",
        variant: "destructive",
      });
      return;
    }

    const method = paymentMethods.find(m => m.id === selectedDepositMethod);
    if (!method) return;

    const amount = parseFloat(depositAmount);
    const minLimit = selectedDepositCurrency === "USD" ? method.minAmountUSD : method.minAmount;
    const maxLimit = selectedDepositCurrency === "USD" ? method.maxAmountUSD : method.maxAmount;
    
    if (isNaN(amount) || amount < minLimit || amount > maxLimit) {
      const currencySymbol = selectedDepositCurrency === "USD" ? "$" : "£";
      toast({
        title: language === 'ar' ? "مبلغ غير صحيح" : "Invalid amount",
        description: language === 'ar' 
          ? `يجب أن يكون الإيداع بين ${currencySymbol}${minLimit} و ${currencySymbol}${maxLimit}`
          : `Deposit must be between ${currencySymbol}${minLimit} and ${currencySymbol}${maxLimit}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          username, 
          amount, 
          paymentMethodId: selectedDepositMethod, 
          transactionNumber,
          currency: selectedDepositCurrency
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const currencySymbol = selectedDepositCurrency === "USD" ? "$" : "£";
        toast({
          title: language === 'ar' ? "تم إرسال طلب الإيداع" : "Deposit request submitted",
          description: language === 'ar' 
            ? `طلب الإيداع بمبلغ ${currencySymbol}${amount} قيد انتظار موافقة الإدارة`
            : `Your deposit of ${currencySymbol}${amount} is pending admin approval`,
        });
        setDepositAmount("");
        setTransactionNumber("");
        setSelectedDepositMethod(null);
        setActiveTab("transactions");
      } else {
        toast({
          title: language === 'ar' ? "فشل الإيداع" : "Deposit failed",
          description: data.message || (language === 'ar' ? "لم يتم إرسال طلب الإيداع" : "Could not submit deposit request"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "حدث خطأ ما" : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userId || !username || !selectedWithdrawMethod) {
      toast({
        title: language === 'ar' ? "معلومات ناقصة" : "Missing information",
        description: language === 'ar' ? "يرجى اختيار طريقة دفع" : "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    const method = paymentMethods.find(m => m.id === selectedWithdrawMethod);
    if (!method) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < method.minAmount || amount > method.maxAmount) {
      toast({
        title: language === 'ar' ? "مبلغ غير صحيح" : "Invalid amount",
        description: language === 'ar'
          ? `يجب أن يكون السحب بين £${method.minAmount} و £${method.maxAmount}`
          : `Withdrawal must be between £${method.minAmount} and £${method.maxAmount}`,
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: language === 'ar' ? "رصيد غير كافٍ" : "Insufficient balance",
        description: language === 'ar' ? "ليس لديك رصيد كافٍ لهذا السحب" : "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    if (!withdrawAddress.trim()) {
      toast({
        title: language === 'ar' ? "عنوان مفقود" : "Missing address",
        description: language === 'ar' ? "يرجى إدخال عنوان السحب" : "Please enter your withdrawal address",
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
          address: withdrawAddress,
          currency: selectedWithdrawCurrency
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const fee = Math.floor((amount * method.fee) / 100);
        const netAmount = amount - fee;
        
        toast({
          title: language === 'ar' ? "تم إرسال طلب السحب" : "Withdrawal request submitted",
          description: language === 'ar'
            ? `طلب السحب بمبلغ £${amount} (صافي: £${netAmount} بعد رسوم ${method.fee}%) قيد انتظار موافقة الإدارة`
            : `Your withdrawal of £${amount} (net: £${netAmount} after ${method.fee}% fee) is pending admin approval`,
        });
        setWithdrawAmount("");
        setWithdrawAddress("");
        setSelectedWithdrawMethod(null);
        setActiveTab("transactions");
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: language === 'ar' ? "فشل السحب" : "Withdrawal failed",
          description: data.message || (language === 'ar' ? "لم يتم إرسال طلب السحب" : "Could not submit withdrawal request"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "حدث خطأ ما" : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDepositMethodData = paymentMethods.find(m => m.id === selectedDepositMethod);
  const selectedWithdrawMethodData = paymentMethods.find(m => m.id === selectedWithdrawMethod);

  const getConversionInfo = (type: "deposit" | "withdraw") => {
    if (!paymentSettings) return null;
    
    const amount = parseFloat(type === "deposit" ? depositAmount : withdrawAmount);
    if (isNaN(amount)) return null;

    if (type === "deposit" && selectedDepositCurrency === "USD") {
      const rate = paymentSettings.usdDepositRate / 100;
      const sypAmount = Math.floor(amount * rate);
      return {
        original: `$${amount}`,
        converted: `£${sypAmount.toLocaleString()}`,
        rate: rate.toFixed(2)
      };
    }

    if (type === "withdraw" && selectedWithdrawCurrency === "USD") {
      const rate = paymentSettings.usdWithdrawRate / 100;
      const usdAmount = (amount / rate).toFixed(2);
      return {
        original: `£${amount.toLocaleString()}`,
        converted: `$${usdAmount}`,
        rate: rate.toFixed(2)
      };
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" data-testid="wallet-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Wallet className="h-6 w-6" />
            {language === 'ar' ? 'محفظتي' : 'My Wallet'}
          </DialogTitle>
          <DialogDescription>{language === 'ar' ? 'إدارة رصيدك والمعاملات' : 'Manage your balance and transactions'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg border border-card-border bg-card p-6">
            <div className="mb-2 text-sm text-muted-foreground">{t('balance', language)}</div>
            <div className="font-mono text-4xl font-bold" data-testid="wallet-balance">
              £{balance.toLocaleString()}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transactions" data-testid="tab-transactions">{language === 'ar' ? 'المعاملات' : 'Transactions'}</TabsTrigger>
              <TabsTrigger value="deposit" data-testid="tab-deposit">{t('deposit', language)}</TabsTrigger>
              <TabsTrigger value="withdraw" data-testid="tab-withdraw">{t('withdraw', language)}</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-3">
              <h3 className="font-display text-lg font-semibold">{language === 'ar' ? 'المعاملات الأخيرة' : 'Recent Transactions'}</h3>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {transactions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('noData', language)}
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
                {language === 'ar' ? 'إضافة أموال إلى حسابك' : 'Add funds to your account'}
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="payment-method">{t('paymentMethod', language)}</Label>
                  <select
                    id="payment-method"
                    className="w-full p-2 border rounded-md bg-background text-foreground"
                    value={selectedDepositMethod || ""}
                    onChange={(e) => {
                      setSelectedDepositMethod(e.target.value || null);
                      const method = paymentMethods.find(m => m.id === e.target.value);
                      if (method?.currency === "USD") setSelectedDepositCurrency("USD");
                      else if (method?.currency === "SYP") setSelectedDepositCurrency("SYP");
                    }}
                    disabled={isLoading}
                  >
                    <option value="">{t('selectPaymentMethod', language)}</option>
                    {paymentMethods
                      .filter(method => method.isActive && (method.type === "deposit" || method.type === "both"))
                      .map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name} - {language === 'ar' ? 'بونص' : 'Bonus'}: {method.fee}%
                        </option>
                      ))}
                  </select>
                </div>

                {selectedDepositMethodData?.currency === "both" && (
                  <div>
                    <Label>{language === 'ar' ? 'اختر العملة' : 'Select Currency'}</Label>
                    <select
                      className="w-full p-2 border rounded-md bg-background text-foreground"
                      value={selectedDepositCurrency}
                      onChange={(e) => setSelectedDepositCurrency(e.target.value as "SYP" | "USD")}
                    >
                      <option value="SYP">£ {language === 'ar' ? 'ليرة سورية' : 'SYP'}</option>
                      <option value="USD">$ {language === 'ar' ? 'دولار أمريكي' : 'USD'}</option>
                    </select>
                  </div>
                )}

                {selectedDepositMethod && paymentSettings && selectedDepositCurrency === "USD" && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      💵 {language === 'ar' ? 'سعر الصرف' : 'Exchange Rate'}: 1 USD = £{(paymentSettings.usdDepositRate / 100).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedDepositMethod && (
                  <div className="p-3 bg-muted rounded-lg">
                    {selectedDepositMethodData && (language === 'ar' ? selectedDepositMethodData.noteAr : selectedDepositMethodData.noteEn) && (
                      <p className="text-sm whitespace-pre-line">{language === 'ar' ? selectedDepositMethodData.noteAr : selectedDepositMethodData.noteEn}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="deposit-amount">
                    {t('amount', language)} ({selectedDepositCurrency === "USD" ? "$" : "£"})
                  </Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder={language === 'ar' ? 'أدخل المبلغ' : 'Enter amount'}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={isLoading || !selectedDepositMethod}
                    min={selectedDepositCurrency === "USD" ? selectedDepositMethodData?.minAmountUSD || 0 : selectedDepositMethodData?.minAmount || 0}
                    max={selectedDepositCurrency === "USD" ? selectedDepositMethodData?.maxAmountUSD || 0 : selectedDepositMethodData?.maxAmount || 0}
                  />
                  {selectedDepositMethodData && (() => {
                    const currencySymbol = selectedDepositCurrency === "USD" ? "$" : "£";
                    const minLimit = selectedDepositCurrency === "USD" ? selectedDepositMethodData.minAmountUSD : selectedDepositMethodData.minAmount;
                    const maxLimit = selectedDepositCurrency === "USD" ? selectedDepositMethodData.maxAmountUSD : selectedDepositMethodData.maxAmount;
                    return (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('minAmount', language)}: {currencySymbol}{minLimit.toLocaleString()} |
                        {t('maxAmount', language)}: {currencySymbol}{maxLimit.toLocaleString()}
                      </p>
                    );
                  })()}
                  {getConversionInfo("deposit") && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        💰 {getConversionInfo("deposit")?.original} = {getConversionInfo("deposit")?.converted}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="transaction-number">{t('transactionNumber', language)}</Label>
                  <Input
                    id="transaction-number"
                    type="text"
                    placeholder={language === 'ar' ? 'أدخل رقم العملية' : 'Enter transaction number'}
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
                  {isLoading ? t('submitting', language) : (language === 'ar' ? 'إرسال طلب الإيداع' : 'Submit Deposit Request')}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="withdraw" className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Download className="h-4 w-4" />
                {language === 'ar' ? 'سحب الأموال من حسابك' : 'Withdraw funds from your account'}
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="withdraw-method">{language === 'ar' ? 'طريقة السحب' : 'Withdrawal Method'}</Label>
                  <select
                    id="withdraw-method"
                    className="w-full p-2 border rounded-md bg-background text-foreground"
                    value={selectedWithdrawMethod || ""}
                    onChange={(e) => {
                      setSelectedWithdrawMethod(e.target.value || null);
                      const method = paymentMethods.find(m => m.id === e.target.value);
                      if (method?.currency === "USD") setSelectedWithdrawCurrency("USD");
                      else if (method?.currency === "SYP") setSelectedWithdrawCurrency("SYP");
                    }}
                    disabled={isLoading}
                  >
                    <option value="">{language === 'ar' ? 'اختر طريقة السحب' : 'Select withdrawal method'}</option>
                    {paymentMethods
                      .filter(method => method.isActive && (method.type === "withdraw" || method.type === "both"))
                      .map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name} - {language === 'ar' ? 'رسوم' : 'Fee'}: {method.fee}%
                        </option>
                      ))}
                  </select>
                </div>

                {selectedWithdrawMethodData?.currency === "both" && (
                  <div>
                    <Label>{language === 'ar' ? 'اختر العملة' : 'Select Currency'}</Label>
                    <select
                      className="w-full p-2 border rounded-md bg-background text-foreground"
                      value={selectedWithdrawCurrency}
                      onChange={(e) => setSelectedWithdrawCurrency(e.target.value as "SYP" | "USD")}
                    >
                      <option value="SYP">£ {language === 'ar' ? 'ليرة سورية' : 'SYP'}</option>
                      <option value="USD">$ {language === 'ar' ? 'دولار أمريكي' : 'USD'}</option>
                    </select>
                  </div>
                )}

                {selectedWithdrawMethod && paymentSettings && selectedWithdrawCurrency === "USD" && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      💵 {language === 'ar' ? 'سعر الصرف' : 'Exchange Rate'}: 1 USD = £{(paymentSettings.usdWithdrawRate / 100).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedWithdrawMethod && selectedWithdrawMethodData && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-base whitespace-pre-line leading-relaxed">
                      {language === 'ar' ? selectedWithdrawMethodData.noteAr : selectedWithdrawMethodData.noteEn}
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="withdraw-amount">
                    {t('amount', language)} (£ {language === 'ar' ? 'ليرة سورية' : 'SYP'})
                  </Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder={language === 'ar' ? 'أدخل المبلغ بالليرة السورية' : 'Enter amount in SYP'}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={isLoading || !selectedWithdrawMethod}
                    min={selectedWithdrawMethodData?.minAmount || 0}
                    max={selectedWithdrawMethodData ? Math.min(balance, selectedWithdrawMethodData.maxAmount) : balance}
                  />
                  {selectedWithdrawMethodData && withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                    <>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('minAmount', language)}: £{selectedWithdrawMethodData.minAmount.toLocaleString()} |
                        {t('maxAmount', language)}: £{Math.min(balance, selectedWithdrawMethodData.maxAmount).toLocaleString()}
                      </p>
                      {(() => {
                        const amount = parseFloat(withdrawAmount);
                        const fee = Math.floor((amount * selectedWithdrawMethodData.fee) / 100);
                        const netAmount = amount - fee;
                        
                        if (selectedWithdrawCurrency === "USD" && paymentSettings) {
                          const rate = paymentSettings.usdWithdrawRate / 100;
                          const usdAmount = (netAmount / rate).toFixed(2);
                          
                          return (
                            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                {language === 'ar' ? 'سيتم السحب' : 'Will withdraw'}: ${usdAmount}
                              </p>
                              {fee > 0 && (
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  ({language === 'ar' ? 'المبلغ المطلوب' : 'Requested amount'}: £{amount.toLocaleString()} - {language === 'ar' ? 'الرسوم' : 'Fee'} {selectedWithdrawMethodData.fee}%: £{fee.toLocaleString()} = £{netAmount.toLocaleString()} ÷ {rate.toFixed(2)})
                                </p>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                {language === 'ar' ? 'سيتم السحب' : 'Will withdraw'}: £{netAmount.toLocaleString()}
                              </p>
                              {fee > 0 && (
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  ({language === 'ar' ? 'المبلغ المطلوب' : 'Requested amount'}: £{amount.toLocaleString()} - {language === 'ar' ? 'الرسوم' : 'Fee'} {selectedWithdrawMethodData.fee}%: £{fee.toLocaleString()})
                                </p>
                              )}
                            </div>
                          );
                        }
                      })()}
                    </>
                  )}
                  {selectedWithdrawMethodData && (!withdrawAmount || isNaN(parseFloat(withdrawAmount))) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('minAmount', language)}: £{selectedWithdrawMethodData.minAmount.toLocaleString()} |
                      {t('maxAmount', language)}: £{Math.min(balance, selectedWithdrawMethodData.maxAmount).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="withdraw-address">{t('address', language)}</Label>
                  <Input
                    id="withdraw-address"
                    type="text"
                    placeholder={language === 'ar' ? 'أدخل عنوان الاستلام' : 'Enter your receiving address'}
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
                  {isLoading ? t('submitting', language) : (language === 'ar' ? 'إرسال طلب السحب' : 'Submit Withdrawal Request')}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
