import { useState, useEffect } from "react";
import { Users, Wallet, Settings, Search, Edit, Trash2, Check, X, Save } from "lucide-react";
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

interface AdminPanelProps {
  users: User[];
  onEditBalance: (userId: string, newBalance: number) => void;
  onSuspendUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export default function AdminPanel({ users, onEditBalance, onSuspendUser, onDeleteUser }: AdminPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [passwordRecoveryRequests, setPasswordRecoveryRequests] = useState<Request[]>([]);
  const [depositRequests, setDepositRequests] = useState<Request[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<Request[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentSettings();
    fetchPasswordRecoveryRequests();
    fetchDepositRequests();
    fetchWithdrawRequests();
  }, []);

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

  const handlePasswordRecoveryAction = async (id: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/password-recovery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "approve" ? "approved" : "rejected" }),
      });

      if (response.ok) {
        toast({
          title: `Request ${action}d`,
          description: `Password recovery request has been ${action}d`,
        });
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
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBalance = users.reduce((sum, user) => sum + user.balance, 0);
  const activeUsers = users.filter((u) => u.status === "active").length;

  return (
    <div className="min-h-screen bg-background p-6" data-testid="admin-panel">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, payments, and platform settings</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-users">
                {users.length}
              </div>
              <p className="text-xs text-muted-foreground">{activeUsers} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-balance">
                £{totalBalance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Across all accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {depositRequests.filter((r) => r.status === "pending").length +
                  withdrawRequests.filter((r) => r.status === "pending").length +
                  passwordRecoveryRequests.filter((r) => r.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="deposits" data-testid="tab-deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="recovery" data-testid="tab-recovery">Password Recovery</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by username or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-users"
                    />
                  </div>
                </div>

                <div className="rounded-md border border-card-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Wins/Losses</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className="text-right font-mono">
                              £{user.balance.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-success">{user.totalWins}</span> /{" "}
                              <span className="text-destructive">{user.totalLosses}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.status === "active" ? "default" : "destructive"}>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    const newBalance = prompt("Enter new balance:", user.balance.toString());
                                    if (newBalance) onEditBalance(user.id, parseFloat(newBalance));
                                  }}
                                  data-testid={`button-edit-${user.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => onSuspendUser(user.id)}
                                  data-testid={`button-suspend-${user.id}`}
                                >
                                  <Wallet className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => onDeleteUser(user.id)}
                                  data-testid={`button-delete-${user.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
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
            <Card>
              <CardHeader>
                <CardTitle>Deposit Requests</CardTitle>
                <CardDescription>Approve or reject deposit requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-card-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {depositRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No deposit requests
                          </TableCell>
                        </TableRow>
                      ) : (
                        depositRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.username}</TableCell>
                            <TableCell className="text-right font-mono">£{request.amount?.toLocaleString()}</TableCell>
                            <TableCell>{new Date(request.createdAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={request.status === "pending" ? "default" : request.status === "approved" ? "default" : "destructive"}>
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {request.status === "pending" && (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDepositAction(request.id, "approve")}
                                    data-testid={`button-approve-deposit-${request.id}`}
                                  >
                                    <Check className="h-4 w-4 text-success" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDepositAction(request.id, "reject")}
                                    data-testid={`button-reject-deposit-${request.id}`}
                                  >
                                    <X className="h-4 w-4 text-destructive" />
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
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
                <CardDescription>Approve or reject withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-card-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No withdrawal requests
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.username}</TableCell>
                            <TableCell className="text-right font-mono">£{request.amount?.toLocaleString()}</TableCell>
                            <TableCell className="font-mono text-xs">{request.address}</TableCell>
                            <TableCell>{new Date(request.createdAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={request.status === "pending" ? "default" : request.status === "approved" ? "default" : "destructive"}>
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {request.status === "pending" && (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleWithdrawAction(request.id, "approve")}
                                    data-testid={`button-approve-withdraw-${request.id}`}
                                  >
                                    <Check className="h-4 w-4 text-success" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleWithdrawAction(request.id, "reject")}
                                    data-testid={`button-reject-withdraw-${request.id}`}
                                  >
                                    <X className="h-4 w-4 text-destructive" />
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

          <TabsContent value="recovery">
            <Card>
              <CardHeader>
                <CardTitle>Password Recovery Requests</CardTitle>
                <CardDescription>Review and approve password recovery requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {passwordRecoveryRequests.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No password recovery requests
                    </p>
                  ) : (
                    passwordRecoveryRequests.map((request) => (
                      <div key={request.id} className="rounded-md border border-card-border bg-card p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-medium">{request.username}</div>
                            <div className="text-sm text-muted-foreground">{request.email}</div>
                            <div className="text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</div>
                          </div>
                          <Badge variant={request.status === "pending" ? "default" : request.status === "approved" ? "default" : "destructive"}>
                            {request.status}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Message: </span>
                          {request.message}
                        </div>
                        {request.status === "pending" && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handlePasswordRecoveryAction(request.id, "approve")}
                              data-testid={`button-approve-recovery-${request.id}`}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePasswordRecoveryAction(request.id, "reject")}
                              data-testid={`button-reject-recovery-${request.id}`}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Reject
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
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Configure payment fees, limits, and addresses</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentSettings && (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="depositFee">Deposit Fee (%)</Label>
                        <Input
                          id="depositFee"
                          type="number"
                          value={paymentSettings.depositFee}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, depositFee: parseFloat(e.target.value) })}
                          data-testid="input-deposit-fee"
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
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Default Payment Method</Label>
                      <Input
                        id="paymentMethod"
                        type="text"
                        value={paymentSettings.paymentMethod}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, paymentMethod: e.target.value })}
                        data-testid="input-payment-method"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availablePaymentMethods">Available Payment Methods (JSON array)</Label>
                      <Input
                        id="availablePaymentMethods"
                        type="text"
                        value={paymentSettings.availablePaymentMethods || '["Bank Transfer", "Cryptocurrency", "PayPal"]'}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, availablePaymentMethods: e.target.value })}
                        data-testid="input-available-payment-methods"
                        placeholder='["Bank Transfer", "Cryptocurrency", "PayPal"]'
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
                      />
                    </div>

                    <Button onClick={handleUpdatePaymentSettings} data-testid="button-save-settings">
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
