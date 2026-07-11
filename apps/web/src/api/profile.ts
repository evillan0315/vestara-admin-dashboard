import apiClient from './client';
import type { UserDTO } from '@vestara/types';

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = {
  get() {
    return apiClient.get<{ user: UserDTO }>('/profile');
  },

  update(data: UpdateProfileData) {
    return apiClient.put<{ user: UserDTO }>('/profile', data);
  },

  changePassword(data: ChangePasswordData) {
    return apiClient.put<{ message: string }>('/profile/password', data);
  },
};
