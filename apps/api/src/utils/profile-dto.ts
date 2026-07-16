import type {
  UserProfileDTO,
  KycDocumentDTO,
  ProfileThemeMode,
  ProfileVisibility,
  VerificationStatus,
  KycDocumentType,
} from '@vestara/types';

type ProfileDocument = {
  id: string;
  fileId: string;
  documentType: string;
  status: string;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  file: {
    name: string;
    originalName: string;
    url: string | null;
    size: bigint;
  } | null;
};

type ProfileWithDocuments = {
  id: string;
  phone: string | null;
  bio: string | null;
  dateOfBirth: Date | null;
  contactEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
  loginAlerts: boolean;
  marketingEmails: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  themeMode: string;
  profileVisibility: string;
  showEmail: boolean;
  showActivity: boolean;
  searchable: boolean;
  kycStatus: string;
  kycSubmittedAt: Date | null;
  kycReviewedAt: Date | null;
  kycRejectionReason: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  documents: ProfileDocument[];
};

/**
 * Convert a Prisma `UserProfile` (with nested KYC documents + files) into the
 * API-facing `UserProfileDTO`. Dates are serialized to ISO strings.
 */
export function toUserProfileDTO(profile: ProfileWithDocuments): UserProfileDTO {
  const toIso = (d: Date | null | undefined) => (d ? d.toISOString() : undefined);

  const documents: KycDocumentDTO[] = profile.documents.map((doc) => ({
    id: doc.id,
    fileId: doc.fileId,
    fileName: doc.file?.originalName || doc.file?.name || 'document',
    fileUrl: doc.file?.url ?? undefined,
    fileSize: doc.file ? Number(doc.file.size) : undefined,
    documentType: doc.documentType as KycDocumentType,
    status: doc.status as VerificationStatus,
    reviewedAt: toIso(doc.reviewedAt),
    rejectionReason: doc.rejectionReason ?? undefined,
    createdAt: doc.createdAt.toISOString(),
  }));

  return {
    id: profile.id,
    phone: profile.phone ?? undefined,
    bio: profile.bio ?? undefined,
    dateOfBirth: toIso(profile.dateOfBirth),
    contactEmail: profile.contactEmail ?? undefined,
    addressLine1: profile.addressLine1 ?? undefined,
    addressLine2: profile.addressLine2 ?? undefined,
    city: profile.city ?? undefined,
    state: profile.state ?? undefined,
    postalCode: profile.postalCode ?? undefined,
    country: profile.country ?? undefined,
    emailNotifications: profile.emailNotifications,
    pushNotifications: profile.pushNotifications,
    loginAlerts: profile.loginAlerts,
    marketingEmails: profile.marketingEmails,
    language: profile.language,
    timezone: profile.timezone,
    dateFormat: profile.dateFormat,
    themeMode: profile.themeMode as ProfileThemeMode,
    profileVisibility: profile.profileVisibility as ProfileVisibility,
    showEmail: profile.showEmail,
    showActivity: profile.showActivity,
    searchable: profile.searchable,
    kycStatus: profile.kycStatus as VerificationStatus,
    kycSubmittedAt: toIso(profile.kycSubmittedAt),
    kycReviewedAt: toIso(profile.kycReviewedAt),
    kycRejectionReason: profile.kycRejectionReason ?? undefined,
    documents,
    createdAt: profile.createdAt ? profile.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: profile.updatedAt ? profile.updatedAt.toISOString() : new Date().toISOString(),
  };
}
