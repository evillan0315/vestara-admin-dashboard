/**
 * Documentation content sourced from the repository `docs/` folder.
 *
 * Each markdown file is imported as a raw string at build time via Vite's
 * `?raw` suffix. This keeps the documentation page in sync with the
 * authoritative markdown sources without a runtime fetch.
 */

import developerGuide from '../../../../../docs/DEVELOPER_GUIDE.md?raw';
import deploymentGuide from '../../../../../docs/DEPLOYMENT.md?raw';
import selfHostedGuide from '../../../../../docs/SELF_HOSTED_DEPLOYMENT.md?raw';
import apiDocs from '../../../../../docs/api/README.md?raw';
import adrIndex from '../../../../../docs/decisions/README.md?raw';
import adrMonorepo from '../../../../../docs/decisions/0001-monorepo-pnpm-turbo.md?raw';
import adrFrontend from '../../../../../docs/decisions/0002-react-mui-frontend.md?raw';
import adrBackend from '../../../../../docs/decisions/0003-express-prisma-backend.md?raw';
import adrJwt from '../../../../../docs/decisions/0004-jwt-auth-refresh-rotation.md?raw';
import adrVercel from '../../../../../docs/decisions/0005-vercel-deployment.md?raw';
import adrZod from '../../../../../docs/decisions/0006-zod-validation.md?raw';
import adrOauth from '../../../../../docs/decisions/0007-oauth-providers.md?raw';

export interface DocEntry {
  /** Stable identifier used as the route hash and React key. */
  id: string;
  /** Human-readable label shown in the table of contents. */
  title: string;
  /** Logical grouping shown as a section header in the table of contents. */
  group: string;
  /** Raw markdown body. */
  content: string;
}

export const docsContent: DocEntry[] = [
  {
    id: 'developer-guide',
    title: 'Developer Guide',
    group: 'Getting Started',
    content: developerGuide,
  },
  {
    id: 'deployment',
    title: 'Deployment Guide',
    group: 'Getting Started',
    content: deploymentGuide,
  },
  {
    id: 'self-hosted',
    title: 'Self-Hosted Deployment',
    group: 'Getting Started',
    content: selfHostedGuide,
  },
  {
    id: 'api',
    title: 'API Reference',
    group: 'Reference',
    content: apiDocs,
  },
  {
    id: 'adr-index',
    title: 'Architecture Decisions (Index)',
    group: 'Architecture',
    content: adrIndex,
  },
  {
    id: 'adr-0001',
    title: 'ADR-0001 · Monorepo (pnpm + turbo)',
    group: 'Architecture',
    content: adrMonorepo,
  },
  {
    id: 'adr-0002',
    title: 'ADR-0002 · React + MUI Frontend',
    group: 'Architecture',
    content: adrFrontend,
  },
  {
    id: 'adr-0003',
    title: 'ADR-0003 · Express + Prisma Backend',
    group: 'Architecture',
    content: adrBackend,
  },
  {
    id: 'adr-0004',
    title: 'ADR-0004 · JWT Auth & Refresh Rotation',
    group: 'Architecture',
    content: adrJwt,
  },
  {
    id: 'adr-0005',
    title: 'ADR-0005 · Vercel Deployment',
    group: 'Architecture',
    content: adrVercel,
  },
  {
    id: 'adr-0006',
    title: 'ADR-0006 · Zod Validation',
    group: 'Architecture',
    content: adrZod,
  },
  {
    id: 'adr-0007',
    title: 'ADR-0007 · OAuth Providers',
    group: 'Architecture',
    content: adrOauth,
  },
];

export const docGroups: { group: string; docs: DocEntry[] }[] = docsContent.reduce<
  { group: string; docs: DocEntry[] }[]
>((acc, doc) => {
  const existing = acc.find((entry) => entry.group === doc.group);
  if (existing) {
    existing.docs.push(doc);
  } else {
    acc.push({ group: doc.group, docs: [doc] });
  }
  return acc;
}, []);

export function getDocById(id: string): DocEntry | undefined {
  return docsContent.find((doc) => doc.id === id);
}

const MD_LINK_MAP: Record<string, string> = {
  'DEVELOPER_GUIDE.md': 'developer-guide',
  'DEPLOYMENT.md': 'deployment',
  '0001-monorepo-pnpm-turbo.md': 'adr-0001',
  '0002-react-mui-frontend.md': 'adr-0002',
  '0003-express-prisma-backend.md': 'adr-0003',
  '0004-jwt-auth-refresh-rotation.md': 'adr-0004',
  '0005-vercel-deployment.md': 'adr-0005',
  '0006-zod-validation.md': 'adr-0006',
  '0007-oauth-providers.md': 'adr-0007',
};

/**
 * Maps an internal markdown link (e.g. `./decisions/README.md`) to a doc id
 * so the documentation page can navigate between documents instead of following
 * a broken relative link. Returns `null` when the link is external or unknown.
 */
export function resolveDocHref(href: string): string | null {
  if (!href.endsWith('.md')) return null;

  const cleaned = href.replace(/^\.+[/\\]?/, '').replace(/^\/+/, '');
  const segments = cleaned.split(/[/\\]/).filter(Boolean);
  const last = segments[segments.length - 1] ?? '';

  if (last === 'README.md') {
    const parent = segments[segments.length - 2];
    if (parent === 'api') return 'api';
    if (parent === 'decisions') return 'adr-index';
    return null;
  }

  return MD_LINK_MAP[last] ?? null;
}
