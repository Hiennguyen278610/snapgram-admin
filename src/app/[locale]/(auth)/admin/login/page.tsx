import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LoginForm } from '@/features/auth/components/login-form';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.login' });
  return { title: t('title') };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LoginForm />;
}
