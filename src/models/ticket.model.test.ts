import assert from "node:assert/strict";
import test from "node:test";
import { reportAnalysisSchema } from "./ticket.model";

test("accepts valid structured report output", () => {
  const result = reportAnalysisSchema.safeParse({
    title: "Lampu jalan mati",
    category: "INFRASTRUCTURE",
    description: "Lampu jalan mati selama tiga hari.",
    location: "Jalan Merdeka",
    transcript: "Lampu jalan di Jalan Merdeka mati.",
    confidence: { category: 0.95, location: 0.8 },
  });
  assert.equal(result.success, true);
});

test("rejects categories and confidence outside the contract", () => {
  const result = reportAnalysisSchema.safeParse({
    title: "Laporan",
    category: "SECRET_INSTRUCTION",
    description: "Deskripsi",
    location: null,
    transcript: "Transkrip",
    confidence: { category: 2, location: -1 },
  });
  assert.equal(result.success, false);
});
