export interface PaginatedMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginatedMeta;
  error?: { code?: string; details?: unknown };
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export type RentalListingStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'PAYMENT_LOCKED'
  | 'RESERVED'
  | 'RENTED'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'REMOVED';

export type RentalListingType = 'APARTMENT' | 'VILLA' | 'STUDIO' | 'DUPLEX' | 'OFFICE' | 'SHOP';
export type RentalFurnishingStatus = 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FURNISHED';
export type RentalInquiryStatus = 'NEW' | 'CONTACT_UNLOCKED' | 'VIEWING_REQUESTED' | 'CLOSED' | 'CANCELLED';
export type RentalInquiryType = 'VIEWING_REQUEST' | 'GENERAL';
export type RentalPaymentStatus = 'INITIATED' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'DISPUTED';
export type RentalReservationStatus = 'PENDING_PAYMENT' | 'PAYMENT_LOCKED' | 'PAID_PENDING_CONFIRMATION' | 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED' | 'REJECTED';
export type RentalOwnerSubmissionStatus = 'NEW' | 'UNDER_REVIEW' | 'NEEDS_CHANGES' | 'APPROVED' | 'REJECTED' | 'CONVERTED_TO_LISTING' | 'CANCELLED';

export interface RentalCompoundPublicSummary {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  logoUrl?: string | null;
}

export interface RentalUnitPublicSummary {
  id: string;
  unitNumber?: string | null;
  unitType?: string | null;
  floor?: number | null;
}

export interface RentalListingImage {
  id: string;
  url: string;
  optimizedUrls?: {
    card: string;
    hero: string;
    thumbnail: string;
  };
  altText?: string | null;
  sortOrder: number;
  isCover: boolean;
}

export interface RentalListing {
  id: string;
  compoundId: string;
  unitId?: string | null;
  title: string;
  slug: string;
  description: string;
  listingType: RentalListingType;
  furnishingStatus: RentalFurnishingStatus;
  unitCondition?: string | null;
  basics?: string | null;
  amenities?: string | null;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number | string;
  floor?: number | null;
  monthlyRent: number | string;
  depositAmount?: number | string | null;
  contactUnlockFee: number | string;
  reservationFee: number | string;
  status: RentalListingStatus;
  addressText?: string | null;
  locationText?: string | null;
  isFeatured: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
  reservedUntil?: string | null;
  createdAt: string;
  totalBeds?: number;
  availableBeds?: number;
  images: RentalListingImage[];
  compound?: RentalCompoundPublicSummary | null;
  unit?: RentalUnitPublicSummary | null;
}

export interface RentalListingQuery extends ListQuery {
  listingType?: RentalListingType;
  furnishingStatus?: RentalFurnishingStatus;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  featured?: boolean;
}

export interface CreateRentalInquiryInput {
  tenantName: string;
  tenantPhone: string;
  tenantEmail?: string;
  tenantNationalId?: string;
  message?: string;
  inquiryType?: RentalInquiryType;
}

export interface RentalInquiryPublicResponse {
  id: string;
  status: RentalInquiryStatus;
}

export interface StartContactUnlockInput {
  tenantName: string;
  tenantPhone: string;
  tenantEmail?: string;
}

export type StartReservationInput = StartContactUnlockInput;

export interface RentalPaymentSummary {
  id: string;
  amount: number | string;
  currency: string;
  status: RentalPaymentStatus;
  paymentUrl?: string | null;
}

export interface RentalContactUnlockSummary {
  id: string;
  listingId: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail?: string | null;
  amount: number | string;
  currency: string;
  status: RentalPaymentStatus;
  unlockedAt?: string | null;
}

export interface StartContactUnlockResponse {
  alreadyUnlocked: boolean;
  contactUnlock?: RentalContactUnlockSummary | null;
  payment?: RentalPaymentSummary | null;
  paymentUrl?: string | null;
}

export interface RentalOwnerPublicSummary {
  fullName: string;
  phone: string;
  email?: string | null;
}

export interface ContactAccessResponse {
  unlocked: boolean;
  ownerContact?: RentalOwnerPublicSummary | null;
}

export interface RentalReservation {
  id: string;
  listingId: string;
  tenantName: string;
  tenantPhone: string;
  status: RentalReservationStatus;
  amount: number | string;
  currency: string;
  reservedUntil?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  expiredAt?: string | null;
  createdAt: string;
  listing?: Pick<RentalListing, 'id' | 'title' | 'slug' | 'status'> | null;
  paymentUrl?: string | null;
  payment?: { paymentUrl?: string | null } | null;
}

export interface StartReservationResponse {
  reservation: RentalReservation;
  payment?: RentalPaymentSummary | null;
  paymentUrl?: string | null;
}

export interface OwnerSubmissionImageInput {
  url: string;
  publicId?: string;
  storagePath?: string;
  altText?: string;
  sortOrder?: number;
  isCover?: boolean;
}

export interface CreateOwnerSubmissionInput {
  ownerName: string;
  ownerPhone: string;
  ownerWhatsapp: string;
  ownerNationalId?: string;
  totalBeds?: number;
  listingType: RentalListingType;
  title?: string;
  description?: string;
  floor?: number | null;
  areaSqm?: number;
  bedrooms?: number;
  bathrooms: number;
  furnishingStatus?: RentalFurnishingStatus;
  unitCondition?: string;
  basics?: string;
  amenities?: string;
  monthlyRent: number;
  depositAmount: number;
  images: OwnerSubmissionImageInput[];
  policyAccepted: true;
}

export interface OwnerSubmissionPublicStatus {
  id: string;
  status: RentalOwnerSubmissionStatus;
  title: string;
  createdListingId?: string | null;
  createdAt: string;
  updatedAt: string;
  duplicateReviewFlag?: boolean;
  reviewReason?: string | null;
  createdListing?: Pick<RentalListing, 'id' | 'title' | 'slug' | 'status'> & { isPublished: boolean } | null;
}

export interface CloudinaryUploadSignatureResponse {
  cloudName: string;
  uploadUrl: string;
  fields: {
    api_key: string;
    folder: string;
    timestamp: number;
    signature: string;
  };
}
