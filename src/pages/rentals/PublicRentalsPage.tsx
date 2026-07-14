import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { ArrowLeft, BedDouble, Building2, Check, Filter, Home, Images, MapPin, ShieldCheck } from 'lucide-react';
import type { FormEvent, PointerEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rentalApiService } from '../../lib/api/rental-service';
import type { RentalListing, RentalListingQuery } from '../../lib/api/types';
import { ROUTES } from '../../lib/constants/routes';
import { cn } from '../../lib/utils/cn';
import { MobileOwnerAcquisitionCta } from '../../components/layout/MobileOwnerAcquisitionCta';
import {
  formatRentalMoney,
  furnishingLabels,
  getListingCoverImage,
  getListingImageAlt,
  getOptimizedListingImageUrl,
  getRentalBedCounts,
  listingStatusLabels,
  listingTypeLabels,
  publicRentalBrand,
  publicRentalText,
  toNumber,
} from './rental-format';

import heroImage from '../../assets/sebahi-gardens-hero.jpg';

const publicRentalCardLocation = 'حدائق العاشر من رمضان';
const PUBLIC_RENTAL_DETAIL_STALE_TIME_MS = 30_000;

function getAvailableBedsText(availableBeds: number) {
  if (availableBeds <= 0) return 'لا توجد سراير متاحة';
  if (availableBeds === 1) return 'آخر سرير متاح';
  return `عدد السراير المتاحة: ${availableBeds}`;
}

function getBasicsSummary(listing: RentalListing) {
  return (listing.basicFeatures || []).length >= 7 ? 'الأساسيات مكتملة' : 'أساسيات غير مكتملة';
}

function prefetchRentalListingDetail(queryClient: QueryClient, slug: string) {
  if (!slug) return;

  const queryKey = ['rentals', 'public', 'listing', slug] as const;
  if (queryClient.getQueryData(queryKey)) return;

  void queryClient.prefetchQuery({
    queryKey,
    queryFn: () => rentalApiService.getPublicRentalListingBySlug(slug),
    staleTime: PUBLIC_RENTAL_DETAIL_STALE_TIME_MS,
  });
}

function buildQuery(searchParams: URLSearchParams): RentalListingQuery {
  const minRent = searchParams.get('minRent');
  const maxRent = searchParams.get('maxRent');

  return {
    page: Number(searchParams.get('page') || 1),
    limit: 12,
    minRent: minRent ? Number(minRent) : undefined,
    maxRent: maxRent ? Number(maxRent) : undefined,
  };
}

function ListingImageFallback({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between overflow-hidden bg-primary p-5 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(214,178,94,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_38%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e4dac5] bg-white/70 px-3 py-1.5 text-xs font-black text-tertiary shadow-sm backdrop-blur-md">
          <Home className="h-4 w-4 text-tertiary" />
          {publicRentalBrand.marketplaceLabel}
        </span>
        <div>
          <p className="text-sm font-bold text-tertiary">{publicRentalBrand.compoundAr}</p>
          <p className="mt-2 text-2xl font-black leading-9 text-fixed">{title}</p>
        </div>
      </div>
    </div>
  );
}

