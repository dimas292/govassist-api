import { TicketStatus } from "@prisma/client";
import { createTicketReplySchema } from "../models/adminReply.model";
import { updateAdminProfileSchema } from "../models/adminProfile.model";
import { canTransitionStatus, updateTicketStatusSchema } from "../models/adminStatus.model";
import { AdminTicketRepository } from "../repositories/adminTicket.repository";
import { ApiError } from "../utils/ApiError";
import { StorageService, StoredFile, storedFileFromMediaUrl } from "./storage.service";

const statusLabel: Record<TicketStatus, string> = {
  RECEIVED: "Diterima",
  VERIFIED: "Terverifikasi",
  IN_PROGRESS: "Diproses",
  COMPLETED: "Selesai",
};

export class AdminTicketService {
  constructor(
    private readonly repository = new AdminTicketRepository(),
    private readonly storage = new StorageService(),
  ) {}

  async list(query?: string) {
    const tickets = await this.repository.findMany(query?.trim() || undefined);
    return tickets.map((ticket) => ({
      id: ticket.publicId,
      title: ticket.title || ticket.description.slice(0, 80),
      description: ticket.description,
      category: ticket.category,
      location: ticket.location,
      status: ticket.status,
      createdAt: ticket.createdAt,
      replies: ticket.replies.map((reply) => ({
        agency: reply.author.organization?.name || reply.author.name,
        avatarUrl: reply.author.avatarUrl,
        message: reply.replyText,
        createdAt: reply.createdAt,
        attachments: reply.attachments.map((attachment) => ({
          url: attachment.attachmentUrl,
          createdAt: attachment.createdAt,
        })),
      })),
    }));
  }

  async currentStaff(actorId: number) {
    const staff = await this.repository.findStaff(actorId);
    if (!staff) throw ApiError.forbidden("Akun admin tidak ditemukan atau tidak aktif");
    return staff;
  }

  async updateProfile(payload: unknown, actorId: number) {
    const parsed = updateAdminProfileSchema.safeParse(payload);
    if (!parsed.success) throw ApiError.badRequest("Profil admin tidak valid", parsed.error.issues);

    await this.currentStaff(actorId);
    const staff = await this.repository.updateProfile({ actorId, ...parsed.data });
    if (!staff) throw ApiError.notFound("Akun admin tidak ditemukan");
    return staff;
  }

  async updateAvatar(file: Express.Multer.File | undefined, actorId: number) {
    if (!file) throw ApiError.badRequest("Foto profil wajib dipilih");
    const staff = await this.currentStaff(actorId);
    let stored: StoredFile | null = null;
    try {
      stored = await this.storage.save(file, "avatars");
      const updated = await this.repository.updateAvatar(actorId, stored.url);
      const previous = storedFileFromMediaUrl(staff.avatarUrl);
      if (previous) await this.storage.remove([previous]).catch(() => undefined);
      return updated;
    } catch (error) {
      if (stored) await this.storage.remove([stored]);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Foto profil gagal diperbarui");
    }
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

  async createReply(
    trackingId: string,
    payload: unknown,
    actorId: number,
    attachments: Express.Multer.File[] = [],
  ) {
    const parsed = createTicketReplySchema.safeParse(payload);
    if (!parsed.success) throw ApiError.badRequest("Balasan ticket tidak valid", parsed.error.issues);

    const staff = await this.currentStaff(actorId);
    const ticket = await this.repository.findStatus(trackingId.trim().toUpperCase());
    if (!ticket) throw ApiError.notFound("Ticket tidak ditemukan");

    const storedAttachments: StoredFile[] = [];
    try {
      for (const attachment of attachments) {
        storedAttachments.push(await this.storage.save(attachment, "images"));
      }
      return await this.repository.createReply({
        ticketId: ticket.id,
        actorId: staff.id,
        replyText: parsed.data.replyText,
        attachmentUrls: storedAttachments.map((attachment) => attachment.url),
      });
    } catch (error) {
      await this.storage.remove(storedAttachments);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Balasan ticket gagal disimpan");
    }
  }
}
