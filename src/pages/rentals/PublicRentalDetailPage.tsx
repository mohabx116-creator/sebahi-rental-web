import { useQuery } from '@tanstack/react-query';
import {
  Bath,
  BedDouble,
  Building2,
  ChevronRight,
  LockKeyhole,
  MapPin,
  Ruler,
  Sparkles,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { rentalApiService } from '../../lib/api/rental-service';
import type { RentalListing } from '../../lib/api/types';
import { ROUTES } from '../../lib/constants/routes';
import {
  formatRentalDate,
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
  sortListingImages,
  toNumber,
} from './rental-format';

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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(214,178,94,0.35),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-tertiary backdrop-blur-md">
          <Building2 className="h-4 w-4 text-tertiary" />
          {publicRentalBrand.rentalsTitle}
        </span>
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-tertiary">كمبوند السبحي</p>
          <p className="mt-2 text-3xl font-black leading-[1.35] sm:text-5xl text-fixed">{title}</p>
        </div>
      </div>
    </div>
  );
}

function DetailError({ title, message }: { title: string; message: string }) {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center text-fixed">
      <Building2 className="h-14 w-14 text-tertiary" />
      <h1 className="mt-5 text-3xl font-black text-fixed">{title}</h1>
      <p className="mt-3 leading-8 text-fixed-dim">{message}</p>
      <Link className="mt-6 rounded-full bg-tertiary px-6 py-3 font-bold text-primary hover:bg-tertiary/90 transition shadow-lg shadow-tertiary/20" to={ROUTES.RENTALS}>
        العودة إلى الإيجارات
      </Link>
    </main>
  );
}

