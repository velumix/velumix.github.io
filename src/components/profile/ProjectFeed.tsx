import { Icon } from "../Icon";
import {
  compact,
  filters,
  projects,
  snapshotDate,
  type Filter,
  type Project,
} from "../../data/projects";

export function ProjectFeed({
  savedOnly,
  saved,
  onSave,
  onSelect,
  query,
  onClear,
  filter,
  onFilter,
  layout,
  onLayout,
}: {
  savedOnly: boolean;
  saved: string[];
  onSave: (id: string) => void;
  onSelect: (project: Project) => void;
  query: string;
  onClear: () => void;
  filter: Filter;
  onFilter: (filter: Filter) => void;
  layout: "feed" | "grid";
  onLayout: (layout: "feed" | "grid") => void;
}) {
  const visible = projects.filter(
    (project) =>
      (!savedOnly || saved.includes(project.id)) &&
      (filter === "All work" || project.categories.includes(filter)) &&
      `${project.name} ${project.engineering.role} ${project.engineering.tags.join(" ")} ${project.engineering.summary}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <div className="project-feed">
      <div className="panel feed-controls">
        <div className="feed-title">
          <div>
            <h2>{savedOnly ? "Saved projects" : "Projects"}</h2>
            <p role="status">
              {query
                ? `${visible.length} result${visible.length === 1 ? "" : "s"} for “${query}”`
                : savedOnly
                  ? "Your collection, saved on this device"
                  : "Games I’ve helped build"}
            </p>
          </div>
          <div className="view-toggle" role="group" aria-label="Project layout">
            <button
              aria-label="Feed view"
              aria-pressed={layout === "feed"}
              onClick={() => onLayout("feed")}
            >
              <Icon name="list" />
            </button>
            <button
              aria-label="Grid view"
              aria-pressed={layout === "grid"}
              onClick={() => onLayout("grid")}
            >
              <Icon name="grid" />
            </button>
          </div>
        </div>
        <div className="work-filters" role="group" aria-label="Filter projects">
          {filters.map((item) => (
            <button
              key={item}
              aria-pressed={filter === item}
              onClick={() => onFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="panel empty-state">
          <Icon name={savedOnly && !query ? "bookmark" : "search"} />
          <h3>
            {savedOnly && saved.length === 0
              ? "Keep a project for later"
              : "No matching projects"}
          </h3>
          <p>
            {savedOnly && saved.length === 0
              ? "Use the bookmark on any project to save it here."
              : "Try another name or skill, or clear your filters."}
          </p>
          {!(savedOnly && saved.length === 0) && (
            <button className="button button-secondary" onClick={onClear}>
              Clear search & filters
            </button>
          )}
        </div>
      ) : (
        <div className={`feed-items ${layout === "grid" ? "feed-grid" : ""}`}>
          {visible.map((project) => (
            <article className="panel project-card" key={project.id}>
              <div className="project-card-top">
                <img
                  className="project-avatar"
                  src={project.cover}
                  alt=""
                  loading="lazy"
                  width="44"
                  height="44"
                />
                <div>
                  <h3>
                    <button onClick={() => onSelect(project)}>
                      {project.name}
                    </button>
                  </h3>
                  <span>
                    {project.id === "samurai"
                      ? "Combat design & gameplay"
                      : project.id === "garden"
                        ? "Gameplay & LiveOps"
                        : "Gameplay systems"}
                    <span className="meta-separator">·</span>Roblox
                  </span>
                </div>
                <button
                  className={`save-button icon-button ${saved.includes(project.id) ? "is-saved" : ""}`}
                  aria-label={`${saved.includes(project.id) ? "Unsave" : "Save"} ${project.name}`}
                  aria-pressed={saved.includes(project.id)}
                  onClick={() => onSave(project.id)}
                >
                  <Icon name="bookmark" />
                </button>
              </div>
              <p className="project-summary">{project.engineering.summary}</p>
              <button
                className="project-cover"
                aria-label={`View ${project.name} project`}
                onClick={() => onSelect(project)}
              >
                <img
                  src={project.cover}
                  alt={`${project.name} game artwork`}
                  width="768"
                  height="432"
                  loading="lazy"
                />
                <span>
                  View project <Icon name="diagonal" />
                </span>
              </button>
              <div className="project-context">
                <div className="project-tags">
                  {project.engineering.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                {project.stats && (
                  <span className="project-visits">
                    <Icon name="eye" />
                    {compact(project.stats.visits)} visits
                  </span>
                )}
              </div>
              <div className="project-card-actions">
                <button onClick={() => onSelect(project)}>
                  <Icon name="layers" />
                  My contribution
                </button>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Play ${project.name} on Roblox`}
                >
                  <Icon name="play" />
                  Play on Roblox
                  <Icon name="diagonal" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="feed-note">
        Experience metrics from Roblox · {snapshotDate}. Contributions are my
        own; experiences were built with teams.
      </p>
    </div>
  );
}
