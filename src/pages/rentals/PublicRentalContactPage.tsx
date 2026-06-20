import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Home,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError } from '../../lib/api/api-client';
import { rentalApiService } from '../../lib/api/rental-service';
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
  publicRentalText,
} from './rental-format';

const contactSchema = z.object({
  tenantName: z.string().trim()
    .min(1, 'الاسم بالكامل مطلوب')
    .regex(/^[\u0621-\u064A\s]+$/, 'الاسم يجب أن يكون باللغة العربية فقط.')
    .refine((value) => {
      const words = value.split(/\s+/).filter(Boolean);
      return words.length >= 2;
    }, 'الاسم يجب أن يكون باللغة العربية ويتكون من اسمين على الأقل.'),
  tenantPhone: z.string().trim().min(5, 'اكتب رقم موبايل صحيح'),
  tenantNationalId: z.string().trim().regex(/^[0-9]{14}$/, 'الرقم القومي يجب أن يكون 14 رقمًا باللغة الإنجليزية.'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
  return false;
}

function generateMessageContent({
  tenantName,
  tenantPhone,
  tenantNationalId,
  listing,
  reservedBedNumber,
  remainingAvailableBeds,
}: {
  tenantName: string;
  tenantPhone: string;
  tenantNationalId: string;
  listing: any;
  reservedBedNumber?: number | null;
  remainingAvailableBeds?: number | null;
}) {
  const listingUrl = `${window.location.origin}/rentals/${listing.slug}`;
  const availableBeds = listing.availableBeds ?? Math.max((listing.totalBeds ?? 4) - 0 - 0, 0);
  const totalBeds = listing.totalBeds ?? 4;
  const remainingBeds =
    remainingAvailableBeds ?? (reservedBedNumber ? Math.max(availableBeds - 1, 0) : availableBeds);
  return `طلب حجز سرير:
- الاسم بالكامل: ${tenantName}
- رقم الموبايل: ${tenantPhone}
- الرقم القومي: ${tenantNationalId}
- عنوان الإعلان: ${listing.title}
- معرف الإعلان (ID): ${listing.id}
- معرف الشقة (Unit ID): ${listing.unitId || 'غير متوفر'}
- رابط الإعلان العام: ${listingUrl}
- إيجار الشقة الشهري: ${listing.monthlyRent}
- مبلغ التأمين: ${listing.depositAmount}
- حالة الشقة: ${listing.unitCondition || 'غير متوفر'}
- عدد السراير المتاحة: ${availableBeds}
- إجمالي السراير: ${totalBeds}${reservedBedNumber ? `
- رقم السرير المحجوز: سرير ${reservedBedNumber}
- عدد السراير المتاحة بعد الطلب: ${remainingBeds}` : ''}`;
}

function getAvailableBeds(listing: { availableBeds?: number; totalBeds?: number }) {
  return listing.availableBeds ?? Math.max((listing.totalBeds ?? 4) - 0 - 0, 0);
}

function getAvailableBedsLabel(count: number) {
  if (count <= 0) return 'لا توجد سراير متاحة';
  if (count === 1) return 'سرير واحد متاح فقط';
  if (count === 2) return 'متبقي سريران فقط';
  return `متاح الآن: ${count} سراير`;
}

const whatsappPhone = '201224591618';

function createClientRequestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function ContactImageFallback({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between overflow-hidden bg-primary p-5 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(214,178,94,0.35),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_40%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-tertiary backdrop-blur-md">
          <MessageCircle className="h-4 w-4 text-tertiary" />
          طلب تواصل بالواتساب
        </span>
        <div>
          <p className="text-sm font-bold text-tertiary">المنطقة المحيطة</p>
          <p className="mt-2 text-2xl font-black leading-9 text-fixed">{title}</p>
        </div>
      </div>
    </div>
  );
}

export function PublicRentalContactPage() {
  const { slug } = useParams();
  const [isSubmitPending, setIsSubmitPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUnavailableError, setIsUnavailableError] = useState(false);
  const clientRequestIdRef = useRef(createClientRequestId());
  const inFlightReservationRef = useRef(false);

  const listingQuery = useQuery({
    queryKey: ['rentals', 'public', 'listing', slug],
    queryFn: () => rentalApiService.getPublicRentalListingBySlug(slug ?? ''),
    enabled: Boolean(slug),
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      tenantName: '',
      tenantPhone: '',
      tenantNationalId: '',
    },
  });

  const listing = listingQuery.data;
  const listingDetailHref = listing ? `/rentals/${listing.slug}` : ROUTES.RENTALS;
  const title = listing ? publicRentalText(listing.title) : '';
  const compoundName = publicCompoundName(listing?.compound?.name);
  const coverImage = listing ? getListingCoverImage(listing) : null;
  const availableBeds = listing ? getAvailableBeds(listing) : 0;

  const onSubmit = handleSubmit(async (values) => {
    if (!listing || isSubmitPending || inFlightReservationRef.current) return;
    inFlightReservationRef.current = true;
    setSubmitError(null);
    setIsUnavailableError(false);
    setIsSubmitPending(true);

    try {
      const result = await rentalApiService.createRentalInquiry(listing.id, {
        clientRequestId: clientRequestIdRef.current,
        tenantName: values.tenantName,
        tenantPhone: values.tenantPhone,
        tenantNationalId: values.tenantNationalId,
        message: '',
      });
      const finalMessage = generateMessageContent({
        tenantName: values.tenantName,
        tenantPhone: values.tenantPhone,
        tenantNationalId: values.tenantNationalId,
        listing,
        reservedBedNumber: result.bedNumber,
        remainingAvailableBeds: result.remainingAvailableBeds,
      });
      const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(finalMessage)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      await copyToClipboard(finalMessage);
    } catch (error) {
      console.error(error);
      let errorMessage = 'تعذر إتمام طلب الحجز، حاول مرة أخرى أو تواصل عبر واتساب';
      if (error instanceof ApiClientError) {
        if (
          error.status === 409 ||
          error.status === 410 ||
          error.message?.includes('RENTAL_INQUIRY_LISTING_UNAVAILABLE') ||
          error.message?.includes('not available') ||
          error.message?.includes('unavailable') ||
          error.message?.includes('متاحة')
        ) {
          errorMessage = 'لا توجد سراير متاحة لهذا الإعلان';
          setIsUnavailableError(true);
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      setSubmitError(errorMessage);
    } finally {
      inFlightReservationRef.current = false;
      setIsSubmitPending(false);
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
        <Home className="h-14 w-14 text-tertiary" />
        <h1 className="mt-5 text-3xl font-black text-fixed">الإعلان غير موجود أو تم تحديث رابطه</h1>
        <p className="mt-3 leading-8 text-fixed-dim">
          الإعلان غير موجود أو تم تحديث رابطه. يمكنك الرجوع إلى سوق إيجارات المنطقة المحيطة واختيار الرابط الحالي من قائمة الإعلانات.
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
          العودة إلى تفاصيل الإعلان
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
                <div className="mt-5">
                  <div className="rounded-3xl bg-primary/45 border border-outline/25 p-4">
                    <p className="text-xs font-bold text-fixed-dim">إيجار الشقة الشهري</p>
                    <p className="mt-1 text-xl font-black text-tertiary">{formatRentalMoney(listing.monthlyRent)}</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <section className="space-y-5 text-right">
            <div className="rounded-[32px] glass-panel p-5 shadow-xl sm:p-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-tertiary backdrop-blur-md">
                <MessageCircle className="h-4 w-4 text-tertiary" />
                الحجز عبر واتساب
              </span>
              <h2 className="mt-5 text-3xl font-black leading-[1.35] text-fixed">
                احجز سرير داخل الشقة عبر واتساب في {compoundName}
              </h2>
              <p className="mt-3 text-sm leading-7 text-fixed-dim">
                الحجز يتم على سرير داخل الشقة، وليس على الشقة بالكامل. سيتم تحديد رقم السرير تلقائيًا حسب أولوية الإتاحة.
              </p>
              {availableBeds > 0 && (
                <div className="mt-4 inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-400">
                  {getAvailableBedsLabel(availableBeds)}
                </div>
              )}


              <div className="mt-4 rounded-[22px] border border-outline/25 bg-primary/35 p-4">
                <h3 className="text-base font-black text-fixed">خطوات بسيطة</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    ['١', 'املأ بياناتك'],
                    ['٢', 'أكد الحجز'],
                    ['٣', 'أرسل واتساب'],
                  ].map(([step, label]) => (
                    <div className="flex items-center gap-2 rounded-2xl bg-primary/45 border border-outline/20 px-3 py-2" key={step}>
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-black text-white">
                        {step}
                      </span>
                      <p className="text-xs font-black leading-5 text-fixed">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <form className="mt-7 space-y-5 text-right" onSubmit={onSubmit}>
                <div className="rounded-2xl border border-[#d9e5dc] bg-[#f7fbf7] p-4">
                  <h3 className="text-base font-black text-[#1f2c22]">ملخص الطلب</h3>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="font-bold text-[#526055]">الإعلان</dt>
                      <dd className="max-w-[60%] truncate font-black text-[#1f2c22]">{title}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="font-bold text-[#526055]">الإيجار</dt>
                      <dd className="font-black text-tertiary">{formatRentalMoney(listing.monthlyRent)}</dd>
                    </div>
                    {listing.depositAmount && (
                      <div className="flex items-center justify-between gap-4">
                        <dt className="font-bold text-[#526055]">التأمين</dt>
                        <dd className="font-black text-tertiary">{formatRentalMoney(listing.depositAmount)}</dd>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <dt className="font-bold text-[#526055]">السراير المطلوبة</dt>
                      <dd className="font-black text-[#1f2c22]">1</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="font-bold text-[#526055]">المتابعة</dt>
                      <dd className="font-black text-[#1f2c22]">واتساب</dd>
                    </div>
                  </dl>
                </div>

                {isUnavailableError ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-right">
                    <h4 className="text-base font-black text-error">السرير لم يعد متاحا</h4>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#526055]">
                      تم حجزه من شخص آخر. اختر إعلاناً آخر من القائمة.
                    </p>
                    <Link
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-white/5 px-4 py-3 text-sm font-black text-fixed transition hover:bg-white/10"
                      to={ROUTES.RENTALS}
                    >
                      عرض الإعلانات المتاحة
                    </Link>
                  </div>
                ) : submitError ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-error">
                    {submitError}
                  </div>
                ) : null}

                <section className="rounded-[24px] border border-[#d9e5dc] bg-white/80 p-4 shadow-sm">
                  <h3 className="text-base font-black text-[#1f2c22]">بيانات التواصل</h3>
                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-[#526055]">الاسم بالكامل</span>
                      <input
                        className="w-full rounded-2xl border border-[#d9e5dc] bg-[#edf3ff] text-right text-[#1f2c22] focus:border-tertiary focus:ring-tertiary/20"
                        disabled={isSubmitPending}
                        {...register('tenantName')}
                      />
                      {errors.tenantName && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantName.message}</span>}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-[#526055]">رقم الموبايل</span>
                      <input
                        className="w-full rounded-2xl border border-[#d9e5dc] bg-[#edf3ff] text-right text-[#1f2c22] focus:border-tertiary focus:ring-tertiary/20"
                        disabled={isSubmitPending}
                        inputMode="tel"
                        {...register('tenantPhone')}
                      />
                      {errors.tenantPhone && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantPhone.message}</span>}
                    </label>
                  </div>
                </section>

                <section className="rounded-[24px] border border-[#d9e5dc] bg-white/80 p-4 shadow-sm">
                  <h3 className="text-base font-black text-[#1f2c22]">بيانات التحقق</h3>
                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-bold text-[#526055]">الرقم القومي</span>
                    <input
                      className="w-full rounded-2xl border border-[#d9e5dc] bg-[#edf3ff] text-right text-[#1f2c22] focus:border-tertiary focus:ring-tertiary/20"
                      disabled={isSubmitPending}
                      maxLength={14}
                      placeholder="14 رقم باللغة الإنجليزية"
                      {...register('tenantNationalId')}
                    />
                    <span className="mt-2 block text-xs font-bold leading-6 text-[#526055]">
                      نستخدمه لتسجيل طلبك فقط.
                    </span>
                    {errors.tenantNationalId && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantNationalId.message}</span>}
                  </label>
                </section>

                <button
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-5 py-4 text-base font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 shadow-xl shadow-emerald-500/25 cursor-pointer"
                  disabled={isSubmitPending || availableBeds <= 0}
                  type="submit"
                >
                  <MessageCircle className="h-5 w-5" />
                  {isSubmitPending ? 'جاري حجز السرير...' : 'تأكيد الحجز'}
                </button>
                <p className="text-center text-xs font-bold leading-6 text-[#526055]">
                  بعد التأكيد سيفتح واتساب برسالة جاهزة لإرسال الطلب.
                </p>
              </form>
            </div>

            <Link
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-outline bg-white/5 hover:bg-white/10 px-5 py-3 text-sm font-black text-fixed sm:w-auto transition"
              to={listingDetailHref}
            >
              العودة للإعلان
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
