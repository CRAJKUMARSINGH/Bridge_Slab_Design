import { z } from "zod";

export const insertProjectSchema = z.object({
  name: z.string(),
  location: z.string().optional(),
  district: z.string().optional(),
  engineer: z.string().optional(),
  designData: z.any().optional(),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
