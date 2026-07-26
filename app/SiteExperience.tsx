"use client";

import { useEffect, useRef, useState } from "react";

const bootSteps = [
  "Loading shipped experiences",
  "Connecting gameplay systems",
  "Portfolio online",
];

export default function SiteExperience() {
  const [introVisible, setIntroVisible] = useState(false);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(8);
  const pointerFrame = useRef<number | null>(null);

  useEffect(() => {
    const hasPlayed = window.sessionStorage.getItem("velumix-intro-played") === "1";
    if (!hasPlayed && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIntroVisible(true);
      document.body.classList.add("intro-active");
      window.sessionStorage.setItem("velumix-intro-played", "1");
    }
    document.body.classList.add("effects-ready");

    const stepTimer = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, bootSteps.length - 1));
    }, 360);
    const progressTimer = window.setInterval(() => {
      setProgress((current) => Math.min(100, current + Math.ceil((100 - current) * 0.24)));
    }, 70);
    const finishTimer = window.setTimeout(() => {
      setProgress(100);
      setStep(bootSteps.length - 1);
      setIntroLeaving(true);
      document.body.classList.remove("intro-active");
      window.setTimeout(() => setIntroVisible(false), 620);
    }, 1450);

    const revealTargets = document.querySelectorAll(
      ".proof-heading, .proof-grid article, .gallery-heading, .roblox-media-card, .case-heading, .case-stats, .observatory-systems article, .architecture, .section-heading, .capability-grid > div, .team-value blockquote, .contact",
    );
    revealTargets.forEach((element) => element.classList.add("reveal-ready"));
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.06 },
    );
    revealTargets.forEach((element) => revealObserver.observe(element));

    const updateScroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty(
        "--scroll-progress",
        String(available > 0 ? window.scrollY / available : 0),
      );
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });

    const updatePointer = (event: PointerEvent) => {
      if (pointerFrame.current) cancelAnimationFrame(pointerFrame.current);
      pointerFrame.current = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
        document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
        const card = (event.target as HTMLElement).closest<HTMLElement>(
          ".roblox-media-card, .proof-grid article, .capability-grid > div",
        );
        if (card) {
          const bounds = card.getBoundingClientRect();
          card.style.setProperty("--card-x", `${event.clientX - bounds.left}px`);
          card.style.setProperty("--card-y", `${event.clientY - bounds.top}px`);
        }
      });
    };
    window.addEventListener("pointermove", updatePointer, { passive: true });

    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(progressTimer);
      window.clearTimeout(finishTimer);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("pointermove", updatePointer);
      revealObserver.disconnect();
      if (pointerFrame.current) cancelAnimationFrame(pointerFrame.current);
      document.body.classList.remove("effects-ready", "intro-active");
    };
  }, []);

  const skipIntro = () => {
    setIntroLeaving(true);
    document.body.classList.remove("intro-active");
    window.setTimeout(() => setIntroVisible(false), 620);
  };

  return (
    <>
      <div className="scroll-progress" aria-hidden="true"><span /></div>
      <div className="pointer-aura" aria-hidden="true" />
      {introVisible && (
        <div className={`site-intro${introLeaving ? " leaving" : ""}`} role="dialog" aria-label="Loading Velumix portfolio" aria-modal="true">
          <div className="intro-grid" aria-hidden="true" />
          <div className="intro-signal" aria-hidden="true"><i /><i /><span>V</span></div>
          <div className="intro-copy">
            <p>Gameplay systems / software engineering</p>
            <h1>VELUMIX</h1>
            <div className="intro-status">
              <span>{String(step + 1).padStart(2, "0")}</span>
              <strong>{bootSteps[step]}</strong><em>{progress}%</em>
            </div>
            <div className="intro-bar"><span style={{ width: `${progress}%` }} /></div>
          </div>
          <button type="button" className="intro-skip" onClick={skipIntro}>Enter now</button>
        </div>
      )}
    </>
  );
}
