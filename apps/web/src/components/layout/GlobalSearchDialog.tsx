import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Paper,
  Box,
  Typography,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Search,
  Keyboard,
  ArrowRight,
  Dashboard,
  Analytics,
  People,
  Settings,
  History,
  Description,
  Person,
  Shield,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../theme/tokens';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  category: 'navigation' | 'dashboard' | 'analytics' | 'users' | 'settings' | 'audit';
}

interface GlobalSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const SEARCH_RESULTS: SearchResult[] = [
  { id: 'dashboard', title: 'Dashboard', description: 'Overview & KPIs', path: '/', icon: <Dashboard fontSize="large" />, category: 'navigation' },
  { id: 'analytics', title: 'Analytics', description: 'Charts & reports', path: '/analytics', icon: <Analytics fontSize="large" />, category: 'analytics' },
  { id: 'users', title: 'Users & Roles', description: 'Manage users and permissions', path: '/users', icon: <People fontSize="large" />, category: 'users' },
  { id: 'settings', title: 'Settings', description: 'Application configuration', path: '/settings', icon: <Settings fontSize="large" />, category: 'settings' },
  { id: 'organizations', title: 'Organizations', description: 'Manage organizations', path: '/organizations', icon: <Settings fontSize="large" />, category: 'settings' },
  { id: 'system-logs', title: 'System Logs', description: 'Audit trail & activity', path: '/system-logs', icon: <History fontSize="large" />, category: 'audit' },
  { id: 'profile', title: 'Profile', description: 'Your account settings', path: '/profile', icon: <Person fontSize="large" />, category: 'users' },
  { id: 'security', title: 'Security', description: 'Password & 2FA settings', path: '/security', icon: <Shield fontSize="large" />, category: 'settings' },
  { id: 'docs', title: 'Documentation', description: 'API docs & guides', path: '/docs', icon: <Description fontSize="large" />, category: 'settings' },
];

export function GlobalSearchDialog({ open, onClose, onSearch, inputRef }: GlobalSearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const localInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Use provided ref or local ref
  const effectiveInputRef = inputRef ?? localInputRef;

  const filteredResults = query
    ? SEARCH_RESULTS.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCH_RESULTS;

  const selectedResult = filteredResults[selectedIndex];

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedResult) {
            navigate(selectedResult.path);
            onClose();
            onSearch?.(query);
          }
          break;
        default:
          break;
      }
    },
    [onClose, navigate, onSearch, query, filteredResults.length, selectedResult]
  );

  // Focus input when dialog opens
  useEffect(() => {
    if (open && effectiveInputRef.current) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => effectiveInputRef.current?.focus(), 50);
    }
  }, [open, effectiveInputRef]);

  if (!open) return null;

  const groupedResults = useMemo(() => groupByCategory(filteredResults), [filteredResults]);

  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1300,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Search Dialog */}
      <Paper
        elevation={24}
        sx={{
          position: 'fixed',
          top: '15vh',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1400,
          width: { xs: '95%', sm: 640 },
          maxHeight: '70vh',
          bgcolor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Search sx={{ color: colors.muted, fontSize: 22 }} />
          <InputBase
            ref={effectiveInputRef}
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, pages, users... (⌘K)"
            sx={{
              flex: 1,
              fontSize: 16,
              color: colors.text,
              '& input::placeholder': { color: colors.muted },
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.muted, fontSize: 11, fontWeight: 600 }}>
            <Keyboard fontSize="small" /> K
          </Box>
        </Box>

        {filteredResults.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No results found for "{query}"</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try a different search term
            </Typography>
          </Box>
        ) : (
          <List
            ref={listRef}
            sx={{ maxHeight: '55vh', overflow: 'auto', px: 1, py: 1 }}
            disablePadding
          >
            {groupedResults.map(({ category, items }) => (
              <Box key={category}>
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    py: 1.5,
                    color: colors.gold,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: 11,
                  }}
                >
                  {getCategoryLabel(category)}
                </Typography>
                {items.map((result) => {
                  const globalIndex = filteredResults.indexOf(result);
                  const isSelected = globalIndex === selectedIndex;
                  return (
                    <ListItemButton
                      key={result.id}
                      selected={isSelected}
                      onClick={() => {
                        navigate(result.path);
                        onClose();
                        onSearch?.(query);
                      }}
                      sx={{
                        borderRadius: 10,
                        mx: 1,
                        my: 0.25,
                        px: 1.5,
                        py: 1,
                        bgcolor: isSelected ? 'rgba(216,164,65,0.12)' : 'transparent',
                        border: isSelected ? `1px solid ${colors.gold}` : 'none',
                        '&:hover': {
                          bgcolor: isSelected ? 'rgba(216,164,65,0.2)' : 'rgba(255,255,255,0.03)',
                        },
                        '&.Mui-selected': {
                          bgcolor: 'rgba(216,164,65,0.12)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: isSelected ? colors.gold : colors.secondary }}>
                        {result.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={isSelected ? colors.gold : colors.text}
                            sx={{ fontSize: 14 }}
                          >
                            {result.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color={colors.secondary} sx={{ fontSize: 12 }}>
                            {result.description}
                          </Typography>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowRight fontSize="small" color="action" />
                      </Box>
                    </ListItemButton>
                  );
                })}
                <Divider sx={{ my: 1, borderColor: colors.border }} />
              </Box>
            ))}
            <Box sx={{ px: 2, py: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color={colors.muted}>
                Press {'⌘K'} to close • {'↑↓'} to navigate • {'Enter'} to select
              </Typography>
            </Box>
          </List>
        )}
      </Paper>
    </>
  );
}

function groupByCategory(results: SearchResult[]): { category: SearchResult['category']; items: SearchResult[] }[] {
  const groups = new Map<SearchResult['category'], SearchResult[]>();

  for (const result of results) {
    if (!groups.has(result.category)) {
      groups.set(result.category, []);
    }
    groups.get(result.category)!.push(result);
  }

  // Sort categories in a logical order
  const categoryOrder: SearchResult['category'][] = ['navigation', 'dashboard', 'analytics', 'users', 'settings', 'audit'];

  return categoryOrder
    .filter((cat) => groups.has(cat))
    .map((category) => ({ category, items: groups.get(category)! }));
}

function getCategoryLabel(category: SearchResult['category']): string {
  const labels: Record<SearchResult['category'], string> = {
    navigation: 'Navigation',
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    users: 'User Management',
    settings: 'Settings',
    audit: 'Audit & Logs',
  };
  return labels[category];
}

export default GlobalSearchDialog;