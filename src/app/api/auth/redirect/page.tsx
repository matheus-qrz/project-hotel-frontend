import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateRestaurantSlug } from "@/utils/slugify";

export default async function AfterLogin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");

  const u: any = session.user;
  const slug = u?.restaurantName
    ? generateRestaurantSlug(u.restaurantName, u.restaurantId)
    : u?.restaurantId;

  if (u?.role === "ADMIN") redirect(`/admin/restaurant/${slug}/dashboard`);
  if (u?.role === "MANAGER") redirect(`/admin/restaurant/${slug}/manager`);

  // fallback:
  redirect("/");
}
