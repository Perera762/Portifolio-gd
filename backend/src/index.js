import crypto from "node:crypto";
import http from "node:http";
import express from "express";
import { profile } from "./profile.js";
import { addMessage, listMessages, stats } from "./store.js";
import { validateContact, clientKey } from "./validate.js";
import { hitLimit } from "./rateLimit.js";
import { sendNotificationEmail } from "./mailer.js";

try {
  process.loadEnvFile?.();
} catch {
  /* ignore if .env does not exist */
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const startedAt = Date.now();
const allowedOrigin = process.env.FRONTEND_URL || process.env.VERCEL_URL;

function constantTimeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin.startsWith("http") ? allowedOrigin : `https://${allowedOrigin}`);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "gdias-api",
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    time: new Date().toISOString(),
  });
});

app.get("/api/profile", (_req, res) => {
  res.json({ ok: true, data: profile });
});

app.get("/api/projects", (_req, res) => {
  res.json({ ok: true, data: profile.projects });
});

app.get("/api/cinematic", (_req, res) => {
  res.json({ ok: true, data: profile.cinematic });
});

app.get("/api/stats", async (_req, res) => {
  try {
    const data = await stats();
    res.json({ ok: true, data });
  } catch {
    res.status(500).json({ ok: false, error: "Falha ao ler estatísticas." });
  }
});

app.get("/api/messages", async (req, res) => {
  const token = req.headers["x-admin-token"];
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || !token || !constantTimeCompare(token, adminToken)) {
    res.status(401).json({ ok: false, error: "Não autorizado." });
    return;
  }
  try {
    const data = await listMessages();
    res.json({ ok: true, data });
  } catch {
    res.status(500).json({ ok: false, error: "Falha ao listar mensagens." });
  }
});

app.post("/api/contact", async (req, res) => {
  const key = clientKey(req);
  const limit = hitLimit(key);
  res.setHeader("X-RateLimit-Remaining", String(limit.remaining));

  if (limit.limited) {
    res.setHeader("Retry-After", String(limit.retryAfter));
    res.status(429).json({
      ok: false,
      error: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
    });
    return;
  }

  const result = validateContact(req.body);
  if (result.spam) {
    res.status(200).json({
      ok: true,
      data: { ticket: `GD-${crypto.randomBytes(3).toString("hex").toUpperCase()}` },
    });
    return;
  }

  if (!result.ok) {
    res.status(422).json({ ok: false, errors: result.errors });
    return;
  }

  const ticket = `GD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const entry = {
    id: crypto.randomUUID(),
    ticket,
    ...result.data,
    status: "received",
    createdAt: new Date().toISOString(),
    ip: key,
    userAgent: String(req.headers["user-agent"] || "").slice(0, 180),
  };

  try {
    await addMessage(entry);
    const mailResult = await sendNotificationEmail(entry);
    res.status(201).json({
      ok: true,
      data: {
        ticket,
        receivedAt: entry.createdAt,
        message: "Mensagem recebida. Gustavo responde em breve.",
        emailDispatched: mailResult.sent,
      },
    });
  } catch {
    res.status(500).json({
      ok: false,
      error: "Não foi possível registrar a mensagem. Tente novamente.",
    });
  }
});

app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "Rota não encontrada." });
});

app.use((err, _req, res, _next) => {
  if (err?.type === "entity.too.large" || err?.status === 413) {
    res.status(413).json({ ok: false, error: "Requisição muito grande. Limite máximo de 32kb." });
    return;
  }
  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    res.status(400).json({ ok: false, error: "JSON inválido." });
    return;
  }
  res.status(500).json({ ok: false, error: "Erro interno." });
});

const server = http.createServer(app);

if (!process.env.VERCEL) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`gdias-api listening on ${PORT}`);
  });
}

export default app;
