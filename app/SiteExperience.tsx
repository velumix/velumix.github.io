"use client";

import { useEffect, useState } from "react";

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
    }, 280);
    const progressTimer = window.setInterval(() => {
      setProgress((current) => Math.min(100, current + Math.ceil((100 - current) * 0.24)));
    }, 65);
    const finishTimer = window.setTimeout(() => {
      setProgress(100);
      setStep(bootSteps.length - 1);
      setIntroLeaving(true);
      document.body.classList.remove("intro-active");
      window.setTimeout(() => setIntroVisible(false), 620);
    }, 1100);

    const revealTargets = document.querySelectorAll(
      ".gallery-heading, .roblox-media-card, .case-heading, .observatory-systems article, .section-heading, .capability-grid > div, .contact",
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

    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(progressTimer);
      window.clearTimeout(finishTimer);
      window.removeEventListener("scroll", updateScroll);
      revealObserver.disconnect();
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
