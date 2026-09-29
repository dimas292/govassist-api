import { z } from "zod";

export const transcriptionSchema = z.object({
  transcript: z.string().trim().min(1).max(20000),
});

export type TranscriptionResult = z.infer<typeof transcriptionSchema>;

export const reportDecisionSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.enum(["MBG", "INFRASTRUCTURE", "GENERAL"]),
  description: z.string().trim().min(1).max(5000),
  location: z.string().trim().max(500).nullable(),
  confidence: z.object({
    category: z.number().min(0).max(1),
    location: z.number().min(0).max(1),
  }),
});

export type ReportDecision = z.infer<typeof reportDecisionSchema>;

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
