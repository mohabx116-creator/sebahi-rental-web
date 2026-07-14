import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble,
  Building2,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  X,
  LockKeyhole,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { rentalApiService } from '../../lib/api/rental-service';
import { ROUTES } from '../../lib/constants/routes';
import { cn } from '../../lib/utils/cn';
import { InlineOwnerAcquisitionCta } from '../../components/layout/MobileOwnerAcquisitionCta';
import type { RentalListing } from '../../lib/api/types';
import {
  formatRentalDate,
  formatRentalMoney,
  furnishingLabels,
  getListingCoverImage,
  getListingImageAlt,
  getAvailableBedsStatusLabel,
  getRentalBedCounts,
  getPublicRentalStatusLabel,
  listingTypeLabels,
  publicCompoundName,
  publicRentalBrand,
  publicRentalText,
  sortListingImages,
  toNumber,
} from './rental-format';

const BASIC_FEATURES_MAP = {
  internet: 'ط·آ·ط¢آ¥ط·آ¸أ¢â‚¬آ ط·آ·ط¹آ¾ط·آ·ط¢آ±ط·آ¸أ¢â‚¬آ ط·آ·ط¹آ¾',
  basic_appliances: 'ط·آ·ط¢آ£ط·آ·ط¢آ¬ط·آ¸أ¢â‚¬طŒط·آ·ط¢آ²ط·آ·ط¢آ© ط·آ¸ط¦â€™ط·آ¸أ¢â‚¬طŒط·آ·ط¢آ±ط·آ·ط¢آ¨ط·آ·ط¢آ§ط·آ·ط¢آ¦ط·آ¸ط¸آ¹ط·آ·ط¢آ© ط·آ·ط¢آ£ط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ³ط·آ¸ط¸آ¹ط·آ·ط¢آ©',
  water_motor: 'ط·آ¸أ¢â‚¬آ¦ط·آ¸ط«â€ ط·آ·ط¹آ¾ط·آ¸ط«â€ ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¸آ¹ط·آ·ط¢آ§ط·آ¸أ¢â‚¬طŒ',
  desks: 'ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¦â€™ط·آ·ط¢آ§ط·آ·ط¹آ¾ط·آ·ط¢آ¨',
  window_mesh: 'ط·آ·ط¢آ³ط·آ¸أ¢â‚¬â€چط·آ¸ط¦â€™ ط·آ·ط¢آ´ط·آ·ط¢آ¨ط·آ·ط¢آ§ط·آ¸ط¦â€™',
  water_heater: 'ط·آ·ط¢آ³ط·آ·ط¢آ®ط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ  ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¸آ¹ط·آ·ط¢آ§ط·آ¸أ¢â‚¬طŒ',
  water_filter: 'ط·آ¸ط¸آ¾ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¸آ¹ط·آ·ط¢آ§ط·آ¸أ¢â‚¬طŒ',
} as const;
type BasicFeatureKey = keyof typeof BASIC_FEATURES_MAP;
const BASIC_FEATURE_KEYS = Object.keys(BASIC_FEATURES_MAP) as BasicFeatureKey[];

function getAvailableBeds(listing: { availableBeds?: number | null; totalBeds?: number | null }) {
  return getRentalBedCounts(listing).availableBeds;
}

function getAvailableBedsLabel(count: number) {
  if (count <= 0) return 'ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ·ط¹آ¾ط·آ·ط¢آ§ط·آ·ط¢آ­ط·آ·ط¢آ©';
  if (count === 1) return 'ط·آ·ط¢آ³ط·آ·ط¢آ±ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ·ط¢آ­ط·آ·ط¢آ¯ ط·آ¸أ¢â‚¬آ¦ط·آ·ط¹آ¾ط·آ·ط¢آ§ط·آ·ط¢آ­ ط·آ¸ط¸آ¾ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ·';
  if (count === 2) return 'ط·آ¸أ¢â‚¬آ¦ط·آ·ط¹آ¾ط·آ·ط¢آ¨ط·آ¸أ¢â‚¬ع‘ط·آ¸ط¸آ¹ ط·آ·ط¢آ³ط·آ·ط¢آ±ط·آ¸ط¸آ¹ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ  ط·آ¸ط¸آ¾ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ·';
  return `ط·آ¸أ¢â‚¬آ¦ط·آ·ط¹آ¾ط·آ·ط¢آ§ط·آ·ط¢آ­ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¢ط·آ¸أ¢â‚¬آ : ${count} ط·آ·ط¢آ³ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ¸ط¸آ¹ط·آ·ط¢آ±`;
}



