import type {
  RentalFurnishingStatus,
  RentalListing,
  RentalListingImage,
  RentalListingStatus,
  RentalListingType,
  RentalReservationStatus,
} from '../../lib/api/types';

export const publicRentalBrand = {
  compoundAr: 'كمبوند السبحي',
  compoundEn: 'Sebahi Compound',
  rentalsTitle: 'إيجارات كمبوند السبحي',
  marketplaceLabel: 'سوق إيجارات السبحي',
} as const;

export const listingTypeLabels: Record<RentalListingType, string> = {
  APARTMENT: 'شقة',
  VILLA: 'فيلا',
  STUDIO: 'استوديو',
  DUPLEX: 'دوبلكس',
  OFFICE: 'مكتب',
  SHOP: 'محل',
};

export const furnishingLabels: Record<RentalFurnishingStatus, string> = {
  UNFURNISHED: 'غير مفروشة',
  SEMI_FURNISHED: 'نصف مفروشة',
  FURNISHED: 'مفروشة',
};

export const listingStatusLabels: Record<RentalListingStatus, string> = {
  DRAFT: 'مسودة',
  PENDING_PAYMENT: 'بانتظار الدفع',
  PENDING_REVIEW: 'بانتظار المراجعة',
  ACTIVE: 'متاحة',
  PAYMENT_LOCKED: 'دفع قيد المعالجة',
  RESERVED: 'محجوزة',
  RENTED: 'تم التأجير',
  EXPIRED: 'منتهية',
  SUSPENDED: 'موقوفة',
  REJECTED: 'مرفوضة',
  REMOVED: 'محذوفة',
};

export const reservationStatusLabels: Record<RentalReservationStatus, string> = {
  PENDING_PAYMENT: 'بانتظار الدفع',
  PAYMENT_LOCKED: 'الدفع قيد التجهيز',
  PAID_PENDING_CONFIRMATION: 'مدفوعة وتنتظر التأكيد',
  RESERVED: 'محجوزة مؤقتا',
  CONFIRMED: 'مؤكدة',
  CANCELLED: 'ملغاة',
  EXPIRED: 'منتهية',
  REFUNDED: 'تم رد المبلغ',
  REJECTED: 'مرفوضة',
};

export function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return 0;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function formatRentalMoney(value: number | string | null | undefined) {
  const amount = toNumber(value);
  return `${new Intl.NumberFormat('ar-EG').format(amount)} ج.م`;
}

export function formatRentalDate(value: string | null | undefined) {
  if (!value) return 'غير محدد';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'غير محدد';

  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function shortId(value: string) {
  return value.slice(0, 8);
}

export function sanitizeSebahiDisplayText(value: string | null | undefined, fallback = '') {
  if (!value?.trim()) return fallback;

  return value
    .trim()
    .replace(/Black Horse Compound/gi, publicRentalBrand.compoundAr)
    .replace(/Black Horse/gi, publicRentalBrand.compoundAr)
    .replace(/black-horse/gi, 'sebahi')
    .replace(/Compound OS Demo/gi, publicRentalBrand.compoundAr)
    .replace(/New Cairo, Egypt/gi, 'القاهرة الجديدة')
    .replace(/بلاك هورس/g, publicRentalBrand.compoundAr);
}

export function publicRentalText(value: string | null | undefined, fallback = '') {
  return sanitizeSebahiDisplayText(value, fallback);
}

export function publicCompoundName(value: string | null | undefined) {
  return publicRentalText(value, publicRentalBrand.compoundAr);
}

export function sortListingImages(listingOrImages: RentalListing | RentalListingImage[] | null | undefined) {
  const images = Array.isArray(listingOrImages) ? listingOrImages : listingOrImages?.images;

  return [...(images ?? [])]
    .filter((image) => image.url.trim().length > 0)
    .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder);
}

export function getListingCoverImage(listing: RentalListing | null | undefined) {
  const images = sortListingImages(listing);
  return images.find((image) => image.isCover) ?? images[0] ?? null;
}

export function getListingImageAlt(listing: RentalListing, image: RentalListingImage | null | undefined) {
  return publicRentalText(image?.altText, `صورة ${publicRentalText(listing.title, 'وحدة للإيجار في كمبوند السبحي')}`);
}

type RentalImageVariant = 'card' | 'hero' | 'thumbnail';

const cloudinaryTransforms: Record<RentalImageVariant, string> = {
  card: 'f_auto,q_auto,w_600,c_limit',
  hero: 'f_auto,q_auto,w_1200,c_limit',
  thumbnail: 'f_auto,q_auto,w_300,c_limit',
};

function transformCloudinaryImageUrl(url: string, variant: RentalImageVariant) {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  return url.replace('/upload/', `/upload/${cloudinaryTransforms[variant]}/`);
}

export function getOptimizedListingImageUrl(
  image: RentalListingImage | null | undefined,
  variant: RentalImageVariant,
) {
  if (!image?.url) return '';
  return image.optimizedUrls?.[variant] ?? transformCloudinaryImageUrl(image.url, variant);
}
