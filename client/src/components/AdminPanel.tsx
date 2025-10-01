
import { useState, useEffect } from "react";
import { Users, Wallet, Settings, Search, Edit, Trash2, Check, X, Save, Link2, Shield, ShieldOff, Eye, EyeOff, Gift, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  totalWins: number;
  totalLosses: number;
  status: "active" | "suspended";
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

interface AdminPanelProps {
  users: User[];
  onEditBalance: (userId: string, newBalance: number) => void;
  onSuspendUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export default function AdminPanel({ users, onEditBalance, onSuspendUser, onDeleteUser }: AdminPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [passwordRecoveryRequests, setPasswordRecoveryRequests] = useState<Request[]>([]);
  const [depositRequests, setDepositRequests] = useState<Request[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<Request[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoValue, setNewPromoValue] = useState("");
  const [newPromoType, setNewPromoType] = useState<"balance" | "percentage">("balance");
  const [newPromoLimit, setNewPromoLimit] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchPaymentSettings(),
        fetchPasswordRecoveryRequests(),
        fetchDepositRequests(),
        fetchWithdrawRequests(),
        fetchPromoCodes(),
        fetchSupportTickets(),
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
        const data = await response.json();
        setSupportTickets(data);
      }
    } catch (error) {
      console.error("Failed to fetch support tickets:", error);
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

  const handleUpdatePaymentSettings = async () => {
    if (!paymentSettings) return;

    try {
      const response = await fetch("/api/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentSettings),
      });

      if (response.ok) {
        toast({
          title: "Settings updated",
          description: "Payment settings have been successfully updated",
        });
      } else {
        toast({
          title: "Update failed",
          description: "Could not update payment settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const generateResetLink = (userId: string) => {
    const resetToken = btoa(`${userId}:${Date.now()}`);
    return `${window.location.origin}/reset-password?token=${resetToken}`;
  };

  const handlePasswordRecoveryAction = async (id: string, action: "approve" | "reject") => {
    try {
      const request = passwordRecoveryRequests.find(r => r.id === id);
      if (!request) return;

      let resetLink = "";
      if (action === "approve") {
        resetLink = generateResetLink(request.userId!);
      }

      const response = await fetch(`/api/password-recovery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: action === "approve" ? "approved" : "rejected",
          resetLink: resetLink
        }),
      });

      if (response.ok) {
        if (action === "approve") {
          // Copy reset link to clipboard
          navigator.clipboard.writeText(resetLink);
          toast({
            title: "Reset link generated",
            description: `Reset link copied to clipboard. Send this to ${request.email}`,
          });
        } else {
          toast({
            title: "Request rejected",
            description: "Password recovery request has been rejected",
          });
        }
        fetchPasswordRecoveryRequests();
      }
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
          fetchUsers(); // Refresh user data after balance update
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
          fetchUsers(); // Refresh user data after balance update
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

  const displayUsers = allUsers.length > 0 ? allUsers : users;
  const filteredUsers = displayUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBalance = displayUsers.reduce((sum, user) => sum + user.balance, 0);
  const activeUsers = displayUsers.filter((u) => u.status === "active").length;
  const suspendedUsers = displayUsers.filter((u) => u.status === "suspended").length;
  const pendingRequests = depositRequests.filter((r) => r.status === "pending").length +
    withdrawRequests.filter((r) => r.status === "pending").length +
    passwordRecoveryRequests.filter((r) => r.status === "pending").length +
    supportTickets.filter((t) => t.status === "open").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6" data-testid="admin-panel">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted-foreground mt-2">Manage users, payments, and platform settings</p>
          </div>
          <Button 
            onClick={fetchAllData} 
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100" data-testid="stat-total-users">
                {displayUsers.length}
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {activeUsers} active • {suspendedUsers} suspended
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Balance</CardTitle>
              <Wallet className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100" data-testid="stat-total-balance">
                £{totalBalance.toLocaleString()}
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">Across all accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending Requests</CardTitle>
              <Settings className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                {pendingRequests}
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-400">Require attention</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Today's Activity</CardTitle>
              <Eye className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {depositRequests.length + withdrawRequests.length}
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-400">Total transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
            <TabsList className="grid w-full grid-cols-8 bg-slate-100 dark:bg-slate-700 rounded-lg p-2 gap-2">
              <TabsTrigger value="overview" data-testid="tab-overview" className="rounded-md py-3 font-medium transition-all duration-200">Overview</TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users" className="rounded-md py-3 font-medium transition-all duration-200">Users</TabsTrigger>
              <TabsTrigger value="deposits" data-testid="tab-deposits" className="rounded-md py-3 font-medium transition-all duration-200">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals" data-testid="tab-withdrawals" className="rounded-md py-3 font-medium transition-all duration-200">Withdrawals</TabsTrigger>
              <TabsTrigger value="recovery" data-testid="tab-recovery" className="rounded-md py-3 font-medium transition-all duration-200">Recovery</TabsTrigger>
              <TabsTrigger value="promo" data-testid="tab-promo" className="rounded-md py-3 font-medium transition-all duration-200">Promo Codes</TabsTrigger>
              <TabsTrigger value="support" data-testid="tab-support" className="rounded-md py-3 font-medium transition-all duration-200">Support</TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings" className="rounded-md py-3 font-medium transition-all duration-200">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Recent Users
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
                            {user.status}
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
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...depositRequests, ...withdrawRequests].slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div>
                          <p className="font-medium">{request.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {depositRequests.includes(request) ? "Deposit" : "Withdrawal"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold">£{request.amount?.toLocaleString()}</p>
                          <Badge variant={request.status === "pending" ? "default" : request.status === "approved" ? "default" : "destructive"} className="text-xs">
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-800">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  User Management
                </CardTitle>
                <CardDescription className="text-base mt-2">View and manage user accounts, balances, and status</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="mb-8">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by username or email..."
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
                        <TableHead className="font-semibold">Username</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="text-right font-semibold">Balance</TableHead>
                        <TableHead className="text-right font-semibold">Wins/Losses</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No users found
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
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newBalance = prompt("Enter new balance:", user.balance.toString());
                                    if (newBalance) onEditBalance(user.id, parseFloat(newBalance));
                                  }}
                                  data-testid={`button-edit-${user.id}`}
                                  className="h-9 px-3 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
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
                                      Suspend
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="h-4 w-4 mr-1" />
                                      Activate
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
                                  Delete
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

          <TabsContent value="deposits">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  Deposit Requests
                </CardTitle>
                <CardDescription>Approve or reject deposit requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-card-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800">
                      <TableRow>
                        <TableHead className="font-semibold">Username</TableHead>
                        <TableHead className="text-right font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {depositRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No deposit requests
                          </TableCell>
                        </TableRow>
                      ) : (
                        depositRequests.map((request) => (
                          <TableRow key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableCell className="font-medium">{request.username}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-green-600">
                              £{request.amount?.toLocaleString()}
                            </TableCell>
                            <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={request.status === "pending" ? "default" : request.status === "approved" ? "default" : "destructive"}>
                                {request.status}
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
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDepositAction(request.id, "reject")}
                                    data-testid={`button-reject-deposit-${request.id}`}
                                    className="h-9 px-4 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 font-medium"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
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

          <TabsContent value="withdrawals">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-red-600" />
                  Withdrawal Requests
                </CardTitle>
                <CardDescription>Approve or reject withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-card-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800">
                      <TableRow>
                        <TableHead className="font-semibold">Username</TableHead>
                        <TableHead className="text-right font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Address</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No withdrawal requests
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawRequests.map((request) => (
                          <TableRow key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableCell className="font-medium">{request.username}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-red-600">
                              £{request.amount?.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-mono text-xs max-w-32 truncate">{request.address}</TableCell>
                            <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={request.status === "pending" ? "default" : request.status === "approved" ? "default" : "destructive"}>
                                {request.status}
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
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleWithdrawAction(request.id, "reject")}
                                    data-testid={`button-reject-withdraw-${request.id}`}
                                    className="h-9 px-4 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 font-medium"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
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

          <TabsContent value="recovery" className="space-y-6">
            <Card className="shadow-lg border-2 border-purple-100 dark:border-purple-800">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                    <Link2 className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  Password Recovery Requests
                </CardTitle>
                <CardDescription className="text-base mt-2">Review and generate reset links for password recovery</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {passwordRecoveryRequests.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg inline-block mb-4">
                        <Link2 className="h-12 w-12 text-gray-400 mx-auto" />
                      </div>
                      <p className="text-lg text-muted-foreground">No password recovery requests</p>
                      <p className="text-sm text-muted-foreground mt-2">Recovery requests will appear here when users submit them</p>
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
                              Submitted: {new Date(request.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <Badge 
                            variant={request.status === "pending" ? "default" : request.status === "approved" ? "default" : "destructive"}
                            className="text-sm px-3 py-1"
                          >
                            {request.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">User Message:</span>
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
                              Generate Reset Link
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handlePasswordRecoveryAction(request.id, "reject")}
                              data-testid={`button-reject-recovery-${request.id}`}
                              className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 px-6 py-3 text-base font-medium"
                            >
                              <X className="mr-2 h-5 w-5" />
                              Reject Request
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

          <TabsContent value="promo">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-purple-600" />
                  Promo Code Management
                </CardTitle>
                <CardDescription>Create and manage promotional codes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="promoCode">Promo Code</Label>
                      <Input
                        id="promoCode"
                        placeholder="WELCOME50"
                        value={newPromoCode}
                        onChange={(e) => setNewPromoCode(e.target.value)}
                        data-testid="input-promo-code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promoValue">Value</Label>
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
                      <Label htmlFor="promoType">Type</Label>
                      <select 
                        id="promoType"
                        value={newPromoType}
                        onChange={(e) => setNewPromoType(e.target.value as "balance" | "percentage")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="balance">Balance (£)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promoLimit">Usage Limit</Label>
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
                    Create Promo Code
                  </Button>

                  <div className="rounded-lg border border-card-border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-800">
                        <TableRow>
                          <TableHead className="font-semibold">Code</TableHead>
                          <TableHead className="font-semibold">Value</TableHead>
                          <TableHead className="font-semibold">Type</TableHead>
                          <TableHead className="text-right font-semibold">Used/Limit</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {promoCodes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No promo codes created
                            </TableCell>
                          </TableRow>
                        ) : (
                          promoCodes.map((promo) => (
                            <TableRow key={promo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                              <TableCell>
                                {promo.value}{promo.type === "percentage" ? "%" : "£"}
                              </TableCell>
                              <TableCell className="capitalize">{promo.type}</TableCell>
                              <TableCell className="text-right">
                                {promo.usedCount}/{promo.usageLimit}
                              </TableCell>
                              <TableCell>
                                <Badge variant={promo.isActive ? "default" : "destructive"}>
                                  {promo.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTogglePromoCode(promo.id, promo.isActive)}
                                  data-testid={`button-toggle-promo-${promo.id}`}
                                >
                                  {promo.isActive ? "Disable" : "Enable"}
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

          <TabsContent value="support">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  Support Management
                </CardTitle>
                <CardDescription>Manage user support tickets and communications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No support tickets
                    </p>
                  ) : (
                    supportTickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="font-semibold text-lg">{ticket.subject}</div>
                            <div className="text-sm text-muted-foreground">From: {ticket.username}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(ticket.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <Badge variant={ticket.status === "open" ? "default" : ticket.status === "in_progress" ? "default" : "destructive"}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                          <span className="text-sm font-medium text-muted-foreground">Message: </span>
                          <p className="text-sm mt-1">{ticket.message}</p>
                        </div>
                        {ticket.response && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">Admin Response: </span>
                            <p className="text-sm mt-1 text-green-800 dark:text-green-200">{ticket.response}</p>
                          </div>
                        )}
                        {ticket.status === "open" && (
                          <div className="flex gap-3 pt-2">
                            <Input
                              placeholder="Type your response..."
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
                              Send Response
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

          <TabsContent value="settings">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Payment Settings
                </CardTitle>
                <CardDescription>Configure payment fees, limits, and addresses</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentSettings && (
                  <div className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="depositFee">Deposit Fee (%)</Label>
                        <Input
                          id="depositFee"
                          type="number"
                          value={paymentSettings.depositFee}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, depositFee: parseFloat(e.target.value) })}
                          data-testid="input-deposit-fee"
                          className="bg-white dark:bg-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="withdrawFee">Withdraw Fee (%)</Label>
                        <Input
                          id="withdrawFee"
                          type="number"
                          value={paymentSettings.withdrawFee}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, withdrawFee: parseFloat(e.target.value) })}
                          data-testid="input-withdraw-fee"
                          className="bg-white dark:bg-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minDeposit">Min Deposit (£)</Label>
                        <Input
                          id="minDeposit"
                          type="number"
                          value={paymentSettings.minDeposit}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, minDeposit: parseFloat(e.target.value) })}
                          data-testid="input-min-deposit"
                          className="bg-white dark:bg-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxDeposit">Max Deposit (£)</Label>
                        <Input
                          id="maxDeposit"
                          type="number"
                          value={paymentSettings.maxDeposit}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, maxDeposit: parseFloat(e.target.value) })}
                          data-testid="input-max-deposit"
                          className="bg-white dark:bg-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minWithdraw">Min Withdraw (£)</Label>
                        <Input
                          id="minWithdraw"
                          type="number"
                          value={paymentSettings.minWithdraw}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, minWithdraw: parseFloat(e.target.value) })}
                          data-testid="input-min-withdraw"
                          className="bg-white dark:bg-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxWithdraw">Max Withdraw (£)</Label>
                        <Input
                          id="maxWithdraw"
                          type="number"
                          value={paymentSettings.maxWithdraw}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, maxWithdraw: parseFloat(e.target.value) })}
                          data-testid="input-max-withdraw"
                          className="bg-white dark:bg-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Input
                          id="paymentMethod"
                          type="text"
                          value={paymentSettings.paymentMethod}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, paymentMethod: e.target.value })}
                          data-testid="input-payment-method"
                          className="bg-white dark:bg-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="depositAddress">Deposit Address</Label>
                        <Input
                          id="depositAddress"
                          type="text"
                          value={paymentSettings.depositAddress}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, depositAddress: e.target.value })}
                          data-testid="input-deposit-address"
                          className="bg-white dark:bg-slate-800"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleUpdatePaymentSettings} 
                      data-testid="button-save-settings"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
