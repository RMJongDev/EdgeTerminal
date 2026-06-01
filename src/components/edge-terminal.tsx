import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "cyan" | "green" | "amber" | "red" | "blue";

const toneClasses: Record<Tone, string> = {
  default: "border-border bg-secondary/40 text-muted-foreground",
  cyan: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  red: "border-red-400/30 bg-red-400/10 text-red-100",
  blue: "border-blue-400/30 bg-blue-400/10 text-blue-100",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b border-border px-4 py-3">
      <h2 className="text-sm font-semibold tracking-normal">{title}</h2>
      {children}
    </div>
  );
}

export function PanelBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: Tone;
}) {
  return (
    <Panel>
      <PanelBody>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={cn(
            "mt-2 font-mono text-2xl font-bold tracking-normal",
            tone === "green" && "text-emerald-200",
            tone === "red" && "text-red-200",
            tone === "amber" && "text-amber-200",
            tone === "cyan" && "text-cyan-100",
          )}
        >
          {value}
        </div>
        {detail ? <div className="mt-1 text-xs text-muted-foreground">{detail}</div> : null}
      </PanelBody>
    </Panel>
  );
}

export function PageHeader({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">{title}</h1>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function Notice({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="mb-4 rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
      {message}
    </div>
  );
}

export function DataRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
