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
      <GlobalModalProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <DashboardContent>
            <MobileMenuButton />
            {children}
          </DashboardContent>
        </div>
      </GlobalModalProvider>
    </MobileSidebarProvider>
  );
} 