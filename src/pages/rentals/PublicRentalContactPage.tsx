import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2, CheckCircle2, ChevronRight, CreditCard, ExternalLink, LockKeyhole, Mail, MessageCircle, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { RentalInquiryForm } from '../../components/rentals/RentalInquiryForm';
import { ApiClientError } from '../../lib/api/api-client';
import { rentalApiService } from '../../lib/api/rental-service';
import type { ContactAccessResponse, StartContactUnlockResponse } from '../../lib/api/types';
import { ROUTES } from '../../lib/constants/routes';
import { formatRentalMoney, getListingCoverImage, getListingImageAlt, publicCompoundName, publicRentalText } from './rental-format';

const contactSchema = z.object({
  tenantName: z.string().trim().min(2, 'اكتب الاسم بالكامل'),
  tenantPhone: z.string().trim().min(5, 'اكتب رقم موبايل صحيح'),
  tenantEmail: z.string().trim().email('اكتب بريد إلكتروني صحيح').optional().or(z.literal('')),
});

type ContactFormValues = z.infer<typeof contactSchema>;

function isPaymentProviderPending(error: unknown) {
  if (!(error instanceof ApiClientError)) return false;
  const details = error.details as { code?: string; error?: { code?: string } } | undefined;
  return error.status === 503 || details?.code === 'PAYMENT_PROVIDER_NOT_CONFIGURED' || details?.error?.code === 'PAYMENT_PROVIDER_NOT_CONFIGURED';
}

function readableContactError(error: unknown) {
  if (isPaymentProviderPending(error)) {
    return 'الدفع الإلكتروني قيد التجهيز. لن تظهر بيانات المالك قبل تفعيل مزود الدفع وتأكيد العملية من الخادم.';
  }
  if (error instanceof ApiClientError && error.message) return `تعذر بدء طلب فتح التواصل. ${error.message}`;
  return error instanceof Error && error.message ? `تعذر بدء طلب فتح التواصل. ${error.message}` : 'تعذر بدء طلب فتح التواصل. حاول مرة أخرى بعد قليل.';
}

