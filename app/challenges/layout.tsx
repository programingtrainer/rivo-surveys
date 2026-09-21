import { requireUser } from "@/lib/route-protection";

export default async function ChallengesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser();
  return children;
}
