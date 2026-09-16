import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { config } from "../config";

export type StoredFile = {
  absolutePath: string;
  url: string;
};

const extensions: Record<string, string> = {
  "audio/webm": ".webm",
  "audio/ogg": ".ogg",
  "audio/mp4": ".m4a",
  "audio/mpeg": ".mp3",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

export class StorageService {
  async save(file: Express.Multer.File, folder: "audio" | "images"): Promise<StoredFile> {
    const directory = path.join(config.storageDir, folder);
    await mkdir(directory, { recursive: true });

    const extension = extensions[file.mimetype];
    if (!extension) throw new Error(`Unsupported media type: ${file.mimetype}`);

    const fileName = `${randomUUID()}${extension}`;
    const absolutePath = path.join(directory, fileName);
    await writeFile(absolutePath, file.buffer, { flag: "wx" });

    return {
      absolutePath,
      url: `${config.publicBaseUrl}/uploads/${folder}/${fileName}`,
    };
  }

  async remove(files: StoredFile[]): Promise<void> {
    await Promise.all(files.map((file) => unlink(file.absolutePath).catch(() => undefined)));
  }
}
