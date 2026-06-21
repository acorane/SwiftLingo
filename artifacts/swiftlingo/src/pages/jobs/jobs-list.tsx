import { useState } from "react";
import { useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Briefcase, Globe, Clock } from "lucide-react";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ru", label: "Russian" },
  { value: "uz", label: "Uzbek" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "tr", label: "Turkish" },
  { value: "ar", label: "Arabic" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
];

const DELIVERY_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "express", label: "Express" },
  { value: "urgent", label: "Urgent" },
];

const SPECIALIZATIONS = [
  { value: "legal", label: "Legal" },
  { value: "medical", label: "Medical" },
  { value: "technical", label: "Technical" },
  { value: "financial", label: "Financial" },
  { value: "marketing", label: "Marketing" },
  { value: "literary", label: "Literary" },
  { value: "general", label: "General" },
];

const deliveryBadgeColor = (type: string) => {
  if (type === "urgent") return "destructive";
  if (type === "express") return "secondary";
  return "outline";
};

export default function JobsList() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [sourceLang, setSourceLang] = useState("");
  const [targetLang, setTargetLang] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [myJobs, setMyJobs] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const params = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(sourceLang && sourceLang !== "__all__" && { sourceLang }),
    ...(targetLang && targetLang !== "__all__" && { targetLang }),
    ...(deliveryType && deliveryType !== "__all__" && { deliveryType }),
    ...(myJobs && { myJobs: true }),
    limit: 20,
    offset: 0,
  };

  const { data, isLoading } = useListJobs(params, {
    query: { queryKey: getListJobsQueryKey(params) }
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._searchTimer);
    (window as any)._searchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const jobs = data?.jobs ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
        {user?.role === "client" && (
          <Button size="sm" onClick={() => setLocation("/jobs/new")} data-testid="button-post-job">
            <Plus className="h-4 w-4 mr-1" /> Post Job
          </Button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search jobs..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            data-testid="input-search-jobs"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Select value={sourceLang} onValueChange={setSourceLang}>
            <SelectTrigger className="text-xs h-8" data-testid="select-source-lang">
              <SelectValue placeholder="From" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Any</SelectItem>
              {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger className="text-xs h-8" data-testid="select-target-lang">
              <SelectValue placeholder="To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Any</SelectItem>
              {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={deliveryType} onValueChange={setDeliveryType}>
            <SelectTrigger className="text-xs h-8" data-testid="select-delivery-type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Any</SelectItem>
              {DELIVERY_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {user?.role === "client" && (
          <Button
            variant={myJobs ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setMyJobs(!myJobs)}
            data-testid="button-my-jobs"
          >
            My Jobs Only
          </Button>
        )}
      </div>

      {/* Job Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <Briefcase className="h-10 w-10 mb-3 opacity-20" />
            <p className="font-medium">No jobs found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <Link key={job.id} href={`/jobs/${job.id}`} data-testid={`card-job-${job.id}`}>
              <Card className="hover:border-primary/40 transition-all cursor-pointer">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm leading-tight flex-1 truncate">{job.title}</p>
                    <Badge variant={deliveryBadgeColor(job.deliveryType ?? "")} className="text-[10px] shrink-0">
                      {job.deliveryType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {job.sourceLang?.toUpperCase()} → {job.targetLang?.toUpperCase()}
                    </span>
                    {job.wordCount && (
                      <span>{job.wordCount.toLocaleString()} words</span>
                    )}
                    {job.specialization && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">{job.specialization}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">
                      ${job.budgetMin}–${job.budgetMax}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {job.bidsCount} bid{job.bidsCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
