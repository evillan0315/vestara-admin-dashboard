import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  styled,
  useTheme,
} from '@mui/material';
import { ArrowBack, Refresh, Insights } from '@mui/icons-material';
import { LineChart, BarChart, PieChart } from '@mui/x-charts';
import StatCard from '../components/data/StatCard';
import { useFetchDataSource } from '../features/integrations/hooks';
import type {
  ChartSpecDTO,
  DataSourceFetchResultDTO,
  FieldMetaDTO,
  KpiSpecDTO,
} from '@vestara/types';

const ChartCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  height: '100%',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
}));

type Record_ = Record<string, unknown>;

function countByField(records: Record_[], field: string, limit?: number): [string, number][] {
  const map = new Map<string, number>();
  for (const r of records) {
    const v = r[field] == null ? '—' : String(r[field]);
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  let entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  if (limit) entries = entries.slice(0, limit);
  return entries;
}

function aggregateByDate(
  records: Record_[],
  xField: string,
  yField?: string,
): { labels: string[]; values: number[] } {
  const map = new Map<string, number[]>();
  for (const r of records) {
    const raw = r[xField];
    if (raw == null) continue;
    const d = new Date(String(raw));
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    const arr = map.get(key) ?? [];
    if (yField) {
      const v = Number(r[yField]);
      if (!Number.isNaN(v)) arr.push(v);
    } else {
      arr.push(1);
    }
    map.set(key, arr);
  }
  const labels = Array.from(map.keys()).sort();
  const values = labels.map((k) => {
    const arr = map.get(k)!;
    if (yField) {
      const sum = arr.reduce((a, b) => a + b, 0);
      return arr.length ? Number((sum / arr.length).toFixed(2)) : 0;
    }
    return arr.length;
  });
  return { labels, values };
}

function computeKpi(
  spec: KpiSpecDTO,
  records: Record_[],
  recordCount: number,
): { title: string; value: string } {
  if (spec.aggregation === 'count') {
    return { title: spec.title, value: recordCount.toLocaleString() };
  }
  const field = spec.field;
  if (!field) return { title: spec.title, value: '—' };
  const nums = records.map((r) => Number(r[field])).filter((n) => !Number.isNaN(n));
  if (spec.aggregation === 'distinct') {
    const distinct = new Set(records.map((r) => String(r[field]))).size;
    return { title: spec.title, value: distinct.toLocaleString() };
  }
  if (nums.length === 0) return { title: spec.title, value: '—' };
  const sum = nums.reduce((a, b) => a + b, 0);
  const value = spec.aggregation === 'sum' ? sum : sum / nums.length;
  const rounded = Math.round(value * 100) / 100;
  return { title: spec.title, value: rounded.toLocaleString() };
}

const PIE_COLORS = [
  '#c9a227',
  '#7b1fa2',
  '#2e7d32',
  '#1976d2',
  '#ed6c02',
  '#9c27b0',
  '#00796b',
  '#c2185b',
  '#455a64',
  '#827717',
  '#00695c',
  '#5e35b1',
];

export default function DataExplorerPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const fetchMut = useFetchDataSource();

  useEffect(() => {
    if (id) fetchMut.mutate(id);
  }, [id, fetchMut]);

  const data: DataSourceFetchResultDTO | undefined = fetchMut.data;
  const records: Record_[] = data?.sample ?? [];
  const fields: FieldMetaDTO[] = data?.fields ?? [];

  const kpis = useMemo(
    () => (data ? data.vizSpec.kpis.map((k) => computeKpi(k, records, data.recordCount)) : []),
    [data, records],
  );

  const renderChart = (chart: ChartSpecDTO) => {
    if (chart.type === 'pie' && chart.groupByField) {
      const entries = countByField(records, chart.groupByField);
      return (
        <PieChart
          height={300}
          series={[
            {
              data: entries.map(([label, value], i) => ({
                id: label,
                value,
                label,
                color: PIE_COLORS[i % PIE_COLORS.length],
              })),
              innerRadius: 50,
              paddingAngle: 3,
              cornerRadius: 4,
            },
          ]}
          slotProps={{
            legend: {
              direction: 'horizontal',
              position: { vertical: 'bottom', horizontal: 'center' },
            },
          }}
        />
      );
    }
    if (chart.type === 'bar' && chart.groupByField) {
      const entries = countByField(records, chart.groupByField, chart.limit ?? 10);
      return (
        <BarChart
          layout="horizontal"
          height={300}
          yAxis={[{ scaleType: 'band', data: entries.map(([label]) => label) }]}
          series={[{ data: entries.map(([, value]) => value), color: theme.palette.primary.main }]}
          xAxis={[{ min: 0 }]}
          margin={{ top: 8, right: 24, bottom: 24, left: 60 }}
        />
      );
    }
    if (chart.type === 'line' && chart.xField) {
      const { labels, values } = aggregateByDate(records, chart.xField, chart.yField);
      return (
        <LineChart
          height={300}
          xAxis={[{ scaleType: 'band', data: labels }]}
          series={[{ data: values, area: true, color: theme.palette.primary.main }]}
          yAxis={[{ min: 0 }]}
          margin={{ top: 16, right: 16, bottom: 28, left: 48 }}
        />
      );
    }
    if (chart.type === 'table') {
      return (
        <Box sx={{ maxHeight: 360, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                {fields.slice(0, 8).map((f) => (
                  <TableCell key={f.name}>{f.name}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((r, i) => (
                <TableRow key={i}>
                  {fields.slice(0, 8).map((f) => (
                    <TableCell key={f.name}>{String(r[f.name] ?? '')}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/integrations')} sx={{ minWidth: 0 }}>
          Back
        </Button>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Data Explorer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Live visualization of the connected REST API response.
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          variant="contained"
          onClick={() => fetchMut.mutate(id)}
          disabled={fetchMut.isPending}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          {fetchMut.isPending ? 'Fetching…' : 'Refresh'}
        </Button>
      </Box>

      {fetchMut.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to fetch the external API. Verify the URL, authentication, and that it returns
          JSON.
        </Alert>
      )}

      {!data && fetchMut.isPending && (
        <Alert severity="info">Fetching data from the external API…</Alert>
      )}

      {data && (
        <>
          {data.summary && (
            <Alert severity="info" icon={<Insights />} sx={{ mb: 3 }}>
              {data.summary}
            </Alert>
          )}

          <Grid container spacing={3} sx={{ mb: 3 }}>
            {kpis.map((kpi) => (
              <Grid key={kpi.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <StatCard title={kpi.title} value={kpi.value} iconColor="primary" />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {data.vizSpec.charts.map((chart, i) => (
              <Grid key={i} size={{ xs: 12, lg: chart.type === 'line' ? 12 : 6 }}>
                <ChartCard>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {chart.title}
                  </Typography>
                  {renderChart(chart)}
                </ChartCard>
              </Grid>
            ))}
            {data.vizSpec.charts.length === 0 && (
              <Grid size={{ xs: 12 }}>
                <ChartCard>
                  <Typography color="text.secondary">
                    No charts could be generated for this response.
                  </Typography>
                </ChartCard>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
}
