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
      className="contact-section"
      aria-labelledby="contact-title"
    >
      <div className="shell contact-content">
        <p className="eyebrow">HAVE A PROJECT IN MIND?</p>
        <h2 id="contact-title">
          Let’s <em>talk.</em>
          <Icon name="diagonal" />
        </h2>
        <p>Tell me about the game you’re making and where I can help.</p>
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
    </section>
  );
}
