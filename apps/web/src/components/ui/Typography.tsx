import {
  Typography as MuiTypography,
  styled,
  type TypographyProps as MuiTypographyProps,
  useTheme,
} from '@mui/material';
import { type ReactNode, type ElementType } from 'react';

export interface TypographyProps extends Omit<MuiTypographyProps, 'variant'> {
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'subtitle1'
    | 'subtitle2'
    | 'body1'
    | 'body2'
    | 'caption'
    | 'overline';
  as?: ElementType;
  children: ReactNode;
  color?:
    | 'primary'
    | 'secondary'
    | 'textPrimary'
    | 'textSecondary'
    | 'error'
    | 'warning'
    | 'success'
    | 'info'
    | 'inherit';
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
  truncate?: boolean;
  align?: 'left' | 'center' | 'right';
}

const weightMap = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

const StyledTypography = styled(MuiTypography, {
  shouldForwardProp: (prop) => prop !== 'weight' && prop !== 'truncate' && prop !== 'textColor',
})<{
  weight?: TypographyProps['weight'];
  truncate?: boolean;
  textColor?: string;
}>(({ weight, truncate, textColor }) => ({
  fontWeight: weight ? weightMap[weight] : undefined,
  ...(truncate && {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  ...(textColor && { color: textColor }),
}));

export const Typography = ({
  variant = 'body1',
  as,
  children,
  color,
  weight,
  truncate = false,
  align,
  ...props
}: TypographyProps) => {
  const theme = useTheme();

  const getColor = () => {
    if (!color) return undefined;
    const palette: Record<string, string> = {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      textPrimary: theme.palette.text.primary,
      textSecondary: theme.palette.text.secondary,
      error: theme.palette.error.main,
      warning: theme.palette.warning.main,
      success: theme.palette.success.main,
      info: theme.palette.info.main,
      inherit: 'inherit',
    };
    return palette[color];
  };

  return (
    <StyledTypography
      variant={variant}
      component={as}
      weight={weight}
      truncate={truncate}
      textColor={getColor()}
      align={align}
      {...props}
    >
      {children}
    </StyledTypography>
  );
};

// Convenience components
export const Heading = ({
  level = 1,
  children,
  ...props
}: Omit<TypographyProps, 'variant'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) => (
  <Typography variant={`h${level}` as TypographyProps['variant']} weight="bold" {...props}>
    {children}
  </Typography>
);

export const Subheading = ({
  level = 1,
  children,
  ...props
}: Omit<TypographyProps, 'variant'> & { level?: 1 | 2 }) => (
  <Typography variant={`subtitle${level}` as TypographyProps['variant']} weight="medium" {...props}>
    {children}
  </Typography>
);

export const Paragraph = ({ children, ...props }: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="body1" {...props}>
    {children}
  </Typography>
);

export const Caption = ({ children, ...props }: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="caption" color="textSecondary" {...props}>
    {children}
  </Typography>
);

export const Label = ({ children, ...props }: Omit<TypographyProps, 'variant'>) => (
  <Typography
    variant="caption"
    weight="semibold"
    sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
    {...props}
  >
    {children}
  </Typography>
);

export default Typography;
