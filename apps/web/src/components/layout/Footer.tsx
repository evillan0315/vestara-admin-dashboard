import { Box, Typography, Link, styled } from '@mui/material';
import { type ReactNode, type ReactElement } from 'react';

export interface FooterProps {
  children?: ReactNode;
  copyright?: string;
  links?: Array<{ label: string; href: string }>;
  variant?: 'simple' | 'full';
}

const StyledFooter = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(3, 4),
  marginTop: 'auto',
}));

const FooterContent = styled(Box)(({ theme }) => ({
  maxWidth: 1440,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  alignItems: 'center',
  textAlign: 'center',
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    textAlign: 'left',
  },
}));

const Copyright = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
}));

const LinksContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    justifyContent: 'flex-end',
  },
}));

const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'color 0.2s ease',
  '&:hover': {
    color: theme.palette.primary.main,
    textDecoration: 'underline',
  },
}));

export const Footer = ({
  children,
  copyright = `© ${new Date().getFullYear()} Vestara. All rights reserved.`,
  links = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Contact', href: '/contact' },
  ],
  variant = 'full',
}: FooterProps): ReactElement => {
  if (variant === 'simple') {
    return (
      <StyledFooter>
        <FooterContent>
          <Copyright variant="body2">{copyright}</Copyright>
        </FooterContent>
      </StyledFooter>
    );
  }

  return (
    <StyledFooter>
      <FooterContent>
        <Copyright variant="body2">{copyright}</Copyright>
        <LinksContainer>
          {links.map((link, index) => (
            <FooterLink key={index} href={link.href} underline="hover">
              {link.label}
            </FooterLink>
          ))}
        </LinksContainer>
        {children}
      </FooterContent>
    </StyledFooter>
  );
};

export default Footer;