export function PublicRentalDetailPage() {
  const { slug } = useParams();

  const listingQuery = useQuery({
    queryKey: ['rentals', 'public', 'listing', slug],
    queryFn: () => rentalApiService.getPublicRentalListingBySlug(slug ?? ''),
    enabled: Boolean(slug),
  });

  if (listingQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-[520px] animate-pulse rounded-[32px] bg-primary/30 border border-outline/25 shadow-xl" />
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
  const unitFacts = [
    { label: 'الغرف', value: `${listing.bedrooms}`, icon: BedDouble },
    { label: 'الحمامات', value: `${listing.bathrooms}`, icon: Bath },
    { label: 'المساحة', value: `${new Intl.NumberFormat('ar-EG').format(toNumber(listing.areaSqm))} م²`, icon: Ruler },
  ];
  const pricingItems = [
    { label: 'التأمين', value: listing.depositAmount ? formatRentalMoney(listing.depositAmount) : 'غير محدد' },
  ];

  return (
    <main className="pb-16 text-fixed">
      <section className="border-b border-outline/30 bg-primary/20">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <Link className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-1 text-sm font-bold text-fixed-dim hover:text-tertiary hover:bg-white/5 transition" to={ROUTES.RENTALS}>
            <ChevronRight className="h-5 w-5 text-tertiary" />
            رجوع إلى الإيجارات
          </Link>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
            <div className="min-w-0 space-y-4">
              <div className="relative overflow-hidden rounded-[32px] glass-panel">
                <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/8.5] bg-surface-dim">
                  <DetailImageFallback title={title} />
                  {coverImage && (
                    <img
                      alt={getListingImageAlt(listing, coverImage)}
                      className="relative h-full w-full object-cover"
                      decoding="async"
                      src={getOptimizedListingImageUrl(coverImage, 'hero')}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent p-5 text-white sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/80 border border-outline px-3 py-1 text-xs font-bold text-fixed backdrop-blur-md">{listingStatusLabels[listing.status]}</span>
                    {listing.isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tertiary px-3 py-1 text-xs font-bold text-primary shadow-md">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        مميز
                      </span>
                    )}
                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-fixed backdrop-blur-md">{listingTypeLabels[listing.listingType]}</span>
                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-fixed backdrop-blur-md">{listing.unitCondition || furnishingLabels[listing.furnishingStatus]}</span>
                  </div>
                  <h1 className="mt-3 max-w-4xl text-2xl font-black leading-[1.35] sm:text-4xl lg:text-5xl text-fixed">{title}</h1>
                  <p className="mt-2 flex max-w-3xl items-center gap-2 text-sm text-fixed-dim sm:text-base">
                    <MapPin className="h-5 w-5 shrink-0 text-tertiary" />
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
                      className="aspect-[4/3] rounded-2xl border border-outline/50 object-cover shadow-md"
                      decoding="async"
                      loading="lazy"
                      src={getOptimizedListingImageUrl(image, 'thumbnail')}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <aside className="self-start rounded-[32px] glass-panel p-5 text-right xl:sticky xl:top-24 xl:p-6">
              <div className="rounded-[26px] bg-secondary p-5 text-white border border-secondary/35 shadow-inner">
                <p className="text-sm font-bold text-tertiary">الإيجار الشهري</p>
                <p className="mt-1 text-4xl font-black leading-tight text-white">{formatRentalMoney(listing.monthlyRent)}</p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {unitFacts.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div key={fact.label} className="rounded-2xl bg-primary/45 border border-outline/20 px-2 py-3 text-center">
                      <Icon className="mx-auto mb-1 h-5 w-5 text-tertiary" />
                      <p className="text-xs font-bold text-fixed-dim">{fact.label}</p>
                      <p className="mt-1 text-sm font-black text-fixed">{fact.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2 rounded-[24px] border border-outline/40 p-4 bg-white/5">
                {pricingItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-bold text-fixed-dim">{item.label}</span>
                    <span className="font-black text-tertiary">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                <Link className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-tertiary hover:bg-tertiary/90 px-5 py-4 text-base font-black text-primary shadow-xl shadow-tertiary/15 transition" to={`/rentals/${listing.slug}/contact`}>
                  <LockKeyhole className="h-5 w-5" />
                  طلب تواصل وحجز الوحدة
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-2xl font-black text-fixed">وصف الوحدة</h2>
            <p className="mt-4 whitespace-pre-line text-base leading-9 text-fixed-dim">{description}</p>
          </section>

          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-2xl font-black text-fixed">المواصفات</h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-primary/45 border border-outline/20 p-4"><dt className="text-sm text-fixed-dim">نوع الوحدة</dt><dd className="mt-1 font-black text-tertiary">{listingTypeLabels[listing.listingType]}</dd></div>
              <div className="rounded-2xl bg-primary/45 border border-outline/20 p-4"><dt className="text-sm text-fixed-dim">حالة الوحدة</dt><dd className="mt-1 font-black text-tertiary">{listing.unitCondition || furnishingLabels[listing.furnishingStatus]}</dd></div>
              <div className="rounded-2xl bg-primary/45 border border-outline/20 p-4"><dt className="text-sm text-fixed-dim">الدور</dt><dd className="mt-1 font-black text-tertiary">{listing.floor ?? 'غير محدد'}</dd></div>
              <div className="rounded-2xl bg-primary/45 border border-outline/20 p-4"><dt className="text-sm text-fixed-dim">تاريخ النشر</dt><dd className="mt-1 font-black text-tertiary">{formatRentalDate(listing.publishedAt)}</dd></div>
            </dl>
          </section>

          {amenities.length > 0 && (
            <section className="rounded-[28px] glass-panel p-6 text-right">
              <h2 className="text-2xl font-black text-fixed">المميزات</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {amenities.map((item) => (
                  <span key={item} className="rounded-full bg-secondary/30 border border-secondary/20 px-4 py-2 text-sm font-bold text-white">
                    {publicRentalText(item)}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-xl font-black text-fixed">الموقع والكمبوند</h2>
            <p className="mt-3 text-sm leading-7 text-fixed-dim">{compoundName}</p>
            <p className="mt-1 text-sm leading-7 text-fixed-dim">{publicRentalText(listing.addressText ?? listing.compound?.address, 'القاهرة الجديدة')}</p>
          </section>
        </div>
      </section>
    </main>
  );
}
