import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrg } from "@/hooks/useOrg";
import { useSurgeryBookings } from "@/hooks/eye/useEye";
import { useTodayFlow, usePickupOrders, useUnpaidInvoices, useFrames, useLenses, FLOW_STAGES, todayISO } from "@/hooks/eye/useEyeOps";
import { hasPageAccess } from "@/config/roleAccess";
import {
  Activity, Stethoscope, Glasses, CreditCard, Scissors, Package,
  ArrowRight, ArrowUpRight, UserPlus, BellRing, AlertTriangle, Sunrise,
} from "lucide-react";

const ngn = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

interface TileProps {
  path: string;
  title: string;
  value: number | string;
  sub: string;
  Icon: any;
  tone: "primary" | "success" | "warning" | "info" | "destructive";
  index: number;
}

const toneStyles: Record<TileProps["tone"], { chip: string; bar: string }> = {
  primary: { chip: "bg-primary/10 text-primary", bar: "from-primary/60 to-primary" },
  success: { chip: "bg-success/10 text-success", bar: "from-success/60 to-success" },
  warning: { chip: "bg-warning/10 text-warning", bar: "from-warning/60 to-warning" },
  info: { chip: "bg-info/10 text-info", bar: "from-info/60 to-info" },
  destructive: { chip: "bg-destructive/10 text-destructive", bar: "from-destructive/60 to-destructive" },
};

