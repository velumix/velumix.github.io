import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Icon } from "./components/Icon";
import { ProjectDialog } from "./components/ProjectDialog";
import {
  ProfileHeader,
  Avatar,
  views,
  type View,
} from "./components/profile/ProfileHeader";
import { ProfileInfo } from "./components/profile/ProfileInfo";
import { ProjectFeed } from "./components/profile/ProjectFeed";
import { AboutPanel, SourcePanel } from "./components/profile/ProfilePanels";
import { type Project } from "./data/projects";
import { portfolio, type WorkFilter } from "./data/work";
import { discordUrl, githubUrl } from "./data/links";
import { AccountAvatar } from "./components/profile/SocialProfiles";

const FlockingLab = lazy(() => import("./lab/FlockingLab"));

function readView(): View {
  const value = window.location.hash.slice(1).split("?")[0];
  return views.find((item) => item.id === value)?.id ?? "projects";
}
function readSaved(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("velumix:saved") ?? "[]",
    );
    return Array.isArray(value)
      ? value.filter(
          (id): id is string =>
            typeof id === "string" &&
            portfolio.some((project) => project.id === id),
        )
      : [];
  } catch {
    return [];
  }
}
function readTheme(): "light" | "dark" {
  try {
    return localStorage.getItem("velumix:appearance") === "light"
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

function readLayout(): "feed" | "grid" {
  try {
    return localStorage.getItem("velumix:layout") === "grid" ? "grid" : "feed";
  } catch {
    return "feed";
  }
}

export default function App() {
  const [view, setView] = useState<View>(readView);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WorkFilter>("All work");
  const [layout, setLayout] = useState<"feed" | "grid">(readLayout);
  const [saved, setSaved] = useState<string[]>(readSaved);
  const [theme, setTheme] = useState<"light" | "dark">(readTheme);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [saveNotice, setSaveNotice] = useState<{
    id: string;
    name: string;
    removed: boolean;
  } | null>(null);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#191b1f" : "#f6f7f9");
    try {
      localStorage.setItem("velumix:appearance", theme);
    } catch {
      /* Browsing remains available if storage is disabled. */
    }
  }, [theme]);
  useEffect(() => {
    try {
      localStorage.setItem("velumix:saved", JSON.stringify(saved));
    } catch {
      /* Keep saves for the current session. */
    }
  }, [saved]);
  useEffect(() => {
    try {
      localStorage.setItem("velumix:layout", layout);
    } catch {
      /* The selected layout still works for this visit. */
    }
  }, [layout]);
  useEffect(() => {
    if (!saveNotice) return;
    const timer = window.setTimeout(() => setSaveNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [saveNotice]);
  useEffect(() => {
    const update = () => {
      const next = readView();
      setView(next);
      if (next === "lab") window.scrollTo({ top: 0, behavior: "instant" });
      setQuery("");
      setFilter("All work");
    };
    window.addEventListener("hashchange", update);
    const shortcut = (event: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) return;
      const target = event.target as HTMLElement;
      if (
        (event.key === "k" && (event.ctrlKey || event.metaKey)) ||
        (event.key === "/" &&
          !["INPUT", "TEXTAREA"].includes(target.tagName) &&
          !target.isContentEditable)
      ) {
        event.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);
  function revealPanel() {
    requestAnimationFrame(() => {
      const tabs = document.querySelector(".profile-tabs");
      if (tabs && tabs.getBoundingClientRect().top < 66) {
        window.scrollTo({
          top: window.scrollY + tabs.getBoundingClientRect().top - 76,
          behavior: "instant",
        });
      }
    });
  }
  function navigate(next: View) {
    setView(next);
    setQuery("");
    setFilter("All work");
    if (next === "lab") window.scrollTo({ top: 0, behavior: "instant" });
    else revealPanel();
    if (location.hash !== `#${next}`) history.pushState(null, "", `#${next}`);
  }
  function save(id: string) {
    const project = portfolio.find((item) => item.id === id);
    if (!project) return;
    setSaveNotice({ id, name: project.name, removed: saved.includes(id) });
    setSaved((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }
  function searchProjects(value: string) {
    setQuery(value);
    setFilter("All work");
    revealPanel();
    if (view !== "projects" && view !== "saved") {
      setView("projects");
      history.replaceState(null, "", "#projects");
    }
  }
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="app-header">
        <button
          className="app-brand"
          onClick={() => {
            navigate("projects");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Velumix home"
        >
          <Avatar small />
          <span>
            velumix<span className="brand-suffix"> / portfolio</span>
          </span>
        </button>
        <div className="global-search">
          <Icon name="search" />
          <input
            ref={search}
            type="search"
            placeholder="Search projects, skills..."
            aria-label="Search projects"
            aria-keyshortcuts="Control+k Meta+k /"
            value={query}
            onChange={(event) => searchProjects(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setQuery("");
                search.current?.blur();
              }
            }}
          />
          {query ? (
            <button
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                search.current?.focus();
              }}
            >
              <Icon name="close" />
            </button>
          ) : (
            <kbd>Ctrl K</kbd>
          )}
        </div>
        <span className="header-context">
          <Icon name={views.find((item) => item.id === view)!.icon} />
          {views.find((item) => item.id === view)!.label}
        </span>
        <div className="header-actions">
          <a
            className="header-github"
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Velumix on GitHub"
          >
            <AccountAvatar provider="github" />
          </a>
          <button
            className="icon-button theme-toggle"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Icon name={theme === "light" ? "moon" : "sun"} />
          </button>
          <a
            className="header-message"
            href={discordUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Message Velumix on Discord"
          >
            <AccountAvatar provider="discord" />
          </a>
        </div>
      </header>
      <aside className="app-sidebar" aria-label="Portfolio navigation">
        <p className="nav-label">Explore</p>
        <nav aria-label="Main navigation">
          {views.map((item) => (
            <button
              key={item.id}
              aria-label={item.label}
              title={item.label}
              className={view === item.id ? "active" : ""}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "projects" && <small>{portfolio.length}</small>}
              {item.id === "saved" && <small>{saved.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <p className="nav-label">Find me elsewhere</p>
        <div className="sidebar-links">
          <a
            aria-label="GitHub"
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
          >
            <AccountAvatar provider="github" />
            <span>GitHub</span>
            <Icon name="diagonal" />
          </a>
          <a
            aria-label="Discord"
            href={discordUrl}
            target="_blank"
            rel="noreferrer"
          >
            <AccountAvatar provider="discord" />
            <span>Discord</span>
            <Icon name="diagonal" />
          </a>
          <a aria-label="Engineering docs" href="/observatory/">
            <Icon name="layers" />
            <span>Engineering docs</span>
            <Icon name="diagonal" />
          </a>
        </div>
        <div className="sidebar-bottom">
          <button className="sidebar-lab" onClick={() => navigate("lab")}>
            <Icon name="orbit" />
            <strong>A little room to experiment</strong>
            <span>
              Explore the interactive systems lab <Icon name="arrow" />
            </span>
          </button>
          <span className="availability">
            <span />
            Open to the right project
          </span>
          <p>Software, developer tools, interfaces, and games.</p>
        </div>
      </aside>
      <main
        id="main"
        className={`app-main${view === "lab" ? " app-main-lab" : ""}`}
      >
        {view === "lab" ? (
          <Suspense
            fallback={
              <div className="panel" style={{ padding: 32 }} role="status">
                Opening the Aquatica lab…
              </div>
            }
          >
            <FlockingLab />
          </Suspense>
        ) : (
          <div className="profile-container">
            <div className="workspace-heading">
              <span>
                <Icon name="briefcase" /> The portfolio <span>/</span>{" "}
                {views.find((item) => item.id === view)!.label}
              </span>
              <span className="availability">
                <span /> Open to the right project
              </span>
            </div>
            <ProfileHeader
              view={view}
              onView={navigate}
              onSelect={setSelectedProject}
              savedCount={saved.length}
              onSearch={searchProjects}
              activeQuery={query}
            />
            <div
              className={`profile-content${view === "projects" || view === "saved" ? " profile-content-work" : ""}`}
            >
              <ProfileInfo onView={navigate} />
              <section
                id="profile-panel"
                role="tabpanel"
                aria-labelledby={`tab-${view}`}
                tabIndex={0}
                className="profile-panel"
              >
                {(view === "projects" || view === "saved") && (
                  <ProjectFeed
                    savedOnly={view === "saved"}
                    saved={saved}
                    onSave={save}
                    onSelect={setSelectedProject}
                    query={query}
                    onClear={() => {
                      setQuery("");
                      setFilter("All work");
                    }}
                    filter={filter}
                    onFilter={(next) => {
                      setFilter(next);
                      revealPanel();
                    }}
                    layout={layout}
                    onLayout={setLayout}
                  />
                )}
                {view === "about" && <AboutPanel />}
                {view === "source" && (
                  <SourcePanel saved={saved} onSave={save} />
                )}
              </section>
            </div>
          </div>
        )}
      </main>
      <nav className="mobile-app-nav" aria-label="Mobile navigation">
        {views.map((item) => (
          <button
            key={item.id}
            aria-current={view === item.id ? "page" : undefined}
            onClick={() => {
              navigate(item.id);
              if (item.id !== "lab") {
                requestAnimationFrame(() =>
                  document
                    .querySelector(".profile-tabs")
                    ?.scrollIntoView({ block: "start", behavior: "instant" }),
                );
              }
            }}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.id === "saved" && saved.length > 0 && (
              <small>{saved.length}</small>
            )}
          </button>
        ))}
      </nav>
      <div
        className="save-feedback"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {saveNotice && (
          <div className="save-toast">
            <Icon name={saveNotice.removed ? "bookmark" : "check"} />
            <span>
              {saveNotice.name}{" "}
              {saveNotice.removed ? "removed from saved" : "saved for later"}
            </span>
            <button
              onClick={() => {
                setSaved((current) =>
                  saveNotice.removed
                    ? [...new Set([...current, saveNotice.id])]
                    : current.filter((id) => id !== saveNotice.id),
                );
                setSaveNotice(null);
              }}
            >
              Undo
            </button>
            <button
              className="toast-dismiss"
              aria-label="Dismiss saved project notification"
              onClick={() => setSaveNotice(null)}
            >
              <Icon name="close" />
            </button>
          </div>
        )}
      </div>
      {selectedProject && (
        <ProjectDialog
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onNavigate={setSelectedProject}
        />
      )}
    </>
  );
}
