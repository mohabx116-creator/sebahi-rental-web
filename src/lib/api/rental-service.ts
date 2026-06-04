import { getApiData, postApiData } from './api-client';
import type {
  ContactAccessResponse,
  CreateRentalInquiryInput,
  RentalInquiryPublicResponse,
  RentalListing,
  RentalListingQuery,
  RentalReservation,
  StartContactUnlockInput,
  StartContactUnlockResponse,
} from './types';

export async function getPublicRentalListings(query?: RentalListingQuery) {
  return getApiData<RentalListing[]>('/rentals/listings', query);
}

export async function getPublicRentalListingBySlug(slug: string): Promise<RentalListing> {
  const response = await getApiData<RentalListing>(`/rentals/listings/${slug}`);
  return response.data;
}

export async function createRentalInquiry(listingId: string, input: CreateRentalInquiryInput): Promise<RentalInquiryPublicResponse> {
  const response = await postApiData<RentalInquiryPublicResponse>(`/rentals/listings/${listingId}/inquiries`, input);
  return response.data;
}

export async function getContactAccess(listingId: string, tenantPhone: string): Promise<ContactAccessResponse> {
  const response = await getApiData<ContactAccessResponse>(`/rentals/listings/${listingId}/contact-access`, { tenantPhone });
  return response.data;
}

export async function startContactUnlock(listingId: string, input: StartContactUnlockInput): Promise<StartContactUnlockResponse> {
  const response = await postApiData<StartContactUnlockResponse>(`/rentals/listings/${listingId}/contact-unlock`, input);
  return response.data;
}

export async function getRentalReservation(id: string): Promise<RentalReservation> {
  const response = await getApiData<RentalReservation>(`/rentals/reservations/${id}`);
  return response.data;
}

export const rentalApiService = {
  getPublicRentalListings,
  getPublicRentalListingBySlug,
  createRentalInquiry,
  getContactAccess,
  startContactUnlock,
  getRentalReservation,
};
