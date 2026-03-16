import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '4000', 10),
  JWT_SECRET: process.env.JWT_SECRET ?? 'change-me-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/expense_tracker',
  AWS_REGION: process.env.AWS_REGION ?? 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  LOG_GROUP_NAME: process.env.CLOUDWATCH_LOG_GROUP ?? '/expense-tracker/api',
};
