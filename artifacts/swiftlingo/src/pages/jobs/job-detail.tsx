import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetJob, useListBids, useSubmitBid, useUpdateBid, useWithdrawBid, useAcceptBid,
  getGetJobQueryKey, getListBidsQueryKey, getListJobsQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Globe, Clock, Star, ChevronRight, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBidForm, setShowBidForm] = useState(false);

  const { data: job, isLoading: jobLoading } = useGetJob(Number(jobId), {
    query: { enabled: !!jobId, queryKey: getGetJobQueryKey(Number(jobId)) }
  });
  const { data: bids, isLoading: bidsLoading } = useListBids(Number(jobId), {
    query: { enabled: !!jobId, queryKey: getListBidsQueryKey(Number(jobId)) }
  });

  const submitBid = useSubmitBid();
  const acceptBid = useAcceptBid();
  const withdrawBid = useWithdrawBid();

  const bidForm = useForm({
    defaultValues: { amount: "", coverLetter: "", deliveryDays: "" }
  });

  const isClient = user?.id === (job as any)?.clientId;
  const isTranslator = user?.isTranslatorApproved && !isClient;
  const myBid = (bids as any[])?.find((b: any) => b.translatorId === user?.id);

  const handleBidSubmit = async (values: any) => {
    try {
      await submitBid.mutateAsync({
        jobId: Number(jobId),
        data: {
          amount: parseFloat(values.amount),
          coverLetter: values.coverLetter,
          deliveryDays: values.deliveryDays ? parseInt(values.deliveryDays) : undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: getListBidsQueryKey(Number(jobId)) });
      queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(Number(jobId)) });
      toast({ title: "Bid submitted", description: "Your bid is now visible to the client." });
      setShowBidForm(false);
      bidForm.reset();
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error || err.message, variant: "destructive" });
    }
  };

  const handleAcceptBid = async (bidId: number) => {
    try {
      await acceptBid.mutateAsync({ bidId });
      queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(Number(jobId)) });
      queryClient.invalidateQueries({ queryKey: getListJobsQueryKey({}) });
      toast({ title: "Bid accepted", description: "A contract has been created. Please complete payment." });
      setLocation("/contracts");
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error || err.message, variant: "destructive" });
    }
  };

  const handleWithdraw = async () => {
    if (!myBid) return;
    try {
      await withdrawBid.mutateAsync({ bidId: myBid.id });
      queryClient.invalidateQueries({ queryKey: getListBidsQueryKey(Number(jobId)) });
      toast({ title: "Bid withdrawn" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (jobLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );

  if (!job) return <div className="text-center text-muted-foreground py-12">Job not found</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/jobs")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate" data-testid="text-job-title">{(job as any).title}</h1>
        </div>
        <Badge variant={(job as any).status === "open" ? "default" : "secondary"} className="shrink-0">
          {(job as any).status}
        </Badge>
      </div>

      {/* Job Info */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              {(job as any).sourceLang?.toUpperCase()} → {(job as any).targetLang?.toUpperCase()}
            </span>
            {(job as any).wordCount && <span>{(job as any).wordCount.toLocaleString()} words</span>}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {(job as any).deliveryType}
            </span>
            {(job as any).specialization && (
              <Badge variant="outline" className="text-[10px]">{(job as any).specialization}</Badge>
            )}
          </div>
          <div className="text-lg font-semibold text-primary">${(job as any).budgetMin}–${(job as any).budgetMax}</div>
          {(job as any).description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{(job as any).description}</p>
          )}
          <div className="text-xs text-muted-foreground">
            Posted by {(job as any).client?.firstName || (job as any).client?.username || "Client"}
            {" · "}{(job as any).bidsCount} bid{(job as any).bidsCount !== 1 ? "s" : ""}
          </div>
        </CardContent>
      </Card>

      {/* Translator: Bid form or current bid */}
      {isTranslator && (job as any).status === "open" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Bid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myBid ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Your bid: <span className="text-primary">${myBid.amount}</span></span>
                  <Badge variant={myBid.status === "pending" ? "secondary" : myBid.status === "accepted" ? "default" : "destructive"}>
                    {myBid.status}
                  </Badge>
                </div>
                {myBid.coverLetter && <p className="text-sm text-muted-foreground">{myBid.coverLetter}</p>}
                {myBid.status === "pending" && (
                  <Button variant="outline" size="sm" onClick={handleWithdraw} disabled={withdrawBid.isPending} data-testid="button-withdraw-bid">
                    Withdraw Bid
                  </Button>
                )}
              </div>
            ) : showBidForm ? (
              <form onSubmit={bidForm.handleSubmit(handleBidSubmit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Your Price ($)</label>
                    <Input type="number" step="0.01" placeholder="e.g. 120" {...bidForm.register("amount", { required: true })} data-testid="input-bid-amount" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Days to Deliver</label>
                    <Input type="number" placeholder="e.g. 3" {...bidForm.register("deliveryDays")} data-testid="input-delivery-days" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Cover Letter</label>
                  <Textarea placeholder="Introduce yourself and explain why you're the best choice..." rows={3} {...bidForm.register("coverLetter")} data-testid="input-cover-letter" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={submitBid.isPending} data-testid="button-submit-bid">
                    {submitBid.isPending ? "Submitting..." : "Submit Bid"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowBidForm(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <Button onClick={() => setShowBidForm(true)} className="w-full" data-testid="button-place-bid">
                Place a Bid
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Non-approved translator message */}
      {!isClient && user?.role === "translator" && !user?.isTranslatorApproved && (
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-center gap-3 text-sm text-muted-foreground">
            <Lock className="h-5 w-5 shrink-0" />
            <span>Your translator application is under review. You can bid once approved.</span>
          </CardContent>
        </Card>
      )}

      {/* Bids section (visible to client who owns the job, or all for overview) */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">
          Bids ({Array.isArray(bids) ? (bids as any[]).length : 0})
        </h2>
        {bidsLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : !Array.isArray(bids) || (bids as any[]).length === 0 ? (
          <p className="text-sm text-muted-foreground">No bids yet.</p>
        ) : (
          <div className="space-y-3">
            {(bids as any[]).map((bid: any) => (
              <Card key={bid.id} data-testid={`card-bid-${bid.id}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {bid.translatorUser?.firstName || bid.translatorUser?.username || "Translator"}
                      </p>
                      {bid.translator?.rating && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {bid.translator.rating.toFixed(1)} · {bid.translator.completedJobsCount} jobs
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">${bid.amount}</p>
                      {bid.deliveryDays && <p className="text-xs text-muted-foreground">{bid.deliveryDays}d delivery</p>}
                    </div>
                  </div>
                  {bid.coverLetter && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{bid.coverLetter}</p>
                  )}
                  {isClient && (job as any).status === "open" && bid.status === "pending" && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleAcceptBid(bid.id)}
                      disabled={acceptBid.isPending}
                      data-testid={`button-accept-bid-${bid.id}`}
                    >
                      Accept This Bid <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                  {bid.status !== "pending" && (
                    <Badge variant={bid.status === "accepted" ? "default" : "secondary"} className="text-[10px]">
                      {bid.status}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
