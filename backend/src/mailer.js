import nodemailer from "nodemailer";

const DEFAULT_RECIPIENT = "pereragustavo13@gmail.com";

export function getTransporter() {
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  // If host is explicitly specified, use custom SMTP server
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });
  }

  // Default to Gmail service
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildEmailContent(entry) {
  const safeName = escapeHtml(entry.name);
  const safeEmail = escapeHtml(entry.email);
  const safePhone = escapeHtml(entry.phone);
  const safeCompany = escapeHtml(entry.company);
  const safeSubject = escapeHtml(entry.subject || "Contato pelo portfólio");
  const safeMessage = escapeHtml(entry.message);
  const safeTicket = escapeHtml(entry.ticket);

  const subject = `[Portfólio GD - ${entry.ticket}] Contato de ${entry.name}${entry.subject ? `: ${entry.subject}` : ""}`;

  const text = `
NOVO CONTATO RECEBIDO NO PORTFÓLIO
====================================
Protocolo: ${entry.ticket}
Data/Hora: ${entry.createdAt}

DADOS DO REMETENTE:
- Nome: ${entry.name}
- E-mail: ${entry.email}
- Telefone: ${entry.phone || "Não informado"}
- Empresa: ${entry.company || "Não informada"}

ASSUNTO:
${entry.subject || "Contato pelo portfólio"}

MENSAGEM:
${entry.message}

====================================
Para responder a este contato, basta responder diretamente a este e-mail.
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c10; color: #e0e2ec; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #13151b; border: 1px solid #232733; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: #191c24; padding: 20px 24px; border-bottom: 1px solid #232733; }
    .badge { display: inline-block; background: #3b82f6; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px; }
    .title { margin: 12px 0 4px; font-size: 20px; color: #ffffff; font-weight: 700; }
    .subtitle { font-size: 13px; color: #8e95a5; margin: 0; }
    .body { padding: 24px; }
    .field-group { margin-bottom: 20px; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #60a5fa; margin-bottom: 4px; }
    .value { font-size: 15px; color: #f1f5f9; line-height: 1.5; }
    .value a { color: #60a5fa; text-decoration: none; }
    .message-box { background: #0b0c10; border: 1px solid #232733; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px; font-size: 15px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; margin-top: 8px; }
    .footer { background: #0e1015; padding: 16px 24px; border-top: 1px solid #232733; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">PROTOCOLO ${safeTicket}</span>
      <h1 class="title">Novo Contato pelo Portfólio</h1>
      <p class="subtitle">Recebido em ${new Date(entry.createdAt).toLocaleString("pt-BR")}</p>
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
      ${entry.phone ? `
      <div class="field-group">
        <div class="label">Telefone</div>
        <div class="value"><a href="tel:${safePhone.replace(/[^+\d]/g, "")}">${safePhone}</a></div>
      </div>` : ""}
      ${entry.company ? `
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

  return { subject, text, html };
}

export async function sendNotificationEmail(entry) {
  const recipient = process.env.NOTIFICATION_EMAIL || DEFAULT_RECIPIENT;
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`[mailer] Nenhuma credencial SMTP configurada. O e-mail de ${entry.name} (${entry.ticket}) não foi despachado via SMTP.`);
    return {
      sent: false,
      reason: "missing_credentials",
      recipient,
      ticket: entry.ticket,
    };
  }

  const { subject, text, html } = buildEmailContent(entry);
  const senderUser = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER;

  const mailOptions = {
    from: `"Portfólio Gustavo Dias" <${senderUser}>`,
    to: recipient,
    replyTo: `${entry.name} <${entry.email}>`,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[mailer] E-mail enviado com sucesso para ${recipient} (MessageId: ${info.messageId})`);
    return {
      sent: true,
      messageId: info.messageId,
      recipient,
      ticket: entry.ticket,
    };
  } catch (err) {
    console.error(`[mailer] Erro ao enviar e-mail para ${recipient}:`, err.message);
    return {
      sent: false,
      reason: err.message,
      recipient,
      ticket: entry.ticket,
    };
  }
}
