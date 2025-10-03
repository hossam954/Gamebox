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

  const handleEditBalance = (userId: string, newBalance: number) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, balance: newBalance } : user
      )
    );
    toast({
      title: "Balance updated",
      description: `User balance updated to £${newBalance.toLocaleString()}`,
    });
  };

  const handleSuspendUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, status: (user.status === "active" ? "suspended" : "active") as UserStatus }
          : user
      )
    );
    toast({
      title: "User status updated",
      description: "User status has been changed",
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user? All related data will be permanently removed.")) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setUsers((prev) => prev.filter((user) => user.id !== userId));
          toast({
            title: "User deleted",
            description: "User and all related data have been removed from the system",
          });
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
