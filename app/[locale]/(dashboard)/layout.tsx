// import { Sidebar } from "@/components/Sidebar";
import { SidebarSimple } from "@/components/SidebarSimple";
// import { MobileSidebarProvider } from "@/contexts/MobileSidebarContext";
// import { MobileMenuButton } from "@/components/MobileMenuButton";
// import { GlobalModalProvider } from "@/components/providers/GlobalModalProvider";
// import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarSimple className="h-full" />
      <main className="flex-1 h-full overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
} 