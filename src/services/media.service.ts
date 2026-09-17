import { StorageService } from "./storage.service";
import { ApiError } from "../utils/ApiError";

const fileNamePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webm|ogg|m4a|mp3|jpg|png)$/i;

export class MediaService {
  constructor(private readonly storage = new StorageService()) {}

  async read(folder: string, fileName: string) {
    if (!(["audio", "images", "avatars"] as string[]).includes(folder) || !fileNamePattern.test(fileName)) {
      throw ApiError.notFound("Media tidak ditemukan");
    }

    try {
      return await this.storage.read(`${folder}/${fileName}`);
    } catch (error) {
      const code = (error as { code?: string; name?: string }).code || (error as { name?: string }).name;
      if (code === "ENOENT" || code === "NoSuchKey") throw ApiError.notFound("Media tidak ditemukan");
      throw error;
    }
  }
}
