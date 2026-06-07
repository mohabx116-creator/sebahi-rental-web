import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bath, BedDouble, Building2, Filter, Home, MapPin, Search, ShieldCheck, Sparkles } from 'lucide-react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rentalApiService } from '../../lib/api/rental-service';
import type { RentalFurnishingStatus, RentalListing, RentalListingQuery, RentalListingType } from '../../lib/api/types';
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
  publicCompoundName,
  publicRentalBrand,
  publicRentalText,
  toNumber,
} from './rental-format';

const heroImage = '/hero-compound.png';

function buildQuery(searchParams: URLSearchParams): RentalListingQuery {
  const minRent = searchParams.get('minRent');
  const maxRent = searchParams.get('maxRent');
  const bedrooms = searchParams.get('bedrooms');
  const featured = searchParams.get('featured');

  return {
    page: Number(searchParams.get('page') || 1),
    limit: 12,
    search: searchParams.get('search') || undefined,
    listingType: (searchParams.get('listingType') || undefined) as RentalListingType | undefined,
    furnishingStatus: (searchParams.get('furnishingStatus') || undefined) as RentalFurnishingStatus | undefined,
    minRent: minRent ? Number(minRent) : undefined,
    maxRent: maxRent ? Number(maxRent) : undefined,
    bedrooms: bedrooms ? Number(bedrooms) : undefined,
    featured: featured === 'true' ? true : undefined,
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
          <p className="text-sm font-bold text-tertiary">كمباوند السبحي</p>
          <p className="mt-2 text-2xl font-black leading-9 text-fixed">{title}</p>
        </div>
      </div>
    </div>
  );
}

