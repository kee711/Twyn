import { SidebarSimple } from "@/components/SidebarSimple";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";

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

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarSimple className="h-full" />
      <main className="flex-1 h-full overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
} 