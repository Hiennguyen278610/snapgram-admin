'use client';

import { Loader2, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  value: string;
  onChange: (value: string) => void;
  isFetching?: boolean;
}

const MIN_CHARS = 2;

export function UserTableFilters({ value, onChange, isFetching = false }: Props) {
  const t = useTranslations('users');
  const showMinCharsHint = value.trim().length > 0 && value.trim().length < MIN_CHARS;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="users-search" className="sr-only">
        {t('filters.search')}
      </Label>
      <div className="relative w-full sm:max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="users-search"
          type="search"
          role="searchbox"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('filters.search')}
          className="pl-9 pr-9"
        />
        {isFetching ? (
          <Loader2
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        ) : value.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('filters.clear')}
            className="absolute top-1/2 right-1 -translate-y-1/2"
            onClick={() => onChange('')}
          >
            <X className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      {showMinCharsHint ? (
        <p className="text-xs text-muted-foreground">{t('filters.minChars')}</p>
      ) : null}
    </div>
  );
}
