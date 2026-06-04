import { useQuery } from '@tanstack/react-query';
import { Bath, BedDouble, Building2, Home, MapPin, Search, ShieldCheck, Sparkles } from 'lucide-react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rentalApiService } from '../../lib/api/rental-service';
import type { RentalFurnishingStatus, RentalListing, RentalListingQuery, RentalListingType } from '../../lib/api/types';
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
  toNumber,
} from './rental-format';

const heroImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1800';

function buildQuery(searchParams: URLSearchParams): RentalListingQuery {
  const minRent = searchParams.get('minRent');
  const maxRent = searchParams.get('maxRent');
  const bedrooms = searchParams.get('bedrooms');
  return {
    page: Number(searchParams.get('page') || 1),
    limit: 12,
    search: searchParams.get('search') || undefined,
    listingType: (searchParams.get('listingType') || undefined) as RentalListingType | undefined,
    furnishingStatus: (searchParams.get('furnishingStatus') || undefined) as RentalFurnishingStatus | undefined,
    minRent: minRent ? Number(minRent) : undefined,
    maxRent: maxRent ? Number(maxRent) : undefined,
    bedrooms: bedrooms ? Number(bedrooms) : undefined,
    featured: searchParams.get('featured') === 'true' ? true : undefined,
  };
}

