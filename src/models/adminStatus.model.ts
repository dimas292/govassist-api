import { TicketStatus } from "@prisma/client";
import { z } from "zod";

export const updateTicketStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
});

export const allowedStatusTransitions: Record<TicketStatus, TicketStatus[]> = {
  RECEIVED: [TicketStatus.VERIFIED, TicketStatus.IN_PROGRESS],
  VERIFIED: [TicketStatus.IN_PROGRESS],
  IN_PROGRESS: [TicketStatus.COMPLETED],
  COMPLETED: [],
};

export const canTransitionStatus = (from: TicketStatus, to: TicketStatus) =>
  allowedStatusTransitions[from].includes(to);
