import { useState } from "react";
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
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'abodiab',
      email: 'abojafar1327@gmail.com',
      balance: 50000,
      totalWins: 45,
      totalLosses: 23,
      status: 'active',
    },
    {
      id: '2',
      username: 'player123',
      email: 'player123@example.com',
      balance: 10500,
      totalWins: 12,
      totalLosses: 8,
      status: 'active',
    },
    {
      id: '3',
      username: 'lucky_gamer',
      email: 'lucky@example.com',
      balance: 25000,
      totalWins: 78,
      totalLosses: 34,
      status: 'active',
    },
  ]);

  const handleEditBalance = (userId: string, newBalance: number) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, balance: newBalance } : user
      )
    );
    toast({
      title: "Balance updated",
      description: `User balance updated to $${newBalance.toLocaleString()}`,
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

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      toast({
        title: "User deleted",
        description: "User has been removed from the system",
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
