/**
 * Data analyzer for external REST responses.
 *
 * Responsibilities:
 *  - Normalize an arbitrary JSON payload into an array of record objects.
 *  - Infer per-field types (number / date / boolean / string).
 *  - Build a deterministic, heuristic visualization spec (KPIs + charts) so the
 *    feature always renders even without an AI provider configured.
 *  - Optionally enhance the result with an AI-generated summary + refined spec.
 */

import type {
  ChartSpecDTO,
  DataSourceFetchResultDTO,
  FieldMetaDTO,
  KpiSpecDTO,
  VisualizationSpecDTO,
} from '@vestara/types';
import { aiService } from '../ai/ai.service.js';

type Record_ = Record<string, unknown>;

function findArrayOfObjects(node: unknown, depth = 0): Record_[] | null {
  if (depth > 6) return null;
  if (Array.isArray(node)) {
    const objs = node.filter((x) => x && typeof x === 'object' && !Array.isArray(x)) as Record_[];
    return objs.length ? objs : null;
  }
  if (node && typeof node === 'object') {
    for (const value of Object.values(node)) {
      const res = findArrayOfObjects(value, depth + 1);
      if (res) return res;
    }
  }
  return null;
}

/**
 * Flatten an arbitrary JSON payload into the first non-empty array of objects
 * found (handles a raw array, `{ data: [...] }`, or deeply nested shapes).
 */
export function normalizeToRecords(payload: unknown): Record_[] {
  if (Array.isArray(payload)) {
    const objs = payload.filter(
      (x) => x && typeof x === 'object' && !Array.isArray(x),
    ) as Record_[];
    if (objs.length) return objs;
  }
  if (payload && typeof payload === 'object') {
    return findArrayOfObjects(payload) ?? [];
  }
  return [];
}

function inferFieldType(value: unknown): FieldMetaDTO['type'] {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') {
    if (
      /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/i.test(value)
    ) {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return 'date';
    }
    return 'string';
  }
  return 'string';
}

function titleCase(name: string): string {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Infer field metadata from a sample of records.
 */
export function analyzeFields(records: Record_[]): FieldMetaDTO[] {
  if (records.length === 0) return [];
  const keys = new Set<string>();
  for (const r of records) Object.keys(r).forEach((k) => keys.add(k));

  return Array.from(keys).map((name) => {
    const values = records.map((r) => r[name]).filter((v) => v !== null && v !== undefined);
    const types = new Set(values.map(inferFieldType));
    let type: FieldMetaDTO['type'] = 'string';
    if (types.has('number')) type = 'number';
    else if (types.has('date')) type = 'date';
    else if (types.has('boolean')) type = 'boolean';
    return { name, type };
  });
}

function distinctCount(records: Record_[], field: string): number {
  return new Set(records.map((r) => String(r[field]))).size;
}

/**
 * Deterministic, always-available visualization spec derived from field types.
 */
export function buildHeuristicSpec(
  records: Record_[],
  fields: FieldMetaDTO[],
): VisualizationSpecDTO {
  const numeric = fields.filter((f) => f.type === 'number');
  const dates = fields.filter((f) => f.type === 'date');
  const categorical = fields.filter((f) => f.type === 'string' || f.type === 'boolean');

  const kpis: KpiSpecDTO[] = [{ title: 'Total Records', aggregation: 'count' }];
  if (numeric.length) {
    kpis.push({
      title: `Avg ${titleCase(numeric[0].name)}`,
      aggregation: 'avg',
      field: numeric[0].name,
    });
    kpis.push({
      title: `Sum ${titleCase(numeric[0].name)}`,
      aggregation: 'sum',
      field: numeric[0].name,
    });
  }

  const charts: ChartSpecDTO[] = [];

  for (const f of categorical.slice(0, 2)) {
    const d = distinctCount(records, f.name);
    if (d > 1 && d <= 12) {
      charts.push({
        type: 'pie',
        title: `Distribution by ${titleCase(f.name)}`,
        groupByField: f.name,
      });
    }
  }

  const topCat = categorical.find((f) => {
    const d = distinctCount(records, f.name);
    return d > 1 && d <= 30;
  });
  if (topCat) {
    charts.push({
      type: 'bar',
      title: `Count by ${titleCase(topCat.name)}`,
      groupByField: topCat.name,
      limit: 10,
    });
  }

  if (dates.length && records.length > 1) {
    const dateField = dates[0].name;
    if (numeric.length) {
      charts.push({
        type: 'line',
        title: `${titleCase(numeric[0].name)} over time`,
        xField: dateField,
        yField: numeric[0].name,
      });
    } else {
      charts.push({ type: 'line', title: 'Record count over time', xField: dateField });
    }
  }

  return { kpis, charts: charts.slice(0, 6) };
}

function buildHeuristicSummary(records: Record_[], fields: FieldMetaDTO[]): string {
  const numeric = fields.filter((f) => f.type === 'number').length;
  const dates = fields.filter((f) => f.type === 'date').length;
  const others = fields.length - numeric - dates;
  return (
    `Returned ${records.length} record${records.length === 1 ? '' : 's'} with ${fields.length} field(s) ` +
    `(${numeric} numeric, ${dates} date/time, ${others} categorical). ` +
    'Charts below summarize the distribution and trends detected in the response.'
  );
}

function extractJsonObject(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : text;
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(source.slice(start, end + 1));
  } catch {
    return null;
  }
}

