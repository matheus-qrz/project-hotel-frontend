"use client";

import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  minHeight?: number | string;
  className?: string;
};

export function LoadingComponent() {
  return (
    <div className="grid h-full min-h-[120px] w-full place-items-center">
      <Loader2 className="text-foreground/80 h-6 w-6 animate-spin" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

export function DelayedLoading({ minHeight = 120, className }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("grid h-full w-full place-items-center", className)}
      style={{
        minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight,
      }}
    >
      <Loader2 className="text-foreground/80 h-6 w-6 animate-spin" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
