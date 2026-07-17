import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useToast } from '../../components/feedback/Toast';
import { useCreateDataSource, useUpdateDataSource } from './hooks';
import type { DataSourceAuthType, DataSourceDTO } from '@vestara/types';

interface DataSourceFormDialogProps {
  open: boolean;
  onClose: () => void;
  dataSource?: DataSourceDTO | null;
}

interface FormState {
  name: string;
  description: string;
  method: 'GET' | 'POST';
  baseUrl: string;
  path: string;
  headersText: string;
  bodyText: string;
  authType: DataSourceAuthType;
  authToken: string;
  authUsername: string;
  authPassword: string;
  authKey: string;
  authValue: string;
  authAddTo: 'header' | 'query';
  refreshInterval: string;
}

const emptyState: FormState = {
  name: '',
  description: '',
  method: 'GET',
  baseUrl: '',
  path: '',
  headersText: '',
  bodyText: '',
  authType: 'none',
  authToken: '',
  authUsername: '',
  authPassword: '',
  authKey: '',
  authValue: '',
  authAddTo: 'header',
  refreshInterval: '',
};

function fromDataSource(ds?: DataSourceDTO | null): FormState {
  if (!ds) return emptyState;
  return {
    ...emptyState,
    name: ds.name,
    description: ds.description ?? '',
    method: ds.method,
    baseUrl: ds.baseUrl,
    path: ds.path,
    headersText: Object.keys(ds.headers ?? {}).length ? JSON.stringify(ds.headers, null, 2) : '',
    refreshInterval: ds.refreshInterval != null ? String(ds.refreshInterval) : '',
  };
}

function parseJsonObject(text: string): Record<string, unknown> | undefined {
  if (!text.trim()) return undefined;
  return JSON.parse(text) as Record<string, unknown>;
}

export default function DataSourceFormDialog({
  open,
  onClose,
  dataSource,
}: DataSourceFormDialogProps) {
  const { showSuccess } = useToast();
  const createMut = useCreateDataSource();
  const updateMut = useUpdateDataSource();
  const [form, setForm] = useState<FormState>(emptyState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(fromDataSource(dataSource));
      setError(null);
    }
  }, [open, dataSource]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim() || !form.baseUrl.trim()) {
      setError('Name and Base URL are required.');
      return;
    }

    let headers: Record<string, string> | undefined;
    let body: Record<string, unknown> | undefined;
    try {
      headers = parseJsonObject(form.headersText) as Record<string, string> | undefined;
      body = parseJsonObject(form.bodyText) as Record<string, unknown> | undefined;
    } catch {
      setError('Headers / Body must be valid JSON.');
      return;
    }

    const authConfig: Record<string, unknown> | undefined =
      form.authType === 'bearer'
        ? { token: form.authToken }
        : form.authType === 'basic'
          ? { username: form.authUsername, password: form.authPassword }
          : form.authType === 'apiKey'
            ? { key: form.authKey, value: form.authValue, addTo: form.authAddTo }
            : undefined;

    const refreshInterval = form.refreshInterval.trim() ? Number(form.refreshInterval) : undefined;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      method: form.method,
      baseUrl: form.baseUrl.trim(),
      path: form.path.trim() || undefined,
      headers,
      body,
      authType: form.authType,
      authConfig,
      refreshInterval,
    };

    try {
      if (dataSource) {
        await updateMut.mutateAsync({ id: dataSource.id, data: payload });
        showSuccess('Data source updated');
      } else {
        await createMut.mutateAsync(payload);
        showSuccess('Data source created');
      }
      onClose();
    } catch {
      setError('Failed to save data source. Check the values and try again.');
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{dataSource ? 'Edit Data Source' : 'New Data Source'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Method</InputLabel>
              <Select
                label="Method"
                value={form.method}
                onChange={(e) => set('method', e.target.value as 'GET' | 'POST')}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Base URL"
              value={form.baseUrl}
              onChange={(e) => set('baseUrl', e.target.value)}
              fullWidth
              required
              placeholder="https://api.example.com"
            />
          </Stack>
          <TextField
            label="Path"
            value={form.path}
            onChange={(e) => set('path', e.target.value)}
            fullWidth
            placeholder="/v1/users"
          />
          <TextField
            label="Headers (JSON)"
            value={form.headersText}
            onChange={(e) => set('headersText', e.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder={'{\n  "Accept": "application/json"\n}'}
          />
          {form.method === 'POST' && (
            <TextField
              label="Body (JSON)"
              value={form.bodyText}
              onChange={(e) => set('bodyText', e.target.value)}
              fullWidth
              multiline
              minRows={2}
              placeholder={'{\n  "query": "..."\n}'}
            />
          )}

          <Divider />
          <Typography variant="subtitle2">Authentication</Typography>
          <FormControl>
            <InputLabel>Auth Type</InputLabel>
            <Select
              label="Auth Type"
              value={form.authType}
              onChange={(e) => set('authType', e.target.value as DataSourceAuthType)}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="bearer">Bearer Token</MenuItem>
              <MenuItem value="basic">Basic Auth</MenuItem>
              <MenuItem value="apiKey">API Key</MenuItem>
            </Select>
          </FormControl>

          {form.authType === 'bearer' && (
            <TextField
              label="Token"
              type="password"
              value={form.authToken}
              onChange={(e) => set('authToken', e.target.value)}
              fullWidth
            />
          )}
          {form.authType === 'basic' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Username"
                value={form.authUsername}
                onChange={(e) => set('authUsername', e.target.value)}
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={form.authPassword}
                onChange={(e) => set('authPassword', e.target.value)}
                fullWidth
              />
            </Stack>
          )}
          {form.authType === 'apiKey' && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Key"
                  value={form.authKey}
                  onChange={(e) => set('authKey', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Value"
                  type="password"
                  value={form.authValue}
                  onChange={(e) => set('authValue', e.target.value)}
                  fullWidth
                />
              </Stack>
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel>Add To</InputLabel>
                <Select
                  label="Add To"
                  value={form.authAddTo}
                  onChange={(e) => set('authAddTo', e.target.value as 'header' | 'query')}
                >
                  <MenuItem value="header">Header</MenuItem>
                  <MenuItem value="query">Query Param</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}

          <Divider />
          <TextField
            label="Refresh Interval (seconds, optional)"
            type="number"
            value={form.refreshInterval}
            onChange={(e) => set('refreshInterval', e.target.value)}
            fullWidth
          />

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
