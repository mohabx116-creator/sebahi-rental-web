import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CalendarCheck, CheckCircle2, MessageSquareText, Send, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiClientError } from '../../lib/api/api-client';
import { rentalApiService } from '../../lib/api/rental-service';
import type { CreateRentalInquiryInput, RentalInquiryPublicResponse, RentalInquiryType } from '../../lib/api/types';
import { cn } from '../../lib/utils/cn';

const inquiryStatusLabels: Record<string, string> = {
  NEW: 'طلب جديد',
  VIEWING_REQUESTED: 'طلب معاينة',
  CONTACT_UNLOCKED: 'تم فتح التواصل',
  CLOSED: 'مغلق',
  CANCELLED: 'ملغي',
};

const inquirySchema = z.object({
  tenantName: z.string().trim().min(2, 'اكتب الاسم على الأقل من حرفين').max(150, 'الاسم طويل جدًا'),
  tenantPhone: z
    .string()
    .trim()
    .min(5, 'اكتب رقم موبايل صحيح')
    .max(30, 'رقم الموبايل طويل جدًا')
    .regex(/^\+?[0-9\s\-()]{5,30}$/, 'اكتب رقم موبايل بصيغة صحيحة'),
  tenantEmail: z
    .string()
    .trim()
    .email('اكتب بريد إلكتروني صحيح')
    .optional()
    .or(z.literal('')),
  message: z.string().trim().max(500, 'الرسالة يجب ألا تتجاوز ٥٠٠ حرف').optional(),
  inquiryType: z.enum(['VIEWING_REQUEST', 'GENERAL']),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

function readableInquiryError(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 409) return 'الوحدة غير متاحة لاستقبال الطلبات حاليًا.';
    if (error.status === 400) return 'راجع البيانات المكتوبة وحاول مرة أخرى.';
    return error.message || 'حاول مرة أخرى بعد قليل.';
  }

  if (error instanceof Error && error.message) return error.message;
  return 'حاول مرة أخرى بعد قليل.';
}

export interface RentalInquiryFormProps {
  listingId: string;
  listingTitle?: string;
  defaultInquiryType?: RentalInquiryType;
  intro?: string;
  className?: string;
  onSuccess?: (result: RentalInquiryPublicResponse) => void;
}

