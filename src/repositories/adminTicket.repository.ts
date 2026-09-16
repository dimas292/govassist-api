import { TicketStatus, UserRole } from "@prisma/client";
import prisma from "../config/database";

export class AdminTicketRepository {
  findStaff(actorId: number) {
    return prisma.user.findFirst({
      where: { id: actorId, role: { in: [UserRole.ADMIN, UserRole.OFFICER] } },
      select: { id: true, name: true, role: true },
    });
  }

  findStatus(publicId: string) {
    return prisma.ticket.findUnique({
      where: { publicId },
      select: { id: true, publicId: true, title: true, status: true, updatedAt: true },
    });
  }

  async updateStatus(input: {
    ticketId: number;
    expectedStatus: TicketStatus;
    status: TicketStatus;
    actorId: number;
    description: string;
  }) {
    return prisma.$transaction(async (transaction) => {
      const updated = await transaction.ticket.updateMany({
        where: { id: input.ticketId, status: input.expectedStatus },
        data: { status: input.status },
      });
      if (updated.count !== 1) return null;

      await transaction.ticketActivity.create({
        data: {
          ticketId: input.ticketId,
          actorId: input.actorId,
          fromStatus: input.expectedStatus,
          toStatus: input.status,
          description: input.description,
        },
      });

      return transaction.ticket.findUnique({
        where: { id: input.ticketId },
        select: { publicId: true, title: true, status: true, updatedAt: true },
      });
    });
  }
}
