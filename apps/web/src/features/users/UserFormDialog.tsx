import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { useState, useEffect, type ReactElement } from 'react';
import { User as UserIcon, Shield, Mail, KeyRound } from 'lucide-react';
import type { UserDTO, UserRole, OrganizationDTO } from '@vestara/types';
import { colors } from '../../theme/tokens';
import { uploadImage } from '../../api/upload';
import AvatarUpload from '../../components/common/AvatarUpload';

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  organizationId?: string;
  avatarUrl?: string;
}

interface UserFormDialogProps {
  open: boolean;
  user?: UserDTO | null;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  loading?: boolean;
  organizations?: OrganizationDTO[];
  currentUserRole?: UserRole;
}

const roles: { value: UserRole; label: string; color: string; bgColor: string }[] = [
  {
    value: 'super_admin' as UserRole,
    label: 'Super Admin',
    color: colors.error,
    bgColor: colors.errorSoft,
  },
  { value: 'admin' as UserRole, label: 'Admin', color: colors.gold, bgColor: colors.goldSoft },
  {
    value: 'moderator' as UserRole,
    label: 'Moderator',
    color: colors.purple,
    bgColor: colors.purpleSoft,
  },
  { value: 'support' as UserRole, label: 'Support', color: colors.teal, bgColor: colors.tealSoft },
];

const textFieldStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: colors.card,
    color: colors.text,
    fontSize: 14,
    '& fieldset': { borderColor: colors.border },
    '&:hover fieldset': { borderColor: colors.gold },
    '&.Mui-focused fieldset': { borderColor: colors.gold, borderWidth: 1.5 },
  },
  '& .MuiInputLabel-root': { color: colors.secondary, fontSize: 13 },
  '& .MuiInputLabel-root.Mui-focused': { color: colors.gold },
  '& .MuiFormHelperText-root': { color: colors.muted, fontSize: 11 },
  '& .Mui-disabled': {
    '& .MuiOutlinedInput-notchedOutline': { borderColor: `${colors.border} !important` },
    '& .MuiOutlinedInput-input': { color: colors.muted },
  },
};

export function UserFormDialog({
  open,
  user,
  onClose,
  onSubmit,
  loading = false,
  organizations = [],
  currentUserRole,
}: UserFormDialogProps): ReactElement {
  const isEdit = !!user;

  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'admin' as UserRole,
    organizationId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (open) {
      if (user) {
        setFormData({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: '',
          role: user.role,
          organizationId: user.organizationId || '',
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'admin' as UserRole,
          organizationId: '',
        });
      }
      setErrors({});
    }
  }, [open, user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!isEdit && (!formData.password || formData.password.length < 8)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const data: UserFormData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      role: formData.role,
      organizationId: formData.organizationId || undefined,
    };
    if (!isEdit && formData.password) {
      data.password = formData.password;
    }
    await onSubmit(data);
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const result = await uploadImage(file);
      const url = result.data?.url;
      if (result.success && url) {
        setFormData((prev) => ({ ...prev, avatarUrl: url }));
      } else {
        console.error('Avatar upload failed:', result.error);
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChange = (field: keyof UserFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const selectedRole = roles.find((r) => r.value === formData.role);
  const initials =
    [formData.firstName, formData.lastName]
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 1,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: isEdit ? colors.goldSoft : colors.cardAlt,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isEdit ? (
            <UserIcon size={22} color={colors.gold} />
          ) : (
            <UserIcon size={22} color={colors.secondary} />
          )}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 16 }}>
            {isEdit ? 'Edit User' : 'Create New User'}
          </Typography>
          <Typography sx={{ color: colors.secondary, fontSize: 12 }}>
            {isEdit ? 'Update user information and role' : 'Fill in the details to add a new user'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Avatar Preview (Edit mode) */}
          {isEdit && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <AvatarUpload
                src={user?.avatarUrl || formData.avatarUrl}
                size="medium"
                editable
                loading={uploadingAvatar}
                initials={initials}
                onUpload={handleAvatarUpload}
              />
              <Box>
                <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>
                  {formData.firstName} {formData.lastName}
                </Typography>
                <Typography sx={{ color: colors.secondary, fontSize: 12 }}>
                  {formData.email}
                </Typography>
                {selectedRole && (
                  <Chip
                    label={selectedRole.label}
                    size="small"
                    sx={{
                      mt: 0.5,
                      height: 20,
                      fontSize: 10,
                      fontWeight: 600,
                      bgcolor: selectedRole.bgColor,
                      color: selectedRole.color,
                      border: `1px solid ${selectedRole.color}30`,
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Name Fields */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName}
              fullWidth
              size="small"
              required
              sx={textFieldStyles}
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName}
              fullWidth
              size="small"
              required
              sx={textFieldStyles}
            />
          </Box>

          {/* Email */}
          <TextField
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
            size="small"
            required
            disabled={isEdit}
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} color={colors.muted} />
                </Box>
              ),
            }}
            sx={textFieldStyles}
          />

          {/* Password (Create mode only) */}
          {!isEdit && (
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              error={!!errors.password}
              helperText={
                errors.password || 'At least 8 characters with uppercase, lowercase, and number'
              }
              fullWidth
              size="small"
              required
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <KeyRound size={16} color={colors.muted} />
                  </Box>
                ),
              }}
              sx={textFieldStyles}
            />
          )}

          {/* Role Selector */}
          <Box>
            <Typography
              sx={{
                fontWeight: 500,
                color: colors.text,
                fontSize: 13,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Shield size={14} color={colors.gold} />
              Role
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {roles.map((role) => {
                const isSelected = formData.role === role.value;
                return (
                  <Box
                    key={role.value}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, role: role.value }));
                      if (errors.role) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.role;
                          return next;
                        });
                      }
                    }}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: isSelected ? role.bgColor : 'transparent',
                      border: `1.5px solid ${isSelected ? role.color : colors.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: role.color,
                        bgcolor: `${role.color}10`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: isSelected ? role.color : colors.muted,
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? role.color : colors.text,
                        }}
                      >
                        {role.label}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Organization (Super Admin only) */}
          {currentUserRole === 'super_admin' && organizations && organizations.length > 0 && (
            <TextField
              label="Organization"
              select
              value={formData.organizationId}
              onChange={handleChange('organizationId')}
              fullWidth
              size="small"
              sx={textFieldStyles}
            >
              <MenuItem value="">
                <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                  Select organization
                </Typography>
              </MenuItem>
              {organizations.map((org) => (
                <MenuItem key={org.id} value={org.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: 13 }}>{org.name}</Typography>
                    <Typography sx={{ color: colors.muted, fontSize: 11 }}>({org.slug})</Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${colors.border}`,
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            color: colors.secondary,
            fontWeight: 500,
            px: 3,
            '&:hover': { bgcolor: colors.cardAlt },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            bgcolor: colors.gold,
            color: '#0A0F18',
            fontWeight: 700,
            px: 4,
            '&:hover': { bgcolor: colors.goldHover },
            '&.Mui-disabled': { bgcolor: colors.gold, opacity: 0.6, color: '#0A0F18' },
          }}
        >
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UserFormDialog;
