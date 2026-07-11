import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  styled,
} from '@mui/material';
import { useState, useEffect, type ReactElement } from 'react';
import type { UserDTO, UserRole } from '@vestara/types';

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
}

interface UserFormDialogProps {
  open: boolean;
  user?: UserDTO | null;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  loading?: boolean;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 12,
    maxWidth: 480,
    width: '100%',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.125rem',
  padding: theme.spacing(2.5, 3, 1.5),
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(1.5, 3, 2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(1.5, 3, 2.5),
  gap: theme.spacing(1),
}));

const roles: { value: UserRole; label: string }[] = [
  { value: 'super_admin' as UserRole, label: 'Super Admin' },
  { value: 'admin' as UserRole, label: 'Admin' },
  { value: 'moderator' as UserRole, label: 'Moderator' },
  { value: 'support' as UserRole, label: 'Support' },
];

export function UserFormDialog({
  open,
  user,
  onClose,
  onSubmit,
  loading = false,
}: UserFormDialogProps): ReactElement {
  const isEdit = !!user;

  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'admin' as UserRole,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (user) {
        setFormData({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: '',
          role: user.role,
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'admin' as UserRole,
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
    };
    if (!isEdit && formData.password) {
      data.password = formData.password;
    }
    await onSubmit(data);
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

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        {isEdit ? 'Edit User' : 'Add User'}
      </StyledDialogTitle>

      <StyledDialogContent>
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
          />
        </Box>

        <TextField
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          error={!!errors.email}
          helperText={errors.email}
          fullWidth
          size="small"
          required
          disabled={isEdit}
        />

        {!isEdit && (
          <TextField
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            error={!!errors.password}
            helperText={errors.password || 'At least 8 characters with uppercase, lowercase, and number'}
            fullWidth
            size="small"
            required
          />
        )}

        <TextField
          label="Role"
          select
          value={formData.role}
          onChange={handleChange('role')}
          fullWidth
          size="small"
        >
          {roles.map((r) => (
            <MenuItem key={r.value} value={r.value}>
              {r.label}
            </MenuItem>
          ))}
        </TextField>
      </StyledDialogContent>

      <StyledDialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
}

export default UserFormDialog;
