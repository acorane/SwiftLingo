import { useAuth } from "@/lib/auth";
import { useGetMyTranslatorProfile, useGetMyTranslatorApplication, useListMyBids, useUpdateMe, getGetMeQueryKey, getGetMyTranslatorProfileQueryKey, getGetMyTranslatorApplicationQueryKey, getListMyBidsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { Star, Briefcase, ChevronRight, LogOut, UserCog, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const applicationStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
};

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const updateMe = useUpdateMe();

  const { data: translatorProfile, isLoading: profileLoading } = useGetMyTranslatorProfile({
    query: {
      enabled: user?.role === "translator",
      queryKey: getGetMyTranslatorProfileQueryKey()
    }
  });

  const { data: application, isLoading: appLoading } = useGetMyTranslatorApplication({
    query: {
      queryKey: getGetMyTranslatorApplicationQueryKey(),
    }
  });

  const { data: myBids } = useListMyBids({
    query: { queryKey: getListMyBidsQueryKey() }
  });

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("") || user?.username?.[0]?.toUpperCase() || "U";

  const handleSwitchRole = async () => {
    const newRole = user?.role === "client" ? "translator" : "client";
    try {
      await updateMe.mutateAsync({ data: { role: newRole as any } });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: `Switched to ${newRole} mode` });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  if (!user) return <Skeleton className="h-48 w-full" />;

  const pendingBids = Array.isArray(myBids) ? (myBids as any[]).filter((b: any) => b.status === "pending") : [];
  const acceptedBids = Array.isArray(myBids) ? (myBids as any[]).filter((b: any) => b.status === "accepted") : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("profile")}</h1>

      {/* User Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {user.profilePhotoUrl && <AvatarImage src={user.profilePhotoUrl} />}
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold truncate">
                {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "User"}
              </h2>
              {user.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === "translator" ? "default" : "secondary"} className="text-[10px]">
                  {user.role}
                </Badge>
                {user.isTranslatorApproved && (
                  <Badge variant="default" className="text-[10px] bg-green-600">Verified</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Translator Stats */}
      {user.role === "translator" && !profileLoading && translatorProfile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("translator_stats")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">
                {(translatorProfile as any).rating ? (translatorProfile as any).rating.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5">
                <Star className="h-3 w-3" /> {t("rating")}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{(translatorProfile as any).completedJobsCount ?? 0}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5">
                <Briefcase className="h-3 w-3" /> {t("jobs_done")}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">${(translatorProfile as any).pricePerWord ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{t("per_word")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Bids Summary (translator) */}
      {user.role === "translator" && Array.isArray(myBids) && (myBids as any[]).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("my_bids")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{pendingBids.length}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" /> {t("pending")}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{acceptedBids.length}</p>
              <p className="text-xs text-muted-foreground">{t("accepted")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Translator Application Status */}
      {user.role === "translator" && (
        <Card>
          <CardContent className="p-4">
            {appLoading ? <Skeleton className="h-10 w-full" /> : !application ? (
              <Link href="/profile/translator-apply">
                <div className="flex items-center justify-between cursor-pointer" data-testid="link-apply-translator">
                  <div>
                    <p className="text-sm font-medium">{t("apply_as_translator")}</p>
                    <p className="text-xs text-muted-foreground">{t("apply_hint")}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("translator_application")}</p>
                  <p className="text-xs text-muted-foreground">{(application as any).fullName}</p>
                </div>
                <Badge variant={applicationStatusColor((application as any).status)} className="text-[10px]">
                  {(application as any).status === "pending" ? t("pending")
                    : (application as any).status === "approved" ? t("accepted")
                    : (application as any).status}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {user.role === "client" && (
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setLocation("/profile/translator-apply")}
            data-testid="button-become-translator"
          >
            <span className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              {t("become_translator")}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("logout")}
        </Button>
      </div>
    </div>
  );
}
