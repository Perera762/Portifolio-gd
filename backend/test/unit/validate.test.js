import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateContact, clientKey } from "../../src/validate.js";

describe("Unit Tests: validateContact", () => {
  const validPayload = {
    name: "Gustavo Pereira",
    email: "gustavo@example.com",
    company: "Tech Corp",
    phone: "(11) 98765-4321",
    subject: "Proposta de Projeto",
    message: "Olá! Gostaria de conversar sobre um projeto de desenvolvimento front-end e testes QA.",
  };

  it("should validate and clean a valid contact payload", () => {
    const res = validateContact(validPayload);
    assert.equal(res.ok, true);
    assert.equal(res.spam, false);
    assert.equal(res.data.name, "Gustavo Pereira");
    assert.equal(res.data.email, "gustavo@example.com");
    assert.equal(res.data.company, "Tech Corp");
    assert.equal(res.data.phone, "(11) 98765-4321");
    assert.equal(res.data.subject, "Proposta de Projeto");
    assert.ok(res.data.message.length >= 20);
  });

  it("should set default subject if not provided", () => {
    const payload = { ...validPayload, subject: "" };
    const res = validateContact(payload);
    assert.equal(res.ok, true);
    assert.equal(res.data.subject, "Contato pelo portfólio");
  });

  it("should detect spam honeypot (website field filled)", () => {
    const payload = { ...validPayload, website: "http://spambot.xyz" };
    const res = validateContact(payload);
    assert.equal(res.ok, false);
    assert.equal(res.spam, true);
    assert.deepEqual(res.errors, { form: "rejected" });
  });

  it("should reject invalid name (too short or numbers)", () => {
    const shortName = validateContact({ ...validPayload, name: "A" });
    assert.equal(shortName.ok, false);
    assert.ok(shortName.errors.name);

    const numericName = validateContact({ ...validPayload, name: "123456" });
    assert.equal(numericName.ok, false);
    assert.ok(numericName.errors.name);
  });

  it("should accept valid unicode names with accents", () => {
    const res = validateContact({ ...validPayload, name: "João Müller da Conceição" });
    assert.equal(res.ok, true);
    assert.equal(res.data.name, "João Müller da Conceição");
  });

  it("should reject invalid email formats", () => {
    const invalidEmails = [
      "not-an-email",
      "missing-domain@",
      "@domain.com",
      "spaces in@email.com",
      "test@domain",
    ];

    for (const email of invalidEmails) {
      const res = validateContact({ ...validPayload, email });
      assert.equal(res.ok, false, `Expected ${email} to fail validation`);
      assert.ok(res.errors.email);
    }
  });

  it("should reject invalid phone format", () => {
    const res = validateContact({ ...validPayload, phone: "abc-invalid" });
    assert.equal(res.ok, false);
    assert.ok(res.errors.phone);
  });

  it("should reject messages shorter than 20 characters", () => {
    const res = validateContact({ ...validPayload, message: "Oi, tudo bem?" });
    assert.equal(res.ok, false);
    assert.equal(res.errors.message, "A mensagem precisa ter pelo menos 20 caracteres.");
  });

  it("should reject messages longer than 2000 characters", () => {
    const res = validateContact({ ...validPayload, message: "A".repeat(2001) });
    assert.equal(res.ok, false);
    assert.equal(res.errors.message, "A mensagem pode ter no máximo 2000 caracteres.");
  });
});

describe("Unit Tests: clientKey", () => {
  it("should extract client IP from x-forwarded-for header", () => {
    const req = {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    };
    assert.equal(clientKey(req), "203.0.113.195");
  });

  it("should fallback to socket.remoteAddress if x-forwarded-for is missing", () => {
    const req = {
      headers: {},
      socket: { remoteAddress: "192.168.1.50" },
    };
    assert.equal(clientKey(req), "192.168.1.50");
  });

  it("should fallback to 'unknown' if no IP is available", () => {
    const req = { headers: {} };
    assert.equal(clientKey(req), "unknown");
  });
});
