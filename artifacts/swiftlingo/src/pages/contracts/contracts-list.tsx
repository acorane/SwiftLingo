import { useListContracts, getListContractsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Awaiting Payment" },
  { value: "active", label: "Active" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed" },
];

const statusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "active") return "default";
  if (status === "completed") return "secondary";
  if (status === "disputed") return "destructive";
  return "outline";
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ContractsList() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");

  const params = statusFilter ? { status: statusFilter } : {};
  const { data: contracts, isLoading } = useListContracts(params, {
    query: { queryKey: getListContractsQueryKey(params) }
  });

  const list = Array.isArray(contracts) ? contracts : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map(f => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? "default" : "outline"}
            size="sm"
            className="shrink-0 h-7 text-xs"
            onClick={() => setStatusFilter(f.value)}
            data-testid={`button-filter-${f.value || "all"}`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : list.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <FileText className="h-10 w-10 mb-3 opacity-20" />
            <p className="font-medium">No contracts yet</p>
            <p className="text-sm mt-1">
              {user?.role === "client" ? "Post a job to get started" : "Browse jobs and submit bids"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((contract: any) => {
            const isClient = contract.clientId === user?.id;
            const otherParty = isClient ? contract.translator : contract.client;
            return (
              <Link key={contract.id} href={`/contracts/${contract.id}`} data-testid={`card-contract-${contract.id}`}>
                <Card className="hover:border-primary/40 transition-all cursor-pointer">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-tight flex-1 truncate">
                        {contract.job?.title || "Translation Contract"}
                      </p>
                      <Badge variant={statusBadgeVariant(contract.status)} className="text-[10px] shrink-0">
                        {contract.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {contract.job && (
                        <span>{contract.job.sourceLang?.toUpperCase()} → {contract.job.targetLang?.toUpperCase()}</span>
                      )}
                      <span className="text-primary font-medium">${contract.agreedPrice}</span>
                      {otherParty && (
                        <span>{isClient ? "Translator" : "Client"}: {otherParty.firstName || otherParty.username}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(contract.updatedAt)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
