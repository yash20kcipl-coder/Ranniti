import path from 'path';
import dotenv from 'dotenv';

const currentEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${currentEnv}`) });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const dbDialect = process.env.DB_DIALECT || 'postgres';
const dbUser = process.env.DB_USER || 'postgres';
const rawPassword = process.env.DB_PASSWORD ? process.env.DB_PASSWORD.replace(/^"|"$/g, '') : '';
const dbPassword = rawPassword ? encodeURIComponent(rawPassword) : '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'ranniti_db';

const constructedDbUrl = dbPassword
  ? `${dbDialect}://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`
  : `${dbDialect}://${dbUser}@${dbHost}:${dbPort}/${dbName}`;

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = constructedDbUrl;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL || constructedDbUrl,
  dbDialect,
  dbHost,
  dbPort: parseInt(dbPort, 10),
  dbUser,
  dbPassword: rawPassword,
  dbName,
  port: parseInt(process.env.PORT || '5000', 10),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_ranniti_jwt_key_2026',
  fileBaseUrl: process.env.FILE_BASE_URL || `http://localhost:${process.env.PORT || '5000'}`,
} as const;

