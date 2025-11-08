'use client'

import { SimpleDashboardLayout } from "./SimpleDashboardLayout";

// Use simple layout for Base mini app to avoid complex provider issues
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SimpleDashboardLayout>{children}</SimpleDashboardLayout>;
} 