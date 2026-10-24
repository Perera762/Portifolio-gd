import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

describe("Integration Tests: Backend API", () => {
  let server;
  let baseUrl;

  before(async () => {
    process.env.VERCEL = "1"; // Prevent index.js from auto-listening on port 3001
    process.env.ADMIN_TOKEN = "test-secret-token-123";
    const { default: app } = await import("../../src/index.js");

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("GET /api/health should return ok: true and service info", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.service, "gdias-api");
    assert.ok(typeof data.uptimeSec === "number");
  });

  it("GET /api/profile should return complete profile data", async () => {
    const res = await fetch(`${baseUrl}/api/profile`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.data.identity);
    assert.equal(data.data.identity.name, "Gustavo Pereira Dias");
    assert.ok(Array.isArray(data.data.skills));
    assert.ok(Array.isArray(data.data.projects));
  });

  it("GET /api/projects should return project list", async () => {
    const res = await fetch(`${baseUrl}/api/projects`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length > 0);
    assert.equal(data.data[0].title, "Agendar Consulta Online");
  });

  it("GET /api/cinematic should return cinematic beats", async () => {
    const res = await fetch(`${baseUrl}/api/cinematic`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.data.frameCount > 0);
    assert.ok(Array.isArray(data.data.beats));
  });

  it("GET /api/stats should return stats", async () => {
    const res = await fetch(`${baseUrl}/api/stats`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(typeof data.data.total === "number");
  });

  it("POST /api/contact should accept valid submission and return ticket", async () => {
    const payload = {
      name: "Cliente Teste",
      email: "cliente.teste@empresa.com",
      company: "Empresa Parceira",
      subject: "Orçamento de Sistema",
      message: "Gostaria de solicitar uma estimativa para testes e desenvolvimento.",
    };

    const res = await fetch(`${baseUrl}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.data.ticket.startsWith("GD-"));
    assert.ok(data.data.receivedAt);
  });

  it("POST /api/contact should reject invalid input with 422 Unprocessable Entity", async () => {
    const payload = {
      name: "X",
      email: "invalid-email",
      message: "curto",
    };

    const res = await fetch(`${baseUrl}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 422);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.ok(data.errors.name);
    assert.ok(data.errors.email);
    assert.ok(data.errors.message);
  });

  it("POST /api/contact should silently catch honeypot spam with 200 OK", async () => {
    const payload = {
      name: "Spam Bot",
      email: "bot@botnet.xyz",
      message: "Mensagem automatizada de bot com link suspeito.",
      website: "http://bot.xyz",
    };

    const res = await fetch(`${baseUrl}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.data.ticket.startsWith("GD-"));
  });

  it("GET /api/messages should return 401 Unauthorized without token", async () => {
    const res = await fetch(`${baseUrl}/api/messages`);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.ok, false);
  });

  it("GET /api/messages should return 200 with valid X-Admin-Token", async () => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      headers: { "X-Admin-Token": "test-secret-token-123" },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(Array.isArray(data.data));
  });

  it("GET /api/nonexistent-route should return 404 Route Not Found", async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent-route`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(data.error, "Rota não encontrada.");
  });

  it("POST /api/contact with malformed JSON should return 400 Bad Request", async () => {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ malformed json",
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(data.error, "JSON inválido.");
  });
});
