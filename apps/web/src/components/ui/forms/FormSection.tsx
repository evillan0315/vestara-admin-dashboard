import { Box, Typography, Divider, Collapse, IconButton, styled, type SxProps, type Theme } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useState, type ReactNode } from 'react';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  required?: boolean;
  error?: boolean;
}

const SectionContainer = styled(Box)(() => ({
  mb: 4,
  '&:last-child': { mb: 0 },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 1.5,
  cursor: 'pointer',
  '&:hover .MuiTypography-root': {
    color: theme.palette.primary.main,
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  color: theme.palette.text.primary,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
}));

const SectionDescription = styled(Typography)(({ theme }) => ({
  fontSize: '0.8125rem',
  color: theme.palette.text.secondary,
  mt: 0.5,
  mb: 1.5,
}));

const SectionContent = styled(Box)(({ theme }) => ({
  borderLeft: `3px solid ${theme.palette.divider}`,
  pl: 3,
  ml: 0.5,
  '&[data-collapsed="true"]': {
    display: 'none',
  },
}));

export function FormSection({
  title,
  description,
  children,
  sx,
  collapsible = false,
  defaultExpanded = true,
  required,
  error,
}: FormSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => setExpanded((prev) => !prev);

  return (
    <SectionContainer sx={sx} data-collapsed={!expanded && collapsible}>
      {(collapsible || required || error) && (
        <SectionHeader onClick={collapsible ? handleToggle : undefined}>
          <SectionTitle color={error ? 'error' : 'inherit'}>
            {title}
            {required && (
              <span style={{ color: 'var(--mui-palette-error-main)' }}>*</span>
            )}
            {collapsible && (
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleToggle(); }} aria-label="Toggle section">
                <ExpandMore sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </IconButton>
            )}
          </SectionTitle>
        </SectionHeader>
      )}
      {!collapsible && <SectionTitle color={error ? 'error' : 'inherit'}>{
        title
      }{required && <span style={{ color: 'var(--mui-palette-error-main)' }}>*</span>}
      </SectionTitle>}
      {description && <SectionDescription>{description}</SectionDescription>}
      <Collapse in={!collapsible || expanded}>
        <SectionContent data-collapsed={!expanded && collapsible}>{children}</SectionContent>
      </Collapse>
      {collapsible && <Divider sx={{ mt: 2, mb: 1 }} />}
    </SectionContainer>
  );
}

export default FormSection;