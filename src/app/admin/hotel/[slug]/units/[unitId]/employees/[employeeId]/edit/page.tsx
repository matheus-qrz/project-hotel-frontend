"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import EmployeeForm from "@/components/employee/EmployeeForm";
import { extractIdFromSlug } from "@/utils/slugify";
import { useSession } from "next-auth/react";
import { DelayedLoading } from "@/components/loading/DelayedLoading";
import { useAuthStore } from "@/stores";

export default function EditEmployeePage() {
  const { slug, employeeId } = useParams();
  const router = useRouter();
  const { isLoading } = useAuthStore();

  const { data: session, status } = useSession();
  const token = (session as any)?.token as string | undefined;

  const restaurantId = slug && extractIdFromSlug(String(slug));

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (status === "unauthenticated" || !token) {
        router.push("/login");
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [token, status, router]);

  if (isLoading) {
    return <DelayedLoading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EmployeeForm
        restaurantId={String(restaurantId)}
        employeeId={String(employeeId)}
        isEditMode={true}
      />
    </div>
  );
}
