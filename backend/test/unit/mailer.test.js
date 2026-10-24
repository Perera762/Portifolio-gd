import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildEmailContent, getTransporter, sendNotificationEmail } from "../../src/mailer.js";

describe("Unit Tests: mailer", () => {
  const sampleEntry = {
    ticket: "GD-A1B2C3",
    name: "Carlos Eduardo",
    email: "carlos@empresa.com",
    company: "Inovação Ltda",
    phone: "(11) 91234-5678",
    subject: "Projeto Full Stack & QA",
    message: "Gostaria de agendar uma reunião técnica para discutir um novo sistema.",
    createdAt: new Date().toISOString(),
  };

  it("should generate email content with ticket, sender details and reply instructions", () => {
    const { subject, text, html } = buildEmailContent(sampleEntry);

    assert.ok(subject.includes("GD-A1B2C3"));
    assert.ok(subject.includes("Carlos Eduardo"));
    assert.ok(subject.includes("Projeto Full Stack & QA"));

    assert.ok(text.includes("Carlos Eduardo"));
    assert.ok(text.includes("carlos@empresa.com"));
    assert.ok(text.includes("GD-A1B2C3"));
    assert.ok(text.includes("(11) 91234-5678"));

    assert.ok(html.includes("Carlos Eduardo"));
    assert.ok(html.includes("carlos@empresa.com"));
    assert.ok(html.includes("GD-A1B2C3"));
    assert.ok(html.includes("mailto:carlos@empresa.com"));
  });

  it("should return null transporter when credentials are not configured", () => {
    const originalUser = process.env.EMAIL_USER;
    const originalGmailUser = process.env.GMAIL_USER;
    const originalSmtpUser = process.env.SMTP_USER;

    delete process.env.EMAIL_USER;
    delete process.env.GMAIL_USER;
    delete process.env.SMTP_USER;

    const transporter = getTransporter();
    assert.equal(transporter, null);

    if (originalUser) process.env.EMAIL_USER = originalUser;
    if (originalGmailUser) process.env.GMAIL_USER = originalGmailUser;
    if (originalSmtpUser) process.env.SMTP_USER = originalSmtpUser;
  });

  it("should gracefully handle sendNotificationEmail when credentials are missing", async () => {
    delete process.env.EMAIL_USER;
    delete process.env.GMAIL_USER;
    delete process.env.SMTP_USER;

    const result = await sendNotificationEmail(sampleEntry);
    assert.equal(result.sent, false);
    assert.equal(result.reason, "missing_credentials");
    assert.equal(result.recipient, "pereragustavo13@gmail.com");
    assert.equal(result.ticket, "GD-A1B2C3");
  });
});
