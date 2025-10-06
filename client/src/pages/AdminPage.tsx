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
    if (confirm("Are you sure you want to delete this user? All related data will be permanently removed.")) {
      try {
        const currentUserId = localStorage.getItem("userId");
        
        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setUsers((prev) => prev.filter((user) => user.id !== userId));
          
          if (currentUserId === userId) {
            localStorage.clear();
            toast({
              title: "Account deleted",
              description: "Your account has been deleted. You will be logged out.",
            });
            setTimeout(() => {
              setLocation("/login");
            }, 1500);
          } else {
            toast({
              title: "User deleted",
              description: "User and all related data have been removed from the system",
            });
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to delete user",
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
