import { Link, useLocation } from "wouter";
import { Home, Briefcase, FileText, User, Bell } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";

export default function BottomNav() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const { data: notifications } = useListNotifications(
    { unreadOnly: true },
    { query: { enabled: !!user, queryKey: getListNotificationsQueryKey({ unreadOnly: true }) } }
  );

  const unreadCount = notifications?.length || 0;

  const navItems = [
    { href: "/", icon: Home, label: t("home") },
    { href: "/jobs", icon: Briefcase, label: t("jobs") },
    { href: "/contracts", icon: FileText, label: t("contracts") },
    { href: "/notifications", icon: Bell, label: t("notifications"), badge: unreadCount },
    { href: "/profile", icon: User, label: t("profile") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {(item.badge ?? 0) > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                    {(item.badge ?? 0) > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
