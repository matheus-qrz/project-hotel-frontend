/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useAuthStore } from "@/stores/auth";
import AdminLogin from "@/components/login/AdminLogin";
import { DelayedLoading } from "@/components/loading/DelayedLoading";

export default function LoginPage() {
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return <DelayedLoading />;
  }

  return (
    <>
      <AdminLogin />
    </>
  );
}
