import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  MapPin,
  Ruler,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { RentalInquiryForm } from '../../components/rentals/RentalInquiryForm';
import { ApiClientError } from '../../lib/api/api-client';
import { rentalApiService } from '../../lib/api/rental-service';
import type { RentalListing } from '../../lib/api/types';
import { ROUTES } from '../../lib/constants/routes';
import {
  formatRentalDate,
  formatRentalMoney,
  furnishingLabels,
  getListingCoverImage,
  getListingImageAlt,
  listingStatusLabels,
  listingTypeLabels,
  publicCompoundName,
  publicRentalBrand,
  publicRentalText,
  sortListingImages,
  toNumber,
} from './rental-format';

const visitorSchema = z.object({
  tenantName: z.string().trim().min(2, 'اكتب الاسم بالكامل'),
  tenantPhone: z.string().trim().min(5, 'اكتب رقم موبايل صحيح'),
  tenantEmail: z.string().trim().email('اكتب بريد إلكتروني صحيح').optional().or(z.literal('')),
});

type VisitorFormValues = z.infer<typeof visitorSchema>;

function optionalAmenities(listing: RentalListing) {
  const value = (listing as RentalListing & { amenities?: unknown; features?: unknown }).amenities
    ?? (listing as RentalListing & { features?: unknown }).features;

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function DetailImageFallback({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between overflow-hidden bg-primary p-6 text-white sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(201,169,97,0.4),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.14),transparent_42%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-secondary-fixed backdrop-blur-md">
          <Building2 className="h-4 w-4" />
          {publicRentalBrand.rentalsTitle}
        </span>
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-primary-fixed">كمباوند السبحي</p>
          <p className="mt-2 text-3xl font-black leading-[1.35] sm:text-5xl">{title}</p>
        </div>
      </div>
    </div>
  );
}

function isPaymentProviderPending(error: unknown) {
  if (!(error instanceof ApiClientError)) return false;
  const details = error.details as { code?: string; error?: { code?: string } } | undefined;
  return error.status === 503 || details?.code === 'PAYMENT_PROVIDER_NOT_CONFIGURED' || details?.error?.code === 'PAYMENT_PROVIDER_NOT_CONFIGURED';
}

function DetailError({ title, message }: { title: string; message: string }) {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <Building2 className="h-14 w-14 text-secondary" />
      <h1 className="mt-5 text-3xl font-black text-primary">{title}</h1>
      <p className="mt-3 leading-8 text-on-surface-variant">{message}</p>
      <Link className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-white" to={ROUTES.RENTALS}>
        العودة إلى الإيجارات
      </Link>
    </main>
  );
}

