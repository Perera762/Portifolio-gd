import { useEffect, useState } from "react";
import Cinematic from "./components/Cinematic.jsx";
import ContactForm from "./components/ContactForm.jsx";
import { fetchProfile } from "./fallback.js";
import { useReveal } from "./hooks/useScrollFrame.js";

const NAV = [
  { href: "#trabalhos", label: "Trabalhos" },
  { href: "#sobre", label: "Sobre" },
  { href: "#experiencia", label: "Experiência" },
  { href: "#formacao", label: "Formação" },
  { href: "#contato", label: "Contato" },
];

export default function App() {
  const [profile, setProfile] = useState(null);
  const [active, setActive] = useState("");

  useEffect(() => {
    fetchProfile().then(setProfile);
  }, []);

  useReveal(profile);

  useEffect(() => {
    const ids = NAV.map((n) => n.href.slice(1));
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [profile]);

  if (!profile) return null;

  const { identity, about, skills, experience, education, projects, cinematic } = profile;
  const project = projects[0];

  return (
    <>
      <div className="grid-bg" aria-hidden="true" />
      <nav className="site-nav">
        <div className="mark">
          G<span>•</span>D
        </div>
        <ul className="nav-links">
          {NAV.map((item) => (
            <li key={item.href}>
              <a href={item.href} className={active === item.href ? "is-active" : ""}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-dot" aria-hidden="true" />
      </nav>

      <Cinematic cinematic={cinematic} identity={identity} />

      <div className="page">
        <div className="content-wrap">
          <section className="block" id="trabalhos">
            <div className="section-head" data-reveal>
              <div>
                <div className="section-tag">Trabalhos</div>
                <h2 className="section-title">
                  Projeto
                  <br />
                  em destaque
                </h2>
              </div>
              <p className="section-note">Do desenho no Figma ao código funcionando — um sistema pensado do zero.</p>
            </div>
            <div className="work-feature" data-reveal="late">
              <div>
                <div className="work-tag mono">
                  {project.index} — {project.kind}
                </div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="stack-tags">
                  {project.stack.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                <div className="work-links">
                  <a href={project.live} target="_blank" rel="noopener noreferrer">
                    Ver site ↗
                  </a>
                  <a href={project.repo} target="_blank" rel="noopener noreferrer">
                    Ver código ↗
                  </a>
                </div>
              </div>
              <div className="work-visual">
                <div className="browser-chip">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="mono-label">
                  AGENDAR
                  <br />
                  CONSULTA
                </div>
                <div className="mono-sub mono">/ONLINE</div>
              </div>
            </div>
          </section>

          <section className="block" id="sobre">
            <div className="section-head" data-reveal>
              <div>
                <div className="section-tag">{about.tag}</div>
                <h2 className="section-title">
                  Do hardware
                  <br />
                  ao front-end
                </h2>
              </div>
              <p className="section-note">{about.note}</p>
            </div>
            <p className="bio" data-reveal>
              Estudante de <strong>Ciência da Computação</strong> com experiência sólida como Técnico de Informática em hardware e infraestrutura. Hoje uno esse conhecimento técnico de suporte ao desenvolvimento de <strong>interfaces front-end funcionais</strong> — HTML, CSS e JavaScript — sempre buscando entregar soluções de alta qualidade.
            </p>
            <div className="skills-grid">
              {skills.map((skill) => (
                <div className="skill-card" data-reveal key={skill.id}>
                  <span className="skill-mark mono">{skill.id}</span>
                  <h3>{skill.title}</h3>
                  <p>{skill.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="block" id="experiencia">
            <div className="section-head" data-reveal>
              <div>
                <div className="section-tag">Experiência</div>
                <h2 className="section-title">
                  No campo,
                  <br />
                  na prática
                </h2>
              </div>
              <p className="section-note">Dois anos e meio de mão na massa com equipamentos, redes e suporte técnico.</p>
            </div>
            <div className="timeline">
              {experience.map((item) => (
                <div className="timeline-item" data-reveal key={item.id}>
                  <div className="timeline-date mono">{item.period}</div>
                  <div className="timeline-role">
                    <h3>{item.role}</h3>
                    <p>{item.description}</p>
                  </div>
                  <div className="timeline-tag mono">{item.contract}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="block" id="formacao">
            <div className="section-head" data-reveal>
              <div>
                <div className="section-tag">Formação</div>
                <h2 className="section-title">
                  Base
                  <br />
                  construída
                </h2>
              </div>
            </div>
            <div className="grad-cols">
              <div className="grad-col" data-reveal>
                <h4>Graduação</h4>
                <div className="edu-title">{education.degree}</div>
                <div className="edu-sub">
                  {education.institution}
                  <br />
                  {education.expected}
                </div>
              </div>
              <div className="grad-col" data-reveal>
                <h4>Certificações</h4>
                <div className="tag-list">
                  {education.certifications.map((c) => (
                    <span className="tag" key={c.name}>
                      {c.name} <span className="who">— {c.issuer}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="grad-col" data-reveal>
                <h4>Idiomas</h4>
                <div className="lang-row">
                  {education.languages.map((l) => (
                    <div className="lang-item" key={l.name}>
                      <span>{l.name}</span>
                      <span className="lvl">{l.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="block" id="contato">
            <div className="contact-block">
              <div data-reveal>
                <div className="section-tag">Contato</div>
                <h2>
                  Bora trocar
                  <br />
                  uma <span className="accent">ideia?</span>
                </h2>
                <div className="contact-links">
                  <a href={`mailto:${identity.email}`}>{identity.email}</a>
                  <a href={identity.phoneHref}>{identity.phone}</a>
                  <a href={identity.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn ↗
                  </a>
                  <a href={identity.github} target="_blank" rel="noopener noreferrer">
                    GitHub ↗
                  </a>
                </div>
              </div>
              <div data-reveal="late">
                <ContactForm />
              </div>
            </div>
            <footer className="site-foot">
              <span>© 2026 {identity.name}</span>
              <span>{identity.location}</span>
            </footer>
          </section>
        </div>
      </div>
    </>
  );
}