function RentalListingCard({ listing }: { listing: RentalListing }) {
  const queryClient = useQueryClient();
  const coverImage = getListingCoverImage(listing);
  const title = publicRentalText(listing.title);
  const location = publicRentalCardLocation;
  const depositAmount = toNumber(listing.depositAmount);
  const bedCounts = getRentalBedCounts(listing);
  const availableBeds = bedCounts.availableBeds;
  const bedsStatusText = getAvailableBedsText(availableBeds);
  const basicsSummary = getBasicsSummary(listing);
  const hasAirConditioning = Boolean(listing.isAirConditioned);

  const handlePrefetch = () => {
    prefetchRentalListingDetail(queryClient, listing.slug);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen' || event.pointerType === 'touch') {
      handlePrefetch();
    }
  };

  const handleFocus = () => {
    handlePrefetch();
  };

  return (
    <Link
      to={`/rentals/${listing.slug}`}
      className={cn(
        'group block overflow-hidden rounded-[28px] glass-card border-[#e8ddc9] shadow-[0_24px_60px_rgba(28,45,34,0.06)] transition-transform duration-300 hover:-translate-y-1',
        listing.isFeatured && 'ring-1 ring-tertiary/20'
      )}
      onFocusCapture={handleFocus}
      onMouseEnter={handlePrefetch}
      onPointerDownCapture={handlePointerDown}
    >
      <div className="relative aspect-[16/11] overflow-hidden bg-surface-dim">
        <ListingImageFallback title={title} />
        {coverImage && (
          <img
            alt={getListingImageAlt(listing, coverImage)}
            className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            decoding="async"
            loading="lazy"
            src={getOptimizedListingImageUrl(coverImage, 'card')}
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-40" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className="rounded-full border border-white/20 bg-[#1f2c22]/70 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
            {listingStatusLabels[listing.status]}
          </span>
        </div>
        
        {listing.images && listing.images.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 flex justify-start p-4">
            <button
              type="button"
              className="z-20 flex items-center gap-2 rounded-xl border-2 border-white/40 bg-black/75 px-5 py-2.5 text-sm font-black text-white shadow-[0_8px_16px_rgba(0,0,0,0.5)] backdrop-blur-md transition hover:scale-105 hover:bg-black"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/rentals/${listing.slug}?gallery=true`;
              }}
            >
              <Images className="h-4 w-4" />
              <span>عرض الصور ({listing.images.length})</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-5 p-4 text-right sm:p-5">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-[#3e4d41]">
            <MapPin className="h-4 w-4 shrink-0 text-[#4e5e52]" />
            <span className="line-clamp-1">{location}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#d8e0d6] bg-[#f7f5ef] px-3 py-1 text-sm font-bold text-[#243025]">
            {listingTypeLabels[listing.listingType]}
          </span>
          <span className="rounded-full border border-[#d7d0be] bg-[#fbf7ef] px-3 py-1 text-sm font-bold text-[#7b5d14]">
            {listing.unitCondition || furnishingLabels[listing.furnishingStatus]}
          </span>
          <span
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-bold',
              availableBeds > 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            )}
          >
            {bedsStatusText}
          </span>
          {hasAirConditioning && (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-bold text-sky-800 shadow-sm">
              الشقة مكيفة
            </span>
          )}
        </div>

        <div className="rounded-[24px] border border-[#d2c4aa] bg-[#fffdf8] p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="text-right">
              <p className="text-xs font-bold tracking-wide text-[#5e4f2f]">إيجار الشقة الشهري</p>
              <p className="mt-1 text-2xl font-black leading-none text-[#132015] sm:text-3xl">
                {formatRentalMoney(listing.monthlyRent)}
              </p>
            </div>
            <div className="rounded-full border border-[#d2c4aa] bg-white px-3 py-2 text-xs font-bold text-[#524424]">
              قابل للحجز
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 text-center text-sm text-[#364539] sm:grid-cols-3">
          <span className="rounded-2xl border border-[#d6c9b3] bg-[#fcfaf5] px-2 py-3">
            <Building2 className="mx-auto mb-1 h-5 w-5 text-[#6e5314]" />
            <span className="font-bold text-[#202c23]">
              {listing.floor != null ? `الدور ${listing.floor}` : `${bedCounts.totalBeds} سراير`}
            </span>
          </span>
          <span className="rounded-2xl border border-[#d6c9b3] bg-[#fcfaf5] px-2 py-3">
            <ShieldCheck className="mx-auto mb-1 h-5 w-5 text-[#6e5314]" />
            <span className="font-bold text-[#202c23]">{basicsSummary}</span>
          </span>
          <span className="rounded-2xl border border-[#d6c9b3] bg-[#fcfaf5] px-2 py-3">
            <BedDouble className="mx-auto mb-1 h-5 w-5 text-[#6e5314]" />
            <span className="font-bold text-[#202c23]">عدد السراير المتاحة: {availableBeds}</span>
          </span>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#d6c9b3] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-tertiary px-5 py-3 text-sm font-black text-primary shadow-lg shadow-tertiary/10 transition group-hover:bg-tertiary/95"
          >
            عرض التفاصيل
            <ArrowLeft className="h-4 w-4 text-primary" />
          </span>
          <div className="text-right">
            <p className="text-xs font-bold text-[#5e4f2f]">التأمين</p>
            <p className="text-base font-extrabold text-[#1d2a21]">
              {depositAmount > 0 ? formatRentalMoney(depositAmount) : 'لا يوجد تأمين'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="min-h-[420px] animate-pulse overflow-hidden rounded-[28px] border border-outline/30 bg-primary/30 shadow-lg">
          <div className="aspect-[16/11] bg-[#ece3d2]" />
          <div className="space-y-4 p-4 sm:p-5">
            <div className="h-5 w-2/3 rounded-full bg-[#ece3d2]" />
            <div className="h-4 w-full rounded-full bg-[#ece3d2]" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="h-14 rounded-2xl bg-[#ece3d2]" />
              <div className="h-14 rounded-2xl bg-[#ece3d2]" />
              <div className="h-14 rounded-2xl bg-[#ece3d2]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublicRentalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = buildQuery(searchParams);
  const listingsQuery = useQuery({
    queryKey: ['rentals', 'public', 'listings', query],
    queryFn: () => rentalApiService.getPublicRentalListings(query),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const listings = listingsQuery.data?.data ?? [];
  const selectedCondition = searchParams.get('unitCondition') || '';
  const airConditionedOnly = searchParams.get('airConditioned') === 'true';
  const filteredListings = listings.filter((listing) => {
    if (airConditionedOnly && !listing.isAirConditioned) return false;
    if (!selectedCondition) return true;
    return listing.unitCondition?.trim() === selectedCondition.trim();
  });
  const visibleListings = [...filteredListings].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  const paginationMeta = listingsQuery.data?.meta;
  const hasClientOnlyFilters = Boolean(selectedCondition) || airConditionedOnly;
  const exactTotalCount = paginationMeta?.totalCount ?? listings.length;
  const exactAvailableCount = paginationMeta?.availableCount ?? paginationMeta?.totalCount ?? listings.length;
  const visibleCount = visibleListings.length;
  const heroCount = hasClientOnlyFilters ? visibleCount : exactAvailableCount;
  const heroCountLabel = hasClientOnlyFilters ? 'المتاح في هذه الصفحة' : 'الإعلانات المتاحة';
  let activeFilters = 0;
  searchParams.forEach((value) => {
    if (value.trim()) activeFilters += 1;
  });

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const next = new URLSearchParams();

    ['minRent', 'maxRent', 'unitCondition'].forEach((key) => {
      const value = String(formData.get(key) ?? '').trim();
      if (value) next.set(key, value);
    });

    if (formData.get('airConditioned') === 'true') next.set('airConditioned', 'true');
    setSearchParams(next);
  }

  return (
    <main className="pb-32 text-fixed">
      <section className="relative overflow-hidden bg-[#f7f2e8] text-white">
        <img alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-18" src={heroImage} />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,253,248,0.66)] via-[rgba(247,242,232,0.9)] to-[#f0eadc]" />
        <div className="relative mx-auto grid min-h-[420px] w-full max-w-7xl items-end gap-8 px-4 pb-10 pt-16 sm:min-h-[520px] sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="max-w-3xl text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e4dac5] bg-white/70 px-4 py-2 text-sm font-bold text-tertiary shadow-sm backdrop-blur-md">
              <Home className="h-4 w-4" />
              {publicRentalBrand.marketplaceLabel}
            </span>
            <h1 className="mt-5 text-3xl font-black leading-[1.25] text-[#1f2c22] sm:text-5xl lg:text-6xl">
              الإيجارات المتاحة في المنطقة
            </h1>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-[#5f6e62]">
              <span className="rounded-full border border-[#e4dac5] bg-white/70 px-4 py-2 shadow-sm backdrop-blur-md">
                بحث سريع حسب السعر والمواصفات
              </span>
            </div>
          </div>

          <div className="mr-auto w-fit rounded-2xl border border-[#e4dac5] bg-white/90 px-6 py-4 text-center shadow-[0_12px_40px_rgba(28,45,34,0.12)] backdrop-blur-md">
            <p className="text-sm font-extrabold text-tertiary">{heroCountLabel}</p>
            <p className="mt-1 text-4xl font-black text-[#1f2c22]">{new Intl.NumberFormat('ar-EG').format(heroCount)}</p>
          </div>
        </div>
      </section>

      <section className="hidden mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <form key={searchParams.toString()} className="rounded-[28px] glass-panel p-5 lg:p-6" onSubmit={handleFilterSubmit}>
          <div className="mb-4 flex flex-col gap-2 text-right text-fixed sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-tertiary" />
              <h2 className="text-lg font-extrabold">تصفية الإعلانات</h2>
            </div>
            {activeFilters > 0 && <span className="text-xs font-bold text-tertiary">{activeFilters} فلتر نشط</span>}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select className="rounded-2xl border-outline bg-primary/45 px-4 py-3 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20" defaultValue={searchParams.get('unitCondition') ?? ''} name="unitCondition">
              <option value="" className="bg-primary text-fixed">الكل</option>
              <option value="سوبر لوكس" className="bg-primary text-fixed">سوبر لوكس</option>
              <option value="مفروشة" className="bg-primary text-fixed">مفروشة</option>
              <option value="فاضية" className="bg-primary text-fixed">فاضية</option>
            </select>
            <input className="rounded-2xl border-outline bg-primary/45 px-4 py-3 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20" defaultValue={searchParams.get('minRent') ?? ''} min="0" name="minRent" placeholder="أقل سعر شهري" type="number" />
            <input className="rounded-2xl border-outline bg-primary/45 px-4 py-3 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20" defaultValue={searchParams.get('maxRent') ?? ''} min="0" name="maxRent" placeholder="أعلى سعر شهري" type="number" />
          </div>
          <label className="group mt-4 flex w-fit cursor-pointer items-center gap-3 text-right">
            <div className="relative flex shrink-0 items-center justify-center">
              <input className="peer sr-only" defaultChecked={airConditionedOnly} name="airConditioned" type="checkbox" value="true" />
              <div className="h-6 w-6 rounded-[6px] border-2 border-[#b5c2b8] bg-white transition-colors peer-checked:border-tertiary peer-checked:bg-tertiary peer-focus-visible:ring-2 peer-focus-visible:ring-tertiary/30 group-hover:border-[#96a69a]" />
              <Check className="pointer-events-none absolute h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3.5} />
            </div>
            <div>
              <span className="block text-base font-bold text-fixed transition-colors group-hover:text-tertiary peer-checked:text-tertiary">مكيفة فقط</span>
              <span className="mt-0.5 block text-xs text-fixed-dim">اعرض الوحدات التي تحتوي على تكييف فقط</span>
            </div>
          </label>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Link className="rounded-full border border-outline bg-[#fffdf8] px-5 py-3 text-sm font-bold text-fixed transition hover:bg-white" to={ROUTES.RENTALS}>
              مسح
            </Link>
            <button className="rounded-full bg-tertiary px-6 py-3 text-sm font-black text-primary shadow-lg shadow-tertiary/20 transition hover:bg-tertiary/90" type="submit">
              فلترة
            </button>
          </div>
        </form>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-outline/40 pb-4">
          <h2 className="text-2xl font-black text-fixed">إعلانات إيجار معروضة</h2>
          <p className="text-sm font-bold text-fixed-dim">
            <span className="ml-2 text-xs font-normal text-tertiary/75">(يتم تحديث العقارات تلقائيًا)</span>
            {listingsQuery.isFetching ? 'جاري تحميل الإعلانات' : `${new Intl.NumberFormat('ar-EG').format(exactTotalCount)} نتيجة`}
          </p>
        </div>

        {listingsQuery.isFetching && !listingsQuery.data && (
          <div className="mb-6 rounded-[24px] border border-tertiary/20 bg-tertiary/10 p-4 text-right text-tertiary">
            <span className="text-sm font-bold">جاري تحديث أحدث العقارات...</span>
          </div>
        )}

        {listingsQuery.isLoading && <LoadingGrid />}

        {listingsQuery.isError && listings.length === 0 && (
          <div className="rounded-[28px] border border-error/25 bg-error-container/10 p-6 text-right shadow-lg">
            <h3 className="text-xl font-black text-error">تعذر تحميل سوق الإيجارات</h3>
            <p className="mt-2 text-sm leading-7 text-fixed-dim">
              الخدمة لم ترجع بيانات الإعلانات حالياً. راجع اتصال الإنترنت أو حاول مرة أخرى بعد لحظات.
            </p>
            <button className="mt-4 rounded-full bg-error px-5 py-3 text-sm font-bold !text-white" type="button" onClick={() => listingsQuery.refetch()}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {!listingsQuery.isLoading && !listingsQuery.isError && listings.length === 0 && (
          <div className="rounded-[28px] glass-panel p-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-tertiary" />
            <h3 className="mt-4 text-2xl font-black text-fixed">لا توجد إعلانات إيجار متاحة حالياً</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-fixed-dim">
              لم نجد إعلانات تطابق الفلاتر الحالية في المنطقة المحيطة. جرّب إزالة بعض الفلاتر أو العودة لاحقاً بعد نشر إعلانات جديدة.
            </p>
            <Link className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-tertiary px-5 py-3 text-sm font-black text-primary shadow-lg shadow-tertiary/10" to={ROUTES.RENTALS}>
              عرض كل الإعلانات
            </Link>
          </div>
        )}

        {!listingsQuery.isLoading && !listingsQuery.isError && listings.length > 0 && visibleListings.length === 0 && (
          <div className="rounded-[28px] glass-panel p-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-tertiary" />
            <h3 className="mt-4 text-2xl font-black text-fixed">لا توجد إعلانات مطابقة لهذه الصفحة</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-fixed-dim">
              هذه الفلاتر محلية على الواجهة، لذلك نعرض فقط ما ظهر في الصفحة الحالية. يمكنك الانتقال للصفحة التالية أو إزالة التصفية المحلية.
            </p>
            <Link className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-tertiary px-5 py-3 text-sm font-black text-primary shadow-lg shadow-tertiary/10" to={ROUTES.RENTALS}>
              إزالة التصفية
            </Link>
          </div>
        )}

        {visibleListings.length > 0 && (
          <div
            className={cn(
              'grid w-full gap-6',
              visibleListings.length === 1
                ? 'mx-auto max-w-[430px] grid-cols-1'
                : visibleListings.length === 2
                  ? 'mx-auto max-w-[900px] grid-cols-1 md:grid-cols-2'
                  : 'mx-auto max-w-7xl grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
              listingsQuery.isFetching && 'opacity-80'
            )}
          >
            {visibleListings.map((listing) => (
              <RentalListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {paginationMeta?.hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-outline bg-[#fffdf8] px-7 py-3 text-sm font-black text-fixed shadow-lg transition hover:bg-white"
              to={{
                pathname: ROUTES.RENTALS,
                search: (() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String((paginationMeta.page ?? query.page ?? 1) + 1));
                  return next.toString();
                })(),
              }}
            >
              تحميل المزيد
            </Link>
          </div>
        )}
      </section>

      <MobileOwnerAcquisitionCta />
    </main>
  );
}
