import { Icon } from "../Icon";
import { snapshotDate, type Project } from "../../data/projects";
import { portfolio, workFilters, type WorkFilter } from "../../data/work";
import { SoftwareCard } from "./SoftwareCard";
import { GameCard } from "./GameCard";
import { WorkOverview } from "./WorkOverview";

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
  filter: WorkFilter;
  onFilter: (filter: WorkFilter) => void;
  layout: "feed" | "grid";
  onLayout: (layout: "feed" | "grid") => void;
}) {
  const visible = portfolio.filter(
    (project) =>
      (!savedOnly || saved.includes(project.id)) &&
      (filter === "All work" || project.category === filter) &&
      `${project.name} ${project.tags.join(" ")} ${project.summary} ${project.kind === "software" ? `${project.discipline} ${project.role} ${project.status ?? ""} ${project.details.join(" ")}` : ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const showOverview =
    !savedOnly && !query && filter === "All work" && layout === "feed";
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
                  : "Roblox gameplay, software, and open-source contributions"}
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
          {workFilters.map((item) => (
            <button
              key={item}
              aria-pressed={filter === item}
              onClick={() => onFilter(item)}
            >
              {item === "Games" ? "Roblox" : item}
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
      ) : showOverview ? (
        <WorkOverview
          saved={saved}
          onSave={onSave}
          onSelect={onSelect}
          onFilter={onFilter}
        />
      ) : (
        <div className={`feed-items ${layout === "grid" ? "feed-grid" : ""}`}>
          {visible.map((work) =>
            work.kind === "software" ? (
              <SoftwareCard
                key={work.id}
                project={work}
                saved={saved.includes(work.id)}
                onSave={onSave}
              />
            ) : (
              <GameCard
                key={work.id}
                project={work.project}
                saved={saved.includes(work.id)}
                onSave={onSave}
                onSelect={onSelect}
              />
            ),
          )}
        </div>
      )}
      {!showOverview && visible.some((work) => work.kind === "game") && (
        <p className="feed-note">
          Game metrics from Roblox · {snapshotDate}. Visits describe the whole
          experience; each project details my contribution.
        </p>
      )}
    </div>
  );
}
