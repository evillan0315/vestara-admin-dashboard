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
  Chip,
} from '@mui/material';
import {
  Search,
  Keyboard,
  ArrowRight,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  People,
  Settings as SettingsIcon,
  History,
  Description,
  Person,
  Shield,
  FolderOpen,
  Build,
  BarChart as BarChartIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../theme/tokens';
import { navGroups } from '../../layouts/navConfig';
import { usersApi } from '../../api/users';
import type { UserDTO } from '@vestara/types';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  category: 'navigation' | 'users';
}

interface GlobalSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

/** Map a nav path to its MUI icon (falls back to Dashboard). */
const ICON_BY_PATH: Record<string, React.ReactNode> = {
  '/': <DashboardIcon fontSize="large" />,
  '/analytics': <AnalyticsIcon fontSize="large" />,
  '/reports': <BarChartIcon fontSize="large" />,
  '/chat': <ChatIcon fontSize="large" />,
  '/users': <People fontSize="large" />,
  '/organizations': <People fontSize="large" />,
  '/settings': <SettingsIcon fontSize="large" />,
  '/files': <FolderOpen fontSize="large" />,
  '/system-logs': <History fontSize="large" />,
  '/admin': <Build fontSize="large" />,
  '/docs': <Description fontSize="large" />,
  '/profile': <Person fontSize="large" />,
  '/security': <Shield fontSize="large" />,
};

/** Build the static navigation results from the sidebar nav config. */
function getNavigationResults(): SearchResult[] {
  const results: SearchResult[] = [];
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.soon) continue; // Roadmap placeholders are not navigable yet.
      results.push({
        id: `nav:${item.path}`,
        title: item.label,
        description: group.title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        path: item.path,
        icon: ICON_BY_PATH[item.path] ?? <DashboardIcon fontSize="large" />,
        category: 'navigation',
      });
    }
  }
  return results;
}

const NAVIGATION_RESULTS = getNavigationResults();

/**
 * Determine the "This Page" scope for the current route: which nav path to
 * anchor on and whether live user search is relevant.
 */
function getScopeForPath(pathname: string): {
  label: string;
  anchorPath: string;
  allowUsers: boolean;
} {
  if (pathname.startsWith('/users')) {
    return { label: 'Users', anchorPath: '/users', allowUsers: true };
  }
  if (pathname.startsWith('/system-logs') || pathname.startsWith('/admin')) {
    return { label: 'System Logs', anchorPath: '/system-logs', allowUsers: false };
  }
  return { label: 'This Page', anchorPath: '', allowUsers: true };
}

export function GlobalSearchDialog({ open, onClose, onSearch, inputRef }: GlobalSearchDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scope, setScope] = useState<'all' | 'this'>('all');
  const localInputRef = useRef<HTMLInputElement>(null);

  const effectiveInputRef = inputRef ?? localInputRef;

  const scoped = getScopeForPath(location.pathname);
  const defaultScope: 'all' | 'this' = scoped.anchorPath ? 'this' : 'all';

  // Live user search when the query is long enough.
  const [userHits, setUserHits] = useState<UserDTO[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScope(defaultScope);
    setQuery('');
    setSelectedIndex(0);
    setUserHits([]);
    setTimeout(() => effectiveInputRef.current?.focus(), 50);
  }, [open, defaultScope, effectiveInputRef]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setUserHits([]);
      return;
    }
    if (scope === 'this' && !scoped.allowUsers) {
      setUserHits([]);
      return;
    }

    let active = true;
    const delay = setTimeout(async () => {
      setDataLoading(true);
      try {
        const res = await usersApi.list({ search: query.trim(), perPage: 5 });
        if (active) {
          setUserHits((res.data as UserDTO[] | undefined) ?? []);
        }
      } catch {
        if (active) setUserHits([]);
      } finally {
        if (active) setDataLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(delay);
    };
  }, [open, query, scope, scoped.allowUsers]);

  // Compose the flat result list used for both rendering and keyboard nav.
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();

    const navMatches =
      scope === 'all'
        ? NAVIGATION_RESULTS
        : NAVIGATION_RESULTS.filter((r) => r.path === scoped.anchorPath);

    const navResults = navMatches.filter(
      (r) => !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
    );

    const userResults: SearchResult[] = userHits.map((u) => ({
      id: `user:${u.id}`,
      title: `${u.firstName} ${u.lastName}`.trim() || u.email,
      description: `${u.email} • ${u.role}`,
      path: `/users?focus=${u.id}`,
      icon: <People fontSize="large" />,
      category: 'users',
    }));

    const merged = [...navResults, ...userResults];
    if (q) {
      return merged.filter(
        (r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
      );
    }
    return merged;
  }, [query, scope, scoped.anchorPath, userHits]);

  const selectedResult = results[selectedIndex];

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
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
    [onClose, navigate, onSearch, query, results.length, selectedResult],
  );

  if (!open) return null;

  const groupedResults = useMemo(() => groupByCategory(results), [results]);
  const showEmpty = results.length === 0 && !dataLoading;

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
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
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
            placeholder="Search pages, users... (⌘K)"
            sx={{
              flex: 1,
              fontSize: 16,
              color: colors.text,
              '& input::placeholder': { color: colors.muted },
            }}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: colors.muted,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Keyboard fontSize="small" /> K
          </Box>
        </Box>

        {/* Scope toggle — "This Page" scopes results to the active route. */}
        {defaultScope === 'all' && (
          <Box sx={{ px: 2.5, pt: 1.5, display: 'flex', gap: 1 }}>
            <Chip
              label="All"
              size="small"
              clickable
              color={scope === 'all' ? 'primary' : 'default'}
              onClick={() => setScope('all')}
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={scoped.label}
              size="small"
              clickable
              color={scope === 'this' ? 'primary' : 'default'}
              onClick={() => setScope('this')}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        )}

        {showEmpty ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No results found for "{query}"</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try a different search term
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: '55vh', overflow: 'auto', px: 1, py: 1 }} disablePadding>
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
                  const globalIndex = results.indexOf(result);
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
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: isSelected ? colors.gold : colors.secondary,
                        }}
                      >
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
                          <Typography
                            variant="caption"
                            color={colors.secondary}
                            sx={{ fontSize: 12 }}
                          >
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

function groupByCategory(
  results: SearchResult[],
): { category: SearchResult['category']; items: SearchResult[] }[] {
  const groups = new Map<SearchResult['category'], SearchResult[]>();

  for (const result of results) {
    if (!groups.has(result.category)) {
      groups.set(result.category, []);
    }
    groups.get(result.category)!.push(result);
  }

  const categoryOrder: SearchResult['category'][] = ['navigation', 'users'];

  return categoryOrder
    .filter((cat) => groups.has(cat))
    .map((category) => ({ category, items: groups.get(category)! }));
}

function getCategoryLabel(category: SearchResult['category']): string {
  const labels: Record<SearchResult['category'], string> = {
    navigation: 'Navigation',
    users: 'User Management',
  };
  return labels[category];
}

export default GlobalSearchDialog;
