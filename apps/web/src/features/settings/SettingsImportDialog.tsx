import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  styled,
  Alert,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useState, useCallback, useRef, type ReactElement } from 'react';
import { useImportSettings } from './hooks';
import { useToast } from '../../components/feedback/Toast';

interface SettingsImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const DropZone = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: 12,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  '&.dragover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

interface ImportResult {
  imported: number;
  created: number;
  updated: number;
  details: { key: string; action: 'created' | 'updated' }[];
}

export function SettingsImportDialog({ open, onClose }: SettingsImportDialogProps): ReactElement {
  const { showSuccess, showError } = useToast();
  const importMutation = useImportSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedSettings, setParsedSettings] = useState<Record<string, unknown> | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    setParseError('');
    setParsedSettings(null);
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Support both raw settings object and export format
        let settings: Record<string, unknown>;
        if (data.settings && Array.isArray(data.settings)) {
          // Export format: { settings: [{ key, value, ... }] }
          settings = data.settings.reduce(
            (acc: Record<string, unknown>, s: { key: string; value: unknown }) => {
              acc[s.key] = s.value;
              return acc;
            },
            {},
          );
        } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
          // Raw format: { key: value, ... }
          settings = data;
        } else {
          setParseError('Invalid format. Expected a JSON object with key-value pairs.');
          return;
        }

        // Validate all values are objects
        for (const [key, value] of Object.entries(settings)) {
          if (typeof value !== 'object' || value === null) {
            setParseError(`Setting "${key}" must be a JSON object, got ${typeof value}.`);
            return;
          }
        }

        setParsedSettings(settings);
      } catch {
        setParseError('Invalid JSON file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/json') {
        handleFile(file);
      } else {
        setParseError('Please upload a JSON file.');
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleImport = useCallback(async () => {
    if (!parsedSettings) return;

    try {
      const response = await importMutation.mutateAsync(parsedSettings);
      const data = response.data?.result;
      if (!data) {
        showError('Invalid import response');
        return;
      }
      setResult(data);
      showSuccess(
        `Imported ${data.imported} settings (${data.created} created, ${data.updated} updated)`,
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Import failed');
    }
  }, [parsedSettings, importMutation, showSuccess, showError]);

  const handleClose = useCallback(() => {
    setParsedSettings(null);
    setFileName('');
    setParseError('');
    setResult(null);
    onClose();
  }, [onClose]);

  const settingCount = parsedSettings ? Object.keys(parsedSettings).length : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.125rem' }}>Import Settings</DialogTitle>

      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}
      >
        {result ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="success" icon={<SuccessIcon />}>
              Successfully imported {result.imported} settings
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Created: {result.created} | Updated: {result.updated}
            </Typography>
            {result.details.length > 0 && (
              <Box
                sx={{
                  maxHeight: 200,
                  overflow: 'auto',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                }}
              >
                {result.details.map((d) => (
                  <Typography
                    key={d.key}
                    variant="caption"
                    display="block"
                    sx={{ fontFamily: 'monospace' }}
                  >
                    {d.action === 'created' ? '+' : '~'} {d.key}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              Upload a JSON file containing settings to import. The file should be a JSON object
              with key-value pairs, or an export file from this system.
            </Typography>

            <DropZone
              className={isDragOver ? 'dragover' : ''}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" fontWeight={600}>
                {fileName || 'Drop JSON file here or click to browse'}
              </Typography>
              {parsedSettings && (
                <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                  Ready to import {settingCount} settings
                </Typography>
              )}
            </DropZone>

            {parseError && (
              <Alert severity="error" icon={<ErrorIcon />}>
                {parseError}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={handleClose} color="inherit" disabled={importMutation.isPending}>
          {result ? 'Close' : 'Cancel'}
        </Button>
        {!result && (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!parsedSettings || importMutation.isPending}
          >
            {importMutation.isPending ? 'Importing...' : `Import ${settingCount} Settings`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default SettingsImportDialog;
