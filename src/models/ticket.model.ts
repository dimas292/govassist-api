import { z } from "zod";

export const reportAnalysisSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.enum(["MBG", "INFRASTRUCTURE", "GENERAL"]),
  description: z.string().trim().min(1).max(5000),
  location: z.string().trim().max(500).nullable(),
  transcript: z.string().trim().min(1).max(20000),
  confidence: z.object({
    category: z.number().min(0).max(1),
    location: z.number().min(0).max(1),
  }),
});

export type ReportAnalysis = z.infer<typeof reportAnalysisSchema>;

export type UploadedTicketFiles = {
  audio: Express.Multer.File;
  attachments: Express.Multer.File[];
};
