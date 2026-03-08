import { auth } from "@/auth";
import { DashboardClient } from "@/components/dashboard-client";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return <DashboardClient />;
}
