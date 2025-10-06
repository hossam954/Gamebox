import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AdminPanel from "@/components/AdminPanel";
import { useToast } from "@/hooks/use-toast";

type UserStatus = "active" | "suspended";

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  totalWins: number;
  totalLosses: number;
  status: UserStatus;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    if (!isAdmin) {
      setLocation("/");
    }
  }, [setLocation]);

  const handleEditBalance = async (userId: string, newBalance: number) => {
    try {
      const response = await fetch(`/api/users/${userId}/balance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: newBalance }),
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, balance: newBalance } : user
          )
        );
        toast({
          title: "تم تحديث الرصيد",
          description: `تم تحديث رصيد المستخدم إلى £${newBalance.toLocaleString()}`,
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل تحديث الرصيد",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الرصيد",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.status === "active" ? "suspended" : "active";

    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, status: newStatus as UserStatus } : u
          )
        );
        toast({
          title: "تم تحديث حالة المستخدم",
          description: newStatus === "active" ? "تم تفعيل المستخدم" : "تم تعليق المستخدم",
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل تحديث حالة المستخدم",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة المستخدم",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        setUsers((prev) => prev.filter((user) => user.id !== userId));

        // التحقق إذا كان المستخدم المحذوف هو المستخدم الحالي
        const currentUserId = localStorage.getItem("userId");
        if (currentUserId === data.userId) {
          // تسجيل خروج فوري
          localStorage.clear();
          toast({
            title: "تم حذف حسابك",
            description: "تم حذف حسابك من قبل المسؤول. سيتم تسجيل خروجك الآن.",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          toast({
            title: "تم حذف المستخدم",
            description: "تم حذف المستخدم بنجاح",
          });
        }
      } else {
        toast({
          title: "خطأ",
          description: "فشل حذف المستخدم",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المستخدم",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminPanel
      users={users}
      onEditBalance={handleEditBalance}
      onSuspendUser={handleSuspendUser}
      onDeleteUser={handleDeleteUser}
    />
  );
}