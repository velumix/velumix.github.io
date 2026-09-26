import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { compact, totalVisits } from "../../data/projects";
import { discordUrl } from "../../data/links";
import type { View } from "./ProfileHeader";

export function ProfileInfo({ onView }: { onView: (view: View) => void }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 4000);
    return () => clearTimeout(timer);
  }, [copyState]);
  async function copy() {
    try {
      await navigator.clipboard.writeText("velumix");
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }
  return (
    <aside className="profile-info" aria-label="Profile information">
      <section className="panel intro-panel">
        <h2>Intro</h2>
        <p>I build the movement, combat, and systems behind Roblox games.</p>
        <ul className="intro-details">
          <li>
            <Icon name="briefcase" />
            <span>Gameplay & software engineering</span>
          </li>
          <li>
            <Icon name="pin" />
            <span>
              Based in <strong>Canada</strong>
            </span>
          </li>
          <li>
            <Icon name="clock" />
            <span>
              <strong>7+ years</strong> building on Roblox
            </span>
          </li>
          <li>
            <Icon name="eye" />
            <span>
              <strong>{compact(totalVisits)} visits</strong> across games I’ve
              contributed to
            </span>
          </li>
        </ul>
        <button
          className="button button-secondary full-width"
          onClick={() => onView("about")}
        >
          More about me
        </button>
      </section>
      <section className="panel expertise-panel">
        <h2>What I work on</h2>
        <div className="expertise-chips">
          {[
            "Gameplay",
            "Luau",
            "Physics",
            "Creature AI",
            "Networking",
            "Developer tools",
          ].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </section>
      <section className="panel contact-panel">
        <h2>Let’s connect</h2>
        <p>Have a project in mind? Tell me what you’re building.</p>
        <a
          className="contact-link"
          href={discordUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span className="contact-icon">
            <Icon name="discord" />
          </span>
          <span>
            <strong>Discord</strong>
            <small>@velumix</small>
          </span>
          <Icon name="diagonal" />
        </a>
        <button
          className="copy-handle"
          onClick={copy}
          aria-label="Copy Discord username velumix"
        >
          <Icon name={copyState === "copied" ? "check" : "copy"} />
          {copyState === "copied" ? "Username copied!" : "Copy username"}
        </button>
        <span role="status" className="copy-feedback">
          {copyState === "failed"
            ? "Couldn’t copy automatically. My Discord username is velumix."
            : copyState === "copied"
              ? "Copied to clipboard"
              : ""}
        </span>
      </section>
      <div className="rail-footer">
        <span>© {new Date().getFullYear()} Velumix</span>
        <a href="/observatory/">
          Engineering docs <Icon name="diagonal" />
        </a>
        <span>Built with React & Vite</span>
      </div>
    </aside>
  );
}