function whatsappHref(phone: string | null | undefined) {
  const digits = phone?.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

export function PublicRentalContactPage() {
  const { slug } = useParams();
  const [access, setAccess] = useState<ContactAccessResponse | null>(null);
  const [unlockResult, setUnlockResult] = useState<StartContactUnlockResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const listingQuery = useQuery({
    queryKey: ['rentals', 'public', 'listing', slug],
    queryFn: () => rentalApiService.getPublicRentalListingBySlug(slug ?? ''),
    enabled: Boolean(slug),
  });

  const accessMutation = useMutation({
    mutationFn: ({ listingId, tenantPhone }: { listingId: string; tenantPhone: string }) => rentalApiService.getContactAccess(listingId, tenantPhone),
  });

  const unlockMutation = useMutation({
    mutationFn: ({ listingId, values }: { listingId: string; values: ContactFormValues }) =>
      rentalApiService.startContactUnlock(listingId, {
        tenantName: values.tenantName,
        tenantPhone: values.tenantPhone,
        tenantEmail: values.tenantEmail || undefined,
      }),
  });

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { tenantName: '', tenantPhone: '', tenantEmail: '' },
  });

  const listing = listingQuery.data;
  const title = listing ? publicRentalText(listing.title) : '';
  const compoundName = publicCompoundName(listing?.compound?.name);
  const coverImage = listing ? getListingCoverImage(listing) : null;
  const checkoutUrl = unlockResult?.paymentUrl ?? unlockResult?.payment?.paymentUrl ?? null;
  const ownerContact = access?.unlocked === true ? access.ownerContact : null;
  const whatsappUrl = ownerContact ? whatsappHref(ownerContact.phone) : null;
  const isPending = isSubmitting || accessMutation.isPending || unlockMutation.isPending;

  const onSubmit = handleSubmit(async (values) => {
    if (!listing) return;
    setNotice(null);
    setAccess(null);
    setUnlockResult(null);
    try {
      const currentAccess = await accessMutation.mutateAsync({ listingId: listing.id, tenantPhone: values.tenantPhone });
      setAccess(currentAccess);
      if (currentAccess.unlocked) {
        setNotice('تم التحقق من فتح تواصل سابق، وبيانات التواصل متاحة الآن لهذا الرقم.');
        return;
      }
      const result = await unlockMutation.mutateAsync({ listingId: listing.id, values });
      setUnlockResult(result);
      const paymentUrl = result.paymentUrl ?? result.payment?.paymentUrl;
      setNotice(paymentUrl ? 'تم تجهيز رابط الدفع. تظهر بيانات التواصل فقط بعد تأكيد الدفع من الخادم.' : 'الدفع الإلكتروني قيد التجهيز. لن تظهر بيانات المالك قبل تفعيل مزود الدفع وتأكيد العملية من الخادم.');
    } catch (error) {
      setNotice(readableContactError(error));
    }
  });

  if (listingQuery.isLoading) return <main className="page"><div className="panel">جاري تحميل صفحة التواصل...</div></main>;
  if (listingQuery.isError || !listing) {
    return (
      <main className="center-state page">
        <section className="panel">
          <LockKeyhole size={52} color="#b58a35" />
          <h1 className="title">الوحدة غير موجودة أو تم تحديث رابطها</h1>
          <p className="muted">يمكنك الرجوع إلى سوق إيجارات السبحي واختيار الرابط الحالي.</p>
          <Link className="btn" to={ROUTES.RENTALS}>العودة إلى الإيجارات</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <Link className="btn-light" to={`/rentals/${listing.slug}`}><ChevronRight size={18} /> العودة إلى تفاصيل الوحدة</Link>
      <section className="grid detail-grid" style={{ marginTop: 20 }}>
        <aside className="grid">
          <section className="card">
            <div className="image-box">
              <div className="image-fallback"><span className="chip gold"><LockKeyhole size={16} /> فتح بيانات التواصل</span><strong>{title}</strong></div>
              {coverImage && <img alt={getListingImageAlt(listing, coverImage)} src={coverImage.url} />}
            </div>
            <div className="card-body">
              <span className="chip"><Building2 size={16} /> {compoundName}</span>
              <h1 className="title" style={{ fontSize: '1.7rem' }}>{title}</h1>
              <div className="prices">
                <div className="price"><small>الإيجار</small><strong>{formatRentalMoney(listing.monthlyRent)}</strong></div>
                <div className="price"><small>رسوم فتح التواصل</small><strong>{formatRentalMoney(listing.contactUnlockFee)}</strong></div>
              </div>
            </div>
          </section>
          <section className="notice">
            <ShieldCheck size={20} />
            بيانات التواصل لا تظهر من الواجهة ولا يتم فتحها إلا إذا أكد الخادم أن الوصول متاح لهذا الرقم.
          </section>
        </aside>

        <section className="grid">
          <div className="form-card">
            <span className="chip"><LockKeyhole size={16} /> فتح بيانات التواصل</span>
            <h2 className="title">اطلب بيانات المالك بأمان داخل {compoundName}</h2>
            <p className="muted">اكتب بياناتك للتحقق أولا من وجود فتح تواصل مدفوع سابقا. إذا لم يكن لديك وصول، يبدأ طلب الدفع من الخادم عند توفر مزود الدفع.</p>
            <form className="grid" style={{ marginTop: 18 }} onSubmit={onSubmit}>
              <label className="field">
                <span>الاسم بالكامل</span>
                <input disabled={isPending} {...register('tenantName')} />
                {errors.tenantName && <small className="error-text">{errors.tenantName.message}</small>}
              </label>
              <label className="field">
                <span>رقم الموبايل</span>
                <input dir="ltr" disabled={isPending} inputMode="tel" {...register('tenantPhone')} />
                {errors.tenantPhone && <small className="error-text">{errors.tenantPhone.message}</small>}
              </label>
              <label className="field">
                <span>البريد الإلكتروني اختياري</span>
                <input dir="ltr" disabled={isPending} type="email" {...register('tenantEmail')} />
                {errors.tenantEmail && <small className="error-text">{errors.tenantEmail.message}</small>}
              </label>
              <button className="btn" disabled={isPending} type="submit"><CreditCard size={18} /> {isPending ? 'جاري التحقق...' : 'تحقق وابدأ فتح التواصل'}</button>
            </form>
          </div>

          <RentalInquiryForm
            listingId={listing.id}
            listingTitle={title}
            intro="هذا الطلب لا يفتح بيانات المالك ولا يبدأ أي دفع. فريق كمباوند السبحي يستلم الطلب ويراجعه للمتابعة."
          />

          {ownerContact && (
            <section className="panel" style={{ borderColor: 'rgba(181, 138, 53, 0.4)' }}>
              <span className="chip gold"><CheckCircle2 size={16} /> وصول مؤكد من الخادم</span>
              <h2 className="section-title" style={{ marginTop: 14 }}>تم فتح بيانات التواصل</h2>
              <div className="grid list-grid">
                <div className="soft-box"><UserRound size={18} /><small>اسم المالك</small><strong>{ownerContact.fullName}</strong></div>
                <a className="soft-box" href={`tel:${ownerContact.phone}`}><Phone size={18} /><small>رقم الهاتف</small><strong>{ownerContact.phone}</strong></a>
                {whatsappUrl && <a className="soft-box" href={whatsappUrl} rel="noreferrer" target="_blank"><MessageCircle size={18} /><small>واتساب</small><strong>مراسلة المالك</strong></a>}
                {ownerContact.email && <a className="soft-box" href={`mailto:${ownerContact.email}`}><Mail size={18} /><small>البريد الإلكتروني</small><strong>{ownerContact.email}</strong></a>}
              </div>
            </section>
          )}

          {!ownerContact && (notice || checkoutUrl) && (
            <section className="panel">
              <span className="chip gold"><CreditCard size={16} /> حالة طلب فتح التواصل</span>
              <h2 className="section-title" style={{ marginTop: 14 }}>{checkoutUrl ? 'رابط الدفع جاهز' : 'الدفع الإلكتروني قيد التجهيز'}</h2>
              <p className="muted">{notice}</p>
              {checkoutUrl && <a className="btn-secondary" href={checkoutUrl} rel="noreferrer" target="_blank">إتمام الدفع <ExternalLink size={16} /></a>}
            </section>
          )}
        </section>
      </section>
    </main>
  );
}
