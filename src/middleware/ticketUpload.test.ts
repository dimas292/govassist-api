import assert from "node:assert/strict";
import test from "node:test";
import { hasValidSignature } from "./ticketUpload";

test("accepts WebM EBML signature", () => {
  assert.equal(
    hasValidSignature({ mimetype: "audio/webm", buffer: Buffer.from([0x1a, 0x45, 0xdf, 0xa3]) }),
    true,
  );
});

test("rejects content that does not match declared MIME type", () => {
  assert.equal(
    hasValidSignature({ mimetype: "image/png", buffer: Buffer.from("not a png") }),
    false,
  );
});
