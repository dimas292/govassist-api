import { Prisma, TicketStatus } from "@prisma/client";
import prisma from "../config/database";
import { ReportAnalysis } from "../models/ticket.model";

const detailInclude = {
  attachments: { orderBy: { createdAt: "asc" as const } },
  activities: {
    orderBy: { createdAt: "asc" as const },
    include: { actor: { include: { organization: true } } },
  },
  replies: {
    orderBy: { createdAt: "asc" as const },
    include: {
      author: { include: { organization: true } },
      attachments: { orderBy: { createdAt: "asc" as const } },
    },
  },
} satisfies Prisma.TicketInclude;

export class TicketRepository {
  async create(data: {
    publicId: string;
    analysis: ReportAnalysis;
    speechUrl: string;
    attachmentUrls: string[];
  }) {
    return prisma.$transaction(async (transaction) =>
      transaction.ticket.create({
        data: {
          publicId: data.publicId,
          reporterId: null,
          title: data.analysis.title,
          category: data.analysis.category,
          description: data.analysis.description,
          transcript: data.analysis.transcript,
          speechUrl: data.speechUrl,
          location: data.analysis.location,
          status: TicketStatus.RECEIVED,
          attachments: {
            create: data.attachmentUrls.map((attachmentUrl) => ({ attachmentUrl })),
          },
          activities: {
            create: {
              actorId: null,
              fromStatus: TicketStatus.RECEIVED,
              toStatus: TicketStatus.RECEIVED,
              description: "Laporan diterima dan berhasil divalidasi oleh sistem.",
            },
          },
        },
        include: detailInclude,
      }),
    );
  }

  async findMany(input: { query?: string; status?: TicketStatus; page: number; limit: number }) {
    const where: Prisma.TicketWhereInput = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.query
        ? {
            OR: [
              { publicId: { contains: input.query, mode: "insensitive" } },
              { title: { contains: input.query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [tickets, total] = await prisma.$transaction([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        select: {
          publicId: true,
          title: true,
          description: true,
          category: true,
          location: true,
          status: true,
          createdAt: true,
          activities: {
            take: 1,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: { toStatus: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);
    return {
      tickets: tickets.map(({ activities, ...ticket }) => ({
        ...ticket,
        status: activities[0]?.toStatus ?? ticket.status,
      })),
      total,
    };
  }

  async findByPublicId(publicId: string) {
    return prisma.ticket.findUnique({ where: { publicId }, include: detailInclude });
  }
}
