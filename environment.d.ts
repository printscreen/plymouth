import { Severity } from '@sentry/types';
declare global {
  namespace NodeJS {
    export interface ProcessEnv {
      POSTGRES_READ_HOST: string;
      POSTGRES_WRITE_HOST: string;
      POSTGRES_PORT: string;
      POSTGRES_DB: string;
      POSTGRES_READ_USER: string;
      POSTGRES_WRITE_USER: string;
      POSTGRES_READ_PASSWORD: string;
      POSTGRES_WRITE_PASSWORD: string;
      POSTGRES_USE_SSL: boolean;
      SENTRY_DSN: string;
      SENTRY_LOG_LEVEL: Severity;
      SENTRY_ENVIRONMENT?: 'development' | 'qa' | 'production';
    }
  }
}
export {};
