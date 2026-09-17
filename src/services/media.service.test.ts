import assert from "node:assert/strict";
import test from "node:test";
import { MediaService } from "./media.service";
import { StorageService } from "./storage.service";

test("allows stored avatars through the media service", async () => {
  let requestedKey = "";
  const storage = {
    read: async (key: string) => {
      requestedKey = key;
      return { body: Buffer.from("avatar"), contentType: "image/png", contentLength: 6 };
    },
  } as unknown as StorageService;

  const result = await new MediaService(storage).read(
    "avatars",
    "123e4567-e89b-42d3-a456-426614174000.png",
  );

  assert.equal(requestedKey, "avatars/123e4567-e89b-42d3-a456-426614174000.png");
  assert.equal(result.contentType, "image/png");
});
