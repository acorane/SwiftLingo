import { useState } from "react";
import { useLocation } from "wouter";
import { useGetMyTranslatorApplication, useSubmitTranslatorApplication, getGetMyTranslatorApplicationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Loader2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const LANGUAGES = ["en", "ru", "uz", "de", "fr", "es", "tr", "ar", "zh", "ja", "it", "pt", "ko"];
const SPECIALIZATIONS = ["legal", "medical", "technical", "financial", "marketing", "literary", "general"];

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  bio: z.string().min(30, "Please write at least 30 characters about yourself"),
  certifications: z.string().optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(50),
  pricePerWord: z.coerce.number().positive("Enter your rate per word"),
  sourceLanguages: z.array(z.string()).min(1, "Select at least one source language"),
  targetLanguages: z.array(z.string()).min(1, "Select at least one target language"),
  specializations: z.array(z.string()).min(1, "Select at least one specialization"),
  acceptTerms: z.boolean().refine(v => v === true, "You must accept the terms"),
});

type FormData = z.infer<typeof schema>;

export default function TranslatorApply() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const submitApplication = useSubmitTranslatorApplication();

  const { data: existingApp, isLoading } = useGetMyTranslatorApplication({
    query: { queryKey: ["my-translator-application"] }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      bio: "",
      certifications: "",
      yearsOfExperience: 0,
      pricePerWord: 0.05,
      sourceLanguages: [],
      targetLanguages: [],
      specializations: [],
      acceptTerms: false,
    },
  });

  const toggleLang = (field: "sourceLanguages" | "targetLanguages", lang: string) => {
    const current = form.getValues(field);
    if (current.includes(lang)) {
      form.setValue(field, current.filter(l => l !== lang), { shouldValidate: true });
    } else {
      form.setValue(field, [...current, lang], { shouldValidate: true });
    }
  };

  const toggleSpec = (spec: string) => {
    const current = form.getValues("specializations");
    if (current.includes(spec)) {
      form.setValue("specializations", current.filter(s => s !== spec), { shouldValidate: true });
    } else {
      form.setValue("specializations", [...current, spec], { shouldValidate: true });
    }
  };

  const onSubmit = async (values: FormData) => {
    try {
      await submitApplication.mutateAsync({ data: values as any });
      queryClient.invalidateQueries({ queryKey: ["my-translator-application"] });
      toast({ title: "Application submitted", description: "We'll review your application and get back to you." });
      setLocation("/profile");
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error || err.message, variant: "destructive" });
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (existingApp) {
    const app = existingApp as any;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/profile")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Application Status</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            {app.status === "pending" && (
              <>
                <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
                <div>
                  <p className="font-semibold text-lg">Under Review</p>
                  <p className="text-sm text-muted-foreground mt-1">Your application is being reviewed. We'll notify you once it's processed.</p>
                </div>
              </>
            )}
            {app.status === "approved" && (
              <>
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                <div>
                  <p className="font-semibold text-lg text-green-600">Application Approved</p>
                  <p className="text-sm text-muted-foreground mt-1">You are now a verified translator. Start bidding on jobs!</p>
                </div>
                <Button onClick={() => setLocation("/jobs")} data-testid="button-browse-jobs">Browse Jobs</Button>
              </>
            )}
            {app.status === "rejected" && (
              <>
                <div className="h-12 w-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                  <span className="text-2xl">!</span>
                </div>
                <div>
                  <p className="font-semibold text-lg">Application Rejected</p>
                  {app.adminNote && <p className="text-sm text-muted-foreground mt-1">{app.adminNote}</p>}
                </div>
              </>
            )}
            <Badge variant={app.status === "approved" ? "default" : app.status === "rejected" ? "destructive" : "secondary"}>
              {app.status}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sourceLangs = form.watch("sourceLanguages");
  const targetLangs = form.watch("targetLanguages");
  const specs = form.watch("specializations");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/profile")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Apply as Translator</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="Your legal name" {...field} data-testid="input-full-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="bio" render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell clients about your experience, background, and what makes you a great translator..." rows={4} {...field} data-testid="input-bio" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="yearsOfExperience" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} data-testid="input-years-exp" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="pricePerWord" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate ($/word)</FormLabel>
                    <FormControl><Input type="number" step="0.001" min={0} {...field} data-testid="input-price-per-word" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="certifications" render={({ field }) => (
                <FormItem>
                  <FormLabel>Certifications (optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. ATA Certified, ISO 17100..." {...field} data-testid="input-certifications" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Languages</CardTitle>
              <CardDescription className="text-xs">Select your working language pairs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FormLabel className="text-sm">Source Languages (I translate FROM)</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLang("sourceLanguages", lang)}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${sourceLangs.includes(lang) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                      data-testid={`button-source-${lang}`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                {form.formState.errors.sourceLanguages && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.sourceLanguages.message}</p>
                )}
              </div>

              <div>
                <FormLabel className="text-sm">Target Languages (I translate INTO)</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLang("targetLanguages", lang)}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${targetLangs.includes(lang) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                      data-testid={`button-target-${lang}`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                {form.formState.errors.targetLanguages && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.targetLanguages.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Specializations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpec(spec)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${specs.includes(spec) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                    data-testid={`button-spec-${spec}`}
                  >
                    {spec.charAt(0).toUpperCase() + spec.slice(1)}
                  </button>
                ))}
              </div>
              {form.formState.errors.specializations && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.specializations.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  By submitting this application you agree to SwiftLingo's Terms of Service,
                  including our 10% platform fee on completed jobs, content guidelines,
                  and dispute resolution process.
                </p>
                <FormField control={form.control} name="acceptTerms" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="terms"
                          data-testid="checkbox-terms"
                        />
                      </FormControl>
                      <Label htmlFor="terms" className="text-sm cursor-pointer">
                        I accept the Terms and Conditions
                      </Label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={submitApplication.isPending} data-testid="button-submit-application">
            {submitApplication.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Application"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
