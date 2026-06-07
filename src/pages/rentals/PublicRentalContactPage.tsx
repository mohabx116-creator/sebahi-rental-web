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
  getOptimizedListingImageUrl,
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(214,178,94,0.35),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_40%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-tertiary backdrop-blur-md">
          <LockKeyhole className="h-4 w-4 text-tertiary" />
          فتح بيانات التواصل
        </span>
        <div>
          <p className="text-sm font-bold text-tertiary">كمبوند السبحي</p>
          <p className="mt-2 text-2xl font-black leading-9 text-fixed">{title}</p>
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
          <div className="h-[420px] animate-pulse rounded-[32px] bg-primary/30 border border-outline/25 shadow-xl" />
          <div className="h-[520px] animate-pulse rounded-[32px] bg-primary/30 border border-outline/25 shadow-xl" />
        </div>
      </main>
    );
  }

  if (listingQuery.isError || !listing) {
    return (
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center text-fixed">
        <LockKeyhole className="h-14 w-14 text-tertiary" />
        <h1 className="mt-5 text-3xl font-black text-fixed">الوحدة غير موجودة أو تم تحديث رابطها</h1>
        <p className="mt-3 leading-8 text-fixed-dim">
          الوحدة غير موجودة أو تم تحديث رابطها. يمكنك الرجوع إلى سوق إيجارات السبحي واختيار الرابط الحالي من قائمة الوحدات.
        </p>
        <Link className="mt-6 rounded-full bg-tertiary px-6 py-3 font-bold text-primary hover:bg-tertiary/90 transition shadow-lg shadow-tertiary/20" to={ROUTES.RENTALS}>
          العودة إلى الإيجارات
        </Link>
      </main>
    );
  }

  return (
    <main className="pb-16 text-fixed">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-bold text-fixed transition shadow-md" to={listingDetailHref}>
          <ChevronRight className="h-5 w-5 text-tertiary" />
          العودة إلى تفاصيل الوحدة
        </Link>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)] lg:items-start">
          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="overflow-hidden rounded-[32px] glass-panel text-right shadow-xl">
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-dim">
                <ContactImageFallback title={title} />
                {coverImage && (
                  <img
                    alt={getListingImageAlt(listing, coverImage)}
                    className="relative h-full w-full object-cover"
                    decoding="async"
                    loading="lazy"
                    src={getOptimizedListingImageUrl(coverImage, 'card')}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary/30 border border-secondary/20 px-3 py-1.5 text-xs font-black text-white">
                    <Building2 className="h-4 w-4 text-tertiary" />
                    {listingStatusLabels[listing.status]}
                  </span>
                  {listing.isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-tertiary px-3 py-1.5 text-xs font-black text-primary shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                      مميز
                    </span>
                  )}
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-black text-fixed">{listingTypeLabels[listing.listingType]}</span>
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-black text-fixed">{listing.unitCondition || furnishingLabels[listing.furnishingStatus]}</span>
                </div>
                <h1 className="mt-4 text-2xl font-black leading-9 text-fixed">{title}</h1>
                <p className="mt-2 flex items-start gap-2 text-sm leading-7 text-fixed-dim">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-tertiary" />
                  <span>{location}</span>
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-primary/45 border border-outline/25 p-4">
                    <p className="text-xs font-bold text-fixed-dim">الايجار الشهري</p>
                    <p className="mt-1 text-xl font-black text-tertiary">{formatRentalMoney(listing.monthlyRent)}</p>
                  </div>
                  <div className="rounded-3xl bg-primary/45 border border-outline/25 p-4">
                    <p className="text-xs font-bold text-fixed-dim">رسوم فتح التواصل</p>
                    <p className="mt-1 text-xl font-black text-tertiary">{formatRentalMoney(listing.contactUnlockFee)}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-secondary/30 bg-secondary/20 p-5 text-right">
              <ShieldCheck className="h-6 w-6 text-tertiary" />
              <h2 className="mt-3 text-lg font-black text-fixed">حماية للزائر والمالك</h2>
              <p className="mt-2 text-sm leading-7 text-fixed-dim">
                بيانات التواصل لا تظهر من الواجهة، ولا يتم فتحها إلا بعد تحقق الخادم من دفع رسوم الفتح لهذه الوحدة وهذا الرقم.
              </p>
            </section>
          </aside>

          <section className="space-y-5 text-right">
            <div className="rounded-[32px] glass-panel p-5 shadow-xl sm:p-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-tertiary backdrop-blur-md">
                <LockKeyhole className="h-4 w-4 text-tertiary" />
                فتح بيانات التواصل
              </span>
              <h2 className="mt-5 text-3xl font-black leading-[1.35] text-fixed">
                اطلب بيانات المالك بأمان داخل {compoundName}
              </h2>
              <p className="mt-3 text-base leading-8 text-fixed-dim">
                اكتب بياناتك للتحقق أولًا من وجود فتح تواصل مدفوع سابقًا. إذا لم يكن لديك وصول، يبدأ طلب الدفع من الخادم عند توفر مزود الدفع.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['١', 'ادفع رسوم فتح التواصل'],
                  ['٢', 'يتم تأكيد الدفع من الخادم'],
                  ['٣', 'تظهر بيانات التواصل بعد التأكيد فقط'],
                ].map(([step, label]) => (
                  <div className="rounded-3xl bg-primary/45 border border-outline/20 p-4" key={step}>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-black text-white">
                      {step}
                    </span>
                    <p className="mt-3 text-sm font-black leading-6 text-fixed">{label}</p>
                  </div>
                ))}
              </div>

              <form className="mt-7 space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-fixed-dim">الاسم بالكامل</span>
                  <input
                    className="w-full rounded-2xl border-outline bg-primary/40 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20"
                    {...register('tenantName')}
                  />
                  {errors.tenantName && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantName.message}</span>}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-fixed-dim">رقم الموبايل</span>
                  <input
                    className="w-full rounded-2xl border-outline bg-primary/40 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20"
                    inputMode="tel"
                    {...register('tenantPhone')}
                  />
                  {errors.tenantPhone && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantPhone.message}</span>}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-fixed-dim">البريد الإلكتروني اختياري</span>
                  <input
                    className="w-full rounded-2xl border-outline bg-primary/40 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20"
                    type="email"
                    {...register('tenantEmail')}
                  />
                  {errors.tenantEmail && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantEmail.message}</span>}
                </label>

                <button
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-tertiary hover:bg-tertiary/90 px-5 py-4 text-base font-black text-primary transition disabled:cursor-not-allowed disabled:opacity-60 shadow-xl shadow-tertiary/20"
                  disabled={isPending}
                  type="submit"
                >
                  <CreditCard className="h-5 w-5 text-primary" />
                  {isPending ? 'جاري التحقق...' : 'تحقق وابدأ فتح التواصل'}
                </button>
              </form>
            </div>

            <section className="rounded-[32px] glass-panel p-5 text-right shadow-xl sm:p-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-tertiary backdrop-blur-md">
                <CalendarCheck className="h-4 w-4 text-tertiary" />
                بديل آمن بدون دفع
              </span>
              <h2 className="mt-4 text-2xl font-black leading-9 text-fixed">أرسل طلب معاينة للإدارة</h2>
              <p className="mt-2 text-sm leading-7 text-fixed-dim">
                بدل فتح بيانات التواصل الآن، يمكنك إرسال طلب معاينة للإدارة وسيتواصل معك فريق كمبوند السبحي لمتابعة الطلب.
              </p>
            </section>

            <RentalInquiryForm
              listingId={listing.id}
              listingTitle={title}
              intro="هذا الطلب لا يفتح بيانات المالك ولا يبدأ أي دفع. فريق كمبوند السبحي يستلم الطلب ويراجعه للمتابعة."
            />

            {ownerContact && (
              <section className="rounded-[32px] border border-secondary/30 bg-secondary/20 p-5 text-right shadow-xl sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-black text-tertiary backdrop-blur-md">
                      <CheckCircle2 className="h-4 w-4 text-tertiary" />
                      وصول مؤكد من الخادم
                    </span>
                    <h3 className="mt-4 text-2xl font-black text-fixed">تم فتح بيانات التواصل</h3>
                    <p className="mt-2 text-sm leading-7 text-fixed-dim">
                      تعامل فقط داخل الإجراءات الرسمية للمنصة، ولا تعتمد على أي تأكيد خارج مسار الدفع المعتمد.
                    </p>
                  </div>
                  <ShieldCheck className="h-10 w-10 text-tertiary" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-primary/45 border border-outline/20 p-4">
                    <p className="flex items-center gap-2 text-xs font-bold text-fixed-dim">
                      <UserRound className="h-4 w-4 text-tertiary" />
                      اسم المالك
                    </p>
                    <p className="mt-2 text-lg font-black text-fixed">{ownerContact.fullName}</p>
                  </div>
                  <a className="rounded-3xl bg-primary/45 border border-outline/20 p-4 transition hover:bg-primary/60" href={`tel:${ownerContact.phone}`}>
                    <p className="flex items-center gap-2 text-xs font-bold text-fixed-dim">
                      <Phone className="h-4 w-4 text-tertiary" />
                      رقم الهاتف
                    </p>
                    <p className="mt-2 text-lg font-black text-fixed" dir="ltr">{ownerContact.phone}</p>
                  </a>
                  {whatsappUrl && (
                    <a className="rounded-3xl bg-primary/45 border border-outline/20 p-4 transition hover:bg-primary/60" href={whatsappUrl} rel="noreferrer" target="_blank">
                      <p className="flex items-center gap-2 text-xs font-bold text-fixed-dim">
                        <MessageCircle className="h-4 w-4 text-tertiary" />
                        واتساب
                      </p>
                      <p className="mt-2 text-lg font-black text-tertiary">مراسلة المالك</p>
                    </a>
                  )}
                  {ownerContact.email && (
                    <a className="rounded-3xl bg-primary/45 border border-outline/20 p-4 transition hover:bg-primary/60" href={`mailto:${ownerContact.email}`}>
                      <p className="flex items-center gap-2 text-xs font-bold text-fixed-dim">
                        <Mail className="h-4 w-4 text-tertiary" />
                        البريد الإلكتروني
                      </p>
                      <p className="mt-2 break-all text-lg font-black text-fixed">{ownerContact.email}</p>
                    </a>
                  )}
                </div>
              </section>
            )}

            {!ownerContact && (notice || checkoutUrl) && (
              <section className="rounded-[32px] glass-panel p-5 text-right shadow-xl sm:p-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-tertiary">
                  <CreditCard className="h-4 w-4 text-tertiary" />
                  حالة طلب فتح التواصل
                </span>
                <h3 className="mt-4 text-2xl font-black text-fixed">
                  {checkoutUrl ? 'رابط الدفع جاهز' : 'الدفع الإلكتروني قيد التجهيز'}
                </h3>
                <p className="mt-2 text-sm leading-7 text-fixed-dim">
                  {notice ??
                    'لن تظهر بيانات المالك قبل نجاح الدفع وتأكيده من الخادم. لا يوجد فتح تواصل وهمي أو اعتماد على حالة من المتصفح.'}
                </p>
                <Link className="mt-3 inline-flex text-sm font-black text-tertiary hover:underline" to={ROUTES.REFUND_POLICY}>
                  سياسة الاسترجاع وشروط الدفع
                </Link>
                {checkoutUrl && (
                  <a
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary hover:bg-secondary/90 px-5 py-3 text-sm font-black text-white shadow-lg shadow-secondary/20 sm:w-auto"
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
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-outline bg-white/5 hover:bg-white/10 px-5 py-3 text-sm font-black text-fixed sm:w-auto transition"
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
