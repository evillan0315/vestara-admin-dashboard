import 'dotenv/config';
import * as dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Local development override: when `apps/api/.env.local` exists (gitignored,
// local only) its variables take precedence over the repo-root `.env`. This lets
// `prisma db push` / `prisma generate` target the local PostgreSQL database
// during development without manually exporting DATABASE_URL. On CI/Vercel this
// file is absent, so it is safely skipped and platform-injected env is used.
dotenv.config({ path: 'apps/api/.env.local', override: true });

export default defineConfig({
  schema: 'apps/api/prisma/schema.prisma',
  migrations: {
    path: 'apps/api/prisma/migrations',
    seed: 'tsx apps/api/prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/vestara',
  },
});
