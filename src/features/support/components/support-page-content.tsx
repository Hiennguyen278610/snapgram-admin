'use client';

import { useState } from 'react';
import { HelpCircle, Loader2, MessageSquare } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccessDeniedCard } from '@/components/layout/access-denied-card';
import { usePermission } from '@/features/auth/hooks/use-permission';
import type { Locale } from '@/i18n/routing';
import type { SupportTicketStatus } from '@/lib/api/query-keys';
import { formatDateTime } from '@/lib/i18n/format';
import { useSupportTickets } from '../hooks/use-support-tickets';
import { SupportTicketDialog } from './support-ticket-dialog';

export function SupportPageContent() {
  const t = useTranslations('support');
  const locale = useLocale() as Locale;
  const { hasPermission, isLoading: isAuthLoading } = usePermission();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const filterStatusParam =
    statusFilter === 'ALL' ? undefined : (statusFilter as SupportTicketStatus);
  const { data, isLoading, refetch } = useSupportTickets({ status: filterStatusParam });

  if (!isAuthLoading && !hasPermission('SUPPORT:TICKET_READ')) {
    return <AccessDeniedCard />;
  }

  const tickets = data?.content ?? [];

  return (
    <section className="py-6 space-y-6">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl text-card-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="h-9">
          <TabsTrigger value="ALL">{t('tabs.all')}</TabsTrigger>
          <TabsTrigger value="OPEN">{t('tabs.open')}</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">{t('tabs.in_progress')}</TabsTrigger>
          <TabsTrigger value="RESOLVED">{t('tabs.resolved')}</TabsTrigger>
          <TabsTrigger value="CLOSED">{t('tabs.closed')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-[120px]">{t('table.ticketId')}</TableHead>
              <TableHead>{t('table.user')}</TableHead>
              <TableHead>{t('table.subject')}</TableHead>
              <TableHead>{t('table.category')}</TableHead>
              <TableHead>{t('table.priority')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead>{t('table.createdAt')}</TableHead>
              <TableHead className="text-right">{t('table.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm">{t('table.loading')}</p>
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  <HelpCircle className="mx-auto size-8 text-muted-foreground/50" />
                  <p className="mt-2 font-medium">{t('table.empty')}</p>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{ticket.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm" className="size-6">
                        {ticket.userAvatarUrl ? (
                          <AvatarImage
                            src={ticket.userAvatarUrl}
                            alt={ticket.userDisplayName || ''}
                          />
                        ) : null}
                        <AvatarFallback className="text-[10px]">
                          {(ticket.userDisplayName || ticket.userUsername || 'U')
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {ticket.userDisplayName || ticket.userUsername || 'User'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium text-xs">
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {t(`category.${ticket.category.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[11px] font-medium ${
                        ticket.priority === 'URGENT' || ticket.priority === 'HIGH'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {t(`priority.${ticket.priority.toLowerCase()}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        ticket.status === 'OPEN'
                          ? 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/20 text-[10px]'
                          : ticket.status === 'IN_PROGRESS'
                            ? 'border-sky-300 text-sky-600 bg-sky-50 dark:bg-sky-950/20 text-[10px]'
                            : ticket.status === 'RESOLVED'
                              ? 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-[10px]'
                              : 'border-border text-muted-foreground text-[10px]'
                      }
                    >
                      {t(`status.${ticket.status.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(ticket.createdAt, locale)}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => setSelectedTicketId(ticket.id)}
                    >
                      <MessageSquare className="size-3.5" />
                      <span>{t('table.viewDetails')}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SupportTicketDialog
        ticketId={selectedTicketId}
        open={Boolean(selectedTicketId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicketId(null);
            void refetch();
          }
        }}
      />
    </section>
  );
}
