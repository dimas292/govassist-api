import { z } from "zod";

export const createTicketReplySchema = z.object({
  replyText: z.string().trim().min(1).max(2000),
}).strict();
