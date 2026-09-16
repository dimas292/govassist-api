import { TicketCategory, TicketStatus } from "@prisma/client";
import { AdminDashboardRepository } from "../repositories/adminDashboard.repository";

const statusValues = Object.values(TicketStatus);
const categoryValues = Object.values(TicketCategory);

export class AdminDashboardService {
  constructor(private readonly repository = new AdminDashboardRepository()) {}

  async getDashboard() {
    const snapshot = await this.repository.getSnapshot();
    const statusCounts = Object.fromEntries(statusValues.map((status) => [status, 0])) as Record<TicketStatus, number>;
    const categoryCounts = Object.fromEntries(categoryValues.map((category) => [category, 0])) as Record<TicketCategory, number>;

    snapshot.statusGroups.forEach((group) => {
      statusCounts[group.status] = (group._count as { _all: number })._all;
    });
    snapshot.categoryGroups.forEach((group) => {
      categoryCounts[group.category] = (group._count as { _all: number })._all;
    });

    const trend = Array.from({ length: 8 }, (_, index) => {
      const date = new Date(snapshot.trendStart);
      date.setUTCMonth(date.getUTCMonth() + index);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      return {
        key: `${year}-${String(month + 1).padStart(2, "0")}`,
        label: new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(date),
        value: snapshot.trendTickets.filter(
          (ticket) => ticket.createdAt.getUTCFullYear() === year && ticket.createdAt.getUTCMonth() === month,
        ).length,
      };
    });

    return {
      total: snapshot.total,
      statusCounts,
      categoryCounts,
      trend,
      latestTickets: snapshot.latestTickets.map((ticket) => ({
        id: ticket.publicId,
        title: ticket.title || ticket.description.slice(0, 100),
        category: ticket.category,
        status: ticket.status,
        createdAt: ticket.createdAt,
      })),
      latestActivities: snapshot.latestActivities.map((activity) => ({
        ticketId: activity.ticket.publicId,
        ticketTitle: activity.ticket.title,
        status: activity.toStatus,
        description: activity.description,
        createdAt: activity.createdAt,
      })),
    };
  }
}
