import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble,
  Building2,
  ChevronRight,
  ChevronLeft,
  X,
  LockKeyhole,
  MapPin,
  Ruler,
  Sparkles,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { rentalApiService } from '../../lib/api/rental-service';
import { ROUTES } from '../../lib/constants/routes';
import { cn } from '../../lib/utils/cn';
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

const BASIC_FEATURES_MAP = {
  internet: 'إنترنت',
  basic_appliances: 'أجهزة كهربائية أساسية',
  water_motor: 'موتور مياه',
  desks: 'مكاتب',
  window_mesh: 'سلك شباك',
  water_heater: 'سخان مياه',
  water_filter: 'فلتر مياه',
} as const;
type BasicFeatureKey = keyof typeof BASIC_FEATURES_MAP;
const BASIC_FEATURE_KEYS = Object.keys(BASIC_FEATURES_MAP) as BasicFeatureKey[];

function getAvailableBeds(listing: { availableBeds?: number; totalBeds?: number }) {
  return listing.availableBeds ?? Math.max((listing.totalBeds ?? 4) - 0 - 0, 0);
}

function getAvailableBedsLabel(count: number) {
  if (count <= 0) return 'لا توجد سراير متاحة';
  if (count === 1) return 'سرير واحد متاح فقط';
  if (count === 2) return 'متبقي سريران فقط';
  return `متاح الآن: ${count} سراير`;
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
          <p className="text-sm font-bold text-tertiary">المنطقة المحيطة</p>
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const listingQuery = useQuery({
    queryKey: ['rentals', 'public', 'listing', slug],
    queryFn: () => rentalApiService.getPublicRentalListingBySlug(slug ?? ''),
    enabled: Boolean(slug),
  });

  const listing = listingQuery.data;
  const coverImage = listing ? getListingCoverImage(listing) : null;
  const gallery = listing ? sortListingImages(listing) : [];

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [slug]);

  useEffect(() => {
    if (gallery.length <= 1) return;

    const prevIndex = (selectedImageIndex - 1 + gallery.length) % gallery.length;
    const nextIndex = (selectedImageIndex + 1) % gallery.length;

    const prevImg = gallery[prevIndex];
    const nextImg = gallery[nextIndex];

    if (prevImg) {
      const prevUrl = prevImg.optimizedUrls
        ? (prevImg.optimizedUrls.card ?? prevImg.optimizedUrls.hero ?? prevImg.url)
        : prevImg.url;
      if (prevUrl) {
        const img = new Image();
        img.src = prevUrl;
      }
    }

    if (nextImg) {
      const nextUrl = nextImg.optimizedUrls
        ? (nextImg.optimizedUrls.card ?? nextImg.optimizedUrls.hero ?? nextImg.url)
        : nextImg.url;
      if (nextUrl) {
        const img = new Image();
        img.src = nextUrl;
      }
    }
  }, [selectedImageIndex, gallery]);

  useEffect(() => {
    if (!isLightboxOpen || gallery.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (event.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
      } else if (event.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev + 1) % gallery.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, gallery.length]);

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  if (listingQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-[520px] animate-pulse rounded-[32px] bg-primary/30 border border-outline/25 shadow-xl" />
      </main>
    );
  }

  if (listingQuery.isError || !listing) {
    return (
      <DetailError
        title="الإعلان غير موجود أو تم تحديث رابطه"
        message="الإعلان غير موجود أو تم تحديث رابطه. يمكنك الرجوع إلى قائمة الإعلانات المتاحة واختيار الرابط الحالي من السوق."
      />
    );
  }

  const title = publicRentalText(listing.title);
  const description = publicRentalText(listing.description);
  const location = publicRentalText(
    listing.locationText ?? listing.addressText ?? listing.compound?.address,
    publicRentalBrand.compoundAr,
  );
  const compoundName = publicCompoundName(listing.compound?.name);
  const availableBeds = getAvailableBeds(listing);
  const unitFacts = [
    { label: 'الغرف', value: listing.bedrooms != null ? `${listing.bedrooms}` : 'غير محدد', icon: BedDouble },
    { label: 'الدور', value: listing.floor != null ? `${listing.floor}` : 'غير محدد', icon: Building2 },
    { label: 'المساحة', value: listing.areaSqm ? `${listing.areaSqm} م²` : 'غير محدد', icon: Ruler },
  ];
  const pricingItems = [
    { label: 'التأمين', value: listing.depositAmount ? formatRentalMoney(listing.depositAmount) : formatRentalMoney(toNumber(listing.monthlyRent) * 2) },
  ];

  const activeImage = gallery[selectedImageIndex] || coverImage;
  const activeImageUrl = activeImage
    ? (activeImage.optimizedUrls
      ? (activeImage.optimizedUrls.card ?? activeImage.optimizedUrls.hero ?? activeImage.url)
      : activeImage.url)
    : '';

  return (
    <main className="pb-32 text-fixed xl:pb-16">
      <section className="border-b border-outline/30 bg-primary/20">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <Link className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-1 text-sm font-bold text-fixed-dim hover:text-tertiary hover:bg-white/5 transition" to={ROUTES.RENTALS}>
            <ChevronRight className="h-5 w-5 text-tertiary" />
            رجوع إلى الإيجارات
          </Link>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
            <div className="min-w-0 space-y-4">
              <div className="relative overflow-hidden rounded-[32px] glass-panel">
                <div
                  className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/8.5] bg-surface-dim cursor-pointer group"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  <DetailImageFallback title={title} />
                  {activeImageUrl && (
                    <img
                      alt={getListingImageAlt(listing, activeImage)}
                      className="relative h-full w-full object-cover transition duration-300 group-hover:opacity-90"
                      decoding="async"
                      loading="eager"
                      src={activeImageUrl}
                      {...{ fetchPriority: 'high' }}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  )}

                  {gallery.length > 1 && (
                    <>
                      <button
                        aria-label="الصورة السابقة"
                        className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/60 text-white hover:bg-primary/80 transition backdrop-blur-sm z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
                        }}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      <button
                        aria-label="الصورة التالية"
                        className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/60 text-white hover:bg-primary/80 transition backdrop-blur-sm z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex((prev) => (prev + 1) % gallery.length);
                        }}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent p-5 text-white sm:p-7 pointer-events-none">
                  <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
                    <span className="rounded-full bg-primary/80 border border-outline px-3 py-1 text-xs font-bold text-fixed backdrop-blur-md">{listingStatusLabels[listing.status]}</span>
                    {listing.isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tertiary px-3 py-1 text-xs font-bold text-primary shadow-md">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        مميز
                      </span>
                    )}
                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-fixed backdrop-blur-md">{listingTypeLabels[listing.listingType]}</span>
                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-fixed backdrop-blur-md">{listing.unitCondition || furnishingLabels[listing.furnishingStatus]}</span>
                    {availableBeds > 0 && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300 backdrop-blur-md">
                        {getAvailableBedsLabel(availableBeds)}
                      </span>
                    )}
                  </div>
                  <h1 className="mt-3 max-w-4xl text-2xl font-black leading-[1.35] sm:text-4xl lg:text-5xl text-fixed pointer-events-auto">{title}</h1>
                  <p className="mt-2 flex max-w-3xl items-center gap-2 text-sm text-fixed-dim sm:text-base pointer-events-auto">
                    <MapPin className="h-5 w-5 shrink-0 text-tertiary" />
                    {location}
                  </p>
                </div>
              </div>

              {gallery.length > 1 && (
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 snap-x">
                  {gallery.map((image, index) => {
                    const thumbUrl = image.optimizedUrls
                      ? (image.optimizedUrls.thumbnail ?? image.url)
                      : image.url;
                    return (
                      <button
                        key={image.id}
                        aria-label={`عرض الصورة ${index + 1}`}
                        className={cn(
                          "relative shrink-0 aspect-[4/3] w-24 sm:w-28 rounded-2xl overflow-hidden border-2 bg-surface-dim snap-start transition",
                          selectedImageIndex === index
                            ? "border-tertiary shadow-lg shadow-tertiary/20 scale-95"
                            : "border-outline/50 hover:border-white/30"
                        )}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img
                          alt={getListingImageAlt(listing, image)}
                          className="h-full w-full object-cover"
                          decoding="async"
                          loading="lazy"
                          src={thumbUrl}
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="self-start rounded-[32px] glass-panel p-5 text-right xl:sticky xl:top-24 xl:p-6">
              <div className="rounded-[26px] bg-secondary p-5 text-white border border-secondary/35 shadow-inner">
                <p className="text-sm font-bold text-tertiary">إيجار الشقة الشهري</p>
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

              <div className="mt-4 space-y-2 rounded-[24px] border border-outline/40 p-4 bg-white/5 text-sm">
                <p className="pb-2 text-sm font-bold leading-7 text-fixed-dim">
                  الحجز يتم على سرير داخل الشقة، وليس على الشقة بالكامل.
                </p>
                <p className="border-b border-outline/25 pb-3 text-xs font-bold leading-6 text-fixed-dim">
                  سيتم تحديد رقم السرير تلقائيًا حسب أولوية الإتاحة: سرير 1 ثم سرير 2 ثم سرير 3 ثم سرير 4.
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-fixed-dim">عدد السراير المتاحة</span>
                  <span className="font-black text-emerald-400">{getAvailableBedsLabel(availableBeds)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-outline/25 pt-2">
                  <span className="font-bold text-fixed-dim">إجمالي السراير</span>
                  <span className="font-black text-tertiary">{listing.totalBeds ?? 4}</span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {availableBeds > 0 ? (
                  <Link className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-tertiary hover:bg-tertiary/90 px-5 py-4 text-base font-black text-primary shadow-xl shadow-tertiary/15 transition" to={`/rentals/${listing.slug}/contact`}>
                    <LockKeyhole className="h-5 w-5" />
                    احجز سريرك الآن
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-error/25 bg-error-container/20 px-4 py-3 text-center text-sm font-black text-error">
                    لا توجد سراير متاحة لهذا الإعلان
                  </div>
                )}
              </div>
              {availableBeds > 0 && (
                <p className="mt-3 text-center text-xs font-bold text-fixed-dim">
                  حجز مبدئي بدون دفع الآن
                </p>
              )}
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-2xl font-black text-fixed">وصف الإعلان</h2>
            <p className="mt-4 whitespace-pre-line text-base leading-9 text-fixed-dim">{description}</p>
          </section>

          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-2xl font-black text-fixed">مواصفات الشقة</h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-primary/45 border border-outline/20 p-4"><dt className="text-sm text-fixed-dim">المساحة</dt><dd className="mt-1 font-black text-tertiary">{listing.areaSqm ? `${listing.areaSqm} م²` : 'غير محدد'}</dd></div>
              <div className="rounded-2xl bg-primary/45 border border-outline/20 p-4"><dt className="text-sm text-fixed-dim">عدد الغرف</dt><dd className="mt-1 font-black text-tertiary">{listing.bedrooms != null ? listing.bedrooms : 'غير محدد'}</dd></div>
              <div className="rounded-2xl bg-primary/45 border border-outline/20 p-4"><dt className="text-sm text-fixed-dim">الدور</dt><dd className="mt-1 font-black text-tertiary">{listing.floor ?? 'غير محدد'}</dd></div>
              <div className="rounded-2xl bg-primary/45 border border-outline/20 p-4"><dt className="text-sm text-fixed-dim">الشقة مكيفة</dt><dd className="mt-1 font-black text-tertiary">{listing.isAirConditioned ? 'نعم' : 'لا'}</dd></div>
              <div className="rounded-2xl bg-primary/45 border border-outline/20 p-4"><dt className="text-sm text-fixed-dim">التأمين</dt><dd className="mt-1 font-black text-tertiary">{listing.depositAmount ? formatRentalMoney(listing.depositAmount) : formatRentalMoney(toNumber(listing.monthlyRent) * 2)}</dd></div>
              <div className="rounded-2xl bg-primary/45 border border-outline/20 p-4"><dt className="text-sm text-fixed-dim">تاريخ النشر</dt><dd className="mt-1 font-black text-tertiary">{formatRentalDate(listing.publishedAt)}</dd></div>
              <div className="rounded-2xl bg-primary/45 border border-outline/20 p-4"><dt className="text-sm text-fixed-dim">عدد السراير المتاحة</dt><dd className="mt-1 font-black text-emerald-400">{availableBeds}</dd></div>
              <div className="rounded-2xl bg-primary/45 border border-outline/20 p-4"><dt className="text-sm text-fixed-dim">إجمالي السراير</dt><dd className="mt-1 font-black text-tertiary">{listing.totalBeds ?? 4}</dd></div>
            </dl>
          </section>

          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-2xl font-black text-fixed">الأساسيات</h2>
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {BASIC_FEATURE_KEYS.map((key) => {
                  const isAvailable = listing.basicFeatures?.includes(key);
                  return (
                    <div key={key} className="flex items-center justify-between rounded-2xl bg-primary/45 border border-outline/20 p-4">
                      <span className="text-sm text-fixed-dim">{BASIC_FEATURES_MAP[key]}</span>
                      <span className={cn("text-sm font-black", isAvailable ? "text-emerald-400" : "text-fixed/50")}>
                        {isAvailable ? 'متوفر' : 'غير متوفر'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl bg-tertiary/10 border border-tertiary/20 p-4 text-center">
                <span className="text-sm font-bold text-tertiary">
                  {(() => {
                    const selected = listing.basicFeatures || [];
                    if (selected.length === BASIC_FEATURE_KEYS.length) return "كل الأساسيات موجودة";
                    if (selected.length === 0) return "كل الأساسيات غير متوفرة";
                    const missing = BASIC_FEATURE_KEYS.filter((k) => !selected.includes(k)).map((k) => BASIC_FEATURES_MAP[k]);
                    return `الأساسيات الناقصة: ${missing.join('، ')}`;
                  })()}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-2xl font-black text-fixed">الكماليات والمميزات الإضافية</h2>
            <div className="mt-5 rounded-2xl bg-primary/45 border border-outline/20 p-5">
              <p className="whitespace-pre-line text-base leading-relaxed text-fixed-dim">
                {listing.extraAmenitiesText || '-'}
              </p>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-xl font-black text-fixed">الموقع والكمبوند</h2>
            <p className="mt-3 text-sm leading-7 text-fixed-dim">{compoundName}</p>
            <p className="mt-1 text-sm leading-7 text-fixed-dim">{publicRentalText(listing.addressText ?? listing.compound?.address, 'القاهرة الجديدة')}</p>
          </section>
        </div>
      </section>

      {isLightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            aria-label="إغلاق المعرض"
            className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm z-50"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>

          {gallery.length > 1 && (
            <>
              <button
                aria-label="الصورة السابقة"
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm z-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
              <button
                aria-label="الصورة التالية"
                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm z-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev + 1) % gallery.length);
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            </>
          )}

          <div
            className="relative max-h-full max-w-full flex items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              alt={getListingImageAlt(listing, activeImage)}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/5"
              decoding="async"
              loading="eager"
              src={activeImage.optimizedUrls ? (activeImage.optimizedUrls.hero ?? activeImage.url) : activeImage.url}
            />
            {gallery.length > 1 && (
              <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-sm font-bold text-white/75 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                {selectedImageIndex + 1} / {gallery.length}
              </div>
            )}
          </div>
        </div>
      )}

      {availableBeds > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline/30 bg-primary/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2.5 shadow-2xl backdrop-blur-xl xl:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1 text-right">
              <p className="truncate text-sm font-black text-tertiary">{formatRentalMoney(listing.monthlyRent)}</p>
              <p className="mt-1 text-xs font-bold text-fixed-dim">{getAvailableBedsLabel(availableBeds)}</p>
              <p className="mt-0.5 text-[11px] font-bold text-fixed-dim">بدون دفع الآن</p>
            </div>
            <Link
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-tertiary px-4 py-3 text-sm font-black text-primary shadow-lg shadow-tertiary/20"
              to={`/rentals/${listing.slug}/contact`}
            >
              <LockKeyhole className="h-4 w-4" />
              احجز سريرك الآن
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
