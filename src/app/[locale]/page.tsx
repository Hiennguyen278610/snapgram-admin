import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('common');

  return (
    <main className="p-8">
      <h1 className="font-display text-4xl">{t('app.title')}</h1>
      <p className="text-muted-foreground mt-2">{t('locale.label')}: {locale}</p>
    </main>
  );
}
