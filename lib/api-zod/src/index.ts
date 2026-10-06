import { z } from "zod";

export const HealthCheckResponse = z.object({
  status: z.string().default("ok"),
  version: z.string().optional(),
  timestamp: z.string().optional(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponse>;
