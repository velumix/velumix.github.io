import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { discordUrl } from "../data/links";

export function Contact() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 4000);
    return () => window.clearTimeout(timer);
  }, [copyState]);
  async function copyHandle() {
    try {
      await navigator.clipboard.writeText("velumix");
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }
  return (
    <section
      id="contact"
      className="contact-section shell"
      aria-labelledby="contact-title"
    >
      <div className="contact-grid" aria-hidden="true" />
      <div className="contact-content">
        <p className="eyebrow">
          <span className="status-dot" /> LET’S MAKE SOMETHING WORTH PLAYING
        </p>
        <h2 id="contact-title">
          Got a good idea?
          <br />
          Let’s <span>build it.</span>
        </h2>
        <p>
          I’m interested in teams that care about great gameplay
          <br className="desktop-break" /> and the craft behind it. Tell me what
          you’re working on.
        </p>
        <div className="contact-actions">
          <a
            className="button button-primary"
            href={discordUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="discord" /> Say hello on Discord{" "}
            <Icon name="diagonal" />
          </a>
          <button
            type="button"
            className="copy-handle"
            onClick={copyHandle}
            aria-label="Copy Discord username velumix"
          >
            @velumix <Icon name={copyState === "copied" ? "check" : "copy"} />
          </button>
        </div>
        <span className="copy-feedback" role="status">
          {copyState === "copied"
            ? "Username copied!"
            : copyState === "failed"
              ? "Couldn’t copy automatically. My Discord username is velumix."
              : ""}
        </span>
      </div>
      <span className="contact-asterisk" aria-hidden="true">
        ✳
      </span>
      <div className="contact-bottom">
        <span>CANADA ↔ EVERYWHERE</span>
        <span>GREAT GAMES START WITH A CONVERSATION.</span>
      </div>
    </section>
  );
}
