import { Icon, type IconName } from "../Icon";
import { discordUrl } from "../../data/links";
import { projects, type Project } from "../../data/projects";

export const views = [
  { id: "projects", label: "Projects", icon: "gamepad" },
  { id: "about", label: "About", icon: "user" },
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
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="m3 6 9 21h7L10 6H3Zm16 0-5 11 4 10L29 6H19Z"
          fill="currentColor"
        />
      </svg>
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
          fetchPriority="high"
          width="768"
          height="432"
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
          <p>Gameplay & software engineer</p>
          <div className="profile-meta">
            <span>Canada</span>
            <span>7+ years on Roblox</span>
            <span>5 experiences</span>
          </div>
        </div>
        <div className="profile-actions">
          <a
            className="button button-primary"
            href={discordUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="discord" />
            Message me
          </a>
          <a
            className="button button-secondary"
            href="https://github.com/velumix"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="github" />
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
            {item.id === "projects" && <span>5</span>}
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
