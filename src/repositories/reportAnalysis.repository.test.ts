import assert from "node:assert/strict";
import test from "node:test";
import { config } from "../config";
import {
  ReportAnalysisRepository,
  ReportAnalysisUnavailableError,
  ReportGenerator,
} from "./reportAnalysis.repository";

const audio = {
  mimetype: "audio/webm",
  buffer: Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
} as Express.Multer.File;

const validResponse = JSON.stringify({
  title: "Lampu jalan mati",
  category: "INFRASTRUCTURE",
  description: "Lampu jalan mati selama tiga hari.",
  location: "Jalan Merdeka",
  transcript: "Lampu jalan di Jalan Merdeka mati.",
  confidence: { category: 0.95, location: 0.8 },
});

test("passes the configured timeout and returns validated Gemini output", async () => {
  let receivedTimeout = 0;
  const generate: ReportGenerator = async (_audio, timeoutMs) => {
    receivedTimeout = timeoutMs;
    return validResponse;
  };

  const result = await new ReportAnalysisRepository(generate).analyzeAudio(audio);
  assert.equal(receivedTimeout, config.gemini.timeoutMs);
  assert.equal(result.category, "INFRASTRUCTURE");
});

test("retries once when Gemini output is invalid", async () => {
  let attempts = 0;
  const generate: ReportGenerator = async () => {
    attempts += 1;
    return attempts === 1 ? "not-json" : validResponse;
  };

  const result = await new ReportAnalysisRepository(generate).analyzeAudio(audio);
  assert.equal(attempts, 2);
  assert.equal(result.title, "Lampu jalan mati");
});

test("fails safely after two Gemini failures", async () => {
  let attempts = 0;
  const generate: ReportGenerator = async () => {
    attempts += 1;
    throw new Error("provider secret response");
  };

  await assert.rejects(new ReportAnalysisRepository(generate).analyzeAudio(audio), ReportAnalysisUnavailableError);
  assert.equal(attempts, 2);
});
