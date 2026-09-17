import assert from "node:assert/strict";
import test from "node:test";
import { AdminTicketRepository } from "../repositories/adminTicket.repository";
import { ReplyStatusClassifier } from "../repositories/replyStatus.repository";
import { AdminTicketService } from "./adminTicket.service";

test("creates a trimmed reply linked to the authenticated staff user", async () => {
  let createInput: {
    ticketId: number;
    actorId: number;
    replyText: string;
    currentStatus: "RECEIVED";
    suggestedStatus: "IN_PROGRESS" | null;
  } | undefined;
  const repository = {
    findStaff: async () => ({ id: 7, name: "Petugas", role: "OFFICER" }),
    findStatus: async () => ({ id: 42, publicId: "GA-TEST", title: "Test", status: "RECEIVED", updatedAt: new Date() }),
    createReply: async (input: typeof createInput) => {
      createInput = input;
      return { replyText: input?.replyText };
    },
  } as unknown as AdminTicketRepository;
  const classifier = {
    classify: async () => "IN_PROGRESS",
  } as ReplyStatusClassifier;

  const service = new AdminTicketService(repository, classifier);
  await service.createReply("ga-test", { replyText: "  Sedang ditangani.  " }, 7);

  assert.deepEqual(createInput, {
    ticketId: 42,
    actorId: 7,
    replyText: "Sedang ditangani.",
    currentStatus: "RECEIVED",
    suggestedStatus: "IN_PROGRESS",
  });
});

test("keeps ticket status when AI finds no operational meaning", async () => {
  let suggestedStatus: string | null | undefined;
  const repository = {
    findStaff: async () => ({ id: 7, name: "Petugas", role: "OFFICER" }),
    findStatus: async () => ({ id: 42, publicId: "GA-TEST", title: "Test", status: "VERIFIED", updatedAt: new Date() }),
    createReply: async (input: { suggestedStatus: string | null }) => {
      suggestedStatus = input.suggestedStatus;
      return { replyText: "Terima kasih." };
    },
  } as unknown as AdminTicketRepository;
  const classifier = { classify: async () => null } as ReplyStatusClassifier;

  await new AdminTicketService(repository, classifier).createReply("GA-TEST", { replyText: "Terima kasih." }, 7);

  assert.equal(suggestedStatus, null);
});

test("never moves ticket status backward from an AI classification", async () => {
  let suggestedStatus: string | null | undefined;
  const repository = {
    findStaff: async () => ({ id: 7, name: "Petugas", role: "OFFICER" }),
    findStatus: async () => ({ id: 42, publicId: "GA-TEST", title: "Test", status: "COMPLETED", updatedAt: new Date() }),
    createReply: async (input: { suggestedStatus: string | null }) => {
      suggestedStatus = input.suggestedStatus;
      return { replyText: "Laporan kami terima." };
    },
  } as unknown as AdminTicketRepository;
  const classifier = { classify: async () => "VERIFIED" } as ReplyStatusClassifier;

  await new AdminTicketService(repository, classifier).createReply("GA-TEST", { replyText: "Laporan kami terima." }, 7);

  assert.equal(suggestedStatus, null);
});

test("lists admin tickets with mapped reply history", async () => {
  const createdAt = new Date("2026-09-17T10:00:00.000Z");
  const repository = {
    findMany: async () => [{
      publicId: "GA-TEST",
      title: null,
      description: "Jalan rusak di depan sekolah",
      category: "INFRASTRUCTURE",
      location: "Jakarta",
      status: "IN_PROGRESS",
      createdAt,
      replies: [{
        replyText: "Tim sedang menuju lokasi.",
        createdAt,
        author: { name: "Petugas", organization: { name: "Dinas PU" } },
      }],
    }],
  } as unknown as AdminTicketRepository;

  const result = await new AdminTicketService(repository).list();

  assert.equal(result[0].title, "Jalan rusak di depan sekolah");
  assert.deepEqual(result[0].replies, [{
    agency: "Dinas PU",
    message: "Tim sedang menuju lokasi.",
    createdAt,
  }]);
});

test("updates the authenticated staff profile with trimmed fields", async () => {
  let updateInput: { actorId: number; name: string; organizationName: string } | undefined;
  const repository = {
    findStaff: async () => ({ id: 7, name: "Admin Lama", role: "ADMIN", organization: null }),
    updateProfile: async (input: { actorId: number; name: string; organizationName: string }) => {
      updateInput = input;
      return { id: 7, name: input.name, role: "ADMIN", organization: { id: 1, name: input.organizationName } };
    },
  } as unknown as AdminTicketRepository;

  const result = await new AdminTicketService(repository).updateProfile({
    name: "  Admin Baru  ",
    organizationName: "  GovAssist Nasional  ",
  }, 7);

  assert.deepEqual(updateInput, { actorId: 7, name: "Admin Baru", organizationName: "GovAssist Nasional" });
  assert.equal(result.name, "Admin Baru");
});
