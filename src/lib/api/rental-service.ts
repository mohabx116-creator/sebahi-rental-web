import { getApiData, postApiData } from './api-client';
import type {
  ContactAccessResponse,
  CloudinaryUploadSignatureResponse,
  CreateOwnerSubmissionInput,
  CreateRentalInquiryInput,
  OwnerSubmissionPublicStatus,
  RentalInquiryPublicResponse,
  RentalListing,
  RentalListingQuery,
  RentalReservation,
  StartContactUnlockInput,
  StartContactUnlockResponse,
  StartReservationInput,
  StartReservationResponse,
} from './types';

export async function getPublicRentalListings(query?: RentalListingQuery) {
  return getApiData<RentalListing[]>('/rentals/listings', query);
}

export async function createCloudinaryUploadSignature(): Promise<CloudinaryUploadSignatureResponse> {
  const response = await postApiData<CloudinaryUploadSignatureResponse>('/rentals/owner-submissions/upload-signature', {});
  return response.data;
}

// Submits a new owner listing request to the backend with unit details
export async function createOwnerSubmission(input: CreateOwnerSubmissionInput): Promise<OwnerSubmissionPublicStatus> {
  const response = await postApiData<OwnerSubmissionPublicStatus>('/rentals/owner-submissions', input);
  return response.data;
}

export async function getOwnerSubmissionStatus(id: string): Promise<OwnerSubmissionPublicStatus> {
  const response = await getApiData<OwnerSubmissionPublicStatus>(`/rentals/owner-submissions/${id}/status`);
  return response.data;
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

export async function startRentalReservation(listingId: string, input: StartReservationInput): Promise<StartReservationResponse> {
  const response = await postApiData<StartReservationResponse>(`/rentals/listings/${listingId}/reservations`, input);
  return response.data;
}

export async function getRentalReservation(id: string): Promise<RentalReservation> {
  const response = await getApiData<RentalReservation>(`/rentals/reservations/${id}`);
  return response.data;
}

export const rentalApiService = {
  getPublicRentalListings,
  createCloudinaryUploadSignature,
  createOwnerSubmission,
  getOwnerSubmissionStatus,
  getPublicRentalListingBySlug,
  createRentalInquiry,
  getContactAccess,
  startContactUnlock,
  startRentalReservation,
  getRentalReservation,
};
