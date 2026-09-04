export const fallbackProfile = {
  identity: {
    name: "Gustavo Pereira Dias",
    shortName: "Gustavo",
    mark: "G•D",
    role: "Front-End & QA Tester",
    headline: "Garanto código. E qualidade.",
    location: "São Paulo, BR",
    coordinates: "23.55°S · 46.63°O",
    plate: "Nº 004 — G. PEREIRA DIAS",
    email: "pereragustavo13@gmail.com",
    phone: "(11) 98785-3840",
    phoneHref: "tel:+5511987853840",
    linkedin: "https://www.linkedin.com/in/gustavo-pereiraa",
    github: "https://github.com/Perera762",
    tags: ["CAMPO", "CÓDIGO", "DESIGN", "DETALHE"],
  },
  hero: {
    eyebrow: "PORTFÓLIO — SÃO PAULO, BR",
    credentials: "ESTUDANTE DE CIÊNCIA DA COMPUTAÇÃO · FRONT-END & QA Tester",
    lede: "Atuo na validação, testes e estabilidade de software. Quality Assurance e análise técnica — o mesmo rigor para identificar falhas antes da produção é o que garante experiências fluidas e sistemas confiáveis.",
  },
  about: {
    tag: "Sobre & Stack",
    title: "Do hardware ao front-end",
    note: "Perfil analítico e organizado, focado em resolver problema rápido — seja num rack de servidor, seja num layout que não fecha.",
    bio: "Estudante de Ciência da Computação com experiência sólida como Técnico de Informática em hardware e infraestrutura. Hoje uno esse conhecimento técnico de suporte ao desenvolvimento de interfaces front-end funcionais — HTML, CSS e JavaScript — sempre buscando entregar soluções de alta qualidade.",
  },
  skills: [
    { id: "01", title: "Front-End", text: "HTML, CSS e JavaScript aplicados a interfaces funcionais e bem construídas." },
    { id: "02", title: "Hardware & Infra", text: "Montagem, manutenção e suporte técnico em equipamentos de TI e infraestrutura." },
    { id: "03", title: "Lógica & Backend", text: "Base em Python e lógica de programação, com fundamentos em Java." },
    { id: "04", title: "Segurança", text: "Fundamentos de segurança da informação aplicados ao dia a dia técnico." },
  ],
  experience: [
    {
      id: "unita",
      period: "02/2026 — 09/2026",
      role: "Suporte Técnico · Unita Engenharia",
      description: "Suporte técnico N1, N2 e N3, manutenção do site interno da empresa, desenvolvimento em PHP, manipulação de banco de dados e segurança.",
      contract: "CLT",
    },
    {
      id: "td",
      period: "02/2024 — 11/2025",
      role: "Técnico de Informática · TD de Tudo",
      description: "Montagem, manutenção e suporte técnico em equipamentos de TI e infraestrutura.",
      contract: "CLT",
    },
    {
      id: "freelance",
      period: "03/2023 — 01/2024",
      role: "Técnico de Informática",
      description: "Montagem, manutenção e reparo de computadores e periféricos como freelancer.",
      contract: "Freelance",
    },
  ],
  education: {
    degree: "Ciência da Computação",
    institution: "Universidade Cidade de São Paulo",
    expected: "Conclusão prevista — Dez/2027",
    certifications: [
      { name: "Full Stack", issuer: "Jinx" },
      { name: "Java Fundamentals", issuer: "Oracle" },
      { name: "Segurança da Informação", issuer: "Cisco" },
      { name: "Python & Lógica", issuer: "Hashtag" },
    ],
    languages: [
      { name: "Português", level: "Nativo" },
      { name: "Inglês", level: "Intermediário" },
      { name: "Espanhol", level: "Intermediário" },
    ],
  },
  projects: [
    {
      id: "agendar-consulta",
      index: "01",
      kind: "PRODUTO WEB",
      title: "Agendar Consulta Online",
      description: "Sistema de agendamento de consultas online, desenhado no Figma e implementado como aplicação web funcional — do wireframe à interface navegável.",
      stack: ["React", "TypeScript", "Vite", "Figma"],
      live: "https://jab-clink-05703139.figma.site/",
      repo: "https://github.com/Perera762/Agendarconsultaonlinecommunityayuatulizado",
    },
  ],
  cinematic: {
    frameCount: 240,
    beats: [
      { id: "open", start: 0, end: 0.16, kicker: "PORTFÓLIO — SÃO PAULO, BR", title: "GARANTO\nCÓDIGO.\nE QUALIDADE", body: "Role para entrar no retrato." },
      { id: "approach", start: 0.16, end: 0.38, kicker: "01 — APROXIMAÇÃO", title: "QUALIDADE\nCOMEÇA NO\nDETALHE", body: "O mesmo olhar que encontra falha no hardware encontra falha no código." },
      { id: "focus", start: 0.38, end: 0.62, kicker: "02 — FOCO", title: "QA · TESTES\nESTABILIDADE", body: "Validação antes da produção. Experiências fluidas, sistemas confiáveis." },
      { id: "close", start: 0.62, end: 0.84, kicker: "03 — CLOSE", title: "ENXERGO\nFALHAS ANTES\nDA PRODUÇÃO", body: "Ciência da Computação · Front-end & QA Tester" },
      { id: "hold", start: 0.84, end: 1, kicker: "Nº 004 — G. PEREIRA DIAS", title: "GUSTAVO\nPEREIRA\nDIAS", body: "São Paulo, BR — 23.55°S · 46.63°O" },
    ],
  },
};

const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export async function fetchProfile() {
  try {
    const res = await fetch(`${apiUrl}/api/profile`);
    if (!res.ok) throw new Error("bad status");
    const json = await res.json();
    if (json?.ok && json.data) return json.data;
  } catch {
    /* fallback */
  }
  return fallbackProfile;
}

export async function sendContact(payload) {
  const res = await fetch(`${apiUrl}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) {
    const err = new Error(json.error || "Falha ao enviar.");
    err.status = res.status;
    err.errors = json.errors || {};
    throw err;
  }
  return json.data;
}
