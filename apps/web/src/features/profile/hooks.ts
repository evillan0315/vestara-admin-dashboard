import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  profileApi,
  type UpdateProfileData,
  type ChangePasswordData,
  type ChangeEmailData,
  type DeleteAccountData,
} from '../../api/profile';
import type { UserProfileDTO, KycDocumentType } from '@vestara/types';

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
    onSuccess: (res) => {
      if (res.data) queryClient.setQueryData(profileKeys.all, res);
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
    onSuccess: (res) => {
      queryClient.setQueryData(profileKeys.all, (old: unknown) => {
        const prev = old as { user: { email: string } } | undefined;
        return prev && res.data
          ? { ...prev, user: { ...prev.user, email: res.data.user.email } }
          : old;
      });
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (data: DeleteAccountData) => profileApi.deleteAccount(data),
  });
}

export function useSubmitKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentType?: KycDocumentType) => profileApi.submitKyc(documentType),
    onSuccess: (res) => {
      queryClient.setQueryData(profileKeys.all, (old: unknown) => {
        const prev = old as { profile: UserProfileDTO } | undefined;
        return prev && res.data ? { ...prev, profile: res.data.profile } : old;
      });
    },
  });
}

export function useUploadKycDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType: KycDocumentType }) =>
      profileApi.uploadKycDocument(file, documentType),
    onSuccess: (res) => {
      queryClient.setQueryData(profileKeys.all, (old: unknown) => {
        const prev = old as { profile: UserProfileDTO } | undefined;
        return prev ? { ...prev, profile: res.profile } : old;
      });
    },
  });
}

export function useDeleteKycDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profileApi.deleteKycDocument(id),
    onSuccess: (res) => {
      queryClient.setQueryData(profileKeys.all, (old: unknown) => {
        const prev = old as { profile: UserProfileDTO } | undefined;
        return prev && res.data ? { ...prev, profile: res.data.profile } : old;
      });
    },
  });
}
