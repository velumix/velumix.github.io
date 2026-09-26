import { useState } from "react";
import { Icon } from "./Icon";
import {
  compact,
  filters,
  projects,
  snapshotDate,
  type Filter,
  type Project,
} from "../data/projects";

function ProjectCard({
  project,
  index,
  onSelect,
}: {
  project: Project;
  index: number;
  onSelect: (project: Project) => void;
}) {
  return (
    <article className={`project-card project-${project.id}`}>
      <button
        type="button"
        className="project-cover"
        onClick={() => onSelect(project)}
        aria-label={`View ${project.name} project`}
      >
        <img
          src={project.cover}
          alt={`${project.name} game artwork`}
          loading="lazy"
          width="768"
          height="432"
        />
        <span className="project-number">0{index + 1}</span>
        <span className="project-open">
          <span>View project</span>
          <Icon name="diagonal" />
        </span>
        {project.stats && (
          <span className="project-visits">
            {compact(project.stats.visits)} visits
          </span>
        )}
      </button>
      <div className="project-info">
        <div className="project-heading">
          <h3>{project.name}</h3>
          <span className="project-role">
            {project.id === "garden"
              ? "LIVEOPS"
              : project.id === "samurai"
                ? "COMBAT"
                : "GAMEPLAY"}
          </span>
        </div>
        <p>{project.summary}</p>
        <div className="tags">
          {project.engineering.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="project-actions">
          <button
            className="text-link project-details"
            type="button"
            onClick={() => onSelect(project)}
          >
            View project <Icon name="arrow" />
          </button>
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="project-play"
            aria-label={`Play ${project.name} on Roblox`}
          >
            Play on Roblox <Icon name="diagonal" />
          </a>
        </div>
      </div>
    </article>
  );
}

export function Work({ onSelect }: { onSelect: (project: Project) => void }) {
  const [filter, setFilter] = useState<Filter>("All work");
  const visible = projects.filter(
    (project) => filter === "All work" || project.categories.includes(filter),
  );

  return (
    <section
      id="work"
      className="work-section section shell"
      aria-labelledby="work-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <span>01 /</span> SELECTED WORK
          </p>
          <h2 id="work-title">
            Less talk.
            <br className="mobile-break" /> More{" "}
            <span className="muted">play.</span>
          </h2>
        </div>
        <p>
          A few worlds I’ve helped bring to life.
          <br />
          Real games. Real players. A lot of Luau.
        </p>
      </div>
      <div className="work-toolbar">
        <div
          className="work-filters"
          role="group"
          aria-label="Filter projects"
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const current = filters.indexOf(filter);
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? filters.length - 1
                  : (current +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      filters.length) %
                    filters.length;
            setFilter(filters[next]);
            event.currentTarget.querySelectorAll("button")[next]?.focus();
          }}
        >
          {filters.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
            >
              {item}
              <span>
                {item === "All work"
                  ? projects.length
                  : projects.filter((project) =>
                      project.categories.includes(item),
                    ).length}
              </span>
            </button>
          ))}
        </div>
        <span className="project-count" role="status">
          {visible.length} projects
        </span>
      </div>
      <div
        className={`project-grid${filter !== "All work" ? " is-filtered" : ""}`}
      >
        {visible.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={projects.indexOf(project)}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div className="work-note">
        <span>
          <span className="small-dot" /> Experience metrics from Roblox ·{" "}
          {snapshotDate}
        </span>
        <span>Built with teams. Contributions detailed in each project.</span>
      </div>
    </section>
  );
}
