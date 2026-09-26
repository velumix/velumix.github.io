import { useEffect } from "react";

export function useEntranceMotion() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;

    function observe() {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      if (preference.matches) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer?.unobserve(entry.target);
            const animation = entry.target.animate(
              [
                { opacity: 0.6, transform: "translateY(18px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" },
            );
            animations.add(animation);
            animation.onfinish = () => animations.delete(animation);
          });
        },
        { threshold: 0.12 },
      );
      document
        .querySelectorAll(
          ".section-heading, .dive-copy, .tool-row, .about-content, .contact-content",
        )
        .forEach((element) => observer?.observe(element));
    }
    observe();
    preference.addEventListener("change", observe);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", observe);
      animations.forEach((animation) => animation.cancel());
    };
  }, []);
}
