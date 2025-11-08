import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "./DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication on server side
  const session = await getServerSession(authOptions);

  // If not authenticated, redirect to signin
  if (!session) {
    redirect('/signin');
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
} 