import { Sidebar } from "@/components/Sidebar";
import { MobileSidebarProvider } from "@/contexts/MobileSidebarContext";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { GlobalModalProvider } from "@/components/providers/GlobalModalProvider";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileSidebarProvider>
      <div className="flex h-screen overflow-hidden md:p-2">
        <Sidebar className="h-full rounded-r-xl" />
        <main className="flex-1 h-full overflow-hidden relative">
          <MobileMenuButton />
          <DashboardContent>
            {children}
          </DashboardContent>
          <GlobalModalProvider />
        </main>
      </div>
    </MobileSidebarProvider>
  );
} 