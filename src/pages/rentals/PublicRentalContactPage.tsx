import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  ExternalLink,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { RentalInquiryForm } from '../../components/rentals/RentalInquiryForm';
import { ApiClientError } from '../../lib/api/api-client';
import { rentalApiService } from '../../lib/api/rental-service';
import type { ContactAccessResponse, StartContactUnlockResponse } from '../../lib/api/types';
import { ROUTES } from '../../lib/constants/routes';
import {
  formatRentalMoney,
  furnishingLabels,
  getListingCoverImage,
  getListingImageAlt,
  listingStatusLabels,
  listingTypeLabels,
  publicCompoundName,
  publicRentalBrand,
  publicRentalText,
} from './rental-format';

const contactSchema = z.object({
  tenantName: z.string().trim().min(2, 'اكتب الاسم بالكامل'),
  tenantPhone: z.string().trim().min(5, 'اكتب رقم موبايل صحيح'),
  tenantEmail: z.string().trim().email('اكتب بريد إلكتروني صحيح').optional().or(z.literal('')),
});

type ContactFormValues = z.infer<typeof contactSchema>;

function isPaymentProviderPending(error: unknown) {
  if (!(error instanceof ApiClientError)) return false;
  const details = error.details as { code?: string; error?: { code?: string } } | undefined;
  return (
    error.status === 503 ||
    details?.code === 'PAYMENT_PROVIDER_NOT_CONFIGURED' ||
    details?.error?.code === 'PAYMENT_PROVIDER_NOT_CONFIGURED'
  );
}

function readableContactError(error: unknown) {
  if (isPaymentProviderPending(error)) {
    return 'الدفع الإلكتروني قيد التجهيز. لن تظهر بيانات المالك قبل تفعيل مزود الدفع وتأكيد العملية من الخادم.';
  }

  if (error instanceof ApiClientError && error.message) {
    return `تعذر بدء طلب فتح التواصل. ${error.message}`;
  }

  if (error instanceof Error && error.message) {
    return `تعذر بدء طلب فتح التواصل. ${error.message}`;
  }

  return 'تعذر بدء طلب فتح التواصل. حاول مرة أخرى بعد قليل.';
}

