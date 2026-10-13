import { Icon, type IconName } from "../Icon";
import { discordUrl, githubUrl } from "../../data/links";
import { portfolio } from "../../data/work";
import {
  projects,
  compact,
  totalVisits,
  type Project,
} from "../../data/projects";

export const views = [
  { id: "projects", label: "Projects", icon: "briefcase" },
  { id: "lab", label: "Systems lab", icon: "orbit" },
  { id: "about", label: "Experience", icon: "user" },
  { id: "source", label: "Open source", icon: "code" },
  { id: "saved", label: "Saved", icon: "bookmark" },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  icon: IconName;
}>;
export type View = (typeof views)[number]["id"];

export function Avatar({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`avatar${small ? " avatar-small" : ""}`}
      aria-hidden="true"
    >
      <img
        src="/images/brand/logo-128.webp"
        alt=""
        width={small ? "32" : "48"}
        height={small ? "32" : "48"}
        decoding="async"
      />
    </span>
  );
}

export function ProfileHeader({
  view,
  onView,
  onSelect,
  savedCount,
  onSearch,
  activeQuery = "",
}: {
  view: View;
  onView: (view: View) => void;
  onSelect: (project: Project) => void;
  savedCount: number;
  onSearch?: (query: string) => void;
  activeQuery?: string;
}) {
  return (
    <section className="profile-card" aria-labelledby="intro-title">
      <div className="portfolio-intro">
        <div className="intro-copy">
          <p className="intro-role">Software & gameplay engineer</p>
          <h1 id="intro-title" className="intro-statement">
            Tools for builders.
            <br />
            <span>Worlds for players.</span>
          </h1>
          <p className="intro-description">
            I build developer tools, thoughtful interfaces, and the systems that
            bring games to life. Made with care, from Canada.
          </p>
          <div className="intro-actions">
            <a
              className="button button-primary"
              href={discordUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="discord" />
              Let’s build something
              <Icon name="diagonal" />
            </a>
            <a
              className="button button-secondary"
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="github" />
              GitHub
            </a>
          </div>
          <div className="intro-chips" role="group" aria-label="Core technologies">
            {["Rust", "C#", "Go", "React", "Luau"].map((tech) => {
              const active = activeQuery.trim().toLowerCase() === tech.toLowerCase();
              return (
                <button
                  key={tech}
                  type="button"
                  className={`intro-chip${active ? " is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => onSearch?.(active ? "" : tech)}
                  title={active ? `Clear ${tech} filter` : `Filter portfolio by ${tech}`}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </div>
        <button
          className="intro-showcase"
          onClick={() => onSelect(projects[0])}
          aria-label="Explore Aquatica Observatory"
        >
          <span className="showcase-toolbar">
            <span>
              <Icon name="gamepad" /> A world I helped build
            </span>
            <Icon name="diagonal" />
          </span>
          <span className="showcase-art">
            <picture>
              <source srcSet="/images/aquatica.webp" type="image/webp" />
              <img
                src="/images/aquatica.png"
                alt="The underwater world of Aquatica Observatory"
                width="768"
                height="432"
                fetchPriority="high"
              />
            </picture>
            <span className="showcase-caption">
              <span>Gameplay · Simulation</span>
              <strong>Aquatica Observatory</strong>
            </span>
          </span>
          <span className="showcase-footer">
            Discover the systems behind the scenery
            <Icon name="arrow" />
          </span>
        </button>
      </div>
      <div className="portfolio-facts" aria-label="Portfolio at a glance">
        <div>
          <strong>7+</strong>
          <span>years building on Roblox</span>
        </div>
        <div>
          <strong>{projects.length}</strong>
          <span>game experiences</span>
        </div>
        <div>
          <strong>{compact(totalVisits)}</strong>
          <span>visits across games I’ve worked on</span>
        </div>
        <a href={githubUrl} target="_blank" rel="noreferrer">
          <Icon name="code" />
          <span>Built in the open</span>
          <Icon name="diagonal" />
        </a>
      </div>
      <div
        className="profile-tabs"
        role="tablist"
        aria-label="Profile sections"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const current = views.findIndex((item) => item.id === view);
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? views.length - 1
                : (current +
                    (event.key === "ArrowRight" ? 1 : -1) +
                    views.length) %
                  views.length;
          onView(views[next].id);
          event.currentTarget
            .querySelectorAll<HTMLButtonElement>("button")
            [next]?.focus();
        }}
      >
        {views.map((item) => (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            role="tab"
            aria-selected={view === item.id}
            aria-controls="profile-panel"
            tabIndex={view === item.id ? 0 : -1}
            onClick={() => onView(item.id)}
          >
            <Icon name={item.icon} />
            {item.label}
            {item.id === "projects" && <span>{portfolio.length}</span>}
            {item.id === "saved" && savedCount > 0 && <span>{savedCount}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
