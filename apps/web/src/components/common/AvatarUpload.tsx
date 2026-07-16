/**
 * AvatarUpload — Reusable avatar / logo with optional upload overlay.
 *
 * Modes:
 *  - `editable = false` (default) — display-only avatar, no interaction
 *  - `editable = true` — shows camera overlay on hover, triggers file picker,
 *    calls `onUpload(file)` when a file is selected
 *
 * Size presets:
 *  - `small`  (32px) — tables, lists, user menu
 *  - `medium` (56px) — form dialogs
 *  - `large`  (96px) — profile header, org detail
 *  - custom `size` prop overrides presets
 *
 * Accepts all image types including SVG via `image/*`.
 */

import { type JSX, useRef, useMemo } from 'react';
import {
  Avatar,
  Box,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { Camera } from 'lucide-react';

export type AvatarSize = 'small' | 'medium' | 'large';

type SxProps = Record<string, unknown>;

export interface AvatarUploadProps {
  /** Image URL (or undefined for initials fallback). */
  src?: string | null;
  /** Alt text. */
  alt?: string;
  /** Size preset or explicit pixel size. */
  size?: AvatarSize | number;
  /** When true, shows a camera overlay on hover and triggers file pick on click. */
  editable?: boolean;
  /** Callback fired when a file is selected in editable mode. */
  onUpload?: (file: File) => void;
  /** Loading state (e.g. during upload). */
  loading?: boolean;
  /** Initials fallback (usually derived from first/last name). */
  initials?: string;
  /** Border style override. */
  border?: string;
  /** Additional sx overrides for the Avatar. */
  sx?: SxProps;
}

const sizeMap: Record<AvatarSize, number> = {
  small: 32,
  medium: 56,
  large: 96,
};

const iconSizeMap: Record<AvatarSize, number> = {
  small: 12,
  medium: 16,
  large: 20,
};

export default function AvatarUpload({
  src,
  alt = '',
  size = 'medium',
  editable = false,
  onUpload,
  loading = false,
  initials,
  border,
  sx,
}: AvatarUploadProps): JSX.Element {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const px = typeof size === 'number' ? size : sizeMap[size];
  const iconPx = typeof size === 'number' ? 16 : iconSizeMap[size];

  const handleClick = () => {
    if (editable && !loading && onUpload) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    // Reset so the same file can be re-selected
    if (e.target) e.target.value = '';
  };

  const avatarBorder = border ?? (editable ? `2px dashed ${alpha(theme.palette.primary.main, 0.4)}` : `2px solid ${alpha(theme.palette.primary.main, 0.25)}`);

  const mergedSx: SxProps = useMemo(
    () => ({
      width: px,
      height: px,
      fontSize: Math.round(px * 0.38),
      fontWeight: 700,
      bgcolor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      border: avatarBorder,
      transition: 'border-color 0.2s, box-shadow 0.2s',
      cursor: editable ? 'pointer' : 'default',
      ...sx,
    }),
    [px, theme, avatarBorder, editable, sx],
  );

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        borderRadius: '50%',
        ...(editable && !loading
          ? {
              '&:hover .avatar-overlay': {
                opacity: 1,
              },
            }
          : {}),
      }}
    >
      <Avatar
        src={src ?? undefined}
        alt={alt}
        onClick={handleClick}
        sx={mergedSx}
      >
        {initials || '?'}
      </Avatar>

      {/* Editable overlay — camera icon */}
      {editable && (
        <Box
          className="avatar-overlay"
          onClick={handleClick}
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.common.black, 0.5),
            opacity: 0,
            transition: 'opacity 0.2s',
            cursor: 'pointer',
          }}
        >
          {loading ? (
            <CircularProgress size={iconPx} sx={{ color: '#fff' }} />
          ) : (
            <Camera size={iconPx} color="#fff" />
          )}
        </Box>
      )}

      {/* Hidden file input */}
      {editable && onUpload && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}
    </Box>
  );
}
