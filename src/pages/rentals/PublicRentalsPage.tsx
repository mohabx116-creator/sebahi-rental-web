import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BedDouble, Building2, Filter, Home, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rentalApiService } from '../../lib/api/rental-service';
import type { ApiData } from '../../lib/api/api-client';
import type { RentalListing, RentalListingQuery } from '../../lib/api/types';
import { ROUTES } from '../../lib/constants/routes';
import { cn } from '../../lib/utils/cn';
import {
  formatRentalMoney,
  furnishingLabels,
  getListingCoverImage,
  getListingImageAlt,
  getOptimizedListingImageUrl,
  listingStatusLabels,
  listingTypeLabels,
  publicRentalBrand,
  publicRentalText,
  toNumber,
} from './rental-format';

const heroImage = '/hero-compound.png';
const publicRentalCardLocation = 'كمبوند السبحي-حدائق العاشر من رمضان';

function getAvailableBedsText(availableBeds: number) {
  if (availableBeds <= 0) return 'لا توجد سراير متاحة';
  if (availableBeds === 1) return 'آخر سرير متاح';
  return `عدد السراير المتاحة: ${availableBeds}`;
}

function getBasicsSummary(listing: RentalListing) {
  return (listing.basicFeatures || []).length >= 7 ? 'الأساسيات مكتملة' : 'أساسيات غير مكتملة';
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(214,178,94,0.35),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_38%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-tertiary backdrop-blur-md">
          <Home className="h-4 w-4 text-tertiary" />
          {publicRentalBrand.marketplaceLabel}
        </span>
        <div>
          <p className="text-sm font-bold text-tertiary">كمبوند السبحي</p>
          <p className="mt-2 text-2xl font-black leading-9 text-fixed">{title}</p>
        </div>
      </div>
    </div>
  );
}

