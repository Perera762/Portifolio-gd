import { useEffect } from "react";

export function frameSrc(index) {
  const n = String(index + 1).padStart(3, "0");
  return `/frames/ezgif-frame-${n}.jpg`;
}

export function useReveal(ready) {
  useEffect(() => {
    if (!ready) return undefined;
    const nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [ready]);
}
