import apiClient from './client';
import type {
  UserDTO,
  UserProfileDTO,
  KycDocumentType,
} from '@vestara/types';

export interface ProfileResponse {
  user: UserDTO;
  profile: UserProfileDTO;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  dateOfBirth?: string;
  contactEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  loginAlerts?: boolean;
  marketingEmails?: boolean;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  themeMode?: string;
  profileVisibility?: string;
  showEmail?: boolean;
  showActivity?: boolean;
  searchable?: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailData {
  newEmail: string;
  currentPassword?: string;
}

export interface DeleteAccountData {
  currentPassword?: string;
  confirmation: string;
}

export const profileApi = {
  get() {
    return apiClient.get<ProfileResponse>('/profile');
  },

  update(data: UpdateProfileData) {
    return apiClient.put<ProfileResponse>('/profile', data);
  },

  changePassword(data: ChangePasswordData) {
    return apiClient.put<{ message: string }>('/profile/password', data);
  },

  changeEmail(data: ChangeEmailData) {
    return apiClient.put<{ user: UserDTO }>('/profile/email', data);
  },

  deleteAccount(data: DeleteAccountData) {
    return apiClient.post<{ message: string }>('/profile/delete-account', data);
  },

  submitKyc(documentType?: KycDocumentType) {
    return apiClient.post<{ profile: UserProfileDTO }>('/profile/kyc/submit', {
      documentType,
    });
  },

  uploadKycDocument(file: File, documentType: KycDocumentType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    const token = localStorage.getItem('accessToken');
    return fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/profile/documents`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to upload document');
      }
      return data as { profile: UserProfileDTO };
    });
  },

  deleteKycDocument(id: string) {
    return apiClient.delete<{ profile: UserProfileDTO }>(`/profile/documents/${id}`);
  },
};
