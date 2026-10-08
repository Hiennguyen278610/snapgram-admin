import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RbacPageContent } from '@/features/rbac/components/rbac-page-content';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'rbac' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function AdminRbacPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RbacPageContent />;
}
