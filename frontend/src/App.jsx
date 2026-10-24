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
                  <a
                    href={identity.whatsappHref || `https://wa.me/5511989825967?text=Ol%C3%A1%2C%20Gustavo!%20Vim%20pelo%20seu%20portf%C3%B3lio.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-link-wa"
                  >
                    <span className="wa-chip mono">WHATSAPP</span>
                    <span className="wa-number">{identity.whatsapp || identity.phone}</span>
                    <span className="arrow">↗</span>
                  </a>
                  <a href={`mailto:${identity.email}`}>{identity.email}</a>
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
      <a
        href={identity.whatsappHref || `https://wa.me/5511989825967?text=Ol%C3%A1%2C%20Gustavo!%20Vim%20pelo%20seu%20portf%C3%B3lio.`}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-wa"
        aria-label="Conversar no WhatsApp"
        title="Conversar no WhatsApp: (11) 98982-5967"
      >
        <span className="floating-wa-dot" aria-hidden="true" />
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        <span className="floating-wa-text mono">CONVERSAR NO WHATSAPP</span>
        <span className="floating-wa-arrow" aria-hidden="true">↗</span>
      </a>
    </>
  );
}
