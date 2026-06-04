import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CalendarCheck, CheckCircle2, Send, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiClientError } from '../../lib/api/api-client';
import { rentalApiService } from '../../lib/api/rental-service';
import type { CreateRentalInquiryInput, RentalInquiryPublicResponse, RentalInquiryType } from '../../lib/api/types';

const inquiryStatusLabels: Record<string, string> = {
  NEW: 'طلب جديد',
  VIEWING_REQUESTED: 'طلب معاينة',
  CONTACT_UNLOCKED: 'تم فتح التواصل',
  CLOSED: 'مغلق',
  CANCELLED: 'ملغي',
};

const inquirySchema = z.object({
  tenantName: z.string().trim().min(2, 'اكتب الاسم على الأقل من حرفين').max(150, 'الاسم طويل جدا'),
  tenantPhone: z.string().trim().min(5, 'اكتب رقم موبايل صحيح').max(30, 'رقم الموبايل طويل جدا').regex(/^\+?[0-9\s\-()]{5,30}$/, 'اكتب رقم موبايل بصيغة صحيحة'),
  tenantEmail: z.string().trim().email('اكتب بريد إلكتروني صحيح').optional().or(z.literal('')),
  message: z.string().trim().max(500, 'الرسالة يجب ألا تتجاوز 500 حرف').optional(),
  inquiryType: z.enum(['VIEWING_REQUEST', 'GENERAL']),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

function readableInquiryError(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 409) return 'الوحدة غير متاحة لاستقبال الطلبات حاليا.';
    if (error.status === 400) return 'راجع البيانات المكتوبة وحاول مرة أخرى.';
    return error.message || 'حاول مرة أخرى بعد قليل.';
  }
  return error instanceof Error && error.message ? error.message : 'حاول مرة أخرى بعد قليل.';
}

export interface RentalInquiryFormProps {
  listingId: string;
  listingTitle?: string;
  defaultInquiryType?: RentalInquiryType;
  intro?: string;
  onSuccess?: (result: RentalInquiryPublicResponse) => void;
}

export function RentalInquiryForm({
  listingId,
  listingTitle,
  defaultInquiryType = 'VIEWING_REQUEST',
  intro,
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
    defaultValues: { tenantName: '', tenantPhone: '', tenantEmail: '', message: '', inquiryType: defaultInquiryType },
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
      reset({ tenantName: '', tenantPhone: '', tenantEmail: '', message: '', inquiryType: defaultInquiryType });
      onSuccess?.(result);
    },
  });

  const selectedInquiryType = watch('inquiryType');
  const isPending = inquiryMutation.isPending || isSubmitting;
  const onSubmit = handleSubmit(async (values) => inquiryMutation.mutateAsync(values));

  return (
    <section className="form-card">
      <div className="status-row" style={{ justifyContent: 'space-between' }}>
        <div>
          <span className="chip gold"><CalendarCheck size={16} /> طلب معاينة أو استفسار</span>
          <h2 className="section-title" style={{ marginTop: 14 }}>احجز اهتمامك بالوحدة بدون دفع</h2>
          <p className="muted">
            {intro ?? 'اترك بياناتك وسيقوم فريق كمباوند السبحي بمتابعة طلبك من خلال الإدارة، بدون إظهار بيانات المالك أو تأكيد أي دفع.'}
          </p>
          {listingTitle && <p style={{ color: '#805b16', fontWeight: 900 }}>{listingTitle}</p>}
        </div>
        <ShieldCheck color="#b58a35" />
      </div>

      {inquiryMutation.data && (
        <div className="notice" style={{ marginTop: 16 }}>
          <CheckCircle2 size={26} />
          <strong>تم إرسال طلبك بنجاح</strong>
          <p>سيتواصل معك فريق كمباوند السبحي لمتابعة الطلب.</p>
          <span className="chip">الحالة: {inquiryStatusLabels[inquiryMutation.data.status] ?? inquiryMutation.data.status}</span>
          <span className="chip" dir="ltr">#{inquiryMutation.data.id.slice(0, 8)}</span>
        </div>
      )}

      {inquiryMutation.error && (
        <div className="notice danger" style={{ marginTop: 16 }}>
          <strong>تعذر إرسال الطلب</strong>
          <p>{readableInquiryError(inquiryMutation.error)}</p>
        </div>
      )}

      <form className="grid" style={{ marginTop: 18 }} onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>الاسم</span>
            <input disabled={isPending} {...register('tenantName')} />
            {errors.tenantName && <small className="error-text">{errors.tenantName.message}</small>}
          </label>
          <label className="field">
            <span>رقم الموبايل</span>
            <input dir="ltr" disabled={isPending} inputMode="tel" {...register('tenantPhone')} />
            {errors.tenantPhone && <small className="error-text">{errors.tenantPhone.message}</small>}
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>البريد الإلكتروني اختياري</span>
            <input dir="ltr" disabled={isPending} type="email" {...register('tenantEmail')} />
            {errors.tenantEmail && <small className="error-text">{errors.tenantEmail.message}</small>}
          </label>
          <label className="field">
            <span>نوع الطلب</span>
            <select disabled={isPending} {...register('inquiryType')}>
              <option value="VIEWING_REQUEST">طلب معاينة</option>
              <option value="GENERAL">استفسار عام</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>الرسالة اختيارية</span>
          <textarea
            disabled={isPending}
            maxLength={500}
            placeholder={selectedInquiryType === 'GENERAL' ? 'اكتب استفسارك عن الوحدة...' : 'اكتب الوقت المناسب للمعاينة أو أي ملاحظات مهمة...'}
            {...register('message')}
          />
          {errors.message && <small className="error-text">{errors.message.message}</small>}
        </label>
        <button className="btn-secondary" disabled={isPending} type="submit">
          <Send size={18} />
          {isPending ? 'جاري إرسال الطلب...' : selectedInquiryType === 'GENERAL' ? 'إرسال الاستفسار' : 'إرسال طلب المعاينة'}
        </button>
        <p className="notice">
          إرسال هذا الطلب لا يفتح بيانات المالك ولا ينشئ أي عملية دفع. الإدارة تراجع الطلب فقط.
        </p>
      </form>
    </section>
  );
}