function RentalListingCard({ listing }: { listing: RentalListing }) {
  const coverImage = getListingCoverImage(listing);
  const title = publicRentalText(listing.title);
  const location = publicRentalCardLocation;
  const compoundName = publicRentalBrand.compoundAr;
  const depositAmount = toNumber(listing.depositAmount);
  const availableBeds = listing.availableBeds ?? Math.max((listing.totalBeds ?? 4) - 0 - 0, 0);
  const bedsStatusText = getAvailableBedsText(availableBeds);
  const basicsSummary = getBasicsSummary(listing);

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-[28px] glass-card',
        listing.isFeatured && 'border-tertiary/40 shadow-2xl shadow-tertiary/10 ring-1 ring-tertiary/20'
      )}
    >
      <Link className="block" to={`/rentals/${listing.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-dim">
          <ListingImageFallback title={title} />
          {coverImage && (
            <img
              alt={getListingImageAlt(listing, coverImage)}
              className="relative h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              decoding="async"
              loading="lazy"
              src={getOptimizedListingImageUrl(coverImage, 'card')}
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-90" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <span className="rounded-full bg-primary/80 border border-outline px-3 py-1 text-xs font-bold text-fixed backdrop-blur-md">
              {listingStatusLabels[listing.status]}
            </span>
            {listing.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-tertiary px-3 py-1 text-xs font-bold text-primary shadow-md">
                <Sparkles className="h-3.5 w-3.5" />
                مميز
              </span>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <p className="text-xs font-bold text-fixed-dim">إيجار الشقة الشهري</p>
            <p className="text-2xl font-black text-tertiary">{formatRentalMoney(listing.monthlyRent)}</p>
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-5 text-right">
        <div>
          <p className="text-sm font-bold text-tertiary">{compoundName}</p>
          <Link className="mt-1 block text-xl font-bold leading-8 text-fixed hover:text-tertiary transition" to={`/rentals/${listing.slug}`}>
            {title}
          </Link>
          <p className="mt-2 flex items-center gap-2 text-sm text-fixed-dim">
            <MapPin className="h-4 w-4 shrink-0 text-secondary-fixed" />
            <span className="line-clamp-1">{location}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary/25 border border-secondary/10 px-3 py-1 text-sm font-bold text-white">{listingTypeLabels[listing.listingType]}</span>
          <span className="rounded-full bg-tertiary/20 border border-tertiary/10 px-3 py-1 text-sm font-bold text-tertiary">{listing.unitCondition || furnishingLabels[listing.furnishingStatus]}</span>
          <span className={cn(
            "rounded-full border px-3 py-1 text-sm font-bold",
            availableBeds > 0 
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/20 border-rose-500/30 text-rose-400"
          )}>
            {bedsStatusText}
          </span>
          {listing.isAirConditioned && (
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm font-bold text-fixed">
              الشقة مكيفة
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm text-fixed-dim">
          <span className="rounded-2xl bg-primary/40 border border-outline-variant/30 px-2 py-3">
            <Building2 className="mx-auto mb-1 h-5 w-5 text-tertiary" />
            {listing.floor != null ? `الدور ${listing.floor}` : `${listing.totalBeds || 4} سراير`}
          </span>
          <span className="rounded-2xl bg-primary/40 border border-outline-variant/30 px-2 py-3">
            <ShieldCheck className="mx-auto mb-1 h-5 w-5 text-tertiary" />
            {basicsSummary}
          </span>
          <span className="rounded-2xl bg-primary/40 border border-outline-variant/30 px-2 py-3">
            {listing.isAirConditioned ? (
              <>
                <Sparkles className="mx-auto mb-1 h-5 w-5 text-tertiary" />
                مكيفة
              </>
            ) : (
              <>
                <BedDouble className="mx-auto mb-1 h-5 w-5 text-tertiary" />
                عدد السراير المتاحة: {availableBeds}
              </>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-outline/40 pt-4">
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-tertiary hover:bg-tertiary/95 px-5 py-3 text-sm font-black text-primary shadow-lg shadow-tertiary/10 transition" to={`/rentals/${listing.slug}`}>
            عرض التفاصيل
            <ArrowLeft className="h-4 w-4 text-primary" />
          </Link>
          <div className="text-right">
            <p className="text-xs font-bold text-fixed-dim">التأمين</p>
            <p className="text-base font-extrabold text-fixed">{depositAmount > 0 ? formatRentalMoney(depositAmount) : 'غير محدد'}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-[420px] animate-pulse rounded-[28px] bg-primary/30 border border-outline/30 shadow-lg">
          <div className="h-48 rounded-t-[28px] bg-white/5" />
          <div className="space-y-4 p-5">
            <div className="h-5 w-2/3 rounded-full bg-white/5" />
            <div className="h-4 w-full rounded-full bg-white/5" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-16 rounded-2xl bg-white/5" />
              <div className="h-16 rounded-2xl bg-white/5" />
              <div className="h-16 rounded-2xl bg-white/5" />
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
    placeholderData: (previousData) => previousData,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const [cachedData, setCachedData] = useState<ApiData<RentalListing[]> | null>(() => {
    try {
      const item = localStorage.getItem('public-rentals-listings-cache-v1');
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed && parsed.data && Array.isArray(parsed.data.data) && typeof parsed.savedAt === 'string') {
          return parsed.data as ApiData<RentalListing[]>;
        } else {
          localStorage.removeItem('public-rentals-listings-cache-v1');
        }
      }
    } catch (e) {
      localStorage.removeItem('public-rentals-listings-cache-v1');
    }
    return null;
  });

  useEffect(() => {
    if (listingsQuery.data) {
      try {
        localStorage.setItem(
          'public-rentals-listings-cache-v1',
          JSON.stringify({
            data: listingsQuery.data,
            savedAt: new Date().toISOString(),
          })
        );
        setCachedData(listingsQuery.data);
      } catch (e) {
        console.error('Failed to save public rentals listings cache', e);
      }
    }
  }, [listingsQuery.data]);

  const listings = (listingsQuery.data ?? cachedData)?.data ?? [];
  const selectedCondition = searchParams.get('unitCondition') || '';
  const featuredOnly = searchParams.get('featured') === 'true';
  const filteredListings = listings.filter((listing) => {
    if (featuredOnly && !listing.isFeatured) return false;
    if (!selectedCondition) return true;
    return listing.unitCondition?.trim() === selectedCondition.trim();
  });
  const visibleListings = [...filteredListings].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  const paginationMeta = (listingsQuery.data ?? cachedData)?.meta;
  const totalCount = filteredListings.length;
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

    if (formData.get('featured') === 'true') next.set('featured', 'true');



    setSearchParams(next);
  }

  return (
    <main className="pb-16 text-fixed">
      <section className="relative overflow-hidden bg-primary text-white">
        <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" src={heroImage} />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/80 to-primary" />
        <div className="relative mx-auto grid min-h-[440px] w-full max-w-7xl items-end gap-8 px-4 pb-10 pt-16 sm:min-h-[540px] sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="max-w-3xl text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-tertiary backdrop-blur-md">
              <Home className="h-4 w-4" />
              {publicRentalBrand.marketplaceLabel}
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.25] sm:text-5xl lg:text-6xl text-fixed">
              الإيجارات المتاحة في المنطقة
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-9 text-fixed-dim">
              تصفح إعلانات الإيجار المنشورة في المنطقة المحيطة، قارن السعر والمساحة وحالة الشقة، وابدأ طلب التواصل أو الحجز من خلال واتساب.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-fixed-dim">
              <span className="rounded-full bg-white/5 border border-white/10 px-4 py-2 backdrop-blur-md">بحث سريع حسب السعر والمواصفات</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-right shadow-2xl backdrop-blur-md">
            <p className="text-sm font-bold text-tertiary">الإعلانات المتاحة</p>
            <p className="mt-2 text-5xl font-black text-fixed">{new Intl.NumberFormat('ar-EG').format(totalCount)}</p>



          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <form className="rounded-[28px] glass-panel p-5 lg:p-6" onSubmit={handleFilterSubmit}>
          <div className="mb-4 flex flex-col gap-2 text-right text-fixed sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-tertiary" />
              <h2 className="text-lg font-extrabold">تصفية الإعلانات</h2>
            </div>
            {activeFilters > 0 && <span className="text-xs font-bold text-tertiary">{activeFilters} فلتر نشط</span>}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select className="rounded-2xl border-outline bg-primary/45 py-3 px-4 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20" defaultValue={searchParams.get('unitCondition') ?? ''} name="unitCondition">
              <option value="" className="bg-primary text-fixed">الكل</option>
              <option value="سوبر لوكس" className="bg-primary text-fixed">سوبر لوكس</option>
              <option value="مفروشة" className="bg-primary text-fixed">مفروشة</option>
              <option value="فاضية" className="bg-primary text-fixed">فاضية</option>
            </select>
            <input className="rounded-2xl border-outline bg-primary/45 py-3 px-4 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20" defaultValue={searchParams.get('minRent') ?? ''} min="0" name="minRent" placeholder="أقل سعر شهري" type="number" />
            <input className="rounded-2xl border-outline bg-primary/45 py-3 px-4 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20" defaultValue={searchParams.get('maxRent') ?? ''} min="0" name="maxRent" placeholder="أعلى سعر شهري" type="number" />
          </div>
          <label className="mt-4 block cursor-pointer text-right">
            <input className="peer sr-only" defaultChecked={featuredOnly} name="featured" type="checkbox" value="true" />
            <span className="flex min-h-24 items-center justify-between gap-4 rounded-[24px] border border-outline bg-primary/35 px-5 py-4 text-fixed transition hover:border-tertiary/60 hover:bg-primary/50 peer-checked:border-tertiary peer-checked:bg-tertiary/15 peer-checked:shadow-lg peer-checked:shadow-tertiary/10">
              <span className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-tertiary peer-checked:border-tertiary/40">
                  <Sparkles className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-lg font-black">الإعلانات المميزة فقط</span>
                  <span className="mt-1 block text-sm font-bold text-fixed-dim">اعرض الإعلانات المميزة أولًا</span>
                </span>
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 bg-white/5 transition peer-checked:bg-white/10 peer-checked:[&>span]:scale-100">
                <span className="h-3 w-3 scale-0 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.65)] transition" />
              </span>
            </span>
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <Link className="rounded-full border border-outline px-5 py-3 text-sm font-bold text-fixed bg-white/5 hover:bg-white/10 transition" to={ROUTES.RENTALS}>
              مسح
            </Link>
            <button className="rounded-full bg-tertiary hover:bg-tertiary/90 px-6 py-3 text-sm font-black text-primary shadow-lg shadow-tertiary/20 transition" type="submit">
              فلترة
            </button>
          </div>
        </form>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-outline/40 pb-4">
          <h2 className="text-2xl font-black text-fixed">إعلانات إيجار متاحة</h2>
          <p className="text-sm font-bold text-fixed-dim">
            <>
              <span className="ml-2 text-xs text-tertiary/75 font-normal">(يتم تحديث العقارات تلقائيًا)</span>
              {listingsQuery.isFetching ? 'جاري تحميل الإعلانات' : `${new Intl.NumberFormat('ar-EG').format(totalCount)} نتيجة`}
            </>
          </p>
        </div>

        {listingsQuery.isFetching && !listingsQuery.data && cachedData && (
          <div className="mb-6 rounded-[24px] bg-tertiary/10 border border-tertiary/20 p-4 text-right text-tertiary">
            <span className="text-sm font-bold">جاري تحديث أحدث العقارات...</span>
          </div>
        )}

        {listingsQuery.isError && cachedData && (
          <div className="mb-6 rounded-[24px] border border-error/20 bg-error-container/5 p-4 text-right flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span className="text-sm font-bold text-error">تعذر تحديث البيانات الآن، يتم عرض آخر نسخة محفوظة.</span>
            <button
              className="rounded-full bg-error hover:bg-error/90 px-4 py-2 text-xs font-bold text-white transition shadow-sm"
              type="button"
              onClick={() => listingsQuery.refetch()}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {listingsQuery.isLoading && !cachedData && <LoadingGrid />}

        {listingsQuery.isError && !cachedData && (
          <div className="rounded-[28px] border border-error/25 bg-error-container/10 p-6 text-right shadow-lg">
            <h3 className="text-xl font-black text-error">تعذر تحميل سوق الإيجارات</h3>
            <p className="mt-2 text-sm leading-7 text-fixed-dim">الخدمة لم ترجع بيانات الإعلانات حاليا. راجع اتصال الإنترنت أو حاول مرة أخرى بعد لحظات.</p>
            <button className="mt-4 rounded-full bg-error px-5 py-3 text-sm font-bold text-white" type="button" onClick={() => listingsQuery.refetch()}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {!listingsQuery.isLoading && !listingsQuery.isError && listings.length === 0 && (
          <div className="rounded-[28px] glass-panel p-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-tertiary" />
            <h3 className="mt-4 text-2xl font-black text-fixed">لا توجد إعلانات إيجار متاحة حاليًا</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-fixed-dim">
              لم نجد إعلانات تطابق الفلاتر الحالية داخل كمبوند السبحي. جرب إزالة بعض الفلاتر أو العودة لاحقا بعد نشر إعلانات جديدة.
            </p>
            <Link className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-tertiary px-5 py-3 text-sm font-black text-primary shadow-lg shadow-tertiary/10" to={ROUTES.RENTALS}>
              عرض كل الإعلانات
            </Link>
          </div>
        )}

        {visibleListings.length > 0 && (
          <>
            <div
              className={cn(
                'grid gap-6 w-full',
                visibleListings.length === 1
                  ? 'grid-cols-1 max-w-[430px] mx-auto'
                  : visibleListings.length === 2
                    ? 'grid-cols-1 md:grid-cols-2 max-w-[900px] mx-auto'
                    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto',
                listingsQuery.isFetching && 'opacity-80'
              )}
            >
              {visibleListings.map((listing) => (
                <RentalListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            {paginationMeta?.hasNextPage && (
              <div className="mt-8 flex justify-center">
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-outline bg-white/5 px-7 py-3 text-sm font-black text-fixed shadow-lg transition hover:bg-white/10"
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
          </>
        )}
      </section>
    </main>
  );
}
