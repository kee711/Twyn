'use client'

import { SidebarSimple } from "@/components/SidebarSimple";
import { MobileSidebarProvider } from "@/contexts/MobileSidebarContext";

export function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MobileSidebarProvider>
            <div className="flex h-screen overflow-hidden">
                <SidebarSimple className="h-full" />
                <main className="flex-1 h-full overflow-auto bg-gray-50">
                    {children}
                </main>
            </div>
        </MobileSidebarProvider>
    );
}
