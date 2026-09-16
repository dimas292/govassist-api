import assert from "node:assert/strict";
import test from "node:test";
import { TicketStatus } from "@prisma/client";
import { canTransitionStatus, updateTicketStatusSchema } from "./adminStatus.model";

test("accepts supported ticket statuses", () => {
  assert.equal(updateTicketStatusSchema.safeParse({ status: "IN_PROGRESS" }).success, true);
  assert.equal(updateTicketStatusSchema.safeParse({ status: "CANCELLED" }).success, false);
});

test("allows forward transitions and rejects backwards transitions", () => {
  assert.equal(canTransitionStatus(TicketStatus.RECEIVED, TicketStatus.VERIFIED), true);
  assert.equal(canTransitionStatus(TicketStatus.RECEIVED, TicketStatus.IN_PROGRESS), true);
  assert.equal(canTransitionStatus(TicketStatus.IN_PROGRESS, TicketStatus.COMPLETED), true);
  assert.equal(canTransitionStatus(TicketStatus.COMPLETED, TicketStatus.IN_PROGRESS), false);
  assert.equal(canTransitionStatus(TicketStatus.VERIFIED, TicketStatus.RECEIVED), false);
});
