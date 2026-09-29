import { Icon, type IconName } from "../Icon";
import { discordUrl, githubUrl } from "../../data/links";
import { portfolio } from "../../data/work";
import { projects, type Project } from "../../data/projects";
import { AccountAvatar } from "./SocialProfiles";

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
        src="/images/velumix-logo.png"
        alt=""
        width="1254"
        height="1254"
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
}: {
  view: View;
  onView: (view: View) => void;
  onSelect: (project: Project) => void;
  savedCount: number;
}) {
  return (
    <section className="profile-card" aria-labelledby="profile-name">
      <div className="profile-cover">
        <img
          src="/images/aquatica.png"
          alt="The underwater world of Aquatica Observatory"
          width="768"
          height="432"
          fetchPriority="high"
        />
        <div className="cover-shade" />
        <button className="cover-credit" onClick={() => onSelect(projects[0])}>
          <Icon name="gamepad" />
          <span>Aquatica Observatory</span>
          <Icon name="diagonal" />
        </button>
      </div>
      <div className="profile-identity">
        <div className="profile-avatar">
          <Avatar />
          <span className="online-dot" title="Open to projects" />
        </div>
        <div className="profile-name">
          <h1 id="profile-name">Velumix</h1>
          <p>Software & gameplay engineer</p>
          <div className="profile-meta">
            <span>Canada</span>
            <span>7+ years on Roblox</span>
            <span>Open-source contributor</span>
          </div>
        </div>
        <div className="profile-actions">
          <a
            className="button button-primary"
            href={discordUrl}
            target="_blank"
            rel="noreferrer"
          >
            <AccountAvatar provider="discord" />
            Message me
          </a>
          <a
            className="button button-secondary"
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
          >
            <AccountAvatar provider="github" />
            GitHub
            <Icon name="diagonal" />
          </a>
        </div>
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
            {item.label}
            {item.id === "projects" && <span>{portfolio.length}</span>}
            {item.id === "saved" && savedCount > 0 && <span>{savedCount}</span>}
          </button>
        ))}
        <span className="profile-availability">
          <span />
          Open to projects
        </span>
      </div>
    </section>
  );
}
