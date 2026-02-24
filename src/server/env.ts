const required = [
  'DATABASE_URL',
  'PRIVY_APP_ID',
  'PRIVY_APP_SECRET',
  'API_KEY_PEPPER',
  'CRON_SECRET',
] as const;

type RequiredKey = (typeof required)[number];

function getRequired(key: RequiredKey): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function getOptional(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

export const serverEnv = {
  DATABASE_URL: getRequired('DATABASE_URL'),
  PRIVY_APP_ID: getRequired('PRIVY_APP_ID'),
  PRIVY_APP_SECRET: getRequired('PRIVY_APP_SECRET'),
  PRIVY_VERIFICATION_KEY: getOptional('PRIVY_VERIFICATION_KEY'),
  BLOB_READ_WRITE_TOKEN: getOptional('BLOB_READ_WRITE_TOKEN'),
  API_KEY_PEPPER: getRequired('API_KEY_PEPPER'),
  CRON_SECRET: getRequired('CRON_SECRET'),
  STARTING_BALANCE_CENTS: Number(getOptional('STARTING_BALANCE_CENTS') ?? 10000),
};

if (Number.isNaN(serverEnv.STARTING_BALANCE_CENTS) || serverEnv.STARTING_BALANCE_CENTS < 0) {
  throw new Error('STARTING_BALANCE_CENTS must be a non-negative integer');
}
