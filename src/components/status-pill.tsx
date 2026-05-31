import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusPillProps = {
  children: ReactNode;
  tone?: "ready" | "warning" | "muted";
};

export function StatusPill({ children, tone = "muted" }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium",
        tone === "ready" && "border-primary/40 bg-primary/10 text-primary",
        tone === "warning" && "border-accent/40 bg-accent/10 text-accent",
        tone === "muted" && "border-border bg-secondary text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
