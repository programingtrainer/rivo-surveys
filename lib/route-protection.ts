import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/config";

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    redirect("/");
  }

  return user;
}
