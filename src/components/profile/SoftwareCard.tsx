import { Icon } from "../Icon";
import type { SoftwareProject } from "../../data/work";

export function SoftwareCard({
  project,
  saved,
  onSave,
  featured = false,
}: {
  project: SoftwareProject;
  saved: boolean;
  onSave: (id: string) => void;
  featured?: boolean;
}) {
  return (
    <article
      className={`panel project-card software-card tone-${project.tone}${featured ? " software-card-featured" : ""}`}
    >
      {project.preview && (
        <a
          className="project-cover software-preview"
          href={project.preview.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${project.name} browser preview`}
        >
          <img
            src={project.preview.src}
            alt={project.preview.alt}
            width="1175"
            height="660"
            loading={featured ? "eager" : "lazy"}
          />
          <span>
            Browser preview
            <Icon name="diagonal" />
          </span>
        </a>
      )}
      <div className="project-card-top">
        <span className="software-icon" aria-hidden="true">
          <Icon name={project.icon} />
        </span>
        <div>
          <h3>
            <a href={project.url} target="_blank" rel="noreferrer">
              {project.name}
            </a>
          </h3>
          <span>{project.discipline}</span>
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
      <p className="project-summary">{project.summary}</p>
      <div className="software-meta">
        <span
          className={`work-role ${project.role === "Merged contribution" ? "work-merged" : ""}`}
        >
          <Icon
            name={project.role === "Merged contribution" ? "check" : "code"}
          />
          {project.role}
        </span>
        <span>{project.category}</span>
        {project.status && (
          <span className="work-status">
            <Icon name="clock" />
            {project.status}
          </span>
        )}
      </div>
      <div className="project-context">
        <div className="project-tags">
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      <details
        className="work-details"
        open={(featured && !project.preview) || undefined}
      >
        <summary>
          Engineering details
          <span className="sr-only"> for {project.name}</span>
          <Icon name="chevron" />
        </summary>
        <ul>
          {project.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
        <div className="work-evidence">
          {project.links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
              {link.label}
              <Icon name="diagonal" />
            </a>
          ))}
        </div>
      </details>
      <div
        className={`project-card-actions software-actions${project.preview ? " software-actions-with-preview" : ""}`}
      >
        {project.preview && (
          <a href={project.preview.url} target="_blank" rel="noreferrer">
            <Icon name="globe" />
            Open preview
            <Icon name="diagonal" />
          </a>
        )}
        <a
          href={project.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${project.name} ${project.role === "Merged contribution" ? "contribution" : "repository"} on GitHub`}
        >
          <Icon name="github" />
          {project.role === "Merged contribution"
            ? "View contribution"
            : "View repository"}
          <Icon name="diagonal" />
        </a>
      </div>
    </article>
  );
}