interface AiInsight {
  summary?: string;
  vizSpec?: VisualizationSpecDTO;
}

async function generateAiInsight(
  records: Record_[],
  fields: FieldMetaDTO[],
  heuristic: VisualizationSpecDTO,
): Promise<AiInsight | null> {
  const sample = records.slice(0, 5).map((r) => {
    const out: Record_ = {};
    for (const f of fields) out[f.name] = r[f.name];
    return out;
  });

  const prompt =
    'You are a data visualization assistant. Given the field metadata and a sample of records ' +
    'from an external REST API, produce a concise natural-language summary and a visualization plan.\n\n' +
    `Fields: ${JSON.stringify(fields)}\n` +
    `Record count: ${records.length}\n` +
    `Sample: ${JSON.stringify(sample)}\n\n` +
    'Respond ONLY with a JSON object of the form:\n' +
    '{\n' +
    '  "summary": string (1-2 sentences, plain language),\n' +
    '  "vizSpec": { "kpis": [{ "title": string, "aggregation": "count"|"sum"|"avg"|"distinct", "field"?: string }], "charts": [{ "type": "line"|"bar"|"pie"|"table", "title": string, "xField"?: string, "yField"?: string, "groupByField"?: string, "limit"?: number }] }\n' +
    '}\n' +
    'Prefer pie for low-cardinality categorical fields, bar for top categories, and line when a date field exists. ' +
    `Use at most 3 KPIs and 4 charts. Heuristic suggestion for reference: ${JSON.stringify(heuristic)}`;

  try {
    const result = await aiService.complete({
      model: 'nemotron-3-ultra-free',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 800,
      temperature: 0.2,
    });
    return extractJsonObject(result.content) as AiInsight | null;
  } catch {
    return null;
  }
}

export type DataSourceAnalysis = Omit<DataSourceFetchResultDTO, 'dataSourceId' | 'fetchedAt'>;

/**
 * Full analysis pipeline: normalize → infer fields → heuristic spec → AI enhancement.
 */
export async function analyzeDataSource(payload: unknown): Promise<DataSourceAnalysis> {
  const records = normalizeToRecords(payload);
  const fields = analyzeFields(records);
  const heuristic = buildHeuristicSpec(records, fields);
  const sample = records.slice(0, 50);

  let vizSpec = heuristic;
  let summary = buildHeuristicSummary(records, fields);

  if (records.length > 0) {
    try {
      const ai = await generateAiInsight(records, fields, heuristic);
      if (ai) {
        if (ai.summary && ai.summary.trim()) summary = ai.summary.trim();
        if (ai.vizSpec && Array.isArray(ai.vizSpec.charts) && ai.vizSpec.charts.length) {
          vizSpec = {
            kpis: ai.vizSpec.kpis?.length ? ai.vizSpec.kpis : heuristic.kpis,
            charts: ai.vizSpec.charts.slice(0, 6),
          };
        }
      }
    } catch {
      // keep heuristic spec + summary
    }
  }

  return { recordCount: records.length, fields, sample, vizSpec, summary };
}
