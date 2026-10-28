import nodemailer from "nodemailer";
import crypto from "node:crypto";

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(req, res) {
  // CORS Headers
  const origin = req.headers?.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Método não permitido" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const honey = String(body.website || "").trim();
    if (honey) {
      // Honeypot anti-spam ativado
      res.status(200).json({ ok: true, data: { ticket: `GD-${crypto.randomBytes(3).toString("hex").toUpperCase()}` } });
      return;
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const company = String(body.company || "").trim().slice(0, 80);
    const phone = String(body.phone || "").trim();
    const subject = String(body.subject || "").trim().slice(0, 120);
    const message = String(body.message || "").trim();

    const errors = {};
    if (name.length < 2 || name.length > 80) {
      errors.name = "Informe um nome válido (2 a 80 caracteres).";
    }
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!EMAIL_RE.test(email) || email.length > 120) {
      errors.email = "Informe um e-mail válido.";
    }
    if (message.length < 5) {
      errors.message = "A mensagem precisa ter pelo menos 5 caracteres.";
    } else if (message.length > 2000) {
      errors.message = "A mensagem pode ter no máximo 2000 caracteres.";
    }

    if (Object.keys(errors).length > 0) {
      res.status(422).json({ ok: false, errors });
      return;
    }

    const ticket = `GD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const createdAt = new Date().toISOString();

    const user = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER || "pereragustavo13@gmail.com";
    const pass = (process.env.EMAIL_PASS || process.env.GMAIL_APP_PASS || process.env.SMTP_PASS || "uxph zadh uwyx oqiy").replace(/\s+/g, "");
    const recipient = process.env.NOTIFICATION_EMAIL || "pereragustavo13@gmail.com";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeCompany = escapeHtml(company);
    const safeSubject = escapeHtml(subject || "Contato pelo portfólio");
    const safeMessage = escapeHtml(message);
    const safeTicket = escapeHtml(ticket);

    const emailSubject = `[Portfólio GD - ${ticket}] Contato de ${name}${subject ? `: ${subject}` : ""}`;
    const textContent = `
NOVO CONTATO RECEBIDO NO PORTFÓLIO
====================================
Protocolo: ${ticket}
Data/Hora: ${createdAt}

REMETENTE:
- Nome: ${name}
- E-mail: ${email}
- Telefone: ${phone || "Não informado"}
- Empresa: ${company || "Não informada"}

ASSUNTO:
${subject || "Contato pelo portfólio"}

MENSAGEM:
${message}

====================================
Você pode responder diretamente a esta notificação.
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c10; color: #e0e2ec; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #13151b; border: 1px solid #232733; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: #191c24; padding: 20px 24px; border-bottom: 1px solid #232733; }
    .badge { display: inline-block; background: #ea580c; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px; }
    .title { margin: 12px 0 4px; font-size: 20px; color: #ffffff; font-weight: 700; }
    .subtitle { font-size: 13px; color: #8e95a5; margin: 0; }
    .body { padding: 24px; }
    .field-group { margin-bottom: 20px; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #f97316; margin-bottom: 4px; }
    .value { font-size: 15px; color: #f1f5f9; line-height: 1.5; }
    .value a { color: #f97316; text-decoration: none; }
    .message-box { background: #0b0c10; border: 1px solid #232733; border-left: 4px solid #ea580c; border-radius: 6px; padding: 16px; font-size: 15px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; margin-top: 8px; }
    .footer { background: #0e1015; padding: 16px 24px; border-top: 1px solid #232733; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">PROTOCOLO ${safeTicket}</span>
      <h1 class="title">Novo Contato pelo Portfólio</h1>
      <p class="subtitle">Recebido em ${new Date(createdAt).toLocaleString("pt-BR")}</p>
    </div>
    <div class="body">
      <div class="field-group">
        <div class="label">Remetente</div>
        <div class="value"><strong>${safeName}</strong></div>
      </div>
      <div class="field-group">
        <div class="label">E-mail</div>
        <div class="value"><a href="mailto:${safeEmail}">${safeEmail}</a> (clique para responder)</div>
      </div>
      ${phone ? `
      <div class="field-group">
        <div class="label">Telefone</div>
        <div class="value"><a href="tel:${safePhone.replace(/[^+\d]/g, "")}">${safePhone}</a></div>
      </div>` : ""}
      ${company ? `
      <div class="field-group">
        <div class="label">Empresa</div>
        <div class="value">${safeCompany}</div>
      </div>` : ""}
      <div class="field-group">
        <div class="label">Assunto</div>
        <div class="value">${safeSubject}</div>
      </div>
      <div class="field-group">
        <div class="label">Mensagem</div>
        <div class="message-box">${safeMessage}</div>
      </div>
    </div>
    <div class="footer">
      Portfólio Gustavo Pereira Dias · Você pode responder diretamente a esta notificação.
    </div>
  </div>
</body>
</html>
`.trim();

    let emailDispatched = false;
    try {
      await transporter.sendMail({
        from: `"Portfólio Gustavo Dias" <${user}>`,
        to: recipient,
        replyTo: `${name} <${email}>`,
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
      });
      emailDispatched = true;
    } catch (mailErr) {
      console.error("[serverless-mailer] Erro ao enviar:", mailErr.message);
    }

    res.status(201).json({
      ok: true,
      data: {
        ticket,
        receivedAt: createdAt,
        message: "Mensagem recebida. Gustavo responde em breve.",
        emailDispatched,
      },
    });
  } catch (err) {
    console.error("[api/contact] Erro interno:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao processar mensagem." });
  }
}
