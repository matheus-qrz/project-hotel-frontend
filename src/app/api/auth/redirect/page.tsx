// app/auth/redirect/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export default async function AuthRedirect() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?error=SessionMissing");

  const slug =
    (session.user as any)?.restaurantSlug || (session as any).restaurantSlug;

  if (!slug) {
    redirect("/admin/register?missing=slug");
  }

  redirect(`/admin/restaurant/${encodeURIComponent(slug)}/dashboard`);
}
