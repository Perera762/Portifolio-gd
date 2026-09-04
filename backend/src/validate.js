const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const NAME_RE = /^[\p{L}\p{M}\s.'-]{2,80}$/u;
const PHONE_RE = /^[\d\s()+.-]{8,20}$/;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateContact(body = {}) {
  const errors = {};
  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const company = clean(body.company).slice(0, 80);
  const phone = clean(body.phone);
  const subject = clean(body.subject).slice(0, 120);
  const message = clean(body.message);
  const honey = clean(body.website);

  if (honey) {
    return { ok: false, spam: true, errors: { form: "rejected" } };
  }

  if (!NAME_RE.test(name)) {
    errors.name = "Informe um nome válido (2 a 80 caracteres).";
  }

  if (!EMAIL_RE.test(email) || email.length > 120) {
    errors.email = "Informe um e-mail válido.";
  }

  if (phone && !PHONE_RE.test(phone)) {
    errors.phone = "Telefone em formato inválido.";
  }

  if (message.length < 20) {
    errors.message = "A mensagem precisa ter pelo menos 20 caracteres.";
  } else if (message.length > 2000) {
    errors.message = "A mensagem pode ter no máximo 2000 caracteres.";
  }

  if (Object.keys(errors).length) {
    return { ok: false, spam: false, errors };
  }

  return {
    ok: true,
    spam: false,
    data: {
      name,
      email,
      company: company || null,
      phone: phone || null,
      subject: subject || "Contato pelo portfólio",
      message,
    },
  };
}

export function clientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}
