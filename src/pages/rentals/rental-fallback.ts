import type { PaginatedMeta, RentalListing, RentalListingQuery } from '../../lib/api/types';
import { RENTALS_FALLBACK, getFallbackRentalBySlug } from '../../data/rentals-fallback';

const DEFAULT_PAGE_SIZE = 12;

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function matchesSearch(listing: RentalListing, search: string) {
  if (!search) return true;

  const haystack = [
    listing.title,
    listing.description,
    listing.slug,
    listing.unitCondition,
    listing.locationText,
    listing.addressText,
    listing.compound?.name,
    listing.compound?.address,
  ]
    .map(normalizeText)
    .join(' ');

  return haystack.includes(search);
}

function matchesQuery(listing: RentalListing, query: RentalListingQuery) {
  const search = normalizeText(query.search);
  if (search && !matchesSearch(listing, search)) return false;

  if (query.listingType && listing.listingType !== query.listingType) return false;
  if (query.furnishingStatus && listing.furnishingStatus !== query.furnishingStatus) return false;
  if (query.featured !== undefined && Boolean(listing.isFeatured) !== query.featured) return false;
  if (query.bedrooms !== undefined && Number(listing.bedrooms) !== query.bedrooms) return false;

  const rent = Number(listing.monthlyRent);
  if (query.minRent !== undefined && rent < query.minRent) return false;
  if (query.maxRent !== undefined && rent > query.maxRent) return false;

  return true;
}

export function getFallbackPublicRentals(query: RentalListingQuery = {}) {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const limit = Math.max(1, Math.floor(query.limit ?? DEFAULT_PAGE_SIZE));
  const filtered = RENTALS_FALLBACK.filter((listing) => matchesQuery(listing, query));
  const totalCount = filtered.length;
  const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / limit);
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  const meta: PaginatedMeta = {
    page,
    limit,
    totalCount,
    availableCount: totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  return {
    data,
    meta,
    message: 'Rental listings retrieved successfully',
  };
}

export function getFallbackPublicRentalBySlug(slug: string) {
  return getFallbackRentalBySlug(slug);
}

