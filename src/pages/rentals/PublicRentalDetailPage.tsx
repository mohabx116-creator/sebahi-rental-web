import { useQuery } from '@tanstack/react-query';
import { Bath, BedDouble, Building2, CalendarCheck, ChevronRight, LockKeyhole, MapPin, Ruler, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { RentalInquiryForm } from '../../components/rentals/RentalInquiryForm';
import { rentalApiService } from '../../lib/api/rental-service';
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

function ListingUnavailable() {
  return (
    <main className="center-state page">
      <section className="panel">
        <Building2 size={52} color="#b58a35" />
        <h1 className="title">الوحدة غير موجودة أو تم تحديث رابطها</h1>
        <p className="muted">يمكنك الرجوع إلى قائمة الوحدات المتاحة واختيار الرابط الحالي من السوق.</p>
        <Link className="btn" to={ROUTES.RENTALS}>العودة إلى الإيجارات</Link>
      </section>
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

  if (listingQuery.isLoading) return <main className="page"><div className="panel">جاري تحميل تفاصيل الوحدة...</div></main>;
  if (listingQuery.isError || !listingQuery.data) return <ListingUnavailable />;

  const listing = listingQuery.data;
  const coverImage = getListingCoverImage(listing);
  const gallery = sortListingImages(listing);
  const title = publicRentalText(listing.title);
  const description = publicRentalText(listing.description);
  const location = publicRentalText(listing.locationText ?? listing.addressText ?? listing.compound?.address, publicRentalBrand.compoundAr);
  const compoundName = publicCompoundName(listing.compound?.name);

  return (
    <main className="page">
      <Link className="btn-light" to={ROUTES.RENTALS}><ChevronRight size={18} /> رجوع إلى الإيجارات</Link>
      <section className="grid detail-grid" style={{ marginTop: 20 }}>
        <div className="grid">
          <div className="card">
            <div className="image-box" style={{ aspectRatio: '16 / 9' }}>
              <div className="image-fallback">
                <span className="chip gold"><Building2 size={16} /> {publicRentalBrand.rentalsTitle}</span>
                <strong>{title}</strong>
              </div>
              {coverImage && <img alt={getListingImageAlt(listing, coverImage)} src={coverImage.url} />}
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="gallery">
              {gallery.slice(0, 4).map((image) => <img key={image.id} alt={getListingImageAlt(listing, image)} src={image.url} />)}
            </div>
          )}
          <section className="panel">
            <h2 className="section-title">وصف الوحدة</h2>
            <p className="muted" style={{ lineHeight: 2 }}>{description}</p>
          </section>
          <section className="panel">
            <h2 className="section-title">المواصفات</h2>
            <div className="grid list-grid">
              <div className="soft-box"><small className="muted">نوع الوحدة</small><strong>{listingTypeLabels[listing.listingType]}</strong></div>
              <div className="soft-box"><small className="muted">التجهيز</small><strong>{furnishingLabels[listing.furnishingStatus]}</strong></div>
              <div className="soft-box"><small className="muted">الدور</small><strong>{listing.floor ?? 'غير محدد'}</strong></div>
              <div className="soft-box"><small className="muted">تاريخ النشر</small><strong>{formatRentalDate(listing.publishedAt)}</strong></div>
            </div>
          </section>
          <span id="inquiry" />
          <RentalInquiryForm
            listingId={listing.id}
            listingTitle={title}
            intro="يمكنك طلب معاينة الوحدة الآن بدون تسجيل دخول وبدون دفع. سيصل الطلب إلى إدارة كمباوند السبحي للمتابعة."
          />
        </div>
        <aside className="grid" style={{ alignSelf: 'start' }}>
          <section className="panel">
            <div className="meta-row">
              <span className="chip">{listingStatusLabels[listing.status]}</span>
              {listing.isFeatured && <span className="chip gold"><Sparkles size={15} /> مميز</span>}
              <span className="chip">{listingTypeLabels[listing.listingType]}</span>
            </div>
            <h1 className="title">{title}</h1>
            <p className="muted"><MapPin size={17} /> {location}</p>
            <p style={{ color: '#805b16', fontWeight: 900 }}>{compoundName}</p>
            <div className="facts">
              <div className="fact"><BedDouble size={20} /><strong>{listing.bedrooms}</strong><small> غرف</small></div>
              <div className="fact"><Bath size={20} /><strong>{listing.bathrooms}</strong><small> حمام</small></div>
              <div className="fact"><Ruler size={20} /><strong>{new Intl.NumberFormat('ar-EG').format(toNumber(listing.areaSqm))}</strong><small> م²</small></div>
            </div>
            <div className="prices" style={{ marginTop: 12 }}>
              <div className="price"><small>الإيجار</small><strong>{formatRentalMoney(listing.monthlyRent)}</strong></div>
              <div className="price"><small>التأمين</small><strong>{listing.depositAmount ? formatRentalMoney(listing.depositAmount) : 'غير محدد'}</strong></div>
              <div className="price"><small>فتح التواصل</small><strong>{formatRentalMoney(listing.contactUnlockFee)}</strong></div>
            </div>
            <div className="grid" style={{ marginTop: 16 }}>
              <a className="btn-secondary" href="#inquiry"><CalendarCheck size={18} /> طلب معاينة</a>
              <Link className="btn" to={`/rentals/${listing.slug}/contact`}><LockKeyhole size={18} /> فتح بيانات التواصل</Link>
            </div>
            <p className="notice" style={{ marginTop: 16 }}>
              <ShieldCheck size={18} /> لا تظهر بيانات المالك ولا يتم تأكيد أي دفع إلا بعد تحقق الخادم.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}
