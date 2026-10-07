import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  const tDashboard = await getTranslations('dashboard');

  return (
    <section className="py-6">
      <h1 className="font-display text-2xl text-card-foreground">
        {t('dashboard')}
      </h1>
      <p className="mt-2 text-muted-foreground">{tDashboard('placeholder')}</p>
    </section>
  );
}
