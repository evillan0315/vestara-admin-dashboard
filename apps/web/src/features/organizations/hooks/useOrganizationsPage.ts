import { useState, useRef, useCallback, useMemo } from 'react';
import type { OrganizationDTO } from '@vestara/types';
import type { CreateOrganizationInput } from '@vestara/validation';
import type { SortState } from '../../../components/data/DataTable';
import { useOrganizations, useCreateOrganization, useUpdateOrganization } from '../hooks';
import { uploadImage } from '../../../api/upload';
import { useToast } from '../../../components/feedback/Toast';

export interface OrganizationsPageState {
  sort: SortState;
  search: string;
  dialogOpen: boolean;
  editingOrg: OrganizationDTO | null;
  formData: CreateOrganizationInput;
  uploadingLogo: boolean;
}

export function useOrganizationsPage() {
  const { showSuccess, showError } = useToast();

  const [sort, setSort] = useState<SortState>({ field: 'name', direction: 'asc' });
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationDTO | null>(null);
  const [formData, setFormData] = useState<CreateOrganizationInput>({
    name: '',
    slug: '',
    logoUrl: '',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: organizations = [], isLoading, isError, error, refetch } = useOrganizations();
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();

  const displayedOrgs = useMemo(() => {
    let result = organizations;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (org) => org.name.toLowerCase().includes(q) || org.slug.toLowerCase().includes(q),
      );
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'slug':
          cmp = a.slug.localeCompare(b.slug);
          break;
        case 'userCount':
          cmp = a.userCount - b.userCount;
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [organizations, search, sort]);

  const handleSortChange = useCallback((newSort: SortState) => {
    setSort(newSort);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingOrg(null);
    setFormData({ name: '', slug: '', logoUrl: '' });
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((org: OrganizationDTO) => {
    setEditingOrg(org);
    setFormData({ name: org.name, slug: org.slug, logoUrl: org.logoUrl || '' });
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditingOrg(null);
  }, []);

  const handleFormChange = useCallback((field: keyof CreateOrganizationInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleLogoUpload = useCallback(
    async (file: File) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        showError('Only JPEG, PNG, WebP, and SVG images are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showError('File size must be less than 5MB');
        return;
      }
      setUploadingLogo(true);
      try {
        const result = await uploadImage(file);
        if (result.success && result.data) {
          setFormData((prev) => ({ ...prev, logoUrl: result.data!.url }));
        } else {
          showError(result.error || 'Failed to upload logo');
        }
      } catch {
        showError('Failed to upload logo');
      } finally {
        setUploadingLogo(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [showError],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingOrg) {
          await updateMutation.mutateAsync({ id: editingOrg.id, ...formData });
          showSuccess('Organization updated successfully');
        } else {
          await createMutation.mutateAsync(formData);
          showSuccess('Organization created successfully');
        }
        handleDialogClose();
        refetch();
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to save organization');
      }
    },
    [
      editingOrg,
      formData,
      updateMutation,
      createMutation,
      showSuccess,
      showError,
      handleDialogClose,
      refetch,
    ],
  );

  return {
    sort,
    search,
    dialogOpen,
    editingOrg,
    formData,
    uploadingLogo,
    fileInputRef,
    displayedOrgs,
    organizations,
    isLoading,
    isError,
    error,
    refetch,
    createMutation,
    updateMutation,
    handleSortChange,
    handleSearchChange,
    handleCreate,
    handleEdit,
    handleDialogClose,
    handleFormChange,
    handleLogoUpload,
    handleSubmit,
  };
}
