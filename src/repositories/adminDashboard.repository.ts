import prisma from "../config/database";

export class AdminDashboardRepository {
  async getSnapshot() {
    const trendStart = new Date();
    trendStart.setUTCDate(1);
    trendStart.setUTCHours(0, 0, 0, 0);
    trendStart.setUTCMonth(trendStart.getUTCMonth() - 7);

    const [total, statusGroups, categoryGroups, trendTickets, latestTickets, latestActivities] =
      await prisma.$transaction([
        prisma.ticket.count(),
        prisma.ticket.groupBy({ by: ["status"], orderBy: { status: "asc" }, _count: { _all: true } }),
        prisma.ticket.groupBy({ by: ["category"], orderBy: { category: "asc" }, _count: { _all: true } }),
        prisma.ticket.findMany({
          where: { createdAt: { gte: trendStart } },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.ticket.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            publicId: true,
            title: true,
            description: true,
            category: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.ticketActivity.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            toStatus: true,
            description: true,
            createdAt: true,
            ticket: { select: { publicId: true, title: true } },
          },
        }),
      ]);

    return {
      total,
      statusGroups,
      categoryGroups,
      trendStart,
      trendTickets,
      latestTickets,
      latestActivities,
    };
  }
}
