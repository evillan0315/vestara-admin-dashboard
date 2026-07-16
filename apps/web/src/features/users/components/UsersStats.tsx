import { Box, Chip } from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { StatCard } from '../../../components/data/StatCard';
import type { UserStats } from '../../../api/users';
import type { ReactElement } from 'react';

interface UsersStatsProps {
  stats: UserStats | undefined;
  loading?: boolean;
}

const roleIcons: Record<string, ReactElement> = {
  super_admin: <ShieldIcon />,
  admin: <ShieldIcon />,
  moderator: <ShieldIcon />,
  support: <PeopleIcon />,
};

const roleColors: Record<string, string> = {
  super_admin: '#EF4444',
  admin: '#F59E0B',
  moderator: '#8B5CF6',
  support: '#10B981',
};

export function UsersStats({ stats, loading = false }: UsersStatsProps): ReactElement {
  if (!stats && !loading) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <StatCard title="Total Users" value="—" icon={<PeopleIcon />} loading />
        <StatCard title="Active" value="—" icon={<CheckCircleIcon />} loading />
        <StatCard title="Inactive" value="—" icon={<BlockIcon />} loading />
        <StatCard title="Admins" value="—" icon={<ShieldIcon />} loading />
      </Box>
    );
  }

  const adminCount = stats?.byRole?.find((r: { role: string; count: number }) => r.role === 'admin')?.count ?? 0;
  const moderatorCount = stats?.byRole?.find((r: { role: string; count: number }) => r.role === 'moderator')?.count ?? 0;
  const superAdminCount = stats?.byRole?.find((r: { role: string; count: number }) => r.role === 'super_admin')?.count ?? 0;
  const adminTotal = adminCount + moderatorCount + superAdminCount;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
      <StatCard title="Total Users" value={stats?.total ?? 0} icon={<PeopleIcon />} iconColor="info" />
      <StatCard
        title="Active"
        value={stats?.active ?? 0}
        icon={<CheckCircleIcon />}
        iconColor="success"
        change={5}
        changeLabel="vs last month"
      />
      <StatCard title="Inactive" value={stats?.inactive ?? 0} icon={<BlockIcon />} iconColor="warning" />
      <StatCard title="Admins & Mods" value={adminTotal} icon={<ShieldIcon />} iconColor="primary" />
      {!loading && stats?.byRole && stats.byRole.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {stats.byRole.map((role: { role: string; count: number }) => (
            <Chip
              key={role.role}
              label={`${role.role.replace('_', ' ')}: ${role.count}`}
              icon={roleIcons[role.role]}
              size="small"
              variant="outlined"
              sx={{
                borderColor: `${roleColors[role.role] || '#F59E0B'}50`,
                color: roleColors[role.role] || '#F59E0B',
                '& .MuiChip-icon': { color: roleColors[role.role] || '#F59E0B' },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default UsersStats;