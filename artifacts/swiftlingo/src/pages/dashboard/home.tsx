import { useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PlusCircle, Search, FileText, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const { data: dashboard, isLoading } = useGetDashboard({
    query: {
      queryKey: getGetDashboardQueryKey()
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isClient = user?.role === 'client';

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Hello, {user?.firstName || user?.username || 'User'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isClient ? "Manage your translation projects" : "Find translation jobs"}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {isClient ? (
          <Link href="/jobs/new">
            <Card className="hover-elevate cursor-pointer transition-all border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex flex-col items-center justify-center space-y-2 text-center h-24">
                <PlusCircle className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{t('post_job')}</span>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link href="/jobs">
            <Card className="hover-elevate cursor-pointer transition-all border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex flex-col items-center justify-center space-y-2 text-center h-24">
                <Search className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{t('browse_jobs')}</span>
              </CardContent>
            </Card>
          </Link>
        )}
        
        <Link href="/contracts">
          <Card className="hover-elevate cursor-pointer transition-all">
            <CardContent className="p-4 flex flex-col items-center justify-center space-y-2 text-center h-24">
              <FileText className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">{t('contracts')}</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Active Jobs/Contracts summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Active Contracts</h2>
          <Link href="/contracts" className="text-sm text-primary font-medium">View all</Link>
        </div>
        
        {dashboard?.activeContracts && dashboard.activeContracts.length > 0 ? (
          <div className="space-y-3">
            {dashboard.activeContracts.slice(0, 3).map(contract => (
              <Link key={contract.id} href={`/contracts/${contract.id}`}>
                <Card className="hover-elevate transition-all border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none truncate max-w-[200px]">
                        {contract.job?.title || "Untitled Job"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">{contract.status.replace('_', ' ')}</Badge>
                        <span>${contract.agreedPrice}</span>
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground opacity-50" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center">
              <FileText className="h-8 w-8 mb-2 opacity-20" />
              <p>No active contracts.</p>
              {isClient ? (
                <Button variant="link" className="mt-2 text-primary p-0" asChild>
                  <Link href="/jobs/new">Post a job to get started</Link>
                </Button>
              ) : (
                <Button variant="link" className="mt-2 text-primary p-0" asChild>
                  <Link href="/jobs">Browse available jobs</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
