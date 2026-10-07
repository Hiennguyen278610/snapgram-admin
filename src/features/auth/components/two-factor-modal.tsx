'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import type { ApiError } from '@/lib/api/types';
import { useTwoFactor } from '../hooks/use-two-factor';
import { twoFactorSchema } from '../schemas/login.schema';

interface Props {
  tempToken?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function TwoFactorModal({ tempToken, open, onOpenChange }: Props) {
  const t = useTranslations('auth.login');
  const tError = useTranslations();
  const router = useRouter();
  const mutation = useTwoFactor();

  const [code, setCode] = useState('');
  const isValid = twoFactorSchema.safeParse({ code }).success;
  const apiError = mutation.error as unknown as ApiError | null;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setCode('');
      mutation.reset();
    }
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || !tempToken) return;

    mutation.mutate(
      { tempToken, code },
      {
        onSuccess: () => {
          handleOpenChange(false);
          router.push('/admin/dashboard');
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('twoFactorTitle')}</DialogTitle>
          <DialogDescription>{t('twoFactorDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field data-invalid={!!apiError}>
            <FieldLabel htmlFor="two-factor-code">{t('twoFactorCode')}</FieldLabel>
            <InputOTP
              id="two-factor-code"
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={mutation.isPending}
              aria-invalid={!!apiError}
              containerClassName="justify-center"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <FieldError
              errors={[apiError ? { message: tError(getErrorMessageKey(apiError)) } : undefined]}
            />
          </Field>

          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || !tempToken || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {t('submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