function RentalListingCard({ listing }: { listing: RentalListing }) {
  const coverImage = getListingCoverImage(listing);
  const title = publicRentalText(listing.title);
  const location = publicRentalText(
    listing.locationText ?? listing.addressText ?? listing.compound?.address,
    publicRentalBrand.compoundAr,
  );
  const compoundName = publicCompoundName(listing.compound?.name);
  const depositAmount = toNumber(listing.depositAmount);

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
            <p className="text-xs font-bold text-fixed-dim">الإيجار الشهري</p>
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
          <span className="rounded-full bg-tertiary/20 border border-tertiary/10 px-3 py-1 text-sm font-bold text-tertiary">{furnishingLabels[listing.furnishingStatus]}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm text-fixed-dim">
          <span className="rounded-2xl bg-primary/40 border border-outline-variant/30 px-2 py-3">
            <BedDouble className="mx-auto mb-1 h-5 w-5 text-tertiary" />
            {listing.bedrooms} غرف
          </span>
          <span className="rounded-2xl bg-primary/40 border border-outline-variant/30 px-2 py-3">
            <Bath className="mx-auto mb-1 h-5 w-5 text-tertiary" />
            {listing.bathrooms} حمام
          </span>
          <span className="rounded-2xl bg-primary/40 border border-outline-variant/30 px-2 py-3">
            <Building2 className="mx-auto mb-1 h-5 w-5 text-tertiary" />
            {new Intl.NumberFormat('ar-EG').format(toNumber(listing.areaSqm))} م²
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
  });

  const listings = listingsQuery.data?.data ?? [];
  const visibleListings = [...listings].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  const paginationMeta = listingsQuery.data?.meta;
  const totalCount = listingsQuery.data?.meta?.totalCount ?? listings.length;
  let activeFilters = 0;
  searchParams.forEach((value) => {
    if (value.trim()) activeFilters += 1;
  });

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const next = new URLSearchParams();

    ['search', 'listingType', 'furnishingStatus', 'minRent', 'maxRent', 'bedrooms'].forEach((key) => {
      const value = String(formData.get(key) ?? '').trim();
      if (value) next.set(key, value);
    });

    if (formData.get('featured') === 'on') {
      next.set('featured', 'true');
    }

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
              وحدات مختارة للإيجار داخل كمباوند السبحي
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-9 text-fixed-dim">
              تصفح الوحدات المنشورة، قارن السعر والمساحة والتجهيز، وابدأ طلب التواصل أو الحجز من خلال تدفقات دفع آمنة لا تعتمد على حالة المتصفح.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-fixed-dim">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 text-tertiary" />
                بيانات المالك محمية حتى تأكيد الدفع
              </span>
              <span className="rounded-full bg-white/5 border border-white/10 px-4 py-2 backdrop-blur-md">بحث سريع حسب السعر والمواصفات</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-right shadow-2xl backdrop-blur-md">
            <p className="text-sm font-bold text-tertiary">الوحدات المتاحة الآن</p>
            <p className="mt-2 text-5xl font-black text-fixed">{new Intl.NumberFormat('ar-EG').format(totalCount)}</p>
            <p className="mt-3 text-sm leading-7 text-fixed-dim/80">
              جميع طلبات فتح التواصل والحجز تمر عبر الخادم. لا نعرض بيانات المالك ولا نؤكد الحجز من الواجهة فقط.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <form className="rounded-[28px] glass-panel p-5 lg:p-6" onSubmit={handleFilterSubmit}>
          <div className="mb-4 flex flex-col gap-2 text-right text-fixed sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-tertiary" />
              <h2 className="text-lg font-extrabold">تصفية الوحدات</h2>
            </div>
            {activeFilters > 0 && <span className="text-xs font-bold text-tertiary">{activeFilters} فلتر نشط</span>}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <label className="xl:col-span-2">
              <span className="sr-only">بحث</span>
              <div className="relative">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fixed-dim/50" />
                <input
                  className="w-full rounded-2xl border-outline bg-primary/45 py-3 pl-4 pr-12 text-right text-fixed placeholder-fixed-dim/50 focus:border-tertiary focus:ring-tertiary/20"
                  defaultValue={searchParams.get('search') ?? ''}
                  name="search"
                  placeholder="ابحث بالعنوان أو الموقع"
                />
              </div>
            </label>
            <select className="rounded-2xl border-outline bg-primary/45 py-3 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20" defaultValue={searchParams.get('listingType') ?? ''} name="listingType">
              <option value="" className="bg-primary text-fixed">كل الأنواع</option>
              {Object.entries(listingTypeLabels).map(([value, label]) => (
                <option key={value} value={value} className="bg-primary text-fixed">{label}</option>
              ))}
            </select>
            <select className="rounded-2xl border-outline bg-primary/45 py-3 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20" defaultValue={searchParams.get('furnishingStatus') ?? ''} name="furnishingStatus">
              <option value="" className="bg-primary text-fixed">كل التشطيبات</option>
              {Object.entries(furnishingLabels).map(([value, label]) => (
                <option key={value} value={value} className="bg-primary text-fixed">{label}</option>
              ))}
            </select>
            <input className="rounded-2xl border-outline bg-primary/45 py-3 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20" defaultValue={searchParams.get('minRent') ?? ''} min="0" name="minRent" placeholder="أقل سعر شهري" type="number" />
            <input className="rounded-2xl border-outline bg-primary/45 py-3 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20" defaultValue={searchParams.get('maxRent') ?? ''} min="0" name="maxRent" placeholder="أعلى سعر شهري" type="number" />
            <input className="rounded-2xl border-outline bg-primary/45 py-3 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20" defaultValue={searchParams.get('bedrooms') ?? ''} min="0" name="bedrooms" placeholder="الغرف" type="number" />
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm font-bold text-fixed-dim">
              <input className="rounded border-outline bg-primary/45 text-tertiary focus:ring-tertiary/20" defaultChecked={searchParams.get('featured') === 'true'} name="featured" type="checkbox" />
              الوحدات المميزة فقط
            </label>
            <div className="flex gap-2">
              <Link className="rounded-full border border-outline px-5 py-3 text-sm font-bold text-fixed bg-white/5 hover:bg-white/10 transition" to={ROUTES.RENTALS}>
                مسح
              </Link>
              <button className="rounded-full bg-tertiary hover:bg-tertiary/90 px-6 py-3 text-sm font-black text-primary shadow-lg shadow-tertiary/20 transition" type="submit">
                تطبيق الفلاتر
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-outline/40 pb-4">
          <h2 className="text-2xl font-black text-fixed">وحدات متاحة للإيجار</h2>
          <p className="text-sm font-bold text-fixed-dim">
            {listingsQuery.isFetching ? 'جار تحديث النتائج...' : `${new Intl.NumberFormat('ar-EG').format(totalCount)} نتيجة`}
          </p>
        </div>

        {listingsQuery.isLoading && <LoadingGrid />}

        {listingsQuery.isError && (
          <div className="rounded-[28px] border border-error/25 bg-error-container/10 p-6 text-right shadow-lg">
            <h3 className="text-xl font-black text-error">تعذر تحميل سوق الإيجارات</h3>
            <p className="mt-2 text-sm leading-7 text-fixed-dim">الخدمة لم ترجع بيانات الوحدات حاليا. راجع اتصال الإنترنت أو حاول مرة أخرى بعد لحظات.</p>
            <button className="mt-4 rounded-full bg-error px-5 py-3 text-sm font-bold text-white" type="button" onClick={() => listingsQuery.refetch()}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {!listingsQuery.isLoading && !listingsQuery.isError && listings.length === 0 && (
          <div className="rounded-[28px] glass-panel p-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-tertiary" />
            <h3 className="mt-4 text-2xl font-black text-fixed">لا توجد وحدات منشورة حاليا</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-fixed-dim">
              لم نجد وحدات تطابق الفلاتر الحالية داخل كمباوند السبحي. جرب إزالة بعض الفلاتر أو العودة لاحقا بعد نشر وحدات جديدة.
            </p>
            <Link className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-tertiary px-5 py-3 text-sm font-black text-primary shadow-lg shadow-tertiary/10" to={ROUTES.RENTALS}>
              عرض كل الوحدات
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
