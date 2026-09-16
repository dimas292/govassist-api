import { TicketStatus } from "@prisma/client";
import { canTransitionStatus, updateTicketStatusSchema } from "../models/adminStatus.model";
import { AdminTicketRepository } from "../repositories/adminTicket.repository";
import { ApiError } from "../utils/ApiError";

const statusLabel: Record<TicketStatus, string> = {
  RECEIVED: "Diterima",
  VERIFIED: "Terverifikasi",
  IN_PROGRESS: "Diproses",
  COMPLETED: "Selesai",
};

export class AdminTicketService {
  constructor(private readonly repository = new AdminTicketRepository()) {}

  async currentStaff(actorId: number) {
    const staff = await this.repository.findStaff(actorId);
    if (!staff) throw ApiError.forbidden("Akun admin tidak ditemukan atau tidak aktif");
    return staff;
  }

  async updateStatus(trackingId: string, payload: unknown, actorId: number) {
    const parsed = updateTicketStatusSchema.safeParse(payload);
    if (!parsed.success) throw ApiError.badRequest("Status ticket tidak valid", parsed.error.issues);

    const staff = await this.currentStaff(actorId);
    const ticket = await this.repository.findStatus(trackingId.trim().toUpperCase());
    if (!ticket) throw ApiError.notFound("Ticket tidak ditemukan");
    if (ticket.status === parsed.data.status) return ticket;
    if (!canTransitionStatus(ticket.status, parsed.data.status)) {
      throw ApiError.badRequest(
        `Status tidak dapat diubah dari ${statusLabel[ticket.status]} ke ${statusLabel[parsed.data.status]}`,
      );
    }

    const updated = await this.repository.updateStatus({
      ticketId: ticket.id,
      expectedStatus: ticket.status,
      status: parsed.data.status,
      actorId: staff.id,
      description: `Status laporan diubah dari ${statusLabel[ticket.status]} menjadi ${statusLabel[parsed.data.status]} oleh ${staff.name}.`,
    });
    if (!updated) throw ApiError.badRequest("Status ticket telah berubah. Muat ulang data lalu coba lagi.");
    return updated;
  }
}
