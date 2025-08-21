"use client";

import AuthSessionBridge from "@/components/auth/AuthSessionBridge";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthSessionBridge />
      {children}
    </>
  );
}
