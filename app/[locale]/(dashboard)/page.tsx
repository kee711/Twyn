import { redirect } from 'next/navigation'

export default function DashboardPage() {
    // Redirect to topic-finder as the default dashboard page
    redirect('/contents/topic-finder')
}
