import { z } from "zod";

export const updateAdminProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  organizationName: z.string().trim().min(2).max(150),
}).strict();