const customerSupportWhatsAppGroupUrl = 'https://chat.whatsapp.com/ECEZfbsvjlU43eDvKa9XUu';

function buildInquiryMessage(
  listing: Pick<
    RentalListing,
    | 'slug'
    | 'title'
    | 'locationText'
    | 'addressText'
    | 'compound'
    | 'monthlyRent'
    | 'depositAmount'
    | 'unitCondition'
    | 'bedrooms'
    | 'floor'
    | 'areaSqm'
    | 'totalBeds'
    | 'availableBeds'
  >,
) {
  const title = publicRentalText(listing.title);
  const location = publicRentalText(
    listing.locationText ?? listing.addressText ?? listing.compound?.address,
    publicRentalBrand.compoundAr,
  );
  const bedCounts = getRentalBedCounts(listing);
  const availableBeds = getAvailableBeds(listing);
  const totalBeds = bedCounts.totalBeds;
  const monthlyRent = formatRentalMoney(listing.monthlyRent);
  const depositAmount = toNumber(listing.depositAmount);

  return [
    'ط·آ·ط¢آ§ط·آ·ط¢آ³ط·آ·ط¹آ¾ط·آ¸ط¸آ¾ط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ± ط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ  ط·آ·ط¢آ´ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ© ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ¸ط¸آ¹ط·آ·ط¢آ¬ط·آ·ط¢آ§ط·آ·ط¢آ±',
    `- ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ·ط¢آ¹ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ : ${title}`,
    `- ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬آ ط·آ·ط¢آ·ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ©: ${location}`,
    `- ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ³ط·آ·ط¢آ¹ط·آ·ط¢آ± ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ´ط·آ¸أ¢â‚¬طŒط·آ·ط¢آ±ط·آ¸ط¸آ¹: ${monthlyRent}`,
    `- ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ£ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬آ : ${depositAmount > 0 ? formatRentalMoney(depositAmount) : 'ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ ط·آ¸ط¸آ¹ط·آ¸ط«â€ ط·آ·ط¢آ¬ط·آ·ط¢آ¯ ط·آ·ط¹آ¾ط·آ·ط¢آ£ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬آ '}`,
    `- ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ­ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ©: ${listing.unitCondition || 'ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ­ط·آ·ط¢آ¯ط·آ·ط¢آ¯'}`,
    `- ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط·â€؛ط·آ·ط¢آ±ط·آ¸ط¸آ¾: ${listing.bedrooms != null ? listing.bedrooms : 'ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ­ط·آ·ط¢آ¯ط·آ·ط¢آ¯'}`,
    `- ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¯ط·آ¸ط«â€ ط·آ·ط¢آ±: ${listing.floor != null ? listing.floor : 'ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ­ط·آ·ط¢آ¯ط·آ·ط¢آ¯'}`,
    `- ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ­ط·آ·ط¢آ©: ${listing.areaSqm ? `${listing.areaSqm} ط·آ¸أ¢â‚¬آ¦ط·آ¢ط¢آ²` : 'ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ­ط·آ·ط¢آ¯ط·آ·ط¢آ¯ط·آ·ط¢آ©'}`,
    `- ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ³ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ·ط¹آ¾ط·آ·ط¢آ§ط·آ·ط¢آ­ط·آ·ط¢آ©: ${availableBeds}`,
    `- ط·آ·ط¢آ¥ط·آ·ط¢آ¬ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸ط¸آ¹ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ³ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ¸ط¸آ¹ط·آ·ط¢آ±: ${totalBeds}`,
    `- ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ·ط¢آ¨ط·آ·ط¢آ· ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ·ط¢آ¹ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ : ${window.location.origin}/rentals/${listing.slug}`,
    'ط·آ·ط¢آ¨ط·آ·ط¢آ±ط·آ·ط¢آ¬ط·آ·ط¢آ§ط·آ·ط·إ’ ط·آ·ط¹آ¾ط·آ·ط¢آ£ط·آ¸ط¦â€™ط·آ¸ط¸آ¹ط·آ·ط¢آ¯ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ¸ط«â€ ط·آ¸ط¸آ¾ط·آ·ط¢آ± ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ·ط¢آµط·آ¸أ¢â‚¬â€چ ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ¹ ط·آ·ط¢آ®ط·آ·ط¢آ¯ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ© ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط·إ’.',
  ].join('\n');
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.error('Failed to copy inquiry message', error);
  }
  return false;
}

function DetailImageFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#eef2ee] p-6 text-center sm:p-8">
      <div className="flex max-w-sm flex-col items-center gap-3 text-[#5f6e62]">
        <Building2 className="h-10 w-10 text-tertiary" />
        <p className="text-sm font-bold">ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آµط·آ¸ط«â€ ط·آ·ط¢آ±ط·آ·ط¢آ© ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ·ط¹آ¾ط·آ·ط¢آ§ط·آ·ط¢آ­ط·آ·ط¢آ© ط·آ·ط¢آ­ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸ط¸آ¹ط·آ·ط¢آ§</p>
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
        ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸ط«â€ ط·آ·ط¢آ¯ط·آ·ط¢آ© ط·آ·ط¢آ¥ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ° ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ¸ط¸آ¹ط·آ·ط¢آ¬ط·آ·ط¢آ§ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ·ط¹آ¾
      </Link>
    </main>
  );
}

export function PublicRentalDetailPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(() => searchParams.get('gallery') === 'true');
  const [imageError, setImageError] = useState(false);

  const listingQuery = useQuery({
    queryKey: ['rentals', 'public', 'listing', slug],
    queryFn: () => rentalApiService.getPublicRentalListingBySlug(slug ?? ''),
    enabled: Boolean(slug),
    staleTime: 0,
  });

  const listing = listingQuery.data;
  const coverImage = listing ? getListingCoverImage(listing) : null;
  const gallery = useMemo(() => (listing ? sortListingImages(listing) : []), [listing]);

  useEffect(() => {
    if (searchParams.get('gallery') === 'true' && gallery.length > 0) {
      setIsLightboxOpen(true);
    }
  }, [searchParams, gallery.length]);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setSelectedImageIndex(0);
      setImageError(false);
    }, 0);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [slug]);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setImageError(false);
    }, 0);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [selectedImageIndex]);

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
        title="ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ·ط¢آ¹ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ  ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ¸ط«â€ ط·آ·ط¢آ¬ط·آ¸ط«â€ ط·آ·ط¢آ¯ ط·آ·ط¢آ£ط·آ¸ط«â€  ط·آ·ط¹آ¾ط·آ¸أ¢â‚¬آ¦ ط·آ·ط¹آ¾ط·آ·ط¢آ­ط·آ·ط¢آ¯ط·آ¸ط¸آ¹ط·آ·ط¢آ« ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ·ط¢آ¨ط·آ·ط¢آ·ط·آ¸أ¢â‚¬طŒ"
        message="ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ·ط¢آ¹ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ  ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ¸ط«â€ ط·آ·ط¢آ¬ط·آ¸ط«â€ ط·آ·ط¢آ¯ ط·آ·ط¢آ£ط·آ¸ط«â€  ط·آ·ط¹آ¾ط·آ¸أ¢â‚¬آ¦ ط·آ·ط¹آ¾ط·آ·ط¢آ­ط·آ·ط¢آ¯ط·آ¸ط¸آ¹ط·آ·ط¢آ« ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ·ط¢آ¨ط·آ·ط¢آ·ط·آ¸أ¢â‚¬طŒ. ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¦â€™ط·آ¸أ¢â‚¬آ ط·آ¸ط¦â€™ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ±ط·آ·ط¢آ¬ط·آ¸ط«â€ ط·آ·ط¢آ¹ ط·آ·ط¢آ¥ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ° ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ§ط·آ·ط¢آ¦ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ© ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ·ط¢آ¹ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ ط·آ·ط¢آ§ط·آ·ط¹آ¾ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ·ط¹آ¾ط·آ·ط¢آ§ط·آ·ط¢آ­ط·آ·ط¢آ© ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ·ط¢آ®ط·آ·ط¹آ¾ط·آ¸ط¸آ¹ط·آ·ط¢آ§ط·آ·ط¢آ± ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ·ط¢آ¨ط·آ·ط¢آ· ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ­ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸ط¸آ¹ ط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬آ  ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ³ط·آ¸ط«â€ ط·آ¸أ¢â‚¬ع‘."
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
  const bedCounts = getRentalBedCounts(listing);
  const availableBeds = bedCounts.availableBeds;
  const availableBedsStatusLabel = getAvailableBedsStatusLabel(listing);
  const isReserved = listing.status === 'RESERVED';
  const isUnavailable = isReserved || availableBeds <= 0;
  const pricingItems = [
    { label: 'ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ£ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬آ ', value: toNumber(listing.depositAmount) > 0 ? formatRentalMoney(listing.depositAmount) : 'ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ ط·آ¸ط¸آ¹ط·آ¸ط«â€ ط·آ·ط¢آ¬ط·آ·ط¢آ¯ ط·آ·ط¹آ¾ط·آ·ط¢آ£ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬آ ' },
  ];
  const inquiryMessage = buildInquiryMessage(listing);

  const activeImage = gallery[selectedImageIndex] || coverImage;
  const activeImageUrl = activeImage
    ? (activeImage.optimizedUrls
      ? (activeImage.optimizedUrls.card ?? activeImage.optimizedUrls.hero ?? activeImage.url)
      : activeImage.url)
    : '';

  return (
    <main className="public-rental-detail pb-32 text-fixed xl:pb-16">
      <section className="border-b border-outline/30 bg-primary/20">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <Link className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-1 text-sm font-bold text-fixed-dim hover:text-tertiary hover:bg-white/5 transition" to={ROUTES.RENTALS}>
            <ChevronRight className="h-5 w-5 text-tertiary" />
            ط·آ·ط¢آ±ط·آ·ط¢آ¬ط·آ¸ط«â€ ط·آ·ط¢آ¹ ط·آ·ط¢آ¥ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ° ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ¸ط¸آ¹ط·آ·ط¢آ¬ط·آ·ط¢آ§ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ·ط¹آ¾
          </Link>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
            <div className="min-w-0 space-y-4">
              <div className="relative overflow-hidden rounded-[32px] glass-panel bg-white/40 border border-[#d2c4aa]/80">
                <div
                  className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/8.5] bg-black cursor-pointer overflow-hidden group"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  {!activeImageUrl || imageError ? (
                    <DetailImageFallback />
                  ) : (
                    <img
                      alt={getListingImageAlt(listing, activeImage)}
                      className={cn("relative h-full w-full object-contain transition duration-300 group-hover:opacity-95", isUnavailable && "opacity-85 mix-blend-multiply filter brightness-75 grayscale-[30%]")}
                      decoding="async"
                      loading="eager"
                      src={activeImageUrl}
                      {...{ fetchPriority: 'high' }}
                      onError={() => {
                        setImageError(true);
                      }}
                    />
                  )}
                  {isUnavailable && <div className="absolute inset-0 bg-[#362e1a]/30 mix-blend-multiply backdrop-blur-[2px]" />}
                  {isUnavailable && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div className="rounded-2xl border border-white/20 bg-black/60 px-8 py-4 text-center backdrop-blur-md shadow-2xl">
                        <span className="text-xl sm:text-3xl font-black tracking-widest text-white">
                          {listing.status === 'RESERVED' ? 'قيد الحجز' : 'تم الإيجار'}
                        </span>
                        <p className="mt-2 text-sm sm:text-base font-bold text-white/90">
                          {listing.status === 'RESERVED' 
                            ? 'هذا الإعلان قيد الحجز حالياً'
                            : 'هذا الإعلان تم تأجيره بالكامل'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 sm:p-7 space-y-5 text-right border-t border-[#d2c4aa]/60 bg-white/20">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-row-reverse">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#d2c4aa] bg-white/80 px-3 py-1 text-xs font-bold text-[#132015] shadow-sm">
                        {getPublicRentalStatusLabel(listing)}
                      </span>
                      {listing.isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-tertiary px-3 py-1 text-xs font-bold text-primary shadow-sm">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          ط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¸آ¹ط·آ·ط¢آ²
                        </span>
                      )}
                      <span className="rounded-full border border-[#d2c4aa] bg-white/80 px-3 py-1 text-xs font-bold text-[#132015] shadow-sm">
                        {listingTypeLabels[listing.listingType]}
                      </span>
                      {(listing.unitCondition || furnishingLabels[listing.furnishingStatus]) && (
                        <span className="rounded-full border border-[#d2c4aa] bg-white/80 px-3 py-1 text-xs font-bold text-[#132015] shadow-sm">
                          {listing.unitCondition || furnishingLabels[listing.furnishingStatus]}
                        </span>
                      )}
                      {!isUnavailable && (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-800 shadow-sm">
                          {getAvailableBedsLabel(availableBeds)}
                        </span>
                      )}
                      {isUnavailable && (
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-800 shadow-sm">
                          {availableBedsStatusLabel}
                        </span>
                      )}
                    </div>


                  </div>

                  <h1 className="text-2xl font-black leading-[1.35] sm:text-3xl lg:text-4xl text-[#1f2c22]">{title}</h1>
                  <p className="flex items-center gap-2 text-sm text-[#3e4d41] sm:text-base">
                    <MapPin className="h-5 w-5 shrink-0 text-tertiary" />
                    {location}
                  </p>
                </div>
              </div>


            </div>

            <aside className="hidden xl:block self-start rounded-[32px] glass-panel p-5 text-right xl:sticky xl:top-24 xl:p-6">
              <div className="rounded-[26px] border border-[#d2c4aa] bg-gradient-to-br from-[#fdfaf4] to-[#eef5ef] p-5 text-[#1f2c22] shadow-[0_18px_40px_rgba(28,45,34,0.08)]">
                <p className="text-sm font-bold text-[#3e4d41]">ط·آ·ط¢آ¥ط·آ¸ط¸آ¹ط·آ·ط¢آ¬ط·آ·ط¢آ§ط·آ·ط¢آ± ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ´ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ© ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ´ط·آ¸أ¢â‚¬طŒط·آ·ط¢آ±ط·آ¸ط¸آ¹</p>
                <p className="mt-1 text-4xl font-black leading-tight text-tertiary">{formatRentalMoney(listing.monthlyRent)}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm text-[#38473d]">
                <span className="rounded-2xl border border-[#d6c9b3] bg-[#fcfaf5] px-2 py-3 shadow-sm">
                  <Building2 className="mx-auto mb-1 h-5 w-5 text-[#8a6d22]" />
                  <span className="font-semibold text-[#202c23]">{listing.floor != null ? `ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¯ط·آ¸ط«â€ ط·آ·ط¢آ± ${listing.floor}` : `${bedCounts.totalBeds} ط·آ·ط¢آ³ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ¸ط¸آ¹ط·آ·ط¢آ±`}</span>
                </span>
                <span className="rounded-2xl border border-[#d6c9b3] bg-[#fcfaf5] px-2 py-3 shadow-sm">
                  <BedDouble className="mx-auto mb-1 h-5 w-5 text-[#8a6d22]" />
                  <span className="font-semibold text-[#202c23]">
                    {isUnavailable ? availableBedsStatusLabel : `ط·آ¹ط·آ¯ط·آ¯ ط·آ§ط¸â€‍ط·آ³ط·آ±ط·آ§ط¸ظ¹ط·آ± ط·آ§ط¸â€‍ط¸â€¦ط·ع¾ط·آ§ط·آ­ط·آ©: ${availableBeds}`}
                  </span>
                </span>
              </div>

              <div className="mt-4 space-y-2 rounded-[24px] border border-[#d2c4aa] bg-white/80 p-4 shadow-sm">
                {pricingItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-bold text-[#38473d]">{item.label}</span>
                    <span className="font-black text-tertiary">{item.value}</span>
                  </div>
                ))}
              </div>



              <div className="mt-5 space-y-3">
                {!isUnavailable ? (
                  <Link className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-tertiary hover:bg-tertiary/90 px-5 py-4 text-base font-black text-primary shadow-xl shadow-tertiary/15 transition" to={`/rentals/${listing.slug}/contact`}>
                     <LockKeyhole className="h-5 w-5" />
                     ط·آ·ط¢آ·ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¨ ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ¹ط·آ·ط¢آ§ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬آ ط·آ·ط¢آ©
                  </Link>
                ) : (
                  <div className="flex min-h-14 w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-amber-200/50 bg-amber-50/50 px-5 py-4 text-base font-black text-amber-800/60 shadow-sm">
                    غير متاح حالياً
                  </div>
                )}
                {!isUnavailable && (
                  <button
                    type="button"
                    onClick={async () => {
                      window.open(customerSupportWhatsAppGroupUrl, '_blank', 'noopener,noreferrer');
                      const copied = await copyToClipboard(inquiryMessage);
                      if (!copied) {
                        console.warn('Unable to copy inquiry message automatically');
                      }
                    }}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#b8c7bc] bg-[#f7fbf7] px-5 py-3 text-sm font-black text-[#111913] shadow-sm transition hover:bg-white"
                  >
                    <MessageCircle className="h-5 w-5 text-emerald-700" />
                    ط·آ·ط¢آ§ط·آ·ط¢آ³ط·آ·ط¹آ¾ط·آ¸ط¸آ¾ط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ±
                  </button>
                )}
              </div>
            </aside>
          </div>

          <div className="mt-5 hidden xl:block">
            <InlineOwnerAcquisitionCta />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-2xl font-black text-fixed">ط·آ¸ط«â€ ط·آ·ط¢آµط·آ¸ط¸آ¾ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ·ط¢آ¹ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ </h2>
            <p className="mt-4 whitespace-pre-line text-base leading-9 text-[#38473d]">{description}</p>
          </section>

          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-2xl font-black text-fixed">ط·آ¸أ¢â‚¬آ¦ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ·ط¢آµط·آ¸ط¸آ¾ط·آ·ط¢آ§ط·آ·ط¹آ¾ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ´ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ©</h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/80 border border-[#d2c4aa] p-4"><dt className="text-sm text-[#38473d]">ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ­ط·آ·ط¢آ©</dt><dd className="mt-1 font-black text-tertiary">{listing.areaSqm ? `${listing.areaSqm} ط·آ¸أ¢â‚¬آ¦ط·آ¢ط¢آ²` : 'ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ­ط·آ·ط¢آ¯ط·آ·ط¢آ¯'}</dd></div>
              <div className="rounded-2xl bg-white/80 border border-[#d2c4aa] p-4"><dt className="text-sm text-[#38473d]">ط·آ·ط¢آ¹ط·آ·ط¢آ¯ط·آ·ط¢آ¯ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط·â€؛ط·آ·ط¢آ±ط·آ¸ط¸آ¾</dt><dd className="mt-1 font-black text-tertiary">{listing.bedrooms != null ? listing.bedrooms : 'ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ­ط·آ·ط¢آ¯ط·آ·ط¢آ¯'}</dd></div>
              <div className="rounded-2xl bg-white/80 border border-[#d2c4aa] p-4"><dt className="text-sm text-[#38473d]">ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¯ط·آ¸ط«â€ ط·آ·ط¢آ±</dt><dd className="mt-1 font-black text-tertiary">{listing.floor ?? 'ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ­ط·آ·ط¢آ¯ط·آ·ط¢آ¯'}</dd></div>
              <div className="rounded-2xl bg-white/80 border border-[#d2c4aa] p-4"><dt className="text-sm text-[#38473d]">ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ´ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ© ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¦â€™ط·آ¸ط¸آ¹ط·آ¸ط¸آ¾ط·آ·ط¢آ©</dt><dd className="mt-1 font-black text-tertiary">{listing.isAirConditioned ? 'ط·آ¸أ¢â‚¬آ ط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ¦' : 'ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§'}</dd></div>
              <div className="rounded-2xl bg-white/80 border border-[#d2c4aa] p-4"><dt className="text-sm text-[#38473d]">ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ£ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬آ </dt><dd className="mt-1 font-black text-tertiary">{toNumber(listing.depositAmount) > 0 ? formatRentalMoney(listing.depositAmount) : 'ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ ط·آ¸ط¸آ¹ط·آ¸ط«â€ ط·آ·ط¢آ¬ط·آ·ط¢آ¯ ط·آ·ط¹آ¾ط·آ·ط¢آ£ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬آ '}</dd></div>
              <div className="rounded-2xl bg-white/80 border border-[#d2c4aa] p-4"><dt className="text-sm text-[#38473d]">ط·آ·ط¹آ¾ط·آ·ط¢آ§ط·آ·ط¢آ±ط·آ¸ط¸آ¹ط·آ·ط¢آ® ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ ط·آ·ط¢آ´ط·آ·ط¢آ±</dt><dd className="mt-1 font-black text-tertiary">{formatRentalDate(listing.publishedAt)}</dd></div>
              <div className="rounded-2xl bg-white/80 border border-[#d2c4aa] p-4"><dt className="text-sm text-[#38473d]">عدد السراير المتاحة</dt><dd className="mt-1 font-black text-emerald-700">{isUnavailable ? availableBedsStatusLabel : availableBeds}</dd></div>
              <div className="rounded-2xl bg-white/80 border border-[#d2c4aa] p-4"><dt className="text-sm text-[#38473d]">ط·آ·ط¢آ¥ط·آ·ط¢آ¬ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸ط¸آ¹ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ³ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ¸ط¸آ¹ط·آ·ط¢آ±</dt><dd className="mt-1 font-black text-tertiary">{bedCounts.totalBeds}</dd></div>
            </dl>
          </section>

          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-2xl font-black text-fixed">ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ£ط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ³ط·آ¸ط¸آ¹ط·آ·ط¢آ§ط·آ·ط¹آ¾</h2>
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {BASIC_FEATURE_KEYS.map((key) => {
                  const isAvailable = listing.basicFeatures?.includes(key);
                  return (
                    <div key={key} className="flex items-center justify-between rounded-2xl bg-white/80 border border-[#d2c4aa] p-4">
                      <span className="text-sm text-[#38473d]">{BASIC_FEATURES_MAP[key]}</span>
                      <span className={cn("text-sm font-black", isAvailable ? "text-emerald-700" : "text-[#7b807a]")}>
                        {isAvailable ? 'ط·آ¸أ¢â‚¬آ¦ط·آ·ط¹آ¾ط·آ¸ط«â€ ط·آ¸ط¸آ¾ط·آ·ط¢آ±' : 'ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ·ط¹آ¾ط·آ¸ط«â€ ط·آ¸ط¸آ¾ط·آ·ط¢آ±'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl bg-tertiary/10 border border-tertiary/40 p-4 text-center">
                <span className="text-sm font-bold text-tertiary">
                  {(() => {
                    const selected = listing.basicFeatures || [];
                    if (selected.length === BASIC_FEATURE_KEYS.length) return "ط·آ¸ط¦â€™ط·آ¸أ¢â‚¬â€چ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ£ط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ³ط·آ¸ط¸آ¹ط·آ·ط¢آ§ط·آ·ط¹آ¾ ط·آ¸أ¢â‚¬آ¦ط·آ¸ط«â€ ط·آ·ط¢آ¬ط·آ¸ط«â€ ط·آ·ط¢آ¯ط·آ·ط¢آ©";
                    if (selected.length === 0) return "ط·آ¸ط¦â€™ط·آ¸أ¢â‚¬â€چ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ£ط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ³ط·آ¸ط¸آ¹ط·آ·ط¢آ§ط·آ·ط¹آ¾ ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ¸أ¢â‚¬آ¦ط·آ·ط¹آ¾ط·آ¸ط«â€ ط·آ¸ط¸آ¾ط·آ·ط¢آ±ط·آ·ط¢آ©";
                    const missing = BASIC_FEATURE_KEYS.filter((k) => !selected.includes(k)).map((k) => BASIC_FEATURES_MAP[k]);
                    return `ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ£ط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ³ط·آ¸ط¸آ¹ط·آ·ط¢آ§ط·آ·ط¹آ¾ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آµط·آ·ط¢آ©: ${missing.join('ط·آ·ط¥â€™ ')}`;
                  })()}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-2xl font-black text-fixed">ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸ط¦â€™ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸ط¸آ¹ط·آ·ط¢آ§ط·آ·ط¹آ¾ ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬آ¦ط·آ¸ط¸آ¹ط·آ·ط¢آ²ط·آ·ط¢آ§ط·آ·ط¹آ¾ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ·ط¢آ¶ط·آ·ط¢آ§ط·آ¸ط¸آ¾ط·آ¸ط¸آ¹ط·آ·ط¢آ©</h2>
            <div className="mt-5 rounded-2xl bg-primary/45 border border-outline/40 p-5">
              <p className="whitespace-pre-line text-base leading-relaxed text-[#38473d]">
                {listing.extraAmenitiesText || '-'}
              </p>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] glass-panel p-6 text-right">
            <h2 className="text-xl font-black text-fixed">ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ¸ط«â€ ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ¹ ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸ط¦â€™ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ¨ط·آ¸ط«â€ ط·آ¸أ¢â‚¬آ ط·آ·ط¢آ¯</h2>
            <p className="mt-3 text-sm leading-7 text-[#38473d]">{compoundName}</p>
            <p className="mt-1 text-sm leading-7 text-[#38473d]">{publicRentalText(listing.addressText ?? listing.compound?.address, 'ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ§ط·آ¸أ¢â‚¬طŒط·آ·ط¢آ±ط·آ·ط¢آ© ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¬ط·آ·ط¢آ¯ط·آ¸ط¸آ¹ط·آ·ط¢آ¯ط·آ·ط¢آ©')}</p>
          </section>
        </div>
      </section>

      {isLightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            aria-label="ط·آ·ط¢آ¥ط·آ·ط·â€؛ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ¸أ¢â‚¬ع‘ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ¹ط·آ·ط¢آ±ط·آ·ط¢آ¶"
            className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm z-50"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>

          {gallery.length > 1 && (
            <>
              <button
                aria-label="ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آµط·آ¸ط«â€ ط·آ·ط¢آ±ط·آ·ط¢آ© ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ¨ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ©"
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm z-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
              <button
                aria-label="ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آµط·آ¸ط«â€ ط·آ·ط¢آ±ط·آ·ط¢آ© ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸ط¸آ¹ط·آ·ط¢آ©"
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d2c4aa] bg-[#fffdf8]/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2.5 shadow-2xl backdrop-blur-xl xl:hidden">
        <div className="mx-auto max-w-7xl space-y-2">
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-black text-tertiary">{formatRentalMoney(listing.monthlyRent)}</p>
            <p className="mt-1 text-sm font-bold text-[#38473d]">{isUnavailable ? availableBedsStatusLabel : getAvailableBedsLabel(availableBeds)}</p>
          </div>
          {isUnavailable ? (
            <div className="flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-amber-200/50 bg-amber-50/50 px-4 py-3 text-sm font-black text-amber-800/60 shadow-sm">
              غير متاح حالياً
            </div>
          ) : (
            <>
              <Link
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-tertiary px-4 py-3 text-sm font-black text-primary shadow-lg shadow-tertiary/20"
                to={`/rentals/${listing.slug}/contact`}
              >
                <LockKeyhole className="h-4 w-4" />
                ط·آ·ط¢آ·ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¨ ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ¹ط·آ·ط¢آ§ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬آ ط·آ·ط¢آ©
              </Link>
              <button
                type="button"
                onClick={async () => {
                  window.open(customerSupportWhatsAppGroupUrl, '_blank', 'noopener,noreferrer');
                  const copied = await copyToClipboard(inquiryMessage);
                  if (!copied) {
                    console.warn('Unable to copy inquiry message automatically');
                  }
                }}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#b8c7bc] bg-[#f7fbf7] px-4 py-3 text-sm font-black text-[#111913] shadow-sm transition hover:bg-white"
              >
                <MessageCircle className="h-4 w-4 text-emerald-700" />
                ط·آ·ط¢آ§ط·آ·ط¢آ³ط·آ·ط¹آ¾ط·آ¸ط¸آ¾ط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ±
              </button>
            </>
          )}
        </div>
      </div>

    </main>
  );
}