export function RentalInquiryForm({
  listingId,
  listingTitle,
  defaultInquiryType = 'VIEWING_REQUEST',
  intro,
  className,
  onSuccess,
}: RentalInquiryFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
      message: '',
      inquiryType: defaultInquiryType,
    },
  });

  const inquiryMutation = useMutation({
    mutationFn: (values: InquiryFormValues) => {
      const input: CreateRentalInquiryInput = {
        tenantName: values.tenantName,
        tenantPhone: values.tenantPhone,
        tenantEmail: values.tenantEmail || undefined,
        message: values.message || undefined,
        inquiryType: values.inquiryType,
      };

      return rentalApiService.createRentalInquiry(listingId, input);
    },
    onSuccess: (result) => {
      reset({
        tenantName: '',
        tenantPhone: '',
        tenantEmail: '',
        message: '',
        inquiryType: defaultInquiryType,
      });
      onSuccess?.(result);
    },
  });

  const selectedInquiryType = watch('inquiryType');
  const isPending = inquiryMutation.isPending || isSubmitting;
  const success = inquiryMutation.data;
  const error = inquiryMutation.error;

  const onSubmit = handleSubmit(async (values) => {
    await inquiryMutation.mutateAsync(values);
  });

  return (
    <section className={cn('rounded-[28px] border border-outline-variant/60 bg-white p-5 text-right shadow-xl shadow-primary/5 sm:p-6', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-black text-secondary">
            <CalendarCheck className="h-4 w-4" />
            طلب معاينة أو استفسار
          </span>
          <h2 className="mt-4 text-2xl font-black leading-9 text-primary">احجز اهتمامك بالوحدة بدون دفع</h2>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            {intro ?? 'اترك بياناتك وسيقوم فريق كمبوند السبحي بمتابعة طلبك من خلال الإدارة، بدون إظهار بيانات المالك أو تأكيد أي دفع.'}
          </p>
          {listingTitle && (
            <p className="mt-3 text-sm font-bold leading-7 text-secondary">{listingTitle}</p>
          )}
        </div>
        <ShieldCheck className="hidden h-9 w-9 shrink-0 text-secondary sm:block" />
      </div>

      {success && (
        <div className="mt-5 rounded-3xl border border-secondary/25 bg-secondary/10 p-5 text-right">
          <CheckCircle2 className="h-8 w-8 text-secondary" />
          <h3 className="mt-3 text-xl font-black text-primary">تم إرسال طلبك بنجاح</h3>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            سيتواصل معك فريق كمبوند السبحي لمتابعة طلب المعاينة.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-white px-3 py-1.5 text-secondary">
              الحالة: {inquiryStatusLabels[success.status] ?? success.status}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 font-mono text-on-surface-variant" dir="ltr">
              #{success.id.slice(0, 8)}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-3xl border border-error/25 bg-error-container/35 p-5 text-right">
          <h3 className="text-lg font-black text-error">تعذر إرسال الطلب</h3>
          <p className="mt-2 text-sm leading-7 text-error">حاول مرة أخرى بعد قليل.</p>
          <p className="mt-2 text-xs leading-6 text-on-surface-variant">{readableInquiryError(error)}</p>
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-primary">الاسم</span>
            <input
              className="w-full rounded-2xl border-outline-variant bg-surface-container-low py-3 text-right focus:border-secondary focus:ring-secondary/20"
              disabled={isPending}
              {...register('tenantName')}
            />
            {errors.tenantName && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantName.message}</span>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-primary">رقم الموبايل</span>
            <input
              className="w-full rounded-2xl border-outline-variant bg-surface-container-low py-3 text-right focus:border-secondary focus:ring-secondary/20"
              dir="ltr"
              disabled={isPending}
              inputMode="tel"
              {...register('tenantPhone')}
            />
            {errors.tenantPhone && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantPhone.message}</span>}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-primary">البريد الإلكتروني اختياري</span>
            <input
              className="w-full rounded-2xl border-outline-variant bg-surface-container-low py-3 text-right focus:border-secondary focus:ring-secondary/20"
              dir="ltr"
              disabled={isPending}
              type="email"
              {...register('tenantEmail')}
            />
            {errors.tenantEmail && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantEmail.message}</span>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-primary">نوع الطلب</span>
            <select
              className="w-full rounded-2xl border-outline-variant bg-surface-container-low py-3 text-right focus:border-secondary focus:ring-secondary/20"
              disabled={isPending}
              {...register('inquiryType')}
            >
              <option value="VIEWING_REQUEST">طلب معاينة</option>
              <option value="GENERAL">استفسار عام</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
            <MessageSquareText className="h-4 w-4 text-secondary" />
            الرسالة اختيارية
          </span>
          <textarea
            className="min-h-28 w-full resize-none rounded-2xl border-outline-variant bg-surface-container-low py-3 text-right focus:border-secondary focus:ring-secondary/20"
            disabled={isPending}
            maxLength={500}
            placeholder={selectedInquiryType === 'GENERAL' ? 'اكتب استفسارك عن الوحدة...' : 'اكتب الوقت المناسب للمعاينة أو أي ملاحظات مهمة...'}
            {...register('message')}
          />
          {errors.message && <span className="mt-1 block text-sm font-bold text-error">{errors.message.message}</span>}
        </label>

        <button
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-4 text-base font-black text-white shadow-xl shadow-secondary/15 transition hover:bg-secondary/95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          <Send className="h-5 w-5" />
          {isPending ? 'جارٍ إرسال الطلب...' : selectedInquiryType === 'GENERAL' ? 'إرسال الاستفسار' : 'إرسال طلب المعاينة'}
        </button>

        <p className="rounded-2xl bg-primary/5 p-3 text-xs leading-6 text-on-surface-variant">
          إرسال هذا الطلب لا يفتح بيانات المالك ولا ينشئ أي عملية دفع. فريق كمبوند السبحي يراجع الطلب من لوحة الإدارة فقط.
        </p>
      </form>
    </section>
  );
}
