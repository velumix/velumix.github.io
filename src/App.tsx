import { useEffect, useRef, useState } from "react";
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
import { projects, type Project, type Filter } from "./data/projects";
import { discordUrl } from "./data/links";

function readView(): View {
  const value = window.location.hash.slice(1);
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
            projects.some((project) => project.id === id),
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

export default function App() {
  const [view, setView] = useState<View>(readView);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All work");
  const [layout, setLayout] = useState<"feed" | "grid">("feed");
  const [saved, setSaved] = useState<string[]>(readSaved);
  const [theme, setTheme] = useState<"light" | "dark">(readTheme);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#18191a" : "#ffffff");
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
    const update = () => {
      setView(readView());
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
    revealPanel();
    if (location.hash !== `#${next}`) history.pushState(null, "", `#${next}`);
  }
  function save(id: string) {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }
  function searchProjects(value: string) {
    setQuery(value);
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
          <span>velumix</span>
        </button>
        <div className="global-search">
          <Icon name="search" />
          <input
            ref={search}
            type="search"
            placeholder="Search projects, skills..."
            aria-label="Search projects"
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
            <kbd>/</kbd>
          )}
        </div>
        <span className="header-context">Developer portfolio</span>
        <div className="header-actions">
          <a
            className="header-github"
            href="https://github.com/velumix"
            target="_blank"
            rel="noreferrer"
            aria-label="Velumix on GitHub"
          >
            <Icon name="github" />
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
            <Icon name="discord" />
          </a>
        </div>
      </header>
      <aside className="app-sidebar" aria-label="Portfolio navigation">
        <nav aria-label="Main navigation">
          {views.map((item) => (
            <button
              key={item.id}
              aria-label={item.label}
              className={view === item.id ? "active" : ""}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "projects" && <small>5</small>}
              {item.id === "saved" && <small>{saved.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <p className="nav-label">Find me elsewhere</p>
        <div className="sidebar-links">
          <a
            aria-label="GitHub"
            href="https://github.com/velumix"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="github" />
            <span>GitHub</span>
            <Icon name="diagonal" />
          </a>
          <a
            aria-label="Discord"
            href={discordUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="discord" />
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
          <span className="availability">
            <span />
            Open to the right project
          </span>
          <p>Gameplay, systems, and everything that makes a game feel good.</p>
        </div>
      </aside>
      <main id="main" className="app-main">
        <div className="profile-container">
          <ProfileHeader
            view={view}
            onView={navigate}
            onSelect={setSelectedProject}
            savedCount={saved.length}
          />
          <div className="profile-content">
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
                  onFilter={setFilter}
                  layout={layout}
                  onLayout={setLayout}
                />
              )}
              {view === "about" && <AboutPanel />}
              {view === "source" && <SourcePanel />}
            </section>
          </div>
        </div>
      </main>
      <nav className="mobile-app-nav" aria-label="Mobile navigation">
        {views.map((item) => (
          <button
            key={item.id}
            aria-current={view === item.id ? "page" : undefined}
            onClick={() => {
              navigate(item.id);
              document
                .querySelector(".profile-tabs")
                ?.scrollIntoView({ block: "start", behavior: "smooth" });
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
