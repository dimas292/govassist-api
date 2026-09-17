import assert from "node:assert/strict";
import test from "node:test";
import { config } from "../config";
import { ReplyStatusRepository } from "./replyStatus.repository";

test("accepts a high-confidence operational reply status", async () => {
  let timeoutMs = 0;
  const repository = new ReplyStatusRepository(async (_replyText, timeout) => {
    timeoutMs = timeout;
    return JSON.stringify({ status: "COMPLETED", confidence: 0.94 });
  });

  assert.equal(await repository.classify("Laporan sudah kami selesaikan."), "COMPLETED");
  assert.equal(timeoutMs, config.gemini.replyStatusTimeoutMs);
});

test("ignores a low-confidence reply status", async () => {
  const repository = new ReplyStatusRepository(async () => JSON.stringify({
    status: "IN_PROGRESS",
    confidence: 0.6,
  }));

  assert.equal(await repository.classify("Kami akan melihatnya."), null);
});

test("retries invalid Gemini structured output", async () => {
  let attempts = 0;
  const repository = new ReplyStatusRepository(async () => {
    attempts += 1;
    return attempts === 1 ? "not-json" : JSON.stringify({ status: "VERIFIED", confidence: 0.9 });
  });

  assert.equal(await repository.classify("Laporan kami terima."), "VERIFIED");
  assert.equal(attempts, 2);
});
