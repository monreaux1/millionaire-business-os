import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2, Mail, Phone, Search, UserRoundCheck, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const STATUSES = ["new", "contacted", "qualified", "customer", "archived"];
const STATUS_STYLE = {
  new: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30",
  contacted: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
  qualified: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30",
  customer: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  archived: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-secondary dark:text-muted-foreground dark:border-border",
};

export default function Leads() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [updating, setUpdating] = useState("");

  const loadLeads = async () => {
    setLoading(true);
    try {
      if (!user?.email) throw new Error("An authenticated account is required.");
      const records = await base44.entities.FunnelLead.filter(
        { owner_email: user.email },
        "-submitted_at",
        200
      );
      setLeads(records || []);
    } catch (error) {
      console.error("Leads could not be loaded", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeads(); }, []);

  const visibleLeads = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((lead) => [lead.first_name, lead.last_name, lead.email, lead.phone, lead.funnel_name, lead.status].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [leads, query]);

  const counts = useMemo(() => ({
    total: leads.length,
    new: leads.filter((lead) => lead.status === "new").length,
    qualified: leads.filter((lead) => lead.status === "qualified").length,
    customer: leads.filter((lead) => lead.status === "customer").length,
  }), [leads]);

  const updateStatus = async (lead, status) => {
    const previousStatus = lead.status;
    setUpdating(lead.id);
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status } : item));
    try {
      if (!user?.email || lead.owner_email !== user.email) {
        throw new Error("This lead does not belong to the current account.");
      }
      await base44.entities.FunnelLead.update(lead.id, { status });
    } catch (error) {
      console.error("Lead status could not be updated", error);
      setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: previousStatus } : item));
      toast({ title: "Status not saved", description: "We couldn't save that status change. Please try again.", variant: "destructive" });
    } finally {
      setUpdating("");
    }
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadLeads}>
      <div className="min-h-screen bg-background p-5 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-black tracking-[0.2em] uppercase text-primary">Lead Dashboard</p>
              <h1 className="font-display text-3xl md:text-5xl font-black mt-2">Your funnel leads</h1>
              <p className="text-muted-foreground mt-3 max-w-2xl">Every lead submitted through one of your published funnels appears here, separated securely by app user.</p>
            </div>
            <Link to="/FunnelCreator"><Button className="bg-black text-white hover:bg-black/85">Open Funnel Creator <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
            <Stat icon={Users} label="Total leads" value={counts.total} />
            <Stat icon={Mail} label="New leads" value={counts.new} />
            <Stat icon={UserRoundCheck} label="Qualified" value={counts.qualified} />
            <Stat icon={ArrowRight} label="Customers" value={counts.customer} />
          </div>

          <div className="bg-card border border-border rounded-3xl mt-6 overflow-hidden shadow-[0_16px_45px_rgba(0,0,0,0.05)]">
            <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-extrabold text-xl">Lead activity</h2>
                <p className="text-sm text-muted-foreground">Search, follow up, and update each lead’s stage.</p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, funnel..." className="pl-9" />
              </div>
            </div>

            {loading ? (
              <div className="min-h-64 grid place-items-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
            ) : visibleLeads.length === 0 ? (
              <div className="min-h-72 grid place-items-center text-center p-8">
                <div>
                  <Users className="w-10 h-10 text-primary mx-auto" />
                  <h3 className="font-display font-extrabold text-xl mt-4">{leads.length ? "No matching leads" : "Your first lead will appear here"}</h3>
                  <p className="text-muted-foreground mt-2">{leads.length ? "Try a different search." : "Publish a funnel, share its public link, and submissions will be saved automatically."}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="hidden lg:grid grid-cols-[1.2fr_1.4fr_1fr_0.9fr_0.9fr] gap-4 px-6 py-3 bg-secondary text-sm font-black tracking-[0.16em] uppercase text-muted-foreground">
                  <span>Lead</span><span>Contact</span><span>Funnel</span><span>Submitted</span><span>Status</span>
                </div>
                <div className="divide-y divide-border">
                  {visibleLeads.map((lead) => (
                    <div key={lead.id} className="grid lg:grid-cols-[1.2fr_1.4fr_1fr_0.9fr_0.9fr] gap-4 px-5 md:px-6 py-5 items-center">
                      <div>
                        <p className="font-bold">{[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unnamed lead"}</p>
                        <p className="text-sm text-muted-foreground mt-1 lg:hidden">{lead.funnel_name}</p>
                      </div>
                      <div className="space-y-1">
                        <a href={lead.email ? `mailto:${lead.email}` : undefined} className="text-sm flex items-center gap-2 hover:text-primary"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{lead.email || "No email"}</a>
                        {lead.phone && <a href={`tel:${lead.phone}`} className="text-sm flex items-center gap-2 text-muted-foreground hover:text-primary"><Phone className="w-3.5 h-3.5" />{lead.phone}</a>}
                      </div>
                      <p className="hidden lg:block text-sm font-semibold">{lead.funnel_name || "Published funnel"}</p>
                      <p className="text-sm text-muted-foreground">{lead.submitted_at ? new Date(lead.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Recently"}</p>
                      <Select value={lead.status || "new"} disabled={updating === lead.id} onValueChange={(v) => updateStatus(lead, v)}>
                        <SelectTrigger className={`w-full border rounded-xl px-3 h-11 md:h-9 text-sm font-bold capitalize ${STATUS_STYLE[lead.status || "new"]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((status) => <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}

function Stat({ icon: Icon, label, value }) {
  return <div className="bg-card border border-border rounded-2xl p-5"><div className="w-9 h-9 rounded-xl bg-primary/10 text-primary grid place-items-center"><Icon className="w-4 h-4" /></div><p className="text-3xl font-black mt-4">{value}</p><p className="text-sm font-bold text-muted-foreground mt-1">{label}</p></div>;
}