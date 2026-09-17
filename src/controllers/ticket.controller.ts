import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { TicketService } from "../services/ticket.service";

const ticketService = new TicketService();

const publicSummary = (ticket: {
  publicId: string;
  title: string | null;
  description: string;
  category: string;
  location: string | null;
  status: string;
  createdAt: Date;
}) => ({
  id: ticket.publicId,
  title: ticket.title || ticket.description.slice(0, 80),
  description: ticket.description,
  category: ticket.category,
  location: ticket.location,
  status: ticket.status,
  createdAt: ticket.createdAt,
});

const publicDetail = (ticket: Awaited<ReturnType<TicketService["detail"]>>) => ({
  ...publicSummary(ticket),
  transcript: ticket.transcript,
  audioUrl: ticket.speechUrl,
  attachments: ticket.attachments.map((attachment) => ({
    url: attachment.attachmentUrl,
    createdAt: attachment.createdAt,
  })),
  activities: ticket.activities.map((activity) => ({
    fromStatus: activity.fromStatus,
    toStatus: activity.toStatus,
    description: activity.description,
    createdAt: activity.createdAt,
    actor: activity.actor?.organization?.name || activity.actor?.name || "Sistem GovAssist",
  })),
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
});

export class TicketController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Record<string, Express.Multer.File[]>;
    const ticket = await ticketService.create({
      audio: files.audio[0],
      attachments: files.attachments || [],
    });
    res.status(201).json(ApiResponse.success(publicDetail(ticket), "Ticket created successfully", 201));
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await ticketService.list({
      query: typeof req.query.query === "string" ? req.query.query : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      page: typeof req.query.page === "string" ? req.query.page : undefined,
      limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
    });
    res.json(ApiResponse.paginated(result.tickets.map(publicSummary), result.total, result.page, result.limit));
  });

  detail = asyncHandler(async (req: Request, res: Response) => {
    const trackingId = Array.isArray(req.params.trackingId)
      ? req.params.trackingId[0]
      : req.params.trackingId;
    const ticket = await ticketService.detail(trackingId);
    res.json(ApiResponse.success(publicDetail(ticket)));
  });
}