function whatsappHref(phone: string | null | undefined) {
  const digits = phone?.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

function ContactImageFallback({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between overflow-hidden bg-primary p-5 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(201,169,97,0.42),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_40%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-secondary-fixed backdrop-blur-md">
          <LockKeyhole className="h-4 w-4" />
          فتح بيانات التواصل
        </span>
        <div>
          <p className="text-sm font-bold text-primary-fixed">كمباوند السبحي</p>
          <p className="mt-2 text-2xl font-black leading-9">{title}</p>
        </div>
      </div>
    </div>
  );
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
    mutationFn: ({ listingId, tenantPhone }: { listingId: string; tenantPhone: string }) =>
      rentalApiService.getContactAccess(listingId, tenantPhone),
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
    defaultValues: {
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
    },
  });

  const listing = listingQuery.data;
  const listingDetailHref = listing ? `/rentals/${listing.slug}` : ROUTES.RENTALS;
  const title = listing ? publicRentalText(listing.title) : '';
  const location = listing
    ? publicRentalText(
        listing.locationText ?? listing.addressText ?? listing.compound?.name,
        publicRentalBrand.compoundAr,
      )
    : publicRentalBrand.compoundAr;
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
      const currentAccess = await accessMutation.mutateAsync({
        listingId: listing.id,
        tenantPhone: values.tenantPhone,
      });

      setAccess(currentAccess);

      if (currentAccess.unlocked) {
        setNotice('تم التحقق من الدفع السابق، وبيانات التواصل متاحة الآن لهذا الرقم.');
        return;
      }

      const result = await unlockMutation.mutateAsync({ listingId: listing.id, values });
      setUnlockResult(result);

      const paymentUrl = result.paymentUrl ?? result.payment?.paymentUrl;

      if (paymentUrl) {
        setNotice('تم تجهيز رابط الدفع. تظهر بيانات التواصل فقط بعد تأكيد الدفع من الخادم.');
      } else if (result.alreadyUnlocked) {
        setNotice('تم العثور على فتح تواصل سابق. تحقق من بيانات التواصل مرة أخرى بنفس رقم الهاتف.');
      } else {
        setNotice('الدفع الإلكتروني قيد التجهيز. لن تظهر بيانات المالك قبل تفعيل مزود الدفع وتأكيد العملية من الخادم.');
      }
    } catch (error) {
      setNotice(readableContactError(error));
    }
  });

  if (listingQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="h-[420px] animate-pulse rounded-[32px] bg-white shadow-xl shadow-primary/5" />
          <div className="h-[520px] animate-pulse rounded-[32px] bg-white shadow-xl shadow-primary/5" />
        </div>
      </main>
    );
  }

  if (listingQuery.isError || !listing) {
    return (
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
        <LockKeyhole className="h-14 w-14 text-secondary" />
        <h1 className="mt-5 text-3xl font-black text-primary">الوحدة غير موجودة أو تم تحديث رابطها</h1>
        <p className="mt-3 leading-8 text-on-surface-variant">
          الوحدة غير موجودة أو تم تحديث رابطها. يمكنك الرجوع إلى سوق إيجارات السبحي واختيار الرابط الحالي من قائمة الوحدات.
        </p>
        <Link className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-white" to={ROUTES.RENTALS}>
          العودة إلى الإيجارات
        </Link>
      </main>
    );
  }

  return (
    <main className="bg-background pb-16">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary shadow-sm shadow-primary/5" to={listingDetailHref}>
          <ChevronRight className="h-5 w-5" />
          العودة إلى تفاصيل الوحدة
        </Link>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)] lg:items-start">
          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="overflow-hidden rounded-[32px] border border-outline-variant/60 bg-white text-right shadow-xl shadow-primary/5">
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                <ContactImageFallback title={title} />
                {coverImage && (
                  <img
                    alt={getListingImageAlt(listing, coverImage)}
                    className="relative h-full w-full object-cover"
                    src={coverImage.url}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-black text-secondary">
                    <Building2 className="h-4 w-4" />
                    {listingStatusLabels[listing.status]}
                  </span>
                  {listing.isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-black text-white shadow-sm shadow-secondary/15">
                      <Sparkles className="h-3.5 w-3.5" />
                      مميز
                    </span>
                  )}
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-black text-primary">{listingTypeLabels[listing.listingType]}</span>
                  <span className="rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-black text-primary">{furnishingLabels[listing.furnishingStatus]}</span>
                </div>
                <h1 className="mt-4 text-2xl font-black leading-9 text-primary">{title}</h1>
                <p className="mt-2 flex items-start gap-2 text-sm leading-7 text-on-surface-variant">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-secondary" />
                  <span>{location}</span>
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-surface-container-low p-4">
                    <p className="text-xs font-bold text-on-surface-variant">الإيجار الشهري</p>
                    <p className="mt-1 text-xl font-black text-primary">{formatRentalMoney(listing.monthlyRent)}</p>
                  </div>
                  <div className="rounded-3xl bg-surface-container-low p-4">
                    <p className="text-xs font-bold text-on-surface-variant">رسوم فتح التواصل</p>
                    <p className="mt-1 text-xl font-black text-primary">{formatRentalMoney(listing.contactUnlockFee)}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-secondary/20 bg-secondary/10 p-5 text-right">
              <ShieldCheck className="h-6 w-6 text-secondary" />
              <h2 className="mt-3 text-lg font-black text-primary">حماية للزائر والمالك</h2>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                بيانات التواصل لا تظهر من الواجهة، ولا يتم فتحها إلا بعد تحقق الخادم من دفع رسوم الفتح لهذه الوحدة وهذا الرقم.
              </p>
            </section>
          </aside>

          <section className="space-y-5 text-right">
            <div className="rounded-[32px] border border-outline-variant/60 bg-white p-5 shadow-xl shadow-primary/5 sm:p-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                <LockKeyhole className="h-4 w-4" />
                فتح بيانات التواصل
              </span>
              <h2 className="mt-5 text-3xl font-black leading-[1.35] text-primary">
                اطلب بيانات المالك بأمان داخل {compoundName}
              </h2>
              <p className="mt-3 text-base leading-8 text-on-surface-variant">
                اكتب بياناتك للتحقق أولا من وجود فتح تواصل مدفوع سابقا. إذا لم يكن لديك وصول، يبدأ طلب الدفع من الخادم عند توفر مزود الدفع.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['١', 'ادفع رسوم فتح التواصل'],
                  ['٢', 'يتم تأكيد الدفع من الخادم'],
                  ['٣', 'تظهر بيانات التواصل بعد التأكيد فقط'],
                ].map(([step, label]) => (
                  <div className="rounded-3xl bg-surface-container-low p-4" key={step}>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                      {step}
                    </span>
                    <p className="mt-3 text-sm font-black leading-6 text-primary">{label}</p>
                  </div>
                ))}
              </div>

              <form className="mt-7 space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-primary">الاسم بالكامل</span>
                  <input
                    className="w-full rounded-2xl border-outline-variant bg-surface-container-low py-3 text-right focus:border-secondary focus:ring-secondary/20"
                    {...register('tenantName')}
                  />
                  {errors.tenantName && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantName.message}</span>}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-primary">رقم الموبايل</span>
                  <input
                    className="w-full rounded-2xl border-outline-variant bg-surface-container-low py-3 text-right focus:border-secondary focus:ring-secondary/20"
                    inputMode="tel"
                    {...register('tenantPhone')}
                  />
                  {errors.tenantPhone && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantPhone.message}</span>}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-primary">البريد الإلكتروني اختياري</span>
                  <input
                    className="w-full rounded-2xl border-outline-variant bg-surface-container-low py-3 text-right focus:border-secondary focus:ring-secondary/20"
                    type="email"
                    {...register('tenantEmail')}
                  />
                  {errors.tenantEmail && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantEmail.message}</span>}
                </label>

                <button
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-black text-white shadow-xl shadow-primary/15 transition hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isPending}
                  type="submit"
                >
                  <CreditCard className="h-5 w-5" />
                  {isPending ? 'جاري التحقق...' : 'تحقق وابدأ فتح التواصل'}
                </button>
              </form>
            </div>

            <section className="rounded-[32px] border border-secondary/20 bg-white p-5 text-right shadow-xl shadow-secondary/10 sm:p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-black text-secondary">
                <CalendarCheck className="h-4 w-4" />
                بديل آمن بدون دفع
              </span>
              <h2 className="mt-4 text-2xl font-black leading-9 text-primary">أرسل طلب معاينة للإدارة</h2>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                بدل فتح بيانات التواصل الآن، يمكنك إرسال طلب معاينة للإدارة وسيتواصل معك فريق كمباوند السبحي لمتابعة الطلب.
              </p>
            </section>

            <RentalInquiryForm
              listingId={listing.id}
              listingTitle={title}
              intro="هذا الطلب لا يفتح بيانات المالك ولا يبدأ أي دفع. فريق كمباوند السبحي يستلم الطلب ويراجعه للمتابعة."
            />

            {ownerContact && (
              <section className="rounded-[32px] border border-secondary/30 bg-secondary/10 p-5 text-right shadow-xl shadow-secondary/10 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-black text-secondary">
                      <CheckCircle2 className="h-4 w-4" />
                      وصول مؤكد من الخادم
                    </span>
                    <h3 className="mt-4 text-2xl font-black text-primary">تم فتح بيانات التواصل</h3>
                    <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                      تعامل فقط داخل الإجراءات الرسمية للمنصة، ولا تعتمد على أي تأكيد خارج مسار الدفع المعتمد.
                    </p>
                  </div>
                  <ShieldCheck className="h-10 w-10 text-secondary" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4">
                    <p className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                      <UserRound className="h-4 w-4 text-secondary" />
                      اسم المالك
                    </p>
                    <p className="mt-2 text-lg font-black text-primary">{ownerContact.fullName}</p>
                  </div>
                  <a className="rounded-3xl bg-white p-4 transition hover:bg-surface-container-low" href={`tel:${ownerContact.phone}`}>
                    <p className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                      <Phone className="h-4 w-4 text-secondary" />
                      رقم الهاتف
                    </p>
                    <p className="mt-2 text-lg font-black text-primary">{ownerContact.phone}</p>
                  </a>
                  {whatsappUrl && (
                    <a className="rounded-3xl bg-white p-4 transition hover:bg-surface-container-low" href={whatsappUrl} rel="noreferrer" target="_blank">
                      <p className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                        <MessageCircle className="h-4 w-4 text-secondary" />
                        واتساب
                      </p>
                      <p className="mt-2 text-lg font-black text-primary">مراسلة المالك</p>
                    </a>
                  )}
                  {ownerContact.email && (
                    <a className="rounded-3xl bg-white p-4 transition hover:bg-surface-container-low" href={`mailto:${ownerContact.email}`}>
                      <p className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                        <Mail className="h-4 w-4 text-secondary" />
                        البريد الإلكتروني
                      </p>
                      <p className="mt-2 break-all text-lg font-black text-primary">{ownerContact.email}</p>
                    </a>
                  )}
                </div>
              </section>
            )}

            {!ownerContact && (notice || checkoutUrl) && (
              <section className="rounded-[32px] border border-outline-variant/60 bg-white p-5 text-right shadow-xl shadow-primary/5 sm:p-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-tertiary/10 px-3 py-1.5 text-xs font-black text-tertiary">
                  <CreditCard className="h-4 w-4" />
                  حالة طلب فتح التواصل
                </span>
                <h3 className="mt-4 text-2xl font-black text-primary">
                  {checkoutUrl ? 'رابط الدفع جاهز' : 'الدفع الإلكتروني قيد التجهيز'}
                </h3>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  {notice ??
                    'لن تظهر بيانات المالك قبل نجاح الدفع وتأكيده من الخادم. لا يوجد فتح تواصل وهمي أو اعتماد على حالة من المتصفح.'}
                </p>
                <Link className="mt-3 inline-flex text-sm font-black text-secondary hover:underline" to={ROUTES.REFUND_POLICY}>
                  سياسة الاسترجاع وشروط الدفع
                </Link>
                {checkoutUrl && (
                  <a
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-sm font-black text-white shadow-lg shadow-secondary/15 sm:w-auto"
                    href={checkoutUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    إتمام الدفع
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </section>
            )}

            <Link
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-white px-5 py-3 text-sm font-black text-primary sm:w-auto"
              to={listingDetailHref}
            >
              العودة للوحدة
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
