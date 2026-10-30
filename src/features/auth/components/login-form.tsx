'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import type { ApiError } from '@/lib/api/types';
import { loginSchema, type LoginInput } from '../schemas/login.schema';
import { useAdminLogin } from '../hooks/use-admin-login';
import { CountdownTimer } from './countdown-timer';
import { PasswordField } from './password-field';
import { TwoFactorModal } from './two-factor-modal';
import { BrandLogo } from '@/components/layout/brand-logo';

const DEFAULT_REDIRECT = '/admin/dashboard';

const STATUS_ALERT_CLASSES =
  'rounded-lg border px-3 py-2 text-sm bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50';

/**
 * Reads the `redirect` search param (set by the middleware guard) and resolves
 * it to a locale-agnostic pathname so next-intl's router can re-prefix the
 * active locale without duplicating it (e.g. `/en/en/admin/dashboard`).
 *
 * It lives behind its own Suspense boundary because `useSearchParams()` is not
 * allowed during static prerendering; isolating it keeps the form itself
 * server-rendered instead of de-opting the whole page to client rendering.
 */
function RedirectParamReader({ onResolve }: { onResolve: (path: string) => void }) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const rawRedirect = searchParams.get('redirect');

  useEffect(() => {
    const target = rawRedirect
      ? rawRedirect.replace(new RegExp(`^/${locale}(?=/|$)`), '') || DEFAULT_REDIRECT
      : DEFAULT_REDIRECT;
    onResolve(target);
  }, [rawRedirect, locale, onResolve]);

  return null;
}

export function LoginForm() {
  const t = useTranslations('auth.login');
  const tError = useTranslations();
  const router = useRouter();

  const [redirectTo, setRedirectTo] = useState(DEFAULT_REDIRECT);
  const [twoFaToken, setTwoFaToken] = useState<string | undefined>(undefined);
  const [twoFaOpen, setTwoFaOpen] = useState(false);

  const mutation = useAdminLogin();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const password = watch('password');
  const apiError = mutation.error as unknown as ApiError | null;
  const isLocked = apiError?.kind === 'locked';
  const isRateLimited = apiError?.kind === 'rateLimit';
  const isDisabled = isSubmitting || isLocked;

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: (data) => {
        if (data.requiresTwoFa === true) {
          setTwoFaToken(data.tempToken);
          setTwoFaOpen(true);
          return;
        }
        router.push(redirectTo);
      },
    });
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <Suspense fallback={null}>
        <RedirectParamReader onResolve={setRedirectTo} />
      </Suspense>

      <div className="flex flex-col items-center text-center space-y-3 pb-3">
        <BrandLogo size="xl" href={null} showText={false} priority />
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-display text-2xl font-bold tracking-tight text-card-foreground">
              Snapgram
            </span>
            <span className="rounded font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 text-xs px-2 py-0.5 select-none">
              ADMIN
            </span>
          </div>
          <h1 className="font-display text-base font-medium text-card-foreground">{t('title')}</h1>
          <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {apiError && (
        <div role="alert" className={`mt-2 ${STATUS_ALERT_CLASSES}`}>
          <p>{tError(getErrorMessageKey(apiError))}</p>
          {isLocked && <CountdownTimer seconds={apiError.retryAfterSeconds ?? 900} />}
          {isRateLimited && <CountdownTimer seconds={apiError.retryAfterSeconds ?? 60} />}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 space-y-5" noValidate>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="login-email">{t('field.email')}</FieldLabel>
          <Input
            id="login-email"
            type="email"
            autoComplete="username"
            placeholder={t('emailPlaceholder')}
            aria-invalid={!!errors.email}
            disabled={isDisabled}
            {...register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="login-password">{t('field.password')}</FieldLabel>
          <PasswordField
            value={password}
            onChange={(v) => setValue('password', v, { shouldValidate: isSubmitted })}
            placeholder={t('passwordPlaceholder')}
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            disabled={isDisabled}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Button
          type="submit"
          disabled={isDisabled}
          className="w-full bg-gradient-to-r from-[#ff6a00] to-[#ee0979] text-white shadow-[0_8px_20px_-3px_rgba(247,119,55,0.45)]"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {t('submit')}
        </Button>
      </form>

      <TwoFactorModal tempToken={twoFaToken} open={twoFaOpen} onOpenChange={setTwoFaOpen} />
    </div>
  );
}
