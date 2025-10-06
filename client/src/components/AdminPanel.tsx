import { useState, useEffect } from "react";
import { Users, Wallet, Settings, TrendingUp, TrendingDown, AlertCircle, Eye, ArrowUpDown, Edit, Lock, Trash2, Check, X, MessageSquare, Gift, CreditCard, Bell, Send, Link2, Shield, ShieldOff, EyeOff, HelpCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  totalWins: number;
  totalLosses: number;
  status: "active" | "suspended";
}



interface Request {
  id: string;
  userId?: string;
  username: string;
  email?: string;
  amount?: number;
  address?: string;
  message?: string;
  status: string;
  createdAt: Date;
}

interface PromoCode {
  id: string;
  code: string;
  value: number;
  type: "balance" | "percentage";
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
}

interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  response?: string;
  createdAt: Date;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: "deposit" | "withdraw" | "both";
  minAmount: number;
  maxAmount: number;
  fee: number;
  note: string;
  isActive: boolean;
  createdAt: Date;
}

interface AdminPanelProps {
  users: User[];
  onEditBalance: (userId: string, newBalance: number) => void;
  onSuspendUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export default function AdminPanel({ users, onEditBalance, onSuspendUser, onDeleteUser }: AdminPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [passwordRecoveryRequests, setPasswordRecoveryRequests] = useState<Request[]>([]);
  const [depositRequests, setDepositRequests] = useState<Request[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<Request[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    name: "",
    type: "both",
    minAmount: 0,
    maxAmount: 100000,
    fee: 0,
    note: ""
  });
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoValue, setNewPromoValue] = useState("");
  const [newPromoType, setNewPromoType] = useState<"balance" | "percentage">("balance");
  const [newPromoLimit, setNewPromoLimit] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [newBalanceUserId, setNewBalanceUserId] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [winRate, setWinRate] = useState(50);

