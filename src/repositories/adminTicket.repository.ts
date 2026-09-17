import { Prisma, TicketStatus, UserRole } from "@prisma/client";
import prisma from "../config/database";

export class AdminTicketRepository {
  findMany(query?: string) {
    const where: Prisma.TicketWhereInput = query
      ? {
          OR: [
            { publicId: { contains: query, mode: "insensitive" } },
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};

    return prisma.ticket.findMany({
      where,
      take: 50,
      orderBy: { createdAt: "desc" },
      select: {
        publicId: true,
        title: true,
        description: true,
        category: true,
        location: true,
        status: true,
        createdAt: true,
        replies: {
          orderBy: { createdAt: "asc" },
          select: {
            replyText: true,
            createdAt: true,
            author: {
              select: {
                name: true,
                avatarUrl: true,
                organization: { select: { name: true } },
              },
            },
            attachments: {
              orderBy: { createdAt: "asc" },
              select: { attachmentUrl: true, createdAt: true },
            },
          },
        },
      },
    });
  }

  findStaff(actorId: number) {
    return prisma.user.findFirst({
      where: { id: actorId, role: { in: [UserRole.ADMIN, UserRole.OFFICER] } },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        organization: { select: { id: true, name: true } },
      },
    });
  }

  async updateProfile(input: { actorId: number; name: string; organizationName: string }) {
    return prisma.$transaction(async (transaction) => {
      const staff = await transaction.user.findUnique({
        where: { id: input.actorId },
        select: { organizationId: true },
      });
      if (!staff) return null;

      let organizationId = staff.organizationId;
      if (organizationId) {
        await transaction.organization.update({
          where: { id: organizationId },
          data: { name: input.organizationName },
        });
      } else {
        const organization = await transaction.organization.create({
          data: { name: input.organizationName },
          select: { id: true },
        });
        organizationId = organization.id;
      }

      return transaction.user.update({
        where: { id: input.actorId },
        data: { name: input.name, organizationId },
        select: {
          id: true,
          name: true,
          role: true,
          avatarUrl: true,
          organization: { select: { id: true, name: true } },
        },
      });
    });
  }

  updateAvatar(actorId: number, avatarUrl: string) {
    return prisma.user.update({
      where: { id: actorId },
      data: { avatarUrl },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        organization: { select: { id: true, name: true } },
      },
    });
  }

  findStatus(publicId: string) {
    return prisma.ticket.findUnique({
      where: { publicId },
      select: { id: true, publicId: true, title: true, status: true, updatedAt: true },
    });
  }

  createReply(input: {
    ticketId: number;
    actorId: number;
    replyText: string;
    attachmentUrls: string[];
  }) {
    return prisma.reply.create({
      data: {
        ticketId: input.ticketId,
        repliedBy: input.actorId,
        replyText: input.replyText,
        attachments: {
          create: input.attachmentUrls.map((attachmentUrl) => ({ attachmentUrl })),
        },
      },
      select: {
        replyText: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            avatarUrl: true,
            organization: { select: { name: true } },
          },
        },
        attachments: {
          orderBy: { createdAt: "asc" },
          select: { attachmentUrl: true, createdAt: true },
        },
        ticket: { select: { publicId: true } },
      },
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
