import { useState } from "react";
import { sendContact } from "../fallback.js";

const empty = {
  name: "",
  email: "",
  company: "",
  phone: "",
  subject: "",
  message: "",
  website: "",
};

export default function ContactForm() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [ticket, setTicket] = useState(null);
  const [fail, setFail] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setErrors({});
    setFail("");
    try {
      const data = await sendContact(form);
      setTicket(data.ticket);
      setStatus("ok");
      setForm(empty);
    } catch (err) {
      if (err.errors && Object.keys(err.errors).length) {
        setErrors(err.errors);
        setStatus("idle");
      } else {
        setFail(err.message || "Falha ao enviar.");
        setStatus("idle");
      }
    }
  };

  if (status === "ok") {
    return (
      <div className="form-ok">
        Mensagem recebida. Protocolo{" "}
        <span className="ticket">{ticket}</span>.
        <br />
        <strong>Gustavo responde em breve.</strong>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <input
        className="hp"
        tabIndex={-1}
        autoComplete="off"
        name="website"
        value={form.website}
        onChange={onChange}
      />
      <div className="form-row">
        <div className="field">
          <label htmlFor="name">Nome</label>
          <input id="name" name="name" value={form.name} onChange={onChange} required />
          {errors.name ? <span className="err">{errors.name}</span> : null}
        </div>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} required />
          {errors.email ? <span className="err">{errors.email}</span> : null}
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="company">Empresa</label>
          <input id="company" name="company" value={form.company} onChange={onChange} />
        </div>
        <div className="field">
          <label htmlFor="phone">Telefone</label>
          <input id="phone" name="phone" value={form.phone} onChange={onChange} />
          {errors.phone ? <span className="err">{errors.phone}</span> : null}
        </div>
      </div>
      <div className="field">
        <label htmlFor="subject">Assunto</label>
        <input id="subject" name="subject" value={form.subject} onChange={onChange} />
      </div>
      <div className="field">
        <label htmlFor="message">Mensagem</label>
        <textarea id="message" name="message" rows="5" value={form.message} onChange={onChange} required />
        {errors.message ? <span className="err">{errors.message}</span> : null}
      </div>
      {fail ? <div className="err">{fail}</div> : null}
      <button className="submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Enviando…" : "Enviar mensagem"}
      </button>
    </form>
  );
}
