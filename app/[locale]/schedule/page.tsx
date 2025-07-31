import { redirect } from 'next/navigation';

interface SchedulePageProps {
  params: Promise<{ locale: string }>;
}

export default async function SchedulePage({ params }: SchedulePageProps) {
    const { locale } = await params;
    redirect(`/${locale}/schedule/calendar`);
} 