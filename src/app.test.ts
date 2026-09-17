import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import app from "./app";

test("health endpoint returns a stable success response", async () => {
  const response = await request(app).get("/health").expect(200);
  assert.equal(response.body.status, "ok");
  assert.equal(typeof response.body.timestamp, "string");
});

test("unknown API route returns the stable error envelope and rate-limit headers", async () => {
  const response = await request(app).get("/api/not-a-route").expect(404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.statusCode, 404);
  assert.equal(typeof response.headers.ratelimit, "string");
});

test("CORS permits configured development origin with credentials", async () => {
  const origin = "http://localhost:5173";
  const response = await request(app).get("/health").set("Origin", origin).expect(200);
  assert.equal(response.headers["access-control-allow-origin"], origin);
  assert.equal(response.headers["access-control-allow-credentials"], "true");
});

test("CORS rejects an origin outside the allowlist", async () => {
  const response = await request(app)
    .get("/health")
    .set("Origin", "https://attacker.example")
    .expect(403);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Origin tidak diizinkan");
  assert.equal(response.headers["access-control-allow-origin"], undefined);
});

test("media delivery rejects malformed object keys before storage access", async () => {
  const response = await request(app).get("/media/audio/not-a-valid-media-key.png").expect(404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Media tidak ditemukan");
});
