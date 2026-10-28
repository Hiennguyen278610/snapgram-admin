'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePermission } from '@/features/auth/hooks/use-permission';
import type { Locale } from '@/i18n/routing';
import { formatDateTime } from '@/lib/i18n/format';
import { useReplySupportTicket } from '../hooks/use-reply-support-ticket';
import { useSupportTicketDetail } from '../hooks/use-support-ticket-detail';
import {
  replySupportTicketSchema,
  type ReplySupportTicketInput,
  type SupportTicketStatus,
} from '../schemas/support.schema';

interface Props {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportTicketDialog({ ticketId, open, onOpenChange }: Props) {
  const t = useTranslations('support');
  const locale = useLocale() as Locale;
  const { data: ticket, isLoading } = useSupportTicketDetail(ticketId);
  const replyMutation = useReplySupportTicket();
  const { isAdmin, hasPermission } = usePermission();

  const canReply = isAdmin || hasPermission('SUPPORT:TICKET_MANAGE');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReplySupportTicketInput>({
    resolver: zodResolver(replySupportTicketSchema),
    defaultValues: {
      reply: '',
      status: 'RESOLVED',
    },
  });

  const selectedStatus = watch('status');

  const onSubmit = (values: ReplySupportTicketInput) => {
    if (!ticketId) return;
    replyMutation.mutate(
      { id: ticketId, payload: values },
      {
        onSuccess: () => {
          toast.success(t('toast.replySuccess'));
          reset();
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to reply to ticket');
        },
      }
    );
  };

  if (!ticketId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-lg font-semibold">{t('dialog.title')}</DialogTitle>
            {ticket?.status ? (
              <Badge
                variant="outline"
                className={
                  ticket.status === 'OPEN'
                    ? 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/20'
                    : ticket.status === 'IN_PROGRESS'
                      ? 'border-sky-300 text-sky-600 bg-sky-50 dark:bg-sky-950/20'
                      : ticket.status === 'RESOLVED'
                        ? 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-border text-muted-foreground'
                }
              >
                {t(`status.${ticket.status.toLowerCase()}`)}
              </Badge>
            ) : null}
          </div>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            Ticket #{ticketId.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {isLoading || !ticket ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* User info */}
              <div className="flex items-center gap-3">
                <Avatar size="sm" className="size-8">
                  {ticket.userAvatarUrl ? (
                    <AvatarImage src={ticket.userAvatarUrl} alt={ticket.userDisplayName || ''} />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {(ticket.userDisplayName || ticket.userUsername || 'U')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {ticket.userDisplayName || ticket.userUsername || 'Unknown User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{ticket.userUsername || ticket.userId.slice(0, 8)}
                  </p>
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  {formatDateTime(ticket.createdAt, locale)}
                </div>
              </div>

              {/* Subject & Description */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-foreground">{ticket.subject}</h4>
                  <Badge variant="secondary" className="text-[10px]">
                    {t(`category.${ticket.category.toLowerCase()}`)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {ticket.description}
                </p>

                {/* Attachments */}
                {ticket.attachments && ticket.attachments.length > 0 ? (
                  <div className="pt-3 space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('dialog.attachments')}
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {ticket.attachments.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-muted/30"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Attachment ${i + 1}`}
                            className="size-full object-cover transition-transform group-hover:scale-105"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Existing Reply if any */}
              {ticket.adminReply ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" />
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {t('dialog.officialReply')}
                    </h5>
                    {ticket.resolvedAt ? (
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {formatDateTime(ticket.resolvedAt, locale)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.adminReply}</p>
                </div>
              ) : null}

              {/* Reply Form (Staff action) */}
              {canReply ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                  <Field>
                    <FieldLabel htmlFor="support-reply">
                      {ticket.adminReply ? t('dialog.updateReply') : t('dialog.writeReply')}
                    </FieldLabel>
                    <Textarea
                      id="support-reply"
                      rows={3}
                      placeholder={t('dialog.replyPlaceholder')}
                      disabled={replyMutation.isPending}
                      {...register('reply')}
                    />
                    {errors.reply?.message ? <FieldError>{errors.reply.message}</FieldError> : null}
                  </Field>

                  <div className="flex items-center gap-4">
                    <div className="w-48">
                      <FieldLabel htmlFor="ticket-status">{t('dialog.setStatus')}</FieldLabel>
                      <Select
                        value={selectedStatus}
                        onValueChange={(val) => setValue('status', val as SupportTicketStatus)}
                        disabled={replyMutation.isPending}
                      >
                        <SelectTrigger id="ticket-status" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN_PROGRESS">{t('status.in_progress')}</SelectItem>
                          <SelectItem value="RESOLVED">{t('status.resolved')}</SelectItem>
                          <SelectItem value="CLOSED">{t('status.closed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="ml-auto pt-5">
                      <Button type="submit" disabled={replyMutation.isPending} className="gap-2">
                        {replyMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                        <span>{t('dialog.submitReply')}</span>
                      </Button>
                    </div>
                  </div>
                </form>
              ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
