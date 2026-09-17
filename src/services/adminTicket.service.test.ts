import assert from "node:assert/strict";
import test from "node:test";
import { config } from "../config";
import { AdminTicketRepository } from "../repositories/adminTicket.repository";
import { AdminTicketService } from "./adminTicket.service";
import { StorageService } from "./storage.service";

test("creates a trimmed reply linked to the authenticated staff user", async () => {
  let createInput: {
    ticketId: number;
    actorId: number;
    replyText: string;
    attachmentUrls: string[];
  } | undefined;
  const repository = {
    findStaff: async () => ({ id: 7, name: "Petugas", role: "OFFICER" }),
    findStatus: async () => ({ id: 42, publicId: "GA-TEST", title: "Test", status: "RECEIVED", updatedAt: new Date() }),
    createReply: async (input: typeof createInput) => {
      createInput = input;
      return { replyText: input?.replyText };
    },
  } as unknown as AdminTicketRepository;
  const service = new AdminTicketService(repository);
  await service.createReply("ga-test", { replyText: "  Sedang ditangani.  " }, 7);

  assert.deepEqual(createInput, {
    ticketId: 42,
    actorId: 7,
    replyText: "Sedang ditangani.",
    attachmentUrls: [],
  });
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
        author: { name: "Petugas", avatarUrl: "https://media.test/avatar.png", organization: { name: "Dinas PU" } },
        attachments: [{ attachmentUrl: "https://media.test/reply.png", createdAt }],
      }],
    }],
  } as unknown as AdminTicketRepository;

  const result = await new AdminTicketService(repository).list();

  assert.equal(result[0].title, "Jalan rusak di depan sekolah");
  assert.deepEqual(result[0].replies, [{
    agency: "Dinas PU",
    avatarUrl: "https://media.test/avatar.png",
    message: "Tim sedang menuju lokasi.",
    createdAt,
    attachments: [{ url: "https://media.test/reply.png", createdAt }],
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

test("uploads a new avatar and removes the previous managed avatar", async () => {
  const removed: string[] = [];
  const oldKey = "avatars/123e4567-e89b-42d3-a456-426614174000.png";
  const repository = {
    findStaff: async () => ({
      id: 7,
      name: "Admin",
      role: "ADMIN",
      avatarUrl: `${config.publicBaseUrl}/media/${oldKey}`,
      organization: null,
    }),
    updateAvatar: async (_actorId: number, avatarUrl: string) => ({ id: 7, avatarUrl }),
  } as unknown as AdminTicketRepository;
  const storage = {
    save: async () => ({ key: "avatars/new.png", url: "https://api.test/media/avatars/new.png" }),
    remove: async (files: Array<{ key: string }>) => { removed.push(...files.map((file) => file.key)); },
  } as unknown as StorageService;
  const file = { mimetype: "image/png", buffer: Buffer.from("png"), size: 3 } as Express.Multer.File;

  const result = await new AdminTicketService(repository, storage).updateAvatar(file, 7);

  assert.equal(result.avatarUrl, "https://api.test/media/avatars/new.png");
  assert.deepEqual(removed, [oldKey]);
});
