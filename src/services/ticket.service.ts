import { randomBytes } from "crypto";
import { TicketStatus } from "@prisma/client";
import { UploadedTicketFiles } from "../models/ticket.model";
import { ReportAnalysisRepository, ReportAnalysisUnavailableError } from "../repositories/reportAnalysis.repository";
import { TicketRepository } from "../repositories/ticket.repository";
import { ApiError } from "../utils/ApiError";
import { createLogger, describeError } from "../utils/logger";
import { StorageService, StoredFile } from "./storage.service";

const log = createLogger("ticket-service");

const publicId = () => `GA-${randomBytes(8).toString("hex").toUpperCase()}`;

export class TicketService {
  constructor(
    private readonly tickets = new TicketRepository(),
    private readonly analysis = new ReportAnalysisRepository(),
    private readonly storage = new StorageService(),
  ) {}

  async create(files: UploadedTicketFiles) {
    let stored: StoredFile[] = [];
    let phase: "analysis" | "storage" | "database" = "analysis";
    log.info("Ticket creation started", {
      audioBytes: files.audio.size,
      attachmentCount: files.attachments.length,
    });
    try {
      const analysis = await this.analysis.analyzeAudio(files.audio);
      phase = "storage";
      const speech = await this.storage.save(files.audio, "audio");
      const attachments = await Promise.all(
        files.attachments.map((file) => this.storage.save(file, "images")),
      );
      stored = [speech, ...attachments];

      phase = "database";
      const ticket = await this.tickets.create({
        publicId: publicId(),
        analysis,
        speechUrl: speech.url,
        attachmentUrls: attachments.map((file) => file.url),
      });
      log.info("Ticket creation succeeded", { publicId: ticket.publicId, category: analysis.category });
      return ticket;
    } catch (error) {
      await this.storage.remove(stored);
      if (error instanceof ApiError) {
        log.warn("Ticket creation rejected", { phase, reason: describeError(error) });
        throw error;
      }
      if (error instanceof ReportAnalysisUnavailableError) {
        log.error("Ticket creation aborted: report analysis failed", { reason: describeError(error) });
        throw ApiError.serviceUnavailable(
          "Analisis suara sedang sibuk. Rekaman belum tersimpan; silakan coba lagi dalam beberapa saat.",
        );
      }
      log.error("Ticket creation failed", { phase, reason: describeError(error) });
      throw ApiError.internal("Laporan gagal dibuat");
    }
  }

  async list(input: { query?: string; status?: string; page?: string; limit?: string }) {
    const page = Math.max(1, Number(input.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(input.limit) || 10));
    const status = input.status
      ? Object.values(TicketStatus).find((value) => value === input.status)
      : undefined;
    if (input.status && !status) throw ApiError.badRequest("Invalid ticket status");
    return { ...(await this.tickets.findMany({ query: input.query?.trim(), status, page, limit })), page, limit };
  }

  async detail(trackingId: string) {
    const ticket = await this.tickets.findByPublicId(trackingId.trim().toUpperCase());
    if (!ticket) throw ApiError.notFound("Ticket not found");
    return ticket;
  }
}
