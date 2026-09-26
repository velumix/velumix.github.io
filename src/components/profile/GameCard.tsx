import { Icon } from "../Icon";
import { compact, type Project } from "../../data/projects";

export function GameCard({
  project,
  saved,
  onSave,
  onSelect,
  featured = false,
}: {
  project: Project;
  saved: boolean;
  onSave: (id: string) => void;
  onSelect: (project: Project) => void;
  featured?: boolean;
}) {
  const artwork = (
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
        loading={featured ? "eager" : "lazy"}
      />
      <span>
        View project <Icon name="diagonal" />
      </span>
    </button>
  );
  return (
    <article
      className={`panel project-card game-card${featured ? " game-card-featured" : ""}`}
    >
      {featured && artwork}
      <div className="project-card-top">
        {!featured && (
          <img
            className="project-avatar"
            src={project.cover}
            alt=""
            loading="lazy"
            width="44"
            height="44"
          />
        )}
        <div>
          <h3>
            <button onClick={() => onSelect(project)}>{project.name}</button>
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
          className={`save-button icon-button ${saved ? "is-saved" : ""}`}
          aria-label={`${saved ? "Unsave" : "Save"} ${project.name}`}
          aria-pressed={saved}
          onClick={() => onSave(project.id)}
        >
          <Icon name="bookmark" />
        </button>
      </div>
      <p className="project-summary">{project.engineering.summary}</p>
      {!featured && artwork}
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
  );
}
