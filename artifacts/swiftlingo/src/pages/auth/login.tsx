import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login, user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [initData, setInitData] = useState('mock_dev_init_data');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Auto-login via Telegram WebApp if available
  useEffect(() => {
    if (window.Telegram?.WebApp?.initData && !user) {
      setIsLoading(true);
      login(window.Telegram.WebApp.initData)
        .catch(err => {
          console.error(err);
          setError("Telegram Auth failed");
        })
        .finally(() => setIsLoading(false));
    }
  }, [login, user]);

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(initData);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (window.Telegram?.WebApp?.initData) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">SwiftLingo</CardTitle>
          <CardDescription>{t('login_dev')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDevLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initData">Init Data (Dev Mode)</Label>
              <Input 
                id="initData" 
                value={initData} 
                onChange={(e) => setInitData(e.target.value)}
                placeholder="Enter mock init data"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
