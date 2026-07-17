import { useState, useRef } from 'react';
import {
  Box,
  Grid,
  Chip,
  IconButton,
  LinearProgress,
  TextField,
  MenuItem,
  Link,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Upload,
  Trash2,
  FileText,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  Camera,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/feedback/Toast';
import { useSubmitKyc, useUploadKycDocument, useDeleteKycDocument } from '../hooks';
import type { ProfileResponse } from '../../../api/profile';
import type { KycDocumentType } from '@vestara/types';
import { ProfileSectionCard, useGold } from './ProfileSectionCard';

interface IdentityTabProps {
  profile: ProfileResponse['profile'];
}

const DOCUMENT_TYPES: { value: KycDocumentType; label: string }[] = [
  { value: 'passport', label: 'Passport' },
  { value: 'driver_license', label: "Driver's License" },
  { value: 'proof_of_address', label: 'Proof of Address' },
  { value: 'selfie', label: 'Selfie / Photo ID' },
  { value: 'other', label: 'Other' },
];

const STATUS_META: Record<
  string,
  { label: string; color: 'default' | 'warning' | 'success' | 'error'; icon: typeof CheckCircle }
> = {
  unverified: { label: 'Unverified', color: 'default', icon: AlertCircle },
  pending: { label: 'Pending Review', color: 'warning', icon: Clock },
  verified: { label: 'Verified', color: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'error', icon: AlertCircle },
};

/**
 * "Identity & KYC" tab — KYC preparation: document uploads, account
 * verification status, and submission for review.
 */
export function IdentityTab({ profile }: IdentityTabProps) {
  const theme = useTheme();
  const { showSuccess, showError } = useToast();
  const { gold, goldSoft, goldBorder } = useGold();

  const submitKyc = useSubmitKyc();
  const uploadDoc = useUploadKycDocument();
  const deleteDoc = useDeleteKycDocument();

  const [docType, setDocType] = useState<KycDocumentType>('passport');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = STATUS_META[profile.kycStatus] ?? STATUS_META.unverified;
  const StatusIcon = status.icon;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      await uploadDoc.mutateAsync({ file, documentType: docType });
      showSuccess('Document uploaded');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    try {
      await submitKyc.mutateAsync(undefined);
      showSuccess('KYC submitted for review');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Submission failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc.mutateAsync(id);
      showSuccess('Document removed');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove document');
    }
  };

  return (
    <>
      {/* Account Verification Status */}
      <ProfileSectionCard
        title="Account Verification Status"
        description="Complete identity verification to unlock full platform capabilities."
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            borderRadius: 2,
            bgcolor:
              status.color === 'success'
                ? alpha(theme.palette.success.main, 0.1)
                : status.color === 'warning'
                  ? alpha(theme.palette.warning.main, 0.1)
                  : alpha(theme.palette.text.disabled, 0.08),
            border: `1px solid ${status.color === 'success' ? alpha(theme.palette.success.main, 0.3) : status.color === 'warning' ? alpha(theme.palette.warning.main, 0.3) : theme.palette.divider}`,
          }}
        >
          <StatusIcon
            size={28}
            color={
              status.color === 'success'
                ? theme.palette.success.main
                : status.color === 'warning'
                  ? theme.palette.warning.main
                  : theme.palette.text.disabled
            }
          />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 15 }}>
                {status.label}
              </Box>
              <Chip
                size="small"
                label={profile.kycStatus}
                sx={{ height: 20, fontSize: 10, textTransform: 'capitalize' }}
              />
            </Box>
            {profile.kycSubmittedAt && (
              <Box component="span" sx={{ color: 'text.secondary', fontSize: 12 }}>
                Submitted {new Date(profile.kycSubmittedAt).toLocaleDateString()}
              </Box>
            )}
            {profile.kycStatus === 'rejected' && profile.kycRejectionReason && (
              <Box component="p" sx={{ color: 'error.main', fontSize: 12, m: 0, mt: 0.5 }}>
                Reason: {profile.kycRejectionReason}
              </Box>
            )}
          </Box>
          {profile.kycStatus !== 'pending' && profile.kycStatus !== 'verified' && (
            <Button
              variant="contained"
              onClick={handleSubmit}
              loading={submitKyc.isPending}
              disabled={profile.documents.length === 0}
              startIcon={<ShieldCheck size={16} />}
            >
              Submit for Verification
            </Button>
          )}
        </Box>
        {profile.documents.length === 0 && (
          <Box component="p" sx={{ color: 'text.secondary', fontSize: 12, mt: 1.5 }}>
            Upload at least one identity document below to begin verification.
          </Box>
        )}
      </ProfileSectionCard>

      {/* Document Uploads */}
      <ProfileSectionCard
        title="KYC Document Uploads"
        description="Upload identity documents required for verification. Accepted: JPEG, PNG, WebP, SVG, PDF."
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
          style={{ display: 'none' }}
          onChange={handleFile}
        />

        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Document Type"
              value={docType}
              onChange={(e) => setDocType(e.target.value as KycDocumentType)}
              fullWidth
              size="small"
            >
              {DOCUMENT_TYPES.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={uploading ? <Camera size={16} /> : <Upload size={16} />}
              onClick={() => fileInputRef.current?.click()}
              loading={uploading || uploadDoc.isPending}
              sx={{ height: 40 }}
            >
              Upload Document
            </Button>
          </Grid>
        </Grid>

        {uploading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
        {uploadError && (
          <Chip
            icon={<AlertCircle size={14} />}
            label={uploadError}
            color="error"
            variant="outlined"
            sx={{ mb: 2 }}
          />
        )}

        {/* Document list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {profile.documents.length === 0 && (
            <Box
              sx={{
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                color: 'text.secondary',
                fontSize: 13,
              }}
            >
              No documents uploaded yet.
            </Box>
          )}
          {profile.documents.map((doc) => {
            const docStatus = STATUS_META[doc.status] ?? STATUS_META.unverified;
            const DocIcon = docStatus.icon;
            return (
              <Box
                key={doc.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': { borderColor: goldBorder },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: goldSoft,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={20} color={gold} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {doc.fileName}
                    </Box>
                    <Chip
                      size="small"
                      label={doc.documentType.replace(/_/g, ' ')}
                      sx={{
                        height: 20,
                        fontSize: 10,
                        textTransform: 'capitalize',
                        bgcolor: goldSoft,
                        color: gold,
                        border: `1px solid ${goldBorder}`,
                      }}
                    />
                  </Box>
                  <Box component="span" sx={{ color: 'text.secondary', fontSize: 11 }}>
                    {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : ''} • Uploaded{' '}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </Box>
                </Box>
                <Chip
                  size="small"
                  icon={<DocIcon size={12} />}
                  label={docStatus.label}
                  color={docStatus.color}
                  sx={{ height: 22, fontSize: 11 }}
                />
                {doc.fileUrl && (
                  <Link
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    sx={{ fontSize: 13, fontWeight: 600 }}
                  >
                    View
                  </Link>
                )}
                <IconButton
                  size="small"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleteDoc.isPending}
                  sx={{
                    color: 'error.main',
                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12) },
                  }}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      </ProfileSectionCard>
    </>
  );
}
