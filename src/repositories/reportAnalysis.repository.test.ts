import assert from "node:assert/strict";
import test from "node:test";
import { config } from "../config";
import {
  ReportAnalysisRepository,
  ReportAnalysisUnavailableError,
  ReportDecisionGenerator,
  SpeechToTextGenerator,
} from "./reportAnalysis.repository";

const audio = {
  mimetype: "audio/webm",
  buffer: Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
} as Express.Multer.File;

const validDecision = {
  title: "Lampu jalan mati",
  category: "INFRASTRUCTURE" as const,
  description: "Lampu jalan mati selama tiga hari.",
  location: "Jalan Merdeka",
  confidence: { category: 0.95, location: 0.8 },
};

test("transcribes audio, analyzes the transcript, and returns validated output", async () => {
  let receivedSttTimeout = 0;
  let receivedDecisionTimeout = 0;
  let receivedTranscript = "";
  const transcribe: SpeechToTextGenerator = async (_audio, timeoutMs) => {
    receivedSttTimeout = timeoutMs;
    return { transcript: "Lampu jalan di Jalan Merdeka mati." };
  };
  const decide: ReportDecisionGenerator = async (transcript, timeoutMs) => {
    receivedDecisionTimeout = timeoutMs;
    receivedTranscript = transcript;
    return validDecision;
  };

  const result = await new ReportAnalysisRepository(transcribe, decide).analyzeAudio(audio);

  assert.equal(receivedSttTimeout, config.ai.speechToText.whisper.timeoutMs);
  assert.equal(receivedDecisionTimeout, config.ai.reportDecision.timeoutMs);
  assert.equal(receivedTranscript, "Lampu jalan di Jalan Merdeka mati.");
  assert.equal(result.category, "INFRASTRUCTURE");
  assert.equal(result.transcript, "Lampu jalan di Jalan Merdeka mati.");
});

test("retries decision provider once without transcribing again", async () => {
  let transcribeAttempts = 0;
  let decisionAttempts = 0;
  const transcribe: SpeechToTextGenerator = async () => {
    transcribeAttempts += 1;
    return { transcript: "Jalan rusak dekat sekolah." };
  };
  const decide: ReportDecisionGenerator = async () => {
    decisionAttempts += 1;
    if (decisionAttempts === 1) throw new Error("temporary provider failure");
    return { ...validDecision, description: "Jalan rusak dekat sekolah." };
  };

  const result = await new ReportAnalysisRepository(transcribe, decide).analyzeAudio(audio);

  assert.equal(transcribeAttempts, 1);
  assert.equal(decisionAttempts, 2);
  assert.equal(result.description, "Jalan rusak dekat sekolah.");
});

test("retries speech-to-text provider once before decision analysis", async () => {
  let transcribeAttempts = 0;
  let decisionAttempts = 0;
  const transcribe: SpeechToTextGenerator = async () => {
    transcribeAttempts += 1;
    if (transcribeAttempts === 1) throw new Error("temporary stt failure");
    return { transcript: "Air tidak mengalir sejak pagi." };
  };
  const decide: ReportDecisionGenerator = async () => {
    decisionAttempts += 1;
    return { ...validDecision, description: "Air tidak mengalir sejak pagi." };
  };

  const result = await new ReportAnalysisRepository(transcribe, decide).analyzeAudio(audio);

  assert.equal(transcribeAttempts, 2);
  assert.equal(decisionAttempts, 1);
  assert.equal(result.transcript, "Air tidak mengalir sejak pagi.");
});

test("fails safely after repeated provider failures", async () => {
  const transcribe: SpeechToTextGenerator = async () => {
    throw new Error("provider secret response");
  };
  const decide: ReportDecisionGenerator = async () => validDecision;

  await assert.rejects(
    new ReportAnalysisRepository(transcribe, decide).analyzeAudio(audio),
    ReportAnalysisUnavailableError,
  );
});
