import assert from "node:assert/strict";
import test from "node:test";
import { parseByteRange } from "./media.controller";

test("parses browser byte ranges for media playback", () => {
  assert.deepEqual(parseByteRange("bytes=0-", 100), { start: 0, end: 99 });
  assert.deepEqual(parseByteRange("bytes=10-19", 100), { start: 10, end: 19 });
  assert.deepEqual(parseByteRange("bytes=-20", 100), { start: 80, end: 99 });
});

test("rejects unsatisfiable media byte ranges", () => {
  assert.equal(parseByteRange("bytes=100-120", 100), null);
  assert.equal(parseByteRange("bytes=20-10", 100), null);
  assert.equal(parseByteRange("invalid", 100), null);
});
