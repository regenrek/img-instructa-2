import { createEnv } from '@t3-oss/env-core';
import * as z from 'zod';

export const env = createEnv({
  server: {
    FAL_KEY: z.string().min(1, 'FAL_KEY is required to call fal.ai APIs'),
  },
  runtimeEnv: process.env,
});