function ListingCard({ listing }: { listing: RentalListing }) {
  const coverImage = getListingCoverImage(listing);
  const title = publicRentalText(listing.title);
  const location = publicRentalText(listing.locationText ?? listing.addressText ?? listing.compound?.address, publicRentalBrand.compoundAr);
  const depositAmount = toNumber(listing.depositAmount);

  return (
    <article className={`card ${listing.isFeatured ? 'featured' : ''}`}>
      <Link to={`/rentals/${listing.slug}`}>
        <div className="image-box">
          <div className="image-fallback">
            <span className="chip gold"><Home size={16} /> {publicRentalBrand.marketplaceLabel}</span>
            <strong>{title}</strong>
          </div>
          {coverImage && <img alt={getListingImageAlt(listing, coverImage)} src={coverImage.url} />}
        </div>
      </Link>
      <div className="card-body grid">
        <div>
          <div className="meta-row">
            <span className="chip">{listingStatusLabels[listing.status]}</span>
            {listing.isFeatured && <span className="chip gold"><Sparkles size={15} /> مميز</span>}
          </div>
          <p style={{ color: '#805b16', fontWeight: 900 }}>{publicCompoundName(listing.compound?.name)}</p>
          <Link className="title" style={{ display: 'block', fontSize: '1.35rem' }} to={`/rentals/${listing.slug}`}>{title}</Link>
          <p className="muted"><MapPin size={16} /> {location}</p>
        </div>
        <div className="meta-row">
          <span className="chip">{listingTypeLabels[listing.listingType]}</span>
          <span className="chip gold">{furnishingLabels[listing.furnishingStatus]}</span>
        </div>
        <div className="facts">
          <div className="fact"><BedDouble size={19} /> <strong>{listing.bedrooms}</strong><br /><small>غرف</small></div>
          <div className="fact"><Bath size={19} /> <strong>{listing.bathrooms}</strong><br /><small>حمام</small></div>
          <div className="fact"><Building2 size={19} /> <strong>{new Intl.NumberFormat('ar-EG').format(toNumber(listing.areaSqm))}</strong><br /><small>م²</small></div>
        </div>
        <div className="actions" style={{ justifyContent: 'space-between' }}>
          <Link className="btn" to={`/rentals/${listing.slug}`}>عرض التفاصيل</Link>
          <div>
            <small className="muted">الإيجار الشهري</small>
            <strong style={{ display: 'block', color: '#143d35' }}>{formatRentalMoney(listing.monthlyRent)}</strong>
            <small className="muted">التأمين: {depositAmount > 0 ? formatRentalMoney(depositAmount) : 'غير محدد'}</small>
          </div>
        </div>
      </div>
    </article>
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
  const totalCount = listingsQuery.data?.meta?.totalCount ?? listings.length;

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    ['search', 'listingType', 'furnishingStatus', 'minRent', 'maxRent', 'bedrooms'].forEach((key) => {
      const value = String(formData.get(key) ?? '').trim();
      if (value) next.set(key, value);
    });
    if (formData.get('featured') === 'on') next.set('featured', 'true');
    setSearchParams(next);
  }

  return (
    <main>
      <section className="hero">
        <img alt="" src={heroImage} />
        <div className="hero-content">
          <div>
            <span className="chip gold"><Home size={17} /> {publicRentalBrand.marketplaceLabel}</span>
            <h1>وحدات مختارة للإيجار داخل كمباوند السبحي</h1>
            <p>تصفح الوحدات المنشورة، قارن السعر والمساحة والتجهيز، وأرسل طلب معاينة بدون كشف بيانات المالك أو إنشاء دفع وهمي.</p>
            <div className="meta-row">
              <span className="chip gold"><ShieldCheck size={16} /> بيانات المالك محمية</span>
              <span className="chip">طلب معاينة بدون تسجيل دخول</span>
            </div>
          </div>
          <div className="hero-stat">
            <span>الوحدات المتاحة الآن</span>
            <strong>{new Intl.NumberFormat('ar-EG').format(totalCount)}</strong>
            <p>كل طلبات التواصل والمعاينة تمر عبر الخادم والإدارة.</p>
          </div>
        </div>
      </section>

      <section className="page">
        <form className="filters" onSubmit={handleFilterSubmit}>
          <input defaultValue={searchParams.get('search') ?? ''} name="search" placeholder="ابحث بالعنوان أو الموقع" />
          <select defaultValue={searchParams.get('listingType') ?? ''} name="listingType">
            <option value="">كل الأنواع</option>
            {Object.entries(listingTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select defaultValue={searchParams.get('furnishingStatus') ?? ''} name="furnishingStatus">
            <option value="">كل التجهيزات</option>
            {Object.entries(furnishingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input defaultValue={searchParams.get('minRent') ?? ''} min="0" name="minRent" placeholder="أقل سعر" type="number" />
          <input defaultValue={searchParams.get('maxRent') ?? ''} min="0" name="maxRent" placeholder="أعلى سعر" type="number" />
          <button className="btn-secondary" type="submit"><Search size={17} /> بحث</button>
        </form>

        <div className="status-row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 className="section-title">وحدات متاحة للإيجار</h2>
          <span className="muted">{listingsQuery.isFetching ? 'جاري تحديث النتائج...' : `${new Intl.NumberFormat('ar-EG').format(totalCount)} نتيجة`}</span>
        </div>

        {listingsQuery.isLoading && <div className="panel">جاري تحميل سوق الإيجارات...</div>}
        {listingsQuery.isError && (
          <div className="notice danger">
            <strong>تعذر تحميل سوق الإيجارات</strong>
            <p>راجع اتصال الإنترنت أو حاول مرة أخرى بعد لحظات.</p>
            <button className="btn" type="button" onClick={() => listingsQuery.refetch()}>إعادة المحاولة</button>
          </div>
        )}
        {!listingsQuery.isLoading && !listingsQuery.isError && listings.length === 0 && (
          <div className="panel center-state">
            <div>
              <Building2 size={42} color="#b58a35" />
              <h3 className="section-title">لا توجد وحدات منشورة حاليا</h3>
              <p className="muted">لم نجد وحدات تطابق الفلاتر الحالية داخل كمباوند السبحي.</p>
              <Link className="btn" to={ROUTES.RENTALS}>عرض كل الوحدات</Link>
            </div>
          </div>
        )}
        {visibleListings.length > 0 && (
          <div className="grid list-grid">
            {visibleListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        )}
      </section>
    </main>
  );
}
