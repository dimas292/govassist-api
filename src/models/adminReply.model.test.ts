import assert from "node:assert/strict";
import test from "node:test";
import { createTicketReplySchema } from "./adminReply.model";

test("accepts and trims a valid staff reply", () => {
  const result = createTicketReplySchema.safeParse({ replyText: "  Laporan sedang ditindaklanjuti.  " });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.replyText, "Laporan sedang ditindaklanjuti.");
});

test("rejects empty, oversized, and unknown reply fields", () => {
  assert.equal(createTicketReplySchema.safeParse({ replyText: "   " }).success, false);
  assert.equal(createTicketReplySchema.safeParse({ replyText: "x".repeat(2001) }).success, false);
  assert.equal(createTicketReplySchema.safeParse({ replyText: "Valid", actorId: 99 }).success, false);
});
