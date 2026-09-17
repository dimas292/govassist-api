import { Request, Response } from "express";
import { MediaService } from "../services/media.service";
import { asyncHandler } from "../utils/asyncHandler";

const media = new MediaService();

export const parseByteRange = (header: string, total: number) => {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2]) || total < 1) return null;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isInteger(suffixLength) || suffixLength < 1) return null;
    return { start: Math.max(0, total - suffixLength), end: total - 1 };
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : total - 1;
  if (!Number.isInteger(start) || !Number.isInteger(requestedEnd) || start >= total || requestedEnd < start) {
    return null;
  }
  return { start, end: Math.min(requestedEnd, total - 1) };
};

export class MediaController {
  read = asyncHandler(async (req: Request, res: Response) => {
    const folder = Array.isArray(req.params.folder) ? req.params.folder[0] : req.params.folder;
    const fileName = Array.isArray(req.params.fileName) ? req.params.fileName[0] : req.params.fileName;
    const stored = await media.read(folder, fileName);
    const body = Buffer.from(stored.body);
    const rangeHeader = req.headers.range;
    const range = rangeHeader ? parseByteRange(rangeHeader, body.length) : null;

    if (rangeHeader && !range) {
      res.status(416).set({
        "Content-Range": `bytes */${body.length}`,
        "Accept-Ranges": "bytes",
      }).end();
      return;
    }

    const responseBody = range ? body.subarray(range.start, range.end + 1) : body;
    res.set({
      "Content-Type": stored.contentType,
      "Content-Length": String(responseBody.length),
      "Cache-Control": "private, max-age=0, no-store",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Accept-Ranges": "bytes",
    });
    if (range) {
      res.status(206).set("Content-Range", `bytes ${range.start}-${range.end}/${body.length}`);
    }
    res.send(responseBody);
  });
}
