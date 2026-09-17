import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { LocalStorageAdapter } from "./storage.service";

test("local storage saves and removes media through the storage adapter", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "govassist-storage-"));
  const storage = new LocalStorageAdapter(directory, "https://api.example.test");
  const file = {
    mimetype: "image/png",
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    size: 4,
  } as Express.Multer.File;

  try {
    const stored = await storage.save(file, "images");
    assert.match(stored.key, /^images\/[0-9a-f-]+\.png$/);
    assert.equal(stored.url, `https://api.example.test/media/${stored.key}`);
    assert.deepEqual(await readFile(path.join(directory, stored.key)), file.buffer);

    const opened = await storage.read(stored.key);
    assert.equal(opened.contentType, "image/png");
    assert.deepEqual(Buffer.from(opened.body), file.buffer);

    await storage.remove([stored]);
    await assert.rejects(readFile(path.join(directory, stored.key)));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
