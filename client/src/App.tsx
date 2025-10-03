import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GamePage from "@/pages/GamePage";
import AdminPage from "@/pages/AdminPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import PasswordRecoveryPage from "@/pages/PasswordRecoveryPage";
import DepositsManagementPage from "@/pages/DepositsManagementPage";
import WithdrawalsManagementPage from "@/pages/WithdrawalsManagementPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/password-recovery" component={PasswordRecoveryPage} />
      <Route path="/" component={GamePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/deposits" component={DepositsManagementPage} />
      <Route path="/admin/withdrawals" component={WithdrawalsManagementPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;