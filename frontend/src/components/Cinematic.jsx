import { useEffect, useRef, useState } from "react";
import { frameSrc } from "../hooks/useScrollFrame.js";

function currentBeat(beats, progress) {
  for (let i = 0; i < beats.length; i += 1) {
    const b = beats[i];
    if (progress >= b.start && progress < b.end) return b;
  }
  return beats[beats.length - 1];
}

function nearestImage(images, index) {
  if (images[index]) return images[index];
  for (let d = 1; d < images.length; d += 1) {
    if (images[index + d]) return images[index + d];
    if (index - d >= 0 && images[index - d]) return images[index - d];
  }
  return null;
}

function drawCover(ctx, img, w, h) {
  const ir = img.width / img.height;
  const cr = w / h;
  let dw = w;
  let dh = h;
  let dx = 0;
  let dy = 0;
  if (ir > cr) {
    dw = h * ir;
    dx = (w - dw) / 2;
  } else {
    dh = w / ir;
    dy = (h - dh) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function clamp01(n) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function sequenceProgress(pin) {
  const rect = pin.getBoundingClientRect();
  const travel = Math.max(1, pin.offsetHeight - window.innerHeight);
  return clamp01(-rect.top / travel);
}

export default function Cinematic({ cinematic, identity }) {
  const pinRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const frameLabelRef = useRef(null);
  const progressFillRef = useRef(null);
  const pctRef = useRef(null);
  const [loadPct, setLoadPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [beat, setBeat] = useState(cinematic.beats[0]);

  const total = cinematic.frameCount;
  const titleLines = beat.title.split("\n");

  useEffect(() => {
    const pin = pinRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    if (!pin || !sticky || !canvas) return undefined;

    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    const images = new Array(total);
    let cancelled = false;
    let loaded = 0;
    let cursor = 0;
    let raf = 0;
    let lastIndex = -1;
    let viewW = 0;
    let viewH = 0;
    let lastBeatId = cinematic.beats[0].id;
    const CONCURRENCY = 12;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewW = window.innerWidth;
      viewH = window.innerHeight;
      const pw = Math.max(1, Math.round(viewW * dpr));
      const ph = Math.max(1, Math.round(viewH * dpr));
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        lastIndex = -1;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = (index, progress) => {
      const img = nearestImage(images, index);
      if (!img || !img.complete || !img.naturalWidth) return false;
      if (index !== lastIndex) {
        ctx.fillStyle = "#0b0b0c";
        ctx.fillRect(0, 0, viewW, viewH);
        drawCover(ctx, img, viewW, viewH);
        lastIndex = index;
      }

      const label = String(index + 1).padStart(3, "0");
      if (frameLabelRef.current) {
        frameLabelRef.current.textContent = `F ${label} / ${String(total).padStart(3, "0")}`;
      }
      const pct = Math.round(progress * 100);
      if (pctRef.current) pctRef.current.textContent = `${pct}%`;
      if (progressFillRef.current) {
        progressFillRef.current.style.setProperty("--p", `${pct}%`);
      }

      const nextBeat = currentBeat(cinematic.beats, progress);
      if (nextBeat.id !== lastBeatId) {
        lastBeatId = nextBeat.id;
        setBeat(nextBeat);
      }
      return true;
    };

    const pinStage = () => {
      const rect = pin.getBoundingClientRect();
      sticky.classList.remove("is-fixed", "is-end");
      if (rect.top > 0) return;
      if (rect.bottom <= window.innerHeight) {
        sticky.classList.add("is-end");
        return;
      }
      sticky.classList.add("is-fixed");
    };

    const loop = () => {
      if (cancelled) return;
      pinStage();
      const progress = sequenceProgress(pin);
      const index = Math.round(progress * (total - 1));
      paint(index, progress);
      raf = requestAnimationFrame(loop);
    };

    const bump = () => {
      loaded += 1;
      if (cancelled) return;
      setLoadPct(Math.round((loaded / total) * 100));
      if (loaded >= 4) setReady(true);
    };

    const loadNext = () => {
      if (cancelled) return;
      const i = cursor;
      cursor += 1;
      if (i >= total) return;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        images[i] = img;
        bump();
        loadNext();
      };
      img.onerror = () => {
        bump();
        loadNext();
      };
      img.src = frameSrc(i);
    };

    resize();
    for (let i = 0; i < CONCURRENCY; i += 1) loadNext();
    raf = requestAnimationFrame(loop);
    window.addEventListener("resize", resize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [cinematic.beats, total]);

  return (
    <>
      <div className={`loader ${ready ? "is-gone" : ""}`} aria-hidden={ready}>
        <div className="loader-kicker mono">SEQ. 001 — RETRATO</div>
        <div className="loader-title">
          GUSTAVO
          <br />
          PEREIRA DIAS
        </div>
        <div className="loader-bar">
          <div className="loader-fill" style={{ width: `${loadPct}%` }} />
        </div>
        <div className="loader-meta mono">
          <span>DECODIFICANDO FRAMES</span>
          <span>{loadPct}%</span>
        </div>
      </div>

      <section className="cine-pin" ref={pinRef} aria-label="Sequencia cinematografica">
        <div className="cine-sticky" ref={stickyRef}>
          <img className="cine-fallback" src={frameSrc(0)} alt="" aria-hidden="true" />
          <canvas ref={canvasRef} className="cine-canvas" />
          <div className="cine-veil" />
          <div className="cine-grain" />
          <div className="cine-side mono">
            {identity.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="cine-copy">
            <div className="cine-kicker mono">{beat.kicker}</div>
            <h1 className="cine-title">
              {titleLines.map((line, i) => (
                <span key={`${beat.id}-${i}`}>
                  {line.endsWith(".") ? (
                    <>
                      {line.slice(0, -1)}
                      <span className="accent">.</span>
                    </>
                  ) : (
                    line
                  )}
                  {i < titleLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </h1>
            <p className="cine-body">{beat.body}</p>
          </div>
          <div className="cine-hud">
            <div className="cine-frame mono" ref={frameLabelRef}>
              F 001 / {String(total).padStart(3, "0")}
            </div>
            <div className="cine-progress" aria-hidden="true">
              <span ref={progressFillRef} style={{ "--p": "0%" }} />
            </div>
            <div className="cine-frame mono" ref={pctRef}>
              0%
            </div>
          </div>
          <div className="scroll-cue mono">Role para explorar</div>
        </div>
      </section>
    </>
  );
}
