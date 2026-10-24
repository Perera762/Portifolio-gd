import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addMessage, listMessages, stats } from "../../src/store.js";

describe("Unit Tests: store", () => {
  it("should add a message and compute stats accurately", async () => {
    const testId = `test-${Date.now()}`;
    const entry = {
      id: testId,
      ticket: `GD-TEST`,
      name: "Tester QA",
      email: "qa@example.com",
      company: "QA Lab",
      phone: null,
      subject: "Test Message",
      message: "Este é um teste unitário para o store de mensagens.",
      status: "received",
      createdAt: new Date().toISOString(),
      ip: "127.0.0.1",
      userAgent: "node-test-agent",
    };

    const added = await addMessage(entry);
    assert.equal(added.id, testId);

    const messages = await listMessages();
    assert.ok(Array.isArray(messages));
    const found = messages.find((m) => m.id === testId);
    assert.ok(found, "Added message should be present in store list");

    // Verify sanitization: ip and userAgent should NOT be exposed in listMessages
    assert.equal(found.ip, undefined, "ip should be stripped from public message list");
    assert.equal(found.userAgent, undefined, "userAgent should be stripped from public message list");

    const st = await stats();
    assert.ok(typeof st.total === "number");
    assert.ok(st.total >= 1);
    assert.ok(st.byStatus.received >= 1);
    assert.ok(typeof st.lastReceivedAt === "string");
  });
});
