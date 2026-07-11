import {
  Tooltip as MuiTooltip,
  styled,
  type TooltipProps as MuiTooltipProps,
  type SxProps,
  type Theme,
} from '@mui/material';
import { type FC, type ReactElement, type ReactNode } from 'react';

export interface TooltipProps extends Omit<MuiTooltipProps, 'title' | 'children'> {
  title: ReactNode;
  children: ReactElement;
  placement?: MuiTooltipProps['placement'];
  arrow?: boolean;
  enterDelay?: number;
  leaveDelay?: number;
  sx?: SxProps<Theme>;
}

const StyledTooltip = styled(({ className, ...props }: MuiTooltipProps) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
))`
  & .MuiTooltip-tooltip {
    background-color: ${({ theme }) =>
      theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[900]};
    font-size: 0.75rem;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 6px;
    max-width: 300px;
  }

  & .MuiTooltip-arrow {
    color: ${({ theme }) =>
      theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[900]};
  }
`;

export const Tooltip: FC<TooltipProps> = ({
  title,
  children,
  placement = 'top',
  arrow = true,
  enterDelay = 300,
  leaveDelay = 0,
  sx,
  ...props
}) => {
  return (
    <StyledTooltip
      title={title}
      placement={placement}
      arrow={arrow}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      sx={sx}
      {...props}
    >
      {children}
    </StyledTooltip>
  );
};

Tooltip.displayName = 'Tooltip';

export default Tooltip;
