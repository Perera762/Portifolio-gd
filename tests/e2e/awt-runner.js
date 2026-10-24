import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_URL = process.env.TARGET_URL || "http://localhost:5173";

async function runAwtScenarioSuite() {
  console.log(`\n======================================================`);
  console.log(`🚀 AWT E2E Test Runner — AI-Powered Web Testing Suite`);
  console.log(`🎯 Target URL: ${TARGET_URL}`);
  console.log(`======================================================\n`);

  const results = {
    suite: "AWT Portfolio Verification",
    platform: "react",
    timestamp: new Date().toISOString(),
    scenarios: [],
    summary: { total: 0, passed: 0, failed: 0 },
  };

  function record(scenarioId, name, status, details = {}) {
    results.summary.total++;
    if (status === "PASS") results.summary.passed++;
    else results.summary.failed++;

    results.scenarios.push({
      scenarioId,
      name,
      status,
      details,
      timestamp: new Date().toISOString(),
    });

    const icon = status === "PASS" ? "✅" : "❌";
    console.log(`${icon} [${scenarioId}] ${name} -> ${status}`);
    if (details.error) console.error(`   Error: ${details.error}`);
  }

  // SCN-01: Page Load & HTTP Status
  try {
    const res = await fetch(TARGET_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const titleOk = html.includes("Gustavo Pereira Dias") || html.includes("<title>");
    const hasVite = html.includes("vite") || html.includes("src/main.jsx");
    if (!titleOk || !hasVite) throw new Error("Missing expected HTML root elements");

    record("SCN-01", "Page Load & Root HTML Structure", "PASS", { status: res.status });
  } catch (err) {
    record("SCN-01", "Page Load & Root HTML Structure", "FAIL", { error: err.message });
  }

  // SCN-02: Backend API Health through Frontend Proxy
  try {
    const res = await fetch(`${TARGET_URL}/api/health`);
    if (!res.ok) throw new Error(`API health returned HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok || json.service !== "gdias-api") throw new Error("Invalid health payload");

    record("SCN-02", "Vite API Proxy Connectivity (/api/health)", "PASS", json);
  } catch (err) {
    record("SCN-02", "Vite API Proxy Connectivity (/api/health)", "FAIL", { error: err.message });
  }

  // SCN-03: Profile Data Delivery
  try {
    const res = await fetch(`${TARGET_URL}/api/profile`);
    const json = await res.json();
    if (!json.ok || !json.data.identity || json.data.identity.name !== "Gustavo Pereira Dias") {
      throw new Error("Profile API payload mismatch");
    }

    record("SCN-03", "Profile & Identity Verification", "PASS", {
      name: json.data.identity.name,
      role: json.data.identity.role,
      skillsCount: json.data.skills.length,
      projectsCount: json.data.projects.length,
    });
  } catch (err) {
    record("SCN-03", "Profile & Identity Verification", "FAIL", { error: err.message });
  }

  // SCN-04: Projects & Experience Data
  try {
    const res = await fetch(`${TARGET_URL}/api/projects`);
    const json = await res.json();
    if (!json.ok || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error("Projects list empty or malformed");
    }

    record("SCN-04", "Projects Showcase Data Integrity", "PASS", {
      projectCount: json.data.length,
      featured: json.data[0].title,
    });
  } catch (err) {
    record("SCN-04", "Projects Showcase Data Integrity", "FAIL", { error: err.message });
  }

  // SCN-05: Contact Form E2E Validation (Negative Flow)
  try {
    const invalidBody = { name: "", email: "not-an-email", message: "curto" };
    const res = await fetch(`${TARGET_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidBody),
    });

    if (res.status !== 422) throw new Error(`Expected 422, received HTTP ${res.status}`);
    const json = await res.json();
    if (json.ok !== false || !json.errors.name || !json.errors.email || !json.errors.message) {
      throw new Error("Missing field errors in validation response");
    }

    record("SCN-05", "Contact Form Validation Rules (422 Rejection)", "PASS", { errors: json.errors });
  } catch (err) {
    record("SCN-05", "Contact Form Validation Rules (422 Rejection)", "FAIL", { error: err.message });
  }

  // SCN-06: Contact Form E2E Submission (Positive Flow)
  try {
    const validBody = {
      name: "AWT Bot Test",
      email: "awt.tester@looplab.io",
      subject: "E2E Automated Assessment",
      message: "Executando bateria de testes end-to-end automatizada via AWT com sucesso.",
    };

    const res = await fetch(`${TARGET_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });

    if (res.status !== 201) throw new Error(`Expected 201, received HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok || !json.data.ticket || !json.data.ticket.startsWith("GD-")) {
      throw new Error("Expected ticket generation GD-XXXX");
    }

    record("SCN-06", "Contact Form Successful Submission & Ticket Generation", "PASS", {
      ticket: json.data.ticket,
      receivedAt: json.data.receivedAt,
    });
  } catch (err) {
    record("SCN-06", "Contact Form Successful Submission & Ticket Generation", "FAIL", { error: err.message });
  }

  // SCN-07: Anti-Spam Honeypot Security Check
  try {
    const spamBody = {
      name: "Spammer",
      email: "spam@spammer.net",
      message: "Compre produtos suspeitos aqui agora mesmo link.",
      website: "http://bot.net",
    };

    const res = await fetch(`${TARGET_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(spamBody),
    });

    // Honeypot should return 200 with fake ticket to avoid alerting bot, without saving
    if (res.status !== 200) throw new Error(`Expected HTTP 200 for honeypot, received ${res.status}`);
    const json = await res.json();
    if (!json.ok || !json.data.ticket) throw new Error("Honeypot did not return mock ticket");

    record("SCN-07", "Anti-Spam Honeypot Trapping", "PASS", { mockTicket: json.data.ticket });
  } catch (err) {
    record("SCN-07", "Anti-Spam Honeypot Trapping", "FAIL", { error: err.message });
  }

  // Write Evidence Artifact
  const reportPath = path.join(__dirname, "awt-report.json");
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2), "utf8");

  console.log(`\n------------------------------------------------------`);
  console.log(`📊 AWT Test Results: ${results.summary.passed}/${results.summary.total} Passed (${Math.round((results.summary.passed / results.summary.total) * 100)}%)`);
  console.log(`📁 Report written to: ${reportPath}`);
  console.log(`------------------------------------------------------\n`);

  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

runAwtScenarioSuite().catch((err) => {
  console.error("FATAL: AWT runner crashed:", err);
  process.exit(1);
});
