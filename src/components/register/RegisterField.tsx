"use client";

import { Label } from "@/components/ui/label";

interface RegisterFieldProps {
  id: string;
  label: string;
  icon?: React.ElementType;
  error?: string;
  children: React.ReactNode;
}

export function RegisterField({
  id,
  label,
  icon: Icon,
  error,
  children,
}: RegisterFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className="text-[0.68rem] uppercase tracking-[0.12em]"
        style={{ color: error ? "#f87171" : "#6B6560" }}
      >
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2"
            style={{ color: error ? "#f87171" : "#6B6560" }}
          />
        )}
        {children}
      </div>
      {error && (
        <p
          className="text-[0.68rem]"
          style={{ color: "#f87171" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ── Section shell ─────────────────────────────────────────────────────────────

interface SectionShellProps {
  icon: React.ElementType;
  step: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionShell({
  icon: Icon,
  step,
  title,
  subtitle,
  children,
  className = "",
}: SectionShellProps) {
  return (
    <div
      className={`rounded-xl p-7 ${className}`}
      style={{
        background: "#141414",
        border: "1px solid rgba(201,169,110,0.12)",
      }}
    >
      <div className="mb-7 flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            border: "1px solid rgba(201,169,110,0.35)",
            background: "rgba(201,169,110,0.08)",
          }}
        >
          <Icon
            size={17}
            style={{ color: "#C9A96E" }}
          />
        </div>
        <div>
          <p
            className="mb-0.5 text-[0.62rem] uppercase tracking-[0.28em]"
            style={{ color: "#C9A96E" }}
          >
            {step}
          </p>
          <h3
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.4rem",
              fontWeight: 400,
              color: "#F0EDE8",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h3>
          <p
            className="mt-0.5 text-[0.78rem]"
            style={{ color: "#6B6560" }}
          >
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
