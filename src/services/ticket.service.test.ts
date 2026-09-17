import assert from "node:assert/strict";
import test from "node:test";
import { ReportAnalysisRepository, ReportAnalysisUnavailableError } from "../repositories/reportAnalysis.repository";
import { TicketRepository } from "../repositories/ticket.repository";
import { ApiError } from "../utils/ApiError";
import { StorageService } from "./storage.service";
import { TicketService } from "./ticket.service";

test("maps unavailable report analysis to a retryable public response", async () => {
  const analysis = {
    analyzeAudio: async () => { throw new ReportAnalysisUnavailableError(); },
  } as unknown as ReportAnalysisRepository;
  const storage = {
    remove: async () => undefined,
  } as unknown as StorageService;
  const service = new TicketService({} as TicketRepository, analysis, storage);
  const audio = { mimetype: "audio/webm", buffer: Buffer.from("audio") } as Express.Multer.File;

  await assert.rejects(
    service.create({ audio, attachments: [] }),
    (error: unknown) => error instanceof ApiError
      && error.statusCode === 503
      && error.message.startsWith("Analisis suara sedang sibuk"),
  );
});
