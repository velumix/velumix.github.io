import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { compact, totalVisits } from "../../data/projects";
import { softwareProjects } from "../../data/work";
import { SocialProfileCard, useSocialProfiles } from "./SocialProfiles";
import type { View } from "./ProfileHeader";

export function ProfileInfo({ onView }: { onView: (view: View) => void }) {
  const { discord } = useSocialProfiles();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 4000);
    return () => clearTimeout(timer);
  }, [copyState]);
  async function copy() {
    if (!discord) return;
    try {
      await navigator.clipboard.writeText(discord.username);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }
  return (
    <aside className="profile-info" aria-label="Profile information">
      <section className="panel intro-panel">
        <h2>Intro</h2>
        <p>
          I build gameplay systems, software, and developer tools. Seven-plus
          years on Roblox sit alongside my work in native apps, code
          intelligence, and interactive interfaces.
        </p>
        <ul className="intro-details">
          <li>
            <Icon name="briefcase" />
            <span>Software & gameplay engineering</span>
          </li>
          <li>
            <Icon name="pin" />
            <span>
              Based in <strong>Canada</strong>
            </span>
          </li>
          <li>
            <Icon name="github" />
            <span>
              <strong>
                {
                  softwareProjects.filter(
                    (project) => project.role === "Personal project",
                  ).length
                }{" "}
                software projects
              </strong>{" "}
              and open-source contributions
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
          Explore my experience
        </button>
      </section>
      <section className="panel expertise-panel">
        <h2>What I work on</h2>
        <div className="expertise-chips">
          {[
            "Rust",
            "C# / .NET",
            "Go",
            "React",
            "TypeScript",
            "Luau",
            "Agent systems",
            "Developer tools",
            "Gameplay",
          ].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </section>
      <section className="panel contact-panel">
        <h2>Let’s connect</h2>
        <p>Have a project in mind? Tell me what you’re building.</p>
        <div className="account-cards">
          <SocialProfileCard provider="discord" />
          <SocialProfileCard provider="github" />
        </div>
        {discord && (
          <button
            className="copy-handle"
            onClick={copy}
            aria-label={`Copy Discord username ${discord.username}`}
          >
            <Icon name={copyState === "copied" ? "check" : "copy"} />
            {copyState === "copied" ? "Username copied!" : "Copy username"}
          </button>
        )}
        <span role="status" className="copy-feedback">
          {copyState === "failed"
            ? `Couldn’t copy automatically. My Discord username is ${discord?.username}.`
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