export function EyeTodayScreen() {
  const { basePath, currentOrg } = useOrg();
  const role = currentOrg?.role || "receptionist";
  const can = (p: string) => hasPageAccess(role, p, "eye");
  const { data: flow = [] } = useTodayFlow();
  const { data: pickups = [] } = usePickupOrders();
  const { data: unpaid = [] } = useUnpaidInvoices();
  const { data: surgeries = [] } = useSurgeryBookings();
  const { data: frames = [] } = useFrames();
  const { data: lenses = [] } = useLenses();

  const active = flow.filter((f) => !["completed", "cancelled", "no_show"].includes(f.status));
  const ready = pickups.filter((o) => o.status === "ready");
  const notTold = ready.filter((o) => !o.notified_at);
  const atLab = pickups.filter((o) => o.status !== "ready");
  const todaySurg = surgeries.filter((s) => s.scheduled_date?.slice(0, 10) === todayISO() && s.status !== "cancelled");
  const lowStock = frames.filter((f) => f.quantity <= f.reorder_level).length + lenses.filter((l) => l.quantity <= l.reorder_level).length;
  const unpaidTotal = unpaid.reduce((s, i) => s + Number(i.total || 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const tile = (props: TileProps) =>
    can(props.path) && (
      <motion.div key={props.path} {...fadeUp} transition={{ duration: 0.3, delay: 0.05 * props.index }}>
        <Link to={`${basePath}/${props.path}`} className="group block h-full">
          <Card className="relative h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30">
            <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneStyles[props.tone].bar}`} />
            <CardContent className="flex items-start justify-between gap-3 p-4 pt-5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{props.title}</p>
                <p className="mt-1.5 text-3xl font-bold tracking-tight tabular-nums">{props.value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{props.sub}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[props.tone].chip}`}>
                <props.Icon className="h-5 w-5" />
              </div>
            </CardContent>
            <ArrowUpRight className="absolute bottom-3 right-3 h-3.5 w-3.5 text-muted-foreground/0 transition-all group-hover:text-muted-foreground" />
          </Card>
        </Link>
      </motion.div>
    );

  const needsAttention = [
    notTold.length > 0 && can("eye/pickup") && {
      Icon: BellRing, text: `${notTold.length} ${notTold.length === 1 ? "pair of glasses is" : "pairs of glasses are"} ready but the patient hasn't been told`,
      to: `${basePath}/eye/pickup`, tone: "text-warning",
    },
    unpaid.length > 0 && can("billing") && {
      Icon: CreditCard, text: `${unpaid.length} unpaid ${unpaid.length === 1 ? "bill" : "bills"} worth ${ngn.format(unpaidTotal)}`,
      to: `${basePath}/billing`, tone: "text-destructive",
    },
    lowStock > 0 && can("eye/stock") && {
      Icon: AlertTriangle, text: `${lowStock} frames or lenses are below reorder level`,
      to: `${basePath}/eye/stock`, tone: "text-warning",
    },
  ].filter(Boolean) as { Icon: any; text: string; to: string; tone: string }[];

  return (
    <div className="space-y-6">
      {/* Greeting banner */}
      <motion.div {...fadeUp} transition={{ duration: 0.35 }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-clinic-navy via-secondary to-primary p-6 text-primary-foreground sm:p-8">
          <Sunrise className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-10" />
          <p className="text-xs font-medium uppercase tracking-widest opacity-70">{dateStr}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{greeting} — here's the clinic at a glance</h1>
          <p className="mt-1.5 max-w-xl text-sm opacity-80">
            {active.length > 0
              ? `${active.length} ${active.length === 1 ? "patient is" : "patients are"} in the clinic right now.`
              : "No patients in the clinic yet. A fresh start!"}
          </p>
          {can("eye/flow") && (
            <Button size="sm" variant="secondary" className="mt-4 bg-white/15 text-white hover:bg-white/25 border-0" asChild>
              <Link to={`${basePath}/eye/flow`}><UserPlus className="mr-1.5 h-4 w-4" />Check in a patient</Link>
            </Button>
          )}
        </div>
      </motion.div>

      {/* Stat tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tile({ path: "eye/flow", title: "In the clinic now", value: active.length, sub: `${flow.length - active.length} finished today`, Icon: Activity, tone: "primary", index: 1 })}
        {tile({ path: "eye/pickup", title: "Glasses ready", value: ready.length, sub: `${notTold.length} not yet told · ${atLab.length} at lab`, Icon: Glasses, tone: "success", index: 2 })}
        {tile({ path: "billing", title: "Unpaid bills", value: unpaid.length, sub: ngn.format(unpaidTotal), Icon: CreditCard, tone: "destructive", index: 3 })}
        {tile({ path: "eye/surgery", title: "Surgeries today", value: todaySurg.length, sub: todaySurg.map((s) => s.procedure_name).slice(0, 2).join(", ") || "None booked", Icon: Scissors, tone: "info", index: 4 })}
        {tile({ path: "eye/stock", title: "Low stock", value: lowStock, sub: "Frames and lenses to reorder", Icon: Package, tone: "warning", index: 5 })}
      </div>

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.25 }}>
          <Card className="border-warning/40 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BellRing className="h-4 w-4 text-warning" /> Needs your attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {needsAttention.map((a, i) => (
                <Link key={i} to={a.to} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-warning/10">
                  <a.Icon className={`h-4 w-4 shrink-0 ${a.tone}`} />
                  <span className="flex-1">{a.text}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Patient progress pipeline */}
      {can("eye/flow") && (
        <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.3 }}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Patient progress</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">Where each patient is right now</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`${basePath}/eye/flow`}>Open board <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-5">
              {FLOW_STAGES.map((st, i) => {
                const list = active.filter((f) => f.stage === st.key);
                const isBusy = list.length > 0;
                return (
                  <div
                    key={st.key}
                    className={`rounded-xl border p-3 transition-colors ${isBusy ? "border-primary/30 bg-accent/50" : "border-border/50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${isBusy ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {i + 1}
                        </span>
                        {st.label}
                      </span>
                      <Badge variant={isBusy ? "default" : "secondary"}>{list.length}</Badge>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {list.slice(0, 4).map((f) => (
                        <li key={f.id} className="truncate">
                          {st.key === "doctor" && can("eye/visit") ? (
                            <Link className="hover:underline" to={`${basePath}/eye/visit?patient=${f.patient_id}`}>
                              <Stethoscope className="mr-1 inline h-3 w-3" />{f.patients?.first_name} {f.patients?.last_name}
                            </Link>
                          ) : <>{f.patients?.first_name} {f.patients?.last_name}</>}
                        </li>
                      ))}
                      {list.length === 0 && <li className="italic opacity-60">Nobody here</li>}
                    </ul>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
