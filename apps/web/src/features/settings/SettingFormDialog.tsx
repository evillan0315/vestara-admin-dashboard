import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  styled,
} from '@mui/material';
import { useState, useEffect, type ReactElement } from 'react';

interface SettingFormDialogProps {
  open: boolean;
  editKey?: string | null;
  editValue?: string;
  onClose: () => void;
  onSubmit: (key: string, value: string) => Promise<void>;
  loading?: boolean;
}

const StyledDialog = styled(Dialog)(({ theme: _theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 12,
    maxWidth: 520,
    width: '100%',
  },
}));

export function SettingFormDialog({
  open,
  editKey,
  editValue,
  onClose,
  onSubmit,
  loading = false,
}: SettingFormDialogProps): ReactElement {
  const isEdit = !!editKey;

  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setKey(editKey ?? '');
      setValue(editValue ?? '');
      setErrors({});
    }
  }, [open, editKey, editValue]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!key.trim()) newErrors.key = 'Key is required';
    if (!value.trim()) newErrors.value = 'Value is required';
    else {
      try {
        JSON.parse(value);
      } catch {
        newErrors.value = 'Value must be valid JSON';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(key.trim(), value.trim());
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
        {isEdit ? `Edit Setting: ${editKey}` : 'Add Setting'}
      </DialogTitle>

      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}
      >
        <TextField
          label="Key"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            if (errors.key)
              setErrors((prev) => {
                const n = { ...prev };
                delete n.key;
                return n;
              });
          }}
          error={!!errors.key}
          helperText={errors.key}
          fullWidth
          size="small"
          required
          disabled={isEdit}
          placeholder="e.g. app.name, theme.primaryColor"
        />

        <TextField
          label="Value (JSON)"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (errors.value)
              setErrors((prev) => {
                const n = { ...prev };
                delete n.value;
                return n;
              });
          }}
          error={!!errors.value}
          helperText={
            errors.value || 'Enter a valid JSON value (e.g. {"key": "value"} or "string")'
          }
          fullWidth
          size="small"
          required
          multiline
          minRows={4}
          maxRows={12}
          placeholder='{"key": "value"}'
        />
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Setting'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}

export default SettingFormDialog;
