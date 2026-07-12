import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  profileApi,
  type UpdateProfileData,
  type ChangePasswordData,
  type ChangeEmailData,
  type DeleteAccountData,
} from '../../api/profile';

export const profileKeys = {
  all: ['profile'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: () => profileApi.get(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileData) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => profileApi.changePassword(data),
  });
}

export function useChangeEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeEmailData) => profileApi.changeEmail(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (data: DeleteAccountData) => profileApi.deleteAccount(data),
  });
}
