import { setRequestLocale } from 'next-intl/server';
import { DashboardPageContent } from '@/features/dashboard/components/dashboard-page-content';

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DashboardPageContent />;
}
