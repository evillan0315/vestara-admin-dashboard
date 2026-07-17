import {
  Tabs as MuiTabs,
  Tab as MuiTab,
  Box,
  styled,
  type SxProps,
  type Theme,
} from '@mui/material';
import { type FC, type ReactNode, useState } from 'react';

export interface TabItem {
  label: string;
  value: string | number;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  centered?: boolean;
  sx?: SxProps<Theme>;
}

const StyledTabs = styled(MuiTabs)`
  & .MuiTabs-indicator {
    height: 3px;
    border-radius: 3px 3px 0 0;
  }

  & .MuiTab-root {
    text-transform: none;
    font-weight: 600;
    font-size: 0.875rem;
    min-height: 48px;
  }
`;

export const Tabs: FC<TabsProps> = ({
  items,
  value: controlledValue,
  defaultValue,
  onChange,
  variant = 'standard',
  centered,
  sx,
}) => {
  const [internalValue, setInternalValue] = useState<string | number>(
    defaultValue ?? items[0]?.value ?? 0,
  );

  const currentValue = controlledValue ?? internalValue;

  const handleChange = (_event: React.SyntheticEvent, newValue: string | number) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <StyledTabs
      value={currentValue}
      onChange={handleChange}
      variant={variant}
      centered={centered}
      sx={sx}
    >
      {items.map((item) => (
        <MuiTab
          key={item.value}
          label={item.label}
          value={item.value}
          icon={item.icon as React.ReactElement | undefined}
          iconPosition="start"
          disabled={item.disabled}
        />
      ))}
    </StyledTabs>
  );
};

Tabs.displayName = 'Tabs';

export interface TabPanelProps {
  value: string | number;
  currentValue: string | number;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export const TabPanel: FC<TabPanelProps> = ({ value, currentValue, children, sx }) => {
  if (value !== currentValue) return null;

  return (
    <Box role="tabpanel" sx={{ py: 3, ...sx }}>
      {children}
    </Box>
  );
};

TabPanel.displayName = 'TabPanel';

export default Tabs;
