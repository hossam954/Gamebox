
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, X, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface DepositRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  paymentMethodId: string | null;
  transactionNumber: string | null;
  status: string;
  createdAt: Date;
}

export default function DepositsManagementPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    if (!isAdmin) {
      setLocation("/");
    } else {
      fetchData();
    }
  }, [setLocation]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [depositsRes, methodsRes] = await Promise.all([
        fetch("/api/deposit"),
        fetch("/api/payment-methods")
      ]);
      
      if (depositsRes.ok) {
        const data = await depositsRes.json();
        setDepositRequests(data);
      }
      
      if (methodsRes.ok) {
        const data = await methodsRes.json();
        setPaymentMethods(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
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
          title: `تم ${action === "approve" ? "قبول" : "رفض"} الطلب`,
          description: `تم ${action === "approve" ? "قبول" : "رفض"} طلب الإيداع بنجاح`,
        });
        fetchData();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ ما",
        variant: "destructive",
      });
    }
  };

  const getPaymentMethodName = (methodId: string | null) => {
    if (!methodId) return "غير محدد";
    const method = paymentMethods.find(m => m.id === methodId);
    return method?.name || "غير محدد";
  };

  const pendingRequests = depositRequests.filter(r => r.status === "pending");
  const approvedRequests = depositRequests.filter(r => r.status === "approved");
  const rejectedRequests = depositRequests.filter(r => r.status === "rejected");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation("/admin")}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة للوحة التحكم
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              إدارة طلبات الإيداع
            </h1>
            <p className="text-muted-foreground mt-1">مراجعة والموافقة على طلبات الإيداع</p>
          </div>
          <Button onClick={fetchData} disabled={isLoading}>
            {isLoading ? "جاري التحديث..." : "تحديث"}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardTitle className="flex items-center gap-3">
              <Wallet className="h-6 w-6 text-green-600" />
              طلبات الإيداع
            </CardTitle>
            <CardDescription>جميع طلبات الإيداع مصنفة حسب الحالة</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="pending">
                  قيد الانتظار ({pendingRequests.length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  موافق عليها ({approvedRequests.length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  مرفوضة ({rejectedRequests.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المستخدم</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead>طريقة الدفع</TableHead>
                      <TableHead>رقم العملية</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          لا توجد طلبات قيد الانتظار
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.username}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-green-600">
                            £{request.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{getPaymentMethodName(request.paymentMethodId)}</TableCell>
                          <TableCell className="font-mono">{request.transactionNumber || "-"}</TableCell>
                          <TableCell>{new Date(request.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDepositAction(request.id, "approve")}
                                className="bg-green-50 hover:bg-green-100 text-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                موافقة
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDepositAction(request.id, "reject")}
                                className="bg-red-50 hover:bg-red-100 text-red-700"
                              >
                                <X className="h-4 w-4 mr-1" />
                                رفض
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="approved">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المستخدم</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead>طريقة الدفع</TableHead>
                      <TableHead>رقم العملية</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          لا توجد طلبات موافق عليها
                        </TableCell>
                      </TableRow>
                    ) : (
                      approvedRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.username}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-green-600">
                            £{request.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{getPaymentMethodName(request.paymentMethodId)}</TableCell>
                          <TableCell className="font-mono">{request.transactionNumber || "-"}</TableCell>
                          <TableCell>{new Date(request.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="rejected">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المستخدم</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead>طريقة الدفع</TableHead>
                      <TableHead>رقم العملية</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          لا توجد طلبات مرفوضة
                        </TableCell>
                      </TableRow>
                    ) : (
                      rejectedRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.username}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-red-600">
                            £{request.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{getPaymentMethodName(request.paymentMethodId)}</TableCell>
                          <TableCell className="font-mono">{request.transactionNumber || "-"}</TableCell>
                          <TableCell>{new Date(request.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
