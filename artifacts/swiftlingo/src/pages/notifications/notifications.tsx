import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, CheckCheck, MessageSquare, DollarSign, FileCheck, Star, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const TYPE_ICON: Record<string, any> = {
  new_bid: FileCheck,
  bid_accepted: CheckCheck,
  payment_received: DollarSign,
  contract_activated: CheckCheck,
  new_message: MessageSquare,
  delivery_submitted: FileCheck,
  delivery_approved: Star,
  application_submitted: Info,
  application_approved: CheckCheck,
  application_rejected: Info,
};

function formatRelativeTime(iso: string, justNowLabel: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return justNowLabel;
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function Notifications() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useListNotifications({}, {
    query: { queryKey: getListNotificationsQueryKey({}) }
  });

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const list = Array.isArray(notifications) ? notifications as any[] : [];
  const unreadCount = list.filter((n: any) => !n.isRead).length;

  const handleMarkRead = async (id: number) => {
    try {
      await markRead.mutateAsync({ notificationId: id });
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({}) });
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({}) });
      toast({ title: t("mark_all_read") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) handleMarkRead(n.id);
    if (n.relatedType === "contract" && n.relatedId) {
      setLocation(`/contracts/${n.relatedId}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{t("notifications")}</h1>
          {unreadCount > 0 && (
            <Badge variant="default" className="text-xs">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} data-testid="button-mark-all-read">
            <CheckCheck className="h-4 w-4 mr-1" />
            {t("mark_all_read")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : list.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <Bell className="h-10 w-10 mb-3 opacity-20" />
            <p className="font-medium">{t("no_notifications")}</p>
            <p className="text-sm mt-1">{t("all_caught_up")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((n: any) => {
            const Icon = TYPE_ICON[n.type] ?? BellRing;
            return (
              <Card
                key={n.id}
                className={`cursor-pointer transition-all hover:border-primary/40 ${!n.isRead ? "border-primary/30 bg-primary/5" : ""}`}
                onClick={() => handleNotificationClick(n)}
                data-testid={`notification-${n.id}`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-1.5 ${!n.isRead ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold" : "font-medium"}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground">{formatRelativeTime(n.createdAt, t("just_now"))}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
