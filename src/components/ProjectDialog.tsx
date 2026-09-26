import { useEffect, useRef, useState } from "react";
import {
  compact,
  projects,
  snapshotDate,
  type Project,
} from "../data/projects";
import { Icon } from "./Icon";

export function ProjectDialog({
  project,
  onClose,
  onNavigate,
}: {
  project: Project;
  onClose: () => void;
  onNavigate: (project: Project) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const currentProject = useRef(project.id);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [failedImage, setFailedImage] = useState(false);
  const images = project.gallery;
  const index = projects.findIndex((item) => item.id === project.id);
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  useEffect(() => {
    const dialog = ref.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (currentProject.current === project.id) return;
    currentProject.current = project.id;
    setActiveImage(0);
    setFailedImage(false);
    ref.current?.scrollTo({ top: 0, behavior: "instant" });
    titleRef.current?.focus({ preventScroll: true });
  }, [project.id]);

  function changeImage(direction: number) {
    setActiveImage(
      (current) => (current + direction + images.length) % images.length,
    );
    setFailedImage(false);
  }

  return (
    <dialog
      ref={ref}
      className="project-dialog"
      aria-labelledby="project-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const focusable = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            "a[href], button:not([disabled])",
          ),
        ].filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <div className="dialog-toolbar">
        <span>
          <span className="status-dot" /> PROJECT DETAILS{" "}
          <span className="dialog-position">
            {String(index + 1).padStart(2, "0")} / 05
          </span>
        </span>
        <button
          autoFocus
          type="button"
          className="dialog-close"
          aria-label="Close project"
          aria-keyshortcuts="Escape"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="dialog-layout">
        <div className="dialog-heading">
          <span className="eyebrow">{project.engineering.role}</span>
          <h2 id="project-title" ref={titleRef} tabIndex={-1}>
            {project.name}
          </h2>
        </div>
        <div className="dialog-media">
          <div
            className="dialog-image"
            onPointerDown={(event) => {
              if (event.pointerType === "touch")
                touchStart.current = { x: event.clientX, y: event.clientY };
            }}
            onPointerUp={(event) => {
              if (!touchStart.current) return;
              const dx = event.clientX - touchStart.current.x;
              const dy = event.clientY - touchStart.current.y;
              if (
                images.length > 1 &&
                Math.abs(dx) > 50 &&
                Math.abs(dx) > Math.abs(dy)
              )
                changeImage(dx < 0 ? 1 : -1);
              touchStart.current = null;
            }}
            onPointerCancel={() => {
              touchStart.current = null;
            }}
          >
            <img
              src={
                failedImage
                  ? project.cover
                  : images[Math.min(activeImage, images.length - 1)]
              }
              alt={`${project.name} preview ${activeImage + 1}`}
              onError={() => setFailedImage(true)}
            />
            {images.length > 1 && (
              <div className="gallery-arrows">
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => changeImage(-1)}
                >
                  <Icon name="left" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => changeImage(1)}
                >
                  <Icon name="right" />
                </button>
              </div>
            )}
          </div>
          <div className="gallery-label">
            <span>{project.name}</span>
            <span>
              {String(activeImage + 1).padStart(2, "0")} /{" "}
              {String(images.length).padStart(2, "0")}
            </span>
          </div>
          {images.length > 1 && (
            <div className="dialog-gallery" aria-label="Project images">
              {images.map((image, imageIndex) => (
                <button
                  type="button"
                  key={image}
                  aria-label={`Show image ${imageIndex + 1}`}
                  aria-pressed={imageIndex === activeImage}
                  onClick={() => {
                    setActiveImage(imageIndex);
                    setFailedImage(false);
                  }}
                >
                  <img src={image} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          {project.stats && (
            <div className="dialog-stats">
              <div>
                <strong>{compact(project.stats.visits)}</strong>
                <span>Experience visits</span>
              </div>
              <div>
                <strong>{compact(project.stats.favorites)}</strong>
                <span>Favorites</span>
              </div>
              <p>
                <span className="small-dot" /> Roblox snapshot · {snapshotDate}
              </p>
            </div>
          )}
          <p className="project-credit">
            Experience by {project.creator?.name ?? "the project team"}.
            Contributions described here are my own.
          </p>
        </div>
        <div className="dialog-content">
          <p className="dialog-summary">{project.engineering.summary}</p>
          <h3>My contribution</h3>
          <ul className="contribution-list">
            {project.engineering.highlights.map((highlight) => (
              <li key={highlight}>
                <Icon name="check" />
                {highlight}
              </li>
            ))}
          </ul>
          <div className="tags">
            {project.engineering.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="dialog-actions">
            <a
              className="button button-primary"
              href={project.url}
              target="_blank"
              rel="noreferrer"
            >
              Play on Roblox <Icon name="diagonal" />
            </a>
            {project.id === "aquatica" && (
              <a className="button button-outline" href="/observatory/">
                Engineering docs <Icon name="arrow" />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="dialog-navigation">
        <button
          type="button"
          onClick={() => onNavigate(previous)}
          aria-label={`Previous project: ${previous.name}`}
        >
          <Icon name="left" />
          <span>
            <small>Previous project</small>
            <strong>{previous.name}</strong>
          </span>
        </button>
        <span className="dialog-navigation-divider" />
        <button
          type="button"
          onClick={() => onNavigate(next)}
          aria-label={`Next project: ${next.name}`}
        >
          <span>
            <small>Next project</small>
            <strong>{next.name}</strong>
          </span>
          <Icon name="right" />
        </button>
      </div>
    </dialog>
  );
}
