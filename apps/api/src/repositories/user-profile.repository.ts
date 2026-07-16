import { BaseRepository } from './base.repository.js';

/**
 * Repository for extended user profiles (personal info, contact, address,
 * preferences, KYC / verification). Profiles are 1:1 with a `User` and
 * org-scoped. A profile is created lazily on first read so existing users
 * (seeded before this model existed) still resolve cleanly.
 */
export class UserProfileRepository extends BaseRepository {
  /**
   * Find a user's profile or create an empty one if it does not yet exist.
   * Returns the profile together with its KYC documents and the underlying file.
   */
  async findOrCreateByUserId(userId: string, organizationId: string) {
    const existing = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { documents: { include: { file: true } } },
    });

    if (existing) return existing;

    return this.prisma.userProfile.create({
      data: { userId, organizationId },
      include: { documents: { include: { file: true } } },
    });
  }

  /**
   * Update a profile by userId. Only the provided fields are changed.
   */
  async updateByUserId(
    userId: string,
    data: Record<string, unknown>,
  ) {
    const updateData: Record<string, unknown> = {};

    const stringFields = [
      'phone',
      'bio',
      'contactEmail',
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      'postalCode',
      'country',
      'language',
      'timezone',
      'dateFormat',
      'themeMode',
      'fontFamily',
      'fontWeight',
      'primaryColor',
      'density',
      'sidebarVariant',
      'contrastLevel',
      'profileVisibility',
    ];

    for (const field of stringFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field] === '' ? null : data[field];
      }
    }

    const floatFields = ['fontSizeScale', 'borderRadiusScale'];

    for (const field of floatFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field] as number;
      }
    }

    const booleanFields = [
      'emailNotifications',
      'pushNotifications',
      'loginAlerts',
      'marketingEmails',
      'showEmail',
      'showActivity',
      'searchable',
    ];

    for (const field of booleanFields) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }

    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth as string) : null;
    }

    return this.prisma.userProfile.update({
      where: { userId },
      data: updateData,
      include: { documents: { include: { file: true } } },
    });
  }

  /**
   * Mark the profile's KYC status as pending and record the submission time.
   */
  async submitKyc(userId: string) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        kycStatus: 'pending',
        kycSubmittedAt: new Date(),
        kycReviewedAt: null,
        kycRejectionReason: null,
      },
      include: { documents: { include: { file: true } } },
    });
  }

  /**
   * Add a KYC document row linked to an uploaded file and the user's profile.
   */
  async addKycDocument(params: {
    userId: string;
    profileId: string;
    fileId: string;
    organizationId: string;
    documentType: string;
  }) {
    return this.prisma.kycDocument.create({
      data: {
        userId: params.userId,
        profileId: params.profileId,
        fileId: params.fileId,
        organizationId: params.organizationId,
        documentType: params.documentType,
        status: 'pending',
      },
      include: { file: true },
    });
  }

  /**
   * Delete a KYC document by id. Ownership is enforced by the caller
   * (must belong to the requesting user).
   */
  async deleteKycDocument(id: string) {
    await this.prisma.kycDocument.delete({ where: { id } });
  }
}
