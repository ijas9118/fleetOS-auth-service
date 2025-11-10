import type { ZodError } from "zod";

import { config } from "dotenv";
import { z } from "zod";

config();

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3001),
  SERVICE_NAME: z.string(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  PRIVATE_KEY: z.string(),
  PUBLIC_KEY: z.string(),
  ACCESS_TOKEN_EXP: z.string().default("15m"),
  REFRESH_TOKEN_EXP: z.string().default("7d"),
});

export type env = z.infer<typeof EnvSchema>;

// eslint-disable-next-line import/no-mutable-exports
let env: env;

try {
  // eslint-disable-next-line node/no-process-env
  env = EnvSchema.parse(process.env);
}
catch (e) {
  const error = e as ZodError;
  console.error("❌ Invalid env");
  console.error(error.flatten().fieldErrors);
  process.exit(1);
}

export default env;
