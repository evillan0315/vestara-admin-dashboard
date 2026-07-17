import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Base configuration lives in the repo-root `.env` (gitignored, holds all
// runtime secrets). Local overrides in `apps/api/.env.local` take precedence
// when present (e.g. for developer-specific tuning).
dotenv.config({ path: resolve(__dirname, '../../../../.env') });
dotenv.config({ path: resolve(__dirname, '../../.env.local'), override: true });

interface Config {
  nodeEnv: string;
  api: {
    port: number;
    host: string;
    url: string;
  };
  client: {
    url: string;
  };
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
    github: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
  s3: {
    endpoint: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  logging: {
    level: string;
  };
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  api: {
    port: parseInt(process.env.PORT || process.env.API_PORT || '5000', 10),
    host: '0.0.0.0',
    url: process.env.API_URL || 'http://localhost:5000',
  },
  client: {
    url: process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/vestara_admin',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ||
        `${process.env.API_URL || 'http://localhost:5000'}/api/v1/auth/oauth/google/callback`,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl:
        process.env.GITHUB_CALLBACK_URL ||
        `${process.env.API_URL || 'http://localhost:5000'}/api/v1/auth/oauth/github/callback`,
    },
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@vestara-admin-api.vercel.app',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || '',
    bucket: process.env.S3_BUCKET || '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    region: process.env.S3_REGION || 'us-east-1',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
} as const;

export default config;
