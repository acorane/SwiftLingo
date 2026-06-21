import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetContract, useListMessages, useSendMessage, useDeliverContract,
  useApproveDelivery, useInitiatePayment, useConfirmPayment, useSubmitReview,
  getGetContractQueryKey, getListMessagesQueryKey, getListContractsQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Send, Lock, CheckCircle2, AlertCircle, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColor = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "active") return "default";
  if (s === "completed") return "secondary";
  if (s === "disputed") return "destructive";
  return "outline";
};

export default function ContractDetail() {
  const { contractId } = useParams<{ contractId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [showDeliverForm, setShowDeliverForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: contract, isLoading } = useGetContract(Number(contractId), {
    query: { enabled: !!contractId, queryKey: getGetContractQueryKey(Number(contractId)) }
  });

  const chatEnabled = (contract as any)?.paymentStatus === "confirmed" || (contract as any)?.paymentStatus === "released";

  const { data: messages } = useListMessages(Number(contractId), {
    query: {
      enabled: !!contractId && chatEnabled,
      queryKey: getListMessagesQueryKey(Number(contractId)),
      refetchInterval: chatEnabled ? 5000 : false,
    }
  });

  const sendMessage = useSendMessage();
  const deliverContract = useDeliverContract();
  const approveDelivery = useApproveDelivery();
  const initiatePayment = useInitiatePayment();
  const confirmPayment = useConfirmPayment();
  const submitReview = useSubmitReview();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isClient = (contract as any)?.clientId === user?.id;
  const isTranslator = (contract as any)?.translatorId === user?.id;

  const handlePay = async () => {
    try {
      await initiatePayment.mutateAsync({ data: { contractId: Number(contractId) } });
      await confirmPayment.mutateAsync({ contractId: Number(contractId) });
      queryClient.invalidateQueries({ queryKey: getGetContractQueryKey(Number(contractId)) });
      toast({ title: t("payment"), description: t("chat_locked").replace("unlocks once", "confirmed.") });
    } catch (err: any) {
      toast({ title: t("error"), description: err?.data?.error || err.message, variant: "destructive" });
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await sendMessage.mutateAsync({ contractId: Number(contractId), data: { content: message } });
      queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(Number(contractId)) });
      setMessage("");
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleDeliver = async () => {
    try {
      await deliverContract.mutateAsync({ contractId: Number(contractId), data: { deliveryNote } });
      queryClient.invalidateQueries({ queryKey: getGetContractQueryKey(Number(contractId)) });
      toast({ title: t("delivery_submitted") });
      setShowDeliverForm(false);
    } catch (err: any) {
      toast({ title: t("error"), description: err?.data?.error || err.message, variant: "destructive" });
    }
  };

  const handleApprove = async () => {
    try {
      await approveDelivery.mutateAsync({ contractId: Number(contractId) });
      queryClient.invalidateQueries({ queryKey: getGetContractQueryKey(Number(contractId)) });
      queryClient.invalidateQueries({ queryKey: getListContractsQueryKey({}) });
      toast({ title: t("approve_release") });
      setShowReviewForm(true);
    } catch (err: any) {
      toast({ title: t("error"), description: err?.data?.error || err.message, variant: "destructive" });
    }
  };

  const handleReview = async () => {
    try {
      await submitReview.mutateAsync({ data: { contractId: Number(contractId), rating: reviewRating, feedback: reviewFeedback } });
      toast({ title: t("submit_review") });
      setShowReviewForm(false);
    } catch (err: any) {
      toast({ title: t("error"), description: err?.data?.error || err.message, variant: "destructive" });
    }
  };

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!contract) return <div className="text-center text-muted-foreground py-12">{t("contract")} not found</div>;

  const c = contract as any;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/contracts")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{t("contract")} #{c.id}</p>
          <h1 className="text-base font-bold truncate" data-testid="text-contract-title">{c.job?.title || t("contract")}</h1>
        </div>
        <Badge variant={statusColor(c.status)} className="shrink-0">
          {c.status === "pending_payment" ? t("awaiting_payment")
            : c.status === "active" ? t("active")
            : c.status === "delivered" ? t("delivered")
            : c.status === "completed" ? t("completed")
            : c.status === "disputed" ? t("disputed")
            : c.status}
        </Badge>
      </div>

      {/* Contract Summary */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("agreed_price")}</p>
              <p className="font-semibold text-primary">${c.agreedPrice}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("your_payout")}</p>
              <p className="font-semibold">${isTranslator ? c.translatorPayout : c.agreedPrice}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("payment")}</p>
              <Badge variant={c.paymentStatus === "confirmed" || c.paymentStatus === "released" ? "default" : "outline"} className="text-[10px]">
                {c.paymentStatus}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isClient ? t("translator_label") : t("client_label")}</p>
              <p className="text-sm font-medium">
                {isClient
                  ? (c.translator?.firstName || c.translator?.username || t("translator_label"))
                  : (c.client?.firstName || c.client?.username || t("client_label"))}
              </p>
            </div>
          </div>
          {c.job && (
            <p className="text-xs text-muted-foreground">
              {c.job.sourceLang?.toUpperCase()} → {c.job.targetLang?.toUpperCase()}
              {c.job.deliveryType && ` · ${c.job.deliveryType}`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment CTA */}
      {isClient && c.status === "pending_payment" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">{t("payment_required")}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("chat_locked")}. {t("payment")}: ${c.agreedPrice}. Platform fee: ${c.platformFee?.toFixed(2)}.
            </p>
            <Button
              className="w-full"
              onClick={handlePay}
              disabled={initiatePayment.isPending || confirmPayment.isPending}
              data-testid="button-pay-now"
            >
              {(initiatePayment.isPending || confirmPayment.isPending) ? t("processing") : `${t("pay_now")} $${c.agreedPrice}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Deliver Button (for translator) */}
      {isTranslator && c.status === "active" && (
        <Card>
          <CardContent className="p-4 space-y-3">
            {showDeliverForm ? (
              <>
                <Textarea
                  placeholder={t("delivery_note_placeholder")}
                  value={deliveryNote}
                  onChange={e => setDeliveryNote(e.target.value)}
                  rows={3}
                  data-testid="input-delivery-note"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleDeliver} disabled={deliverContract.isPending} data-testid="button-deliver">
                    {deliverContract.isPending ? t("processing") : t("submit_delivery")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowDeliverForm(false)}>{t("cancel")}</Button>
                </div>
              </>
            ) : (
              <Button className="w-full" onClick={() => setShowDeliverForm(true)} data-testid="button-mark-delivered">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t("mark_delivered")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approve Delivery (for client) */}
      {isClient && c.status === "delivered" && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium">{t("delivery_submitted")}</p>
            </div>
            {c.deliveryNote && <p className="text-xs text-muted-foreground">{c.deliveryNote}</p>}
            <Button className="w-full" onClick={handleApprove} disabled={approveDelivery.isPending} data-testid="button-approve-delivery">
              {approveDelivery.isPending ? t("approving") : t("approve_release")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review form */}
      {isClient && c.status === "completed" && !c.review && showReviewForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("leave_review")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setReviewRating(star)} data-testid={`button-star-${star}`}>
                  <Star className={`h-6 w-6 ${star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <Textarea
              placeholder={t("your_experience")}
              value={reviewFeedback}
              onChange={e => setReviewFeedback(e.target.value)}
              rows={3}
              data-testid="input-review-feedback"
            />
            <Button size="sm" onClick={handleReview} disabled={submitReview.isPending} data-testid="button-submit-review">
              {submitReview.isPending ? t("processing") : t("submit_review")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Chat */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {t("chat")}
            {!chatEnabled && <Lock className="h-4 w-4 text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!chatEnabled ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Lock className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>{t("chat_locked")}</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {Array.isArray(messages) && (messages as any[]).length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">{t("no_messages")}</p>
                )}
                {Array.isArray(messages) && (messages as any[]).map((msg: any) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`} data-testid={`message-${msg.id}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {!isMine && (
                          <p className="text-[10px] font-medium mb-0.5 opacity-70">
                            {msg.sender?.firstName || msg.sender?.username}
                          </p>
                        )}
                        <p className="text-sm leading-snug">{msg.content}</p>
                        <p className={`text-[10px] mt-0.5 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <Separator />
              <div className="flex gap-2">
                <Input
                  placeholder={t("type_message")}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  data-testid="input-message"
                />
                <Button size="icon" onClick={handleSend} disabled={sendMessage.isPending || !message.trim()} data-testid="button-send-message">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
