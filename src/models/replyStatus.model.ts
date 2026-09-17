import { TicketStatus } from "@prisma/client";
import { z } from "zod";

export const replyStatusAnalysisSchema = z.object({
  status: z.nativeEnum(TicketStatus).nullable(),
  confidence: z.number().min(0).max(1),
}).strict();

export type ReplyStatusAnalysis = z.infer<typeof replyStatusAnalysisSchema>;