export function PublicRentalDetailPage() {
  const { slug } = useParams();
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [reservationNotice, setReservationNotice] = useState<{ type: 'pending' | 'ready'; message: string; href?: string } | null>(null);
  const inquiryFormRef = useRef<HTMLDivElement>(null);

  const listingQuery = useQuery({
    queryKey: ['rentals', 'public', 'listing', slug],
    queryFn: () => rentalApiService.getPublicRentalListingBySlug(slug ?? ''),
    enabled: Boolean(slug),
  });

  const reservationMutation = useMutation({
    mutationFn: ({ listingId, values }: { listingId: string; values: VisitorFormValues }) =>
      rentalApiService.startRentalReservation(listingId, {
        tenantName: values.tenantName,
        tenantPhone: values.tenantPhone,
        tenantEmail: values.tenantEmail || undefined,
      }),
    onSuccess: (result) => {
      if (result.paymentUrl) {
        setReservationNotice({
          type: 'ready',
          message: 'تم تجهيز رابط دفع الحجز المؤقت من خلال مزود الدفع.',
          href: result.paymentUrl,
        });
        return;
      }

      setReservationNotice({
        type: 'pending',
        message: 'تم إنشاء طلب الحجز، لكن رابط الدفع غير متاح حاليا. تابع حالة الطلب بدون اعتبار الحجز مؤكدا.',
        href: result.reservation?.id ? `/rentals/reservations/${result.reservation.id}` : undefined,
      });
    },
    onError: (error) => {
      setReservationNotice({
        type: 'pending',
        message: isPaymentProviderPending(error)
          ? 'الدفع الإلكتروني قيد التجهيز. لم يتم تأكيد الحجز أو خصم أي مبلغ من خلال هذه الواجهة.'
          : error instanceof Error
            ? error.message
            : 'تعذر بدء طلب الحجز. حاول مرة أخرى.',
      });
    },
  });

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
    },
  });

  if (listingQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-[520px] animate-pulse rounded-[32px] bg-white shadow-xl shadow-primary/5" />
      </main>
    );
  }

  if (listingQuery.isError || !listingQuery.data) {
    return (
      <DetailError
        title="الوحدة غير موجودة أو تم تحديث رابطها"
        message="الوحدة غير موجودة أو تم تحديث رابطها. يمكنك الرجوع إلى قائمة الوحدات المتاحة واختيار الرابط الحالي من السوق."
      />
    );
  }

  const listing = listingQuery.data;
  const coverImage = getListingCoverImage(listing);
  const gallery = sortListingImages(listing);
  const amenities = optionalAmenities(listing);
  const title = publicRentalText(listing.title);
  const description = publicRentalText(listing.description);
  const location = publicRentalText(
    listing.locationText ?? listing.addressText ?? listing.compound?.address,
    publicRentalBrand.compoundAr,
  );
  const compoundName = publicCompoundName(listing.compound?.name);
  const isReservationPending = reservationMutation.isPending || isSubmitting;
  const unitFacts = [
    { label: 'الغرف', value: `${listing.bedrooms}`, icon: BedDouble },
    { label: 'الحمامات', value: `${listing.bathrooms}`, icon: Bath },
    { label: 'المساحة', value: `${new Intl.NumberFormat('ar-EG').format(toNumber(listing.areaSqm))} م²`, icon: Ruler },
  ];
  const pricingItems = [
    { label: 'التأمين', value: listing.depositAmount ? formatRentalMoney(listing.depositAmount) : 'غير محدد' },
    { label: 'فتح التواصل', value: formatRentalMoney(listing.contactUnlockFee) },
    { label: 'الحجز المؤقت', value: formatRentalMoney(listing.reservationFee) },
  ];

  const onReservationSubmit = handleSubmit(async (values) => {
    setReservationNotice(null);
    await reservationMutation.mutateAsync({ listingId: listing.id, values });
  });

  function revealInquiryForm() {
    setShowInquiryForm(true);
    window.requestAnimationFrame(() => {
      inquiryFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <main className="bg-background pb-16">
      <section className="border-b border-outline-variant/50 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <Link className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full px-1 text-sm font-bold text-primary hover:text-secondary" to={ROUTES.RENTALS}>
            <ChevronRight className="h-5 w-5" />
            رجوع إلى الإيجارات
          </Link>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
            <div className="min-w-0 space-y-4">
              <div className="relative overflow-hidden rounded-[32px] bg-surface-container-low shadow-2xl shadow-primary/10">
                <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/8.5]">
                  <DetailImageFallback title={title} />
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
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/80 via-primary/25 to-transparent p-5 text-white sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-secondary shadow-md">{listingStatusLabels[listing.status]}</span>
                    {listing.isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-white shadow-md">
                        <Sparkles className="h-3.5 w-3.5" />
                        مميز
                      </span>
                    )}
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">{listingTypeLabels[listing.listingType]}</span>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">{furnishingLabels[listing.furnishingStatus]}</span>
                  </div>
                  <h1 className="mt-3 max-w-4xl text-2xl font-black leading-[1.35] sm:text-4xl lg:text-5xl">{title}</h1>
                  <p className="mt-2 flex max-w-3xl items-center gap-2 text-sm text-primary-fixed sm:text-base">
                    <MapPin className="h-5 w-5 shrink-0 text-secondary-fixed" />
                    {location}
                  </p>
                </div>
              </div>

              {gallery.length > 1 && (
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {gallery.slice(0, 4).map((image) => (
                    <img
                      key={image.id}
                      alt={getListingImageAlt(listing, image)}
                      className="aspect-[4/3] rounded-2xl border border-outline-variant/50 object-cover shadow-sm"
                      src={image.url}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <aside className="self-start rounded-[32px] border border-outline-variant/60 bg-white p-5 text-right shadow-2xl shadow-primary/10 xl:sticky xl:top-24 xl:p-6">
              <div className="rounded-[26px] bg-primary p-5 text-white">
                <p className="text-sm font-bold text-primary-fixed-dim">الإيجار الشهري</p>
                <p className="mt-1 text-4xl font-black leading-tight">{formatRentalMoney(listing.monthlyRent)}</p>
                <p className="mt-3 text-sm leading-7 text-primary-fixed">
                  لوحة الحجز تعرض الرسوم فقط. التأكيد وفتح بيانات المالك يتمان عبر الخادم.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {unitFacts.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div key={fact.label} className="rounded-2xl bg-surface-container-low px-2 py-3 text-center">
                      <Icon className="mx-auto mb-1 h-5 w-5 text-primary" />
                      <p className="text-xs font-bold text-on-surface-variant">{fact.label}</p>
                      <p className="mt-1 text-sm font-black text-primary">{fact.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2 rounded-[24px] border border-outline-variant/60 p-4">
                {pricingItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-bold text-on-surface-variant">{item.label}</span>
                    <span className="font-black text-primary">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-4 text-base font-black text-white shadow-xl shadow-secondary/15" type="button" onClick={revealInquiryForm}>
                  <CalendarCheck className="h-5 w-5" />
                  طلب معاينة
                </button>
                <Link className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-black text-white shadow-xl shadow-primary/15" to={`/rentals/${listing.slug}/contact`}>
                  <LockKeyhole className="h-5 w-5" />
                  فتح بيانات التواصل
                </Link>
                <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-4 text-base font-black text-white shadow-xl shadow-secondary/15" type="button" onClick={() => setShowReservationForm((value) => !value)}>
                  <CalendarClock className="h-5 w-5" />
                  بدء حجز مؤقت
                </button>
              </div>

              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-secondary/10 p-3 text-xs leading-6 text-secondary">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                لا تظهر بيانات المالك ولا يتم تأكيد الحجز إلا بعد تحقق الدفع من الخادم.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-outline-variant/60 bg-white p-6 text-right shadow-xl shadow-primary/5">
            <h2 className="text-2xl font-black text-primary">وصف الوحدة</h2>
            <p className="mt-4 whitespace-pre-line text-base leading-9 text-on-surface-variant">{description}</p>
          </section>

          <section className="rounded-[28px] border border-outline-variant/60 bg-white p-6 text-right shadow-xl shadow-primary/5">
            <h2 className="text-2xl font-black text-primary">المواصفات</h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-container-low p-4"><dt className="text-sm text-on-surface-variant">نوع الوحدة</dt><dd className="mt-1 font-black text-primary">{listingTypeLabels[listing.listingType]}</dd></div>
              <div className="rounded-2xl bg-surface-container-low p-4"><dt className="text-sm text-on-surface-variant">التجهيز</dt><dd className="mt-1 font-black text-primary">{furnishingLabels[listing.furnishingStatus]}</dd></div>
              <div className="rounded-2xl bg-surface-container-low p-4"><dt className="text-sm text-on-surface-variant">الدور</dt><dd className="mt-1 font-black text-primary">{listing.floor ?? 'غير محدد'}</dd></div>
              <div className="rounded-2xl bg-surface-container-low p-4"><dt className="text-sm text-on-surface-variant">تاريخ النشر</dt><dd className="mt-1 font-black text-primary">{formatRentalDate(listing.publishedAt)}</dd></div>
            </dl>
          </section>

          {amenities.length > 0 && (
            <section className="rounded-[28px] border border-outline-variant/60 bg-white p-6 text-right shadow-xl shadow-primary/5">
              <h2 className="text-2xl font-black text-primary">المميزات</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {amenities.map((item) => (
                  <span key={item} className="rounded-full bg-secondary/10 px-4 py-2 text-sm font-bold text-secondary">
                    {publicRentalText(item)}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <div ref={inquiryFormRef}>
            {showInquiryForm ? (
              <RentalInquiryForm
                listingId={listing.id}
                listingTitle={title}
                intro="يمكنك طلب معاينة الوحدة الآن بدون تسجيل دخول وبدون دفع. سيصل الطلب إلى إدارة كمباوند السبحي للمتابعة."
              />
            ) : (
              <section className="rounded-[28px] border border-secondary/20 bg-secondary/10 p-5 text-right">
                <CalendarCheck className="h-6 w-6 text-secondary" />
                <h2 className="mt-3 text-xl font-black text-primary">تريد معاينة الوحدة أولًا؟</h2>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  أرسل طلب معاينة للإدارة بدون دفع أو فتح بيانات المالك. الطلب يصل لفريق كمباوند السبحي لمتابعته من لوحة الإدارة.
                </p>
                <button className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-sm font-black text-white shadow-lg shadow-secondary/15" type="button" onClick={revealInquiryForm}>
                  طلب معاينة
                  <CalendarCheck className="h-4 w-4" />
                </button>
              </section>
            )}
          </div>

          {showReservationForm && (
            <form className="rounded-[28px] border border-secondary/20 bg-white p-5 text-right shadow-xl shadow-secondary/10" onSubmit={onReservationSubmit}>
              <h2 className="text-xl font-black text-primary">بيانات الحجز المؤقت</h2>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                رسوم الحجز المؤقت: {formatRentalMoney(listing.reservationFee)}. الدفع الإلكتروني يجب أن يتم من خلال رابط مزود الدفع عند توفره.
              </p>
              <div className="mt-5 space-y-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-primary">الاسم</span>
                  <input className="w-full rounded-2xl border-outline-variant bg-surface-container-low text-right focus:border-secondary focus:ring-secondary/20" {...register('tenantName')} />
                  {errors.tenantName && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantName.message}</span>}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-primary">رقم الموبايل</span>
                  <input className="w-full rounded-2xl border-outline-variant bg-surface-container-low text-right focus:border-secondary focus:ring-secondary/20" {...register('tenantPhone')} />
                  {errors.tenantPhone && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantPhone.message}</span>}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-primary">البريد الإلكتروني اختياري</span>
                  <input className="w-full rounded-2xl border-outline-variant bg-surface-container-low text-right focus:border-secondary focus:ring-secondary/20" type="email" {...register('tenantEmail')} />
                  {errors.tenantEmail && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantEmail.message}</span>}
                </label>
              </div>
              {reservationNotice && (
                <div className="mt-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-4 text-sm leading-7 text-on-surface-variant">
                  <p className="font-bold text-primary">{reservationNotice.message}</p>
                  {reservationNotice.href && (
                    <a className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 font-bold text-white" href={reservationNotice.href}>
                      {reservationNotice.type === 'ready' ? 'فتح رابط الدفع' : 'متابعة حالة الحجز'}
                      <ArrowLeft className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-4 font-black text-white disabled:opacity-60" disabled={isReservationPending} type="submit">
                <CheckCircle2 className="h-5 w-5" />
                {isReservationPending ? 'جار بدء الطلب...' : 'بدء طلب الحجز'}
              </button>
            </form>
          )}

          <section className="rounded-[28px] border border-outline-variant/60 bg-white p-5 text-right shadow-xl shadow-primary/5">
            <h2 className="text-xl font-black text-primary">الموقع والكمباوند</h2>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">{compoundName}</p>
            <p className="mt-1 text-sm leading-7 text-on-surface-variant">{publicRentalText(listing.addressText ?? listing.compound?.address, 'القاهرة الجديدة')}</p>
          </section>
        </div>
      </section>
    </main>
  );
}