  useEffect(() => {
    const fetchWinRate = async () => {
      try {
        const response = await fetch('/api/payment-settings');
        if (response.ok) {
          const data = await response.json();
          setWinRate(data.winRate || 50);
        }
      } catch (error) {
        console.error('Error fetching win rate:', error);
      }
    };
    fetchWinRate();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winRate }),
      });

      if (response.ok) {
        toast({
          title: "تم حفظ الإعدادات بنجاح",
          description: "تم حفظ إعدادات نسبة الربح بنجاح.",
        });
      } else {
        toast({
          title: "فشل حفظ الإعدادات",
          description: "حدث خطأ أثناء حفظ إعدادات نسبة الربح.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };


  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUsers(),

        fetchPasswordRecoveryRequests(),
        fetchDepositRequests(),
        fetchWithdrawRequests(),
        fetchPromoCodes(),
        fetchSupportTickets(),
        fetchPaymentMethods(),
      ]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };



  const fetchPasswordRecoveryRequests = async () => {
    try {
      const response = await fetch("/api/password-recovery");
      if (response.ok) {
        const data = await response.json();
        setPasswordRecoveryRequests(data);
      }
    } catch (error) {
      console.error("Failed to fetch password recovery requests:", error);
    }
  };

  const fetchDepositRequests = async () => {
    try {
      const response = await fetch("/api/deposit");
      if (response.ok) {
        const data = await response.json();
        setDepositRequests(data);
      }
    } catch (error) {
      console.error("Failed to fetch deposit requests:", error);
    }
  };

  const fetchWithdrawRequests = async () => {
    try {
      const response = await fetch("/api/withdraw");
      if (response.ok) {
        const data = await response.json();
        setWithdrawRequests(data);
      }
    } catch (error) {
      console.error("Failed to fetch withdraw requests:", error);
    }
  };

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch("/api/promo-codes");
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data);
      }
    } catch (error) {
      console.error("Failed to fetch promo codes:", error);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const response = await fetch("/api/support");
      if (response.ok) {
        const tickets = await response.json();
        setSupportTickets(tickets);
      }
    } catch (error) {
      console.error("Failed to fetch support tickets:", error);
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

  const handleCreatePromoCode = async () => {
    if (!newPromoCode || !newPromoValue || !newPromoLimit) return;

    try {
      const response = await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newPromoCode,
          value: parseFloat(newPromoValue),
          type: newPromoType,
          usageLimit: parseInt(newPromoLimit),
        }),
      });

      if (response.ok) {
        toast({
          title: "Promo code created",
          description: `Code ${newPromoCode} has been created successfully`,
        });
        setNewPromoCode("");
        setNewPromoValue("");
        setNewPromoLimit("");
        fetchPromoCodes();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create promo code",
        variant: "destructive",
      });
    }
  };

  const handleTogglePromoCode = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/promo-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchPromoCodes();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update promo code",
        variant: "destructive",
      });
    }
  };

  const handleSupportResponse = async (ticketId: string, response: string) => {
    try {
      const responseData = await fetch(`/api/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, status: "closed" }),
      });

      if (responseData.ok) {
        toast({
          title: "Response sent",
          description: "Support ticket has been responded to",
        });
        fetchSupportTickets();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive",
      });
    }
  };



  const handlePasswordRecoveryAction = async (id: string, action: "approve" | "reject") => {
    try {
      const request = passwordRecoveryRequests.find(r => r.id === id);
      if (!request) return;

      if (action === "approve") {
        const tokenResponse = await fetch("/api/auth/generate-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: request.userId }),
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          navigator.clipboard.writeText(tokenData.resetLink);
          
          await fetch(`/api/password-recovery/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "approved" }),
          });

          toast({
            title: "Reset link generated",
            description: `Reset link copied to clipboard. Send this to ${request.email}. Link expires in 30 minutes.`,
          });
        }
      } else {
        await fetch(`/api/password-recovery/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected" }),
        });
        
        toast({
          title: "Request rejected",
          description: "Password recovery request has been rejected",
        });
      }
      
      fetchPasswordRecoveryRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleDepositAction = async (id: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/deposit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "approve" ? "approved" : "rejected" }),
      });

      if (response.ok) {
        toast({
          title: `Deposit ${action}d`,
          description: `Deposit request has been ${action}d`,
        });
        fetchDepositRequests();
        if (action === "approve") {
          fetchUsers();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleWithdrawAction = async (id: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/withdraw/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "approve" ? "approved" : "rejected" }),
      });

      if (response.ok) {
        toast({
          title: `Withdrawal ${action}d`,
          description: `Withdrawal request has been ${action}d`,
        });
        fetchWithdrawRequests();
        if (action === "approve") {
          fetchUsers();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleCreatePaymentMethod = async () => {
    if (!newPaymentMethod.name || newPaymentMethod.minAmount < 0 || newPaymentMethod.maxAmount <= newPaymentMethod.minAmount) {
      toast({
        title: "Invalid payment method",
        description: "Please fill all fields correctly",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPaymentMethod),
      });

      if (response.ok) {
        toast({
          title: "Payment method created",
          description: "New payment method has been added",
        });
        setNewPaymentMethod({ name: "", type: "both", minAmount: 0, maxAmount: 100000, fee: 0, note: "" });
        fetchPaymentMethods();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create payment method",
        variant: "destructive",
      });
    }
  };

  const handleTogglePaymentMethod = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        toast({
          title: "Payment method updated",
          description: `Payment method ${isActive ? "activated" : "deactivated"}`,
        });
        fetchPaymentMethods();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment method",
        variant: "destructive",
      });
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Payment method deleted",
          description: "Payment method has been removed",
        });
        fetchPaymentMethods();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete payment method",
        variant: "destructive",
      });
    }
  };


  const displayUsers = allUsers.length > 0 ? allUsers : users;
  const filteredUsers = displayUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBalance = displayUsers.reduce((sum, user) => sum + (user.balance || 0), 0);
  const totalUsers = displayUsers.length;
  const activeUsers = allUsers.filter((u) => u.status === "active").length;
  const suspendedUsers = allUsers.filter((u) => u.status === "suspended").length;

  const totalDeposits = depositRequests
    .filter(req => req.status === "approved")
    .reduce((sum, req) => sum + (req.amount || 0), 0);

  const totalWithdrawals = withdrawRequests
    .filter(req => req.status === "approved")
    .reduce((sum, req) => sum + (req.amount ?? 0), 0);
  
  const pendingDeposits = depositRequests.filter((r) => r.status === "pending").length;
  const pendingWithdrawals = withdrawRequests.filter((r) => r.status === "pending").length;
  
  const pendingRequests = depositRequests.filter((r) => r.status === "pending").length +
    withdrawRequests.filter((r) => r.status === "pending").length +
    passwordRecoveryRequests.filter((r) => r.status === "pending").length +
    supportTickets.filter((t) => t.status === "open").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4" data-testid="admin-panel">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              لوحة تحكم الإدارة
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mt-2">إدارة المستخدمين والمدفوعات وإعدادات المنصة</p>
          </div>
          <Button
            onClick={fetchAllData}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full md:w-auto"
            size="lg"
          >
            {isLoading ? "جاري التحديث..." : "تحديث البيانات"}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">إجمالي المستخدمين</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-100" data-testid="stat-total-users">
                {displayUsers.length}
              </div>
              <p className="text-xs md:text-sm text-blue-600 dark:text-green-400">
                {activeUsers} نشط • {suspendedUsers} معلق
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">إجمالي الرصيد</CardTitle>
              <Wallet className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-green-900 dark:text-green-100" data-testid="stat-total-balance">
                £{totalBalance.toLocaleString()}
              </div>
              <p className="text-xs md:text-sm text-green-600 dark:text-green-400">عبر جميع الحسابات</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">إجمالي الإيداعات</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-orange-900 dark:text-orange-100" data-testid="stat-total-deposits">
                £{totalDeposits.toLocaleString()}
              </div>
              <p className="text-xs md:text-sm text-orange-600 dark:text-orange-400">إجمالي الإيداعات الموافق عليها</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">إجمالي السحوبات</CardTitle>
              <TrendingDown className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-purple-900 dark:text-purple-100" data-testid="stat-total-withdrawals">
                £{totalWithdrawals.toLocaleString()}
              </div>
              <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400">إجمالي السحوبات الموافق عليها</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/20 border-yellow-300 border-2 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">إيداعات قيد الانتظار</CardTitle>
              <AlertCircle className="h-6 w-6 text-yellow-600 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold text-yellow-900 dark:text-yellow-100" data-testid="stat-pending-deposits">
                {pendingDeposits}
              </div>
              <p className="text-xs md:text-sm text-yellow-600 dark:text-yellow-400 font-semibold">تحتاج إلى مراجعة</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-800/20 border-red-300 border-2 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">سحوبات قيد الانتظار</CardTitle>
              <AlertCircle className="h-6 w-6 text-red-600 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold text-red-900 dark:text-red-100" data-testid="stat-pending-withdrawals">
                {pendingWithdrawals}
              </div>
              <p className="text-xs md:text-sm text-red-600 dark:text-red-400 font-semibold">تحتاج إلى مراجعة</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {/* Admin Tabs as Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              activeTab === "overview"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold text-lg">نظرة عامة</h3>
              <p className="text-sm text-muted-foreground mt-1">إحصائيات عامة</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              activeTab === "users"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setActiveTab("users")}
          >
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold text-lg">المستخدمين</h3>
              <p className="text-sm text-muted-foreground mt-1">إدارة الحسابات</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-gray-200 hover:border-emerald-300`}
            onClick={() => window.location.href = "/admin/deposits"}
          >
            <CardContent className="p-6 text-center">
              <Wallet className="h-8 w-8 mx-auto mb-3 text-emerald-600" />
              <h3 className="font-semibold text-lg">الإيداعات</h3>
              <p className="text-sm text-muted-foreground mt-1">طلبات الإيداع</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-gray-200 hover:border-red-300`}
            onClick={() => window.location.href = "/admin/withdrawals"}
          >
            <CardContent className="p-6 text-center">
              <Wallet className="h-8 w-8 mx-auto mb-3 text-red-600" />
              <h3 className="font-semibold text-lg">السحوبات</h3>
              <p className="text-sm text-muted-foreground mt-1">طلبات السحب</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              activeTab === "recovery"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setActiveTab("recovery")}
          >
            <CardContent className="p-6 text-center">
              <Link2 className="h-8 w-8 mx-auto mb-3 text-purple-600" />
              <h3 className="font-semibold text-lg">استرداد كلمة المرور</h3>
              <p className="text-sm text-muted-foreground mt-1">طلبات الاسترداد</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              activeTab === "promo"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setActiveTab("promo")}
          >
            <CardContent className="p-6 text-center">
              <Gift className="h-8 w-8 mx-auto mb-3 text-pink-600" />
              <h3 className="font-semibold text-lg">أكواد الخصم</h3>
              <p className="text-sm text-muted-foreground mt-1">إدارة الأكواد</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              activeTab === "support"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setActiveTab("support")}
          >
            <CardContent className="p-6 text-center">
              <HelpCircle className="h-8 w-8 mx-auto mb-3 text-indigo-600" />
              <h3 className="font-semibold text-lg">الدعم الفني</h3>
              <p className="text-sm text-muted-foreground mt-1">تذاكر الدعم</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              activeTab === "payment-methods"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setActiveTab("payment-methods")}
          >
            <CardContent className="p-6 text-center">
              <Wallet className="h-8 w-8 mx-auto mb-3 text-orange-600" />
              <h3 className="font-semibold text-lg">طرق الدفع</h3>
              <p className="text-sm text-muted-foreground mt-1">إدارة الطرق</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              activeTab === "messaging"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setActiveTab("messaging")}
          >
            <CardContent className="p-6 text-center">
              <svg className="h-8 w-8 mx-auto mb-3 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3 className="font-semibold text-lg">الإذاعة والرسائل</h3>
              <p className="text-sm text-muted-foreground mt-1">إرسال الإشعارات</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7 px-3">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="users">المستخدمين</TabsTrigger>
              <TabsTrigger value="deposits">الإيداعات</TabsTrigger>
              <TabsTrigger value="withdrawals">السحوبات</TabsTrigger>
              <TabsTrigger value="recovery">استرداد</TabsTrigger>
              <TabsTrigger value="promo">أكواد الخصم</TabsTrigger>
              <TabsTrigger value="support">الدعم</TabsTrigger>
              <TabsTrigger value="messaging">الرسائل</TabsTrigger>
              <TabsTrigger value="payment-methods">طرق الدفع</TabsTrigger>
              <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        أحدث المستخدمين
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {displayUsers.slice(0, 5).map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-bold">£{user.balance.toLocaleString()}</p>
                              <Badge variant={user.status === "active" ? "default" : "destructive"} className="text-xs">
                                {user.status === "active" ? "نشط" : "معلق"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        النشاط الأخير
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[...depositRequests, ...withdrawRequests]
                          .filter(request => request.amount != null && typeof request.amount === 'number')
                          .slice(0, 5)
                          .map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div>
                              <p className="font-medium">{request.username}</p>
                              <p className="text-sm text-muted-foreground">
                                {depositRequests.includes(request) ? "إيداع" : "سحب"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-bold">£{(request.amount || 0).toLocaleString()}</p>
                              <Badge variant={request.status === "pending" ? "default" : request.status === "approved" ? "default" : "destructive"} className="text-xs">
                                {request.status === "pending" ? "معلق" : request.status === "approved" ? "موافق عليه" : "مرفوض"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-6 mt-0">
                <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-800">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                      </div>
                      إدارة المستخدمين
                    </CardTitle>
                    <CardDescription className="text-base mt-2">عرض وإدارة حسابات المستخدمين والأرصدة والحالة</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="البحث باسم المستخدم أو البريد الإلكتروني..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 h-12 text-base bg-white dark:bg-slate-800 border-2 focus:border-blue-400"
                          data-testid="input-search-users"
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-card-border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800">
                          <TableRow>
                            <TableHead className="font-semibold">اسم المستخدم</TableHead>
                            <TableHead className="font-semibold">البريد الإلكتروني</TableHead>
                            <TableHead className="text-right font-semibold">الرصيد</TableHead>
                            <TableHead className="text-right font-semibold">مكاسب/خسائر</TableHead>
                            <TableHead className="font-semibold">الحالة</TableHead>
                            <TableHead className="text-right font-semibold">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                لا توجد مستخدمين
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredUsers.map((user) => (
                              <TableRow key={user.id} data-testid={`user-row-${user.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <TableCell className="font-medium">{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell className="text-right font-mono font-bold">
                                  £{user.balance.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="text-green-600 font-semibold">{user.totalWins || 0}</span> /{" "}
                                  <span className="text-red-600 font-semibold">{user.totalLosses || 0}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={user.status === "active" ? "default" : "destructive"}>
                                    {user.status === "active" ? "نشط" : "معلق"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newBalance = prompt("أدخل الرصيد الجديد:", user.balance.toString());
                                        if (newBalance) onEditBalance(user.id, parseFloat(newBalance));
                                      }}
                                      data-testid={`button-edit-${user.id}`}
                                      className="h-9 px-3 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      تعديل
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onSuspendUser(user.id)}
                                      data-testid={`button-suspend-${user.id}`}
                                      className={`h-9 px-3 ${user.status === "active"
                                        ? "bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                                        : "bg-green-50 hover:bg-green-100 border-green-200 text-green-700"}`}
                                    >
                                      {user.status === "active" ? (
                                        <>
                                          <ShieldOff className="h-4 w-4 mr-1" />
                                          تعليق
                                        </>
                                      ) : (
                                        <>
                                          <Shield className="h-4 w-4 mr-1" />
                                          تفعيل
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onDeleteUser(user.id)}
                                      data-testid={`button-delete-${user.id}`}
                                      className="h-9 px-3 bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      حذف
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deposits" className="mt-0">
                <Card className="shadow-lg border-2 border-green-100 dark:border-green-800">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                        <Wallet className="h-6 w-6 text-green-600 dark:text-green-300" />
                      </div>
                      طلبات الإيداع
                    </CardTitle>
                    <CardDescription className="text-base mt-2">مراجعة والموافقة على أو رفض طلبات الإيداع</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="rounded-lg border border-card-border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800">
                          <TableRow>
                            <TableHead className="font-semibold">اسم المستخدم</TableHead>
                            <TableHead className="text-right font-semibold">المبلغ</TableHead>
                            <TableHead className="font-semibold">التاريخ</TableHead>
                            <TableHead className="font-semibold">الحالة</TableHead>
                            <TableHead className="text-right font-semibold">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {depositRequests.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                لا توجد طلبات إيداع
                              </TableCell>
                            </TableRow>
                          ) : (
                            depositRequests.map((request) => (
                              <TableRow key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <TableCell className="font-medium">{request.username}</TableCell>
                                <TableCell className="text-right font-mono font-bold text-green-600">
                                  £{(request.amount ?? 0).toLocaleString()}
                                </TableCell>
                                <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Badge variant={request.status === "pending" ? "default" : request.status === "approved" ? "default" : "destructive"}>
                                    {request.status === "pending" ? "معلق" : request.status === "approved" ? "موافق عليه" : "مرفوض"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {request.status === "pending" && (
                                    <div className="flex justify-end gap-3">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDepositAction(request.id, "approve")}
                                        data-testid={`button-approve-deposit-${request.id}`}
                                        className="h-9 px-4 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 font-medium"
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        موافق
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDepositAction(request.id, "reject")}
                                        data-testid={`button-reject-deposit-${request.id}`}
                                        className="h-9 px-4 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 font-medium"
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        رفض
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="withdrawals" className="mt-0">
                <Card className="shadow-lg border-2 border-red-100 dark:border-red-800">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg">
                        <Wallet className="h-6 w-6 text-red-600 dark:text-red-300" />
                      </div>
                      طلبات السحب
                    </CardTitle>
                    <CardDescription className="text-base mt-2">مراجعة والموافقة على أو رفض طلبات السحب</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="rounded-lg border border-card-border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800">
                          <TableRow>
                            <TableHead className="font-semibold">اسم المستخدم</TableHead>
                            <TableHead className="text-right font-semibold">المبلغ</TableHead>
                            <TableHead className="font-semibold">العنوان</TableHead>
                            <TableHead className="font-semibold">التاريخ</TableHead>
                            <TableHead className="font-semibold">الحالة</TableHead>
                            <TableHead className="text-right font-semibold">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {withdrawRequests.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                لا توجد طلبات سحب
                              </TableCell>
                            </TableRow>
                          ) : (
                            withdrawRequests.map((request) => (
                              <TableRow key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <TableCell className="font-medium">{request.username}</TableCell>
                                <TableCell className="text-right font-mono font-bold text-red-600">
                                  £{(request.amount ?? 0).toLocaleString()}
                                </TableCell>
                                <TableCell className="font-mono text-xs max-w-32 truncate">{request.address}</TableCell>
                                <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Badge variant={request.status === "pending" ? "default" : request.status === "approved" ? "default" : "destructive"}>
                                    {request.status === "pending" ? "معلق" : request.status === "approved" ? "موافق عليه" : "مرفوض"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {request.status === "pending" && (
                                    <div className="flex justify-end gap-3">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleWithdrawAction(request.id, "approve")}
                                        data-testid={`button-approve-withdraw-${request.id}`}
                                        className="h-9 px-4 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 font-medium"
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        موافق
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleWithdrawAction(request.id, "reject")}
                                        data-testid={`button-reject-withdraw-${request.id}`}
                                        className="h-9 px-4 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 font-medium"
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        رفض
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recovery" className="mt-0">
                <Card className="shadow-lg border-2 border-purple-100 dark:border-purple-800">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                        <Link2 className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                      </div>
                      طلبات استرداد كلمة المرور
                    </CardTitle>
                    <CardDescription className="text-base mt-2">مراجعة وإنشاء روابط إعادة تعيين كلمة المرور</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {passwordRecoveryRequests.length === 0 ? (
                        <div className="py-12 text-center">
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg inline-block mb-4">
                            <Link2 className="h-12 w-12 text-gray-400 mx-auto" />
                          </div>
                          <p className="text-lg text-muted-foreground">لا توجد طلبات استرداد كلمة المرور</p>
                          <p className="text-sm text-muted-foreground mt-2">ستظهر طلبات الاسترداد هنا عندما يقدمها المستخدمون</p>
                        </div>
                      ) : (
                        passwordRecoveryRequests.map((request, index) => (
                          <div key={request.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">#{index + 1}</span>
                                  <div className="font-bold text-xl text-gray-900 dark:text-gray-100">{request.username}</div>
                                </div>
                                <div className="text-base text-gray-600 dark:text-gray-300 font-medium">{request.email}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  تاريخ التقديم: {new Date(request.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <Badge
                                variant={request.status === "pending" ? "default" : request.status === "approved" ? "default" : "destructive"}
                                className="text-sm px-3 py-1"
                              >
                                {request.status === "pending" ? "معلق" : request.status === "approved" ? "موافق عليه" : "مرفوض"}
                              </Badge>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">رسالة المستخدم:</span>
                              </div>
                              <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200">{request.message}</p>
                            </div>

                            {request.status === "pending" && (
                              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <Button
                                  onClick={() => handlePasswordRecoveryAction(request.id, "approve")}
                                  data-testid={`button-approve-recovery-${request.id}`}
                                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-6 py-3 text-base font-medium shadow-lg"
                                >
                                  <Link2 className="mr-2 h-5 w-5" />
                                  إنشاء رابط إعادة التعيين
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handlePasswordRecoveryAction(request.id, "reject")}
                                  data-testid={`button-reject-recovery-${request.id}`}
                                  className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 px-6 py-3 text-base font-medium"
                                >
                                  <X className="mr-2 h-5 w-5" />
                                  رفض الطلب
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="promo" className="mt-0">
                <Card className="shadow-lg border-2 border-purple-100 dark:border-purple-800">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                        <Gift className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                      </div>
                      إدارة أكواد الخصم
                    </CardTitle>
                    <CardDescription className="text-base mt-2">إنشاء وإدارة أكواد الخصم الترويجية</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label htmlFor="promoCode">كود الخصم</Label>
                          <Input
                            id="promoCode"
                            placeholder="WELCOME50"
                            value={newPromoCode}
                            onChange={(e) => setNewPromoCode(e.target.value)}
                            data-testid="input-promo-code"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="promoValue">القيمة</Label>
                          <Input
                            id="promoValue"
                            type="number"
                            placeholder="50"
                            value={newPromoValue}
                            onChange={(e) => setNewPromoValue(e.target.value)}
                            data-testid="input-promo-value"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="promoType">النوع</Label>
                          <select
                            id="promoType"
                            value={newPromoType}
                            onChange={(e) => setNewPromoType(e.target.value as "balance" | "percentage")}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="balance">رصيد (£)</option>
                            <option value="percentage">نسبة مئوية (%)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="promoLimit">حد الاستخدام</Label>
                          <Input
                            id="promoLimit"
                            type="number"
                            placeholder="100"
                            value={newPromoLimit}
                            onChange={(e) => setNewPromoLimit(e.target.value)}
                            data-testid="input-promo-limit"
                          />
                        </div>
                      </div>
                      <Button onClick={handleCreatePromoCode} data-testid="button-create-promo">
                        إنشاء كود خصم
                      </Button>

                      <div className="rounded-lg border border-card-border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50 dark:bg-slate-800">
                            <TableRow>
                              <TableHead className="font-semibold">الكود</TableHead>
                              <TableHead className="font-semibold">القيمة</TableHead>
                              <TableHead className="font-semibold">النوع</TableHead>
                              <TableHead className="text-right font-semibold">مستخدم/الحد</TableHead>
                              <TableHead className="font-semibold">الحالة</TableHead>
                              <TableHead className="text-right font-semibold">الإجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {promoCodes.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                  لم يتم إنشاء أكواد خصم
                                </TableCell>
                              </TableRow>
                            ) : (
                              promoCodes.map((promo) => (
                                <TableRow key={promo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                                  <TableCell>
                                    {promo.value}{promo.type === "percentage" ? "%" : "£"}
                                  </TableCell>
                                  <TableCell className="capitalize">{promo.type === "balance" ? "رصيد" : "نسبة مئوية"}</TableCell>
                                  <TableCell className="text-right">
                                    {promo.usedCount}/{promo.usageLimit}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={promo.isActive ? "default" : "destructive"}>
                                      {promo.isActive ? "نشط" : "غير نشط"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleTogglePromoCode(promo.id, promo.isActive)}
                                      data-testid={`button-toggle-promo-${promo.id}`}
                                    >
                                      {promo.isActive ? "تعطيل" : "تفعيل"}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="support" className="mt-0">
                <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-800">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                        <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                      </div>
                      إدارة الدعم الفني
                    </CardTitle>
                    <CardDescription className="text-base mt-2">إدارة تذاكر الدعم الفني والتواصل مع المستخدمين</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {supportTickets.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          لا توجد تذاكر دعم فني
                        </p>
                      ) : (
                        supportTickets.map((ticket) => (
                          <div key={ticket.id} className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="font-semibold text-lg">{ticket.subject}</div>
                                <div className="text-sm text-muted-foreground">من: {ticket.username}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(ticket.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <Badge variant={ticket.status === "open" ? "default" : ticket.status === "in_progress" ? "default" : "destructive"}>
                                {ticket.status === "open" ? "مفتوح" : ticket.status === "in_progress" ? "قيد المعالجة" : "مغلق"}
                              </Badge>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">الرسالة: </span>
                              <p className="text-sm mt-1">{ticket.message}</p>
                            </div>
                            {ticket.response && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">رد الإدارة: </span>
                                <p className="text-sm mt-1 text-green-800 dark:text-green-200">{ticket.response}</p>
                              </div>
                            )}
                            {ticket.status === "open" && (
                              <div className="flex gap-3 pt-2">
                                <Input
                                  placeholder="اكتب ردك..."
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleSupportResponse(ticket.id, e.currentTarget.value);
                                      e.currentTarget.value = "";
                                    }
                                  }}
                                  data-testid={`input-support-response-${ticket.id}`}
                                />
                                <Button
                                  onClick={() => {
                                    const input = document.querySelector(`[data-testid="input-support-response-${ticket.id}"]`) as HTMLInputElement;
                                    if (input?.value) {
                                      handleSupportResponse(ticket.id, input.value);
                                      input.value = "";
                                    }
                                  }}
                                  data-testid={`button-send-response-${ticket.id}`}
                                >
                                  إرسال الرد
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messaging" className="mt-0">
                <Card className="shadow-lg border-2 border-cyan-100 dark:border-cyan-800">
                  <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-cyan-100 dark:bg-cyan-800 rounded-lg">
                        <svg className="h-6 w-6 text-cyan-600 dark:text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      الإذاعة العامة والرسائل الخاصة
                    </CardTitle>
                    <CardDescription className="text-base mt-2">إرسال إشعارات لجميع المستخدمين أو لمستخدم محدد</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Tabs defaultValue="broadcast">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="broadcast">إذاعة عامة</TabsTrigger>
                        <TabsTrigger value="private">رسالة خاصة</TabsTrigger>
                      </TabsList>

                      <TabsContent value="broadcast" className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="broadcast-title">عنوان الإذاعة</Label>
                          <Input
                            id="broadcast-title"
                            placeholder="أدخل عنوان الإذاعة"
                            data-testid="input-broadcast-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="broadcast-message">نص الإذاعة</Label>
                          <textarea
                            id="broadcast-message"
                            placeholder="أدخل نص الإذاعة"
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            data-testid="input-broadcast-message"
                          />
                        </div>
                        <Button
                          onClick={async () => {
                            const title = (document.getElementById("broadcast-title") as HTMLInputElement).value;
                            const message = (document.getElementById("broadcast-message") as HTMLTextAreaElement).value;

                            if (!title || !message) {
                              toast({
                                title: "خطأ",
                                description: "يرجى ملء جميع الحقول",
                                variant: "destructive"
                              });
                              return;
                            }

                            try {
                              const response = await fetch("/api/broadcast", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ title, message })
                              });

                              if (response.ok) {
                                const data = await response.json();
                                toast({
                                  title: "تم إرسال الإذاعة",
                                  description: `تم إرسال الإذاعة إلى ${data.count} مستخدم بنجاح`
                                });
                                (document.getElementById("broadcast-title") as HTMLInputElement).value = "";
                                (document.getElementById("broadcast-message") as HTMLTextAreaElement).value = "";
                              }
                            } catch (error) {
                              toast({
                                title: "خطأ",
                                description: "فشل إرسال الإذاعة",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="w-full"
                          data-testid="button-send-broadcast"
                        >
                          إرسال الإذاعة لجميع المستخدمين
                        </Button>
                      </TabsContent>

                      <TabsContent value="private" className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="private-user">اسم المستخدم أو البريد الإلكتروني</Label>
                          <Input
                            id="private-user"
                            placeholder="أدخل اسم المستخدم أو البريد"
                            data-testid="input-private-user"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="private-title">عنوان الرسالة</Label>
                          <Input
                            id="private-title"
                            placeholder="أدخل عنوان الرسالة"
                            data-testid="input-private-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="private-message">نص الرسالة</Label>
                          <textarea
                            id="private-message"
                            placeholder="أدخل نص الرسالة"
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            data-testid="input-private-message"
                          />
                        </div>
                        <Button
                          onClick={async () => {
                            const usernameOrEmail = (document.getElementById("private-user") as HTMLInputElement).value;
                            const title = (document.getElementById("private-title") as HTMLInputElement).value;
                            const message = (document.getElementById("private-message") as HTMLTextAreaElement).value;

                            if (!usernameOrEmail || !title || !message) {
                              toast({
                                title: "خطأ",
                                description: "يرجى ملء جميع الحقول",
                                variant: "destructive"
                              });
                              return;
                            }

                            try {
                              const response = await fetch("/api/send-message", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ usernameOrEmail, title, message })
                              });

                              if (response.ok) {
                                toast({
                                  title: "تم إرسال الرسالة",
                                  description: "تم إرسال الرسالة بنجاح"
                                });
                                (document.getElementById("private-user") as HTMLInputElement).value = "";
                                (document.getElementById("private-title") as HTMLInputElement).value = "";
                                (document.getElementById("private-message") as HTMLTextAreaElement).value = "";
                              } else {
                                const data = await response.json();
                                toast({
                                  title: "خطأ",
                                  description: data.message || "المستخدم غير موجود",
                                  variant: "destructive"
                                });
                              }
                            } catch (error) {
                              toast({
                                title: "خطأ",
                                description: "فشل إرسال الرسالة",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="w-full"
                          data-testid="button-send-private"
                        >
                          إرسال الرسالة
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment-methods" className="mt-0">
                <Card className="shadow-lg border-2 border-purple-100 dark:border-purple-800">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                        <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                      </div>
                      إدارة طرق الدفع
                    </CardTitle>
                    <CardDescription className="text-base mt-2">إنشاء وإدارة طرق الإيداع والسحب المتاحة</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentMethodName">اسم الطريقة</Label>
                          <Input
                            id="paymentMethodName"
                            placeholder="Bitcoin"
                            value={newPaymentMethod.name}
                            onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                            data-testid="input-payment-method-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentMethodType">النوع</Label>
                          <select
                            id="paymentMethodType"
                            value={newPaymentMethod.type}
                            onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value as any })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="deposit">إيداع</option>
                            <option value="withdraw">سحب</option>
                            <option value="both">كلاهما</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minAmount">الحد الأدنى</Label>
                          <Input
                            id="minAmount"
                            type="number"
                            placeholder="10"
                            value={newPaymentMethod.minAmount}
                            onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, minAmount: parseFloat(e.target.value) })}
                            data-testid="input-payment-method-min-amount"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxAmount">الحد الأقصى</Label>
                          <Input
                            id="maxAmount"
                            type="number"
                            placeholder="100000"
                            value={newPaymentMethod.maxAmount}
                            onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, maxAmount: parseFloat(e.target.value) })}
                            data-testid="input-payment-method-max-amount"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentFee">الرسوم (%)</Label>
                          <Input
                            id="paymentFee"
                            type="number"
                            placeholder="0.5"
                            value={newPaymentMethod.fee}
                            onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, fee: parseFloat(e.target.value) })}
                            data-testid="input-payment-method-fee"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentNote">ملاحظة</Label>
                        <Textarea
                          id="paymentNote"
                          placeholder="رسوم شبكة قد تنطبق"
                          value={newPaymentMethod.note}
                          onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, note: e.target.value })}
                          data-testid="input-payment-method-note"
                          className="min-h-[120px]"
                          rows={5}
                        />
                      </div>
                      <Button onClick={handleCreatePaymentMethod} data-testid="button-create-payment-method">
                        إنشاء طريقة دفع
                      </Button>

                      <div className="rounded-lg border border-card-border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50 dark:bg-slate-800">
                            <TableRow>
                              <TableHead className="font-semibold">الاسم</TableHead>
                              <TableHead className="font-semibold">النوع</TableHead>
                              <TableHead className="text-right font-semibold">الحدود</TableHead>
                              <TableHead className="text-right font-semibold">الرسوم</TableHead>
                              <TableHead className="font-semibold">الحالة</TableHead>
                              <TableHead className="text-right font-semibold">الإجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paymentMethods.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                  لم يتم إنشاء طرق دفع
                                </TableCell>
                              </TableRow>
                            ) : (
                              paymentMethods.map((method) => (
                                <TableRow key={method.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <TableCell className="font-medium">{method.name}</TableCell>
                                  <TableCell className="capitalize">{method.type}</TableCell>
                                  <TableCell className="text-right">
                                    {method.minAmount} - {method.maxAmount} £
                                  </TableCell>
                                  <TableCell className="text-right">{method.fee}%</TableCell>
                                  <TableCell>
                                    <Badge variant={method.isActive ? "default" : "destructive"}>
                                      {method.isActive ? "نشط" : "غير نشط"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleTogglePaymentMethod(method.id, method.isActive)}
                                      data-testid={`button-toggle-payment-method-${method.id}`}
                                    >
                                      {method.isActive ? "تعطيل" : "تفعيل"}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeletePaymentMethod(method.id)}
                                      data-testid={`button-delete-payment-method-${method.id}`}
                                    >
                                      حذف
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>إعدادات النظام</CardTitle>
                    <CardDescription>
                      إدارة إعدادات النظام العامة
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="winRate" className="text-base font-semibold">
                            نسبة الربح للاعبين
                          </Label>
                          <Badge variant="outline" className="text-lg font-bold">
                            {winRate}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {winRate === 0 && "لا يوجد ربح - خسارة دائمة"}
                          {winRate > 0 && winRate < 30 && "نسبة ربح منخفضة جداً"}
                          {winRate >= 30 && winRate < 50 && "نسبة ربح منخفضة"}
                          {winRate >= 50 && winRate < 70 && "نسبة ربح متوسطة"}
                          {winRate >= 70 && winRate < 90 && "نسبة ربح عالية"}
                          {winRate >= 90 && winRate < 100 && "نسبة ربح عالية جداً"}
                          {winRate === 100 && "أرباح كثيرة - ربح دائم"}
                        </p>
                        <Slider
                          id="winRate"
                          min={0}
                          max={100}
                          step={1}
                          value={[winRate]}
                          onValueChange={(value) => setWinRate(value[0])}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0% (خسارة فقط)</span>
                          <span>50% (متوازن)</span>
                          <span>100% (ربح دائم)</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleSaveSettings} className="w-full">
                      حفظ الإعدادات
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}