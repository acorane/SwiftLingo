import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";
import AppLayout from "@/components/layout/app-layout";
import Login from "@/pages/auth/login";
import Home from "@/pages/dashboard/home";
import JobsList from "@/pages/jobs/jobs-list";
import JobDetail from "@/pages/jobs/job-detail";
import PostJob from "@/pages/jobs/post-job";
import ContractsList from "@/pages/contracts/contracts-list";
import ContractDetail from "@/pages/contracts/contract-detail";
import Profile from "@/pages/profile/profile";
import TranslatorApply from "@/pages/profile/translator-apply";
import Notifications from "@/pages/notifications/notifications";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, path }: { component: any, path: string }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <Route path={path}>
      <AppLayout>
        <Component />
      </AppLayout>
    </Route>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes */}
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/jobs" component={JobsList} />
      <ProtectedRoute path="/jobs/new" component={PostJob} />
      <ProtectedRoute path="/jobs/:jobId" component={JobDetail} />
      <ProtectedRoute path="/contracts" component={ContractsList} />
      <ProtectedRoute path="/contracts/:contractId" component={ContractDetail} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/profile/translator-apply" component={TranslatorApply} />
      <ProtectedRoute path="/notifications" component={Notifications} />
      
      <Route>
        <AppLayout>
          <NotFound />
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  // Telegram initialization
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
