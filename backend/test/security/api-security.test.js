import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { escapeHtml, buildEmailContent } from "../../src/mailer.js";

describe("API Security Testing Suite (OWASP & Security Best Practices)", () => {
  let server;
  let baseUrl;

  before(async () => {
    process.env.VERCEL = "1";
    process.env.ADMIN_TOKEN = "super-secret-admin-token-2026";
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

  it("Security Headers: should enforce X-Content-Type-Options, X-Frame-Options and suppress X-Powered-By", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    // Verify defensive headers
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal(res.headers.get("x-frame-options"), "DENY");
    assert.equal(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.ok(res.headers.get("permissions-policy"));

    // Verify server banner information disclosure is suppressed
    assert.equal(res.headers.get("x-powered-by"), null);
  });

  it("Input Sanitization: should escape malicious HTML tags to prevent Email HTML Injection / XSS", () => {
    const maliciousInput = {
      ticket: "GD-XSS",
      name: '<script>alert("pwned")</script>',
      email: "attacker@exploit.com",
      company: 'EvilCorp" onclick="alert(1)',
      phone: "+55 11 98888-8888",
      subject: "<svg onload=alert(document.cookie)>",
      message: 'Olá <img src=x onerror=alert(1)> e <a href="http://phishing.site">clique aqui</a>',
      createdAt: new Date().toISOString(),
    };

    const { html, text } = buildEmailContent(maliciousInput);

    // Assert that raw dangerous tags are properly escaped
    assert.ok(!html.includes("<script>"), "Raw script tag must not be present in HTML");
    assert.ok(html.includes("&lt;script&gt;alert(&quot;pwned&quot;)&lt;/script&gt;"));
    assert.ok(!html.includes("<svg onload="), "Raw SVG onload must not be present in HTML");
    assert.ok(html.includes("&lt;svg onload=alert(document.cookie)&gt;"));
    assert.ok(!html.includes("<img src=x"), "Raw img tag must not be present in HTML");
    assert.ok(html.includes("&lt;img src=x onerror=alert(1)&gt;"));
  });

  it("Authentication: constant-time verification for admin token should block brute force & invalid attempts", async () => {
    // Missing token
    const res1 = await fetch(`${baseUrl}/api/messages`);
    assert.equal(res1.status, 401);

    // Invalid token
    const res2 = await fetch(`${baseUrl}/api/messages`, {
      headers: { "X-Admin-Token": "wrong-token" },
    });
    assert.equal(res2.status, 401);

    // Valid token
    const res3 = await fetch(`${baseUrl}/api/messages`, {
      headers: { "X-Admin-Token": "super-secret-admin-token-2026" },
    });
    assert.equal(res3.status, 200);
  });

  it("DoS Protection: should reject oversized JSON bodies exceeding 32kb limit", async () => {
    const oversizedMessage = "A".repeat(40 * 1024); // 40KB
    const payload = {
      name: "Flooder",
      email: "flooder@badactor.net",
      message: oversizedMessage,
    };

    const res = await fetch(`${baseUrl}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Express json parser with limit 32kb returns 413 Payload Too Large
    assert.equal(res.status, 413);
  });

  it("Rate Limiting: should attach X-RateLimit headers and throttle rapid abusive requests", async () => {
    const clientIp = `198.51.100.${Date.now() % 250}`;
    const testBody = {
      name: "Security Rate Limit Tester",
      email: "tester@security.org",
      message: "Testando limites de requisição por segundo no endpoint de contato.",
      website: "http://bot-honeypot.local", // Prevents flooding real email inbox during rapid loop
    };

    let wasThrottled = false;
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": clientIp,
        },
        body: JSON.stringify(testBody),
      });

      if (res.status === 429) {
        wasThrottled = true;
        const retryAfter = res.headers.get("retry-after");
        assert.ok(retryAfter, "429 responses must include Retry-After header");
        break;
      }
    }

    assert.ok(wasThrottled, "Endpoint should throttle abuse and respond with HTTP 429");
  });

  it("Information Disclosure: malformed requests should not leak stack traces or debug info", async () => {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ unclosed_json_string: ",
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(data.error, "JSON inválido.");
    assert.equal(data.stack, undefined, "Stack trace must never be leaked");
  });
});
