import { requireAdmin } from "@/lib/route-protection";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();
  return children;
}
