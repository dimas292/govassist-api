import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { config } from "../config";

export type StoredFile = {
  key: string;
  url: string;
};

export type StoredMedia = {
  body: Uint8Array;
  contentType: string;
  contentLength: number;
};

export interface StorageAdapter {
  save(file: Express.Multer.File, folder: "audio" | "images"): Promise<StoredFile>;
  remove(files: StoredFile[]): Promise<void>;
  read(key: string): Promise<StoredMedia>;
}

const extensions: Record<string, string> = {
  "audio/webm": ".webm",
  "audio/ogg": ".ogg",
  "audio/mp4": ".m4a",
  "audio/mpeg": ".mp3",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

const createKey = (folder: "audio" | "images", mimetype: string) => {
  const extension = extensions[mimetype];
  if (!extension) throw new Error(`Unsupported media type: ${mimetype}`);
  return `${folder}/${randomUUID()}${extension}`;
};

const mediaTypeFromKey = (key: string) => {
  const extension = path.extname(key).toLowerCase();
  const entry = Object.entries(extensions).find(([, value]) => value === extension);
  if (!entry) throw new Error("Unsupported stored media extension");
  return entry[0];
};

export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private readonly directory = config.storage.localDir,
    private readonly publicBaseUrl = config.publicBaseUrl,
  ) {}

  async save(file: Express.Multer.File, folder: "audio" | "images"): Promise<StoredFile> {
    const key = createKey(folder, file.mimetype);
    const absolutePath = path.join(this.directory, key);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, file.buffer, { flag: "wx" });
    return { key, url: `${this.publicBaseUrl}/media/${key.replace(/\\/g, "/")}` };
  }

  async remove(files: StoredFile[]): Promise<void> {
    await Promise.all(files.map((file) => unlink(path.join(this.directory, file.key)).catch(() => undefined)));
  }

  async read(key: string): Promise<StoredMedia> {
    const body = await readFile(path.join(this.directory, key));
    return { body, contentType: mediaTypeFromKey(key), contentLength: body.length };
  }
}

export class S3StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const isR2 = config.storage.driver === "r2";
    const settings = isR2
      ? {
          bucket: config.storage.r2.bucket,
          region: "auto",
          endpoint: config.storage.r2.accountId
            ? `https://${config.storage.r2.accountId}.r2.cloudflarestorage.com`
            : undefined,
          accessKeyId: config.storage.r2.accessKeyId,
          secretAccessKey: config.storage.r2.secretAccessKey,
          forcePathStyle: false,
        }
      : config.storage.s3;

    if (!settings.bucket || !settings.region || (isR2 && !settings.endpoint)) {
      throw new Error(isR2
        ? "R2 storage requires R2_ACCOUNT_ID and R2_BUCKET"
        : "S3 storage requires S3_BUCKET and S3_REGION");
    }
    if (Boolean(settings.accessKeyId) !== Boolean(settings.secretAccessKey) || (isR2 && !settings.accessKeyId)) {
      throw new Error(isR2
        ? "R2 storage requires R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY"
        : "S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be configured together");
    }

    this.bucket = settings.bucket;
    this.client = new S3Client({
      region: settings.region,
      endpoint: settings.endpoint,
      forcePathStyle: settings.forcePathStyle,
      credentials: settings.accessKeyId && settings.secretAccessKey
        ? { accessKeyId: settings.accessKeyId, secretAccessKey: settings.secretAccessKey }
        : undefined,
    });
  }

  async save(file: Express.Multer.File, folder: "audio" | "images"): Promise<StoredFile> {
    const key = createKey(folder, file.mimetype);
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
      CacheControl: "private, max-age=0, no-store",
    }));
    return { key, url: `${config.publicBaseUrl}/media/${key}` };
  }

  async remove(files: StoredFile[]): Promise<void> {
    if (!files.length) return;
    await this.client.send(new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: { Objects: files.map((file) => ({ Key: file.key })), Quiet: true },
    }));
  }

  async read(key: string): Promise<StoredMedia> {
    const result = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
    if (!result.Body) throw new Error("Stored media has no body");
    const body = await result.Body.transformToByteArray();
    return {
      body,
      contentType: result.ContentType || mediaTypeFromKey(key),
      contentLength: result.ContentLength ?? body.length,
    };
  }
}

export class StorageService implements StorageAdapter {
  private readonly adapter: StorageAdapter;

  constructor(adapter?: StorageAdapter) {
    this.adapter = adapter || (config.storage.driver === "local"
      ? new LocalStorageAdapter()
      : new S3StorageAdapter());
  }

  save(file: Express.Multer.File, folder: "audio" | "images") {
    return this.adapter.save(file, folder);
  }

  remove(files: StoredFile[]) {
    return this.adapter.remove(files);
  }

  read(key: string) {
    return this.adapter.read(key);
  }
}
