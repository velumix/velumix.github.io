import { useState } from "react";
import { Icon } from "./Icon";
import { projects, type Project } from "../data/projects";

export function Hero({ onSelect }: { onSelect: (project: Project) => void }) {
  const featured = projects.slice(0, 3);
  const [index, setIndex] = useState(0);
  const project = featured[index];

  return (
    <section id="top" className="hero shell" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="availability">
          <span className="status-dot" /> Open to the right project{" "}
          <span className="availability-line" />
        </div>
        <h1 id="hero-title">
          I make games
          <br />
          feel{" "}
          <span className="alive">
            alive
            <svg viewBox="0 0 270 20" aria-hidden="true">
              <path d="M4 14C63 4 161 0 261 8M18 18C104 8 166 9 235 12" />
            </svg>
          </span>
          <span className="hero-period">.</span>
        </h1>
        <p className="hero-description">
          Hey, I’m <strong>Velumix</strong> — a gameplay & software engineer.
          <br className="desktop-break" /> I build the movement, worlds, and
          systems that turn a good idea into a game you keep coming back to.
        </p>
        <div className="hero-actions">
          <a className="button button-primary" href="#work">
            Explore my work <Icon name="arrow" />
          </a>
          <a
            className="hero-github"
            href="https://github.com/velumix"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="github" /> GitHub <Icon name="diagonal" />
          </a>
        </div>
        <div className="hero-location">
          <Icon name="pin" />
          <span>Based in Canada</span>
          <span className="small-dot" />
          <span>Building for everywhere</span>
        </div>
      </div>
      <div className="hero-visual">
        <div className="visual-orbit orbit-one" aria-hidden="true" />
        <div className="visual-orbit orbit-two" aria-hidden="true" />
        <span className="visual-cross cross-one" aria-hidden="true">
          +
        </span>
        <span className="visual-cross cross-two" aria-hidden="true">
          +
        </span>
        <div className="floating-label">
          <span className="status-dot" /> MADE TO BE PLAYED
        </div>
        <div className="feature-frame">
          <div className="feature-topline">
            <span>
              <span className="tiny-square" /> PROJECT SPOTLIGHT
            </span>
            <span>0{index + 1} / 03</span>
          </div>
          <button
            className="feature-image"
            type="button"
            onClick={() => onSelect(project)}
            aria-label={`Explore ${project.name}`}
          >
            <img
              key={project.id}
              src={project.cover}
              alt={`${project.name} game artwork`}
              fetchPriority="high"
            />
            <span className="feature-image-link">
              <Icon name="diagonal" />
            </span>
          </button>
          <div className="feature-caption" aria-live="polite">
            <div>
              <span>
                {project.id === "aquatica"
                  ? "A LIVING UNDERWATER WORLD"
                  : project.id === "samurai"
                    ? "EVERY FRAME. EVERY FIGHT."
                    : "BUILT FOR THE UNEXPECTED"}
              </span>
              <h2>{project.name}</h2>
            </div>
            <span className="feature-platform">ROBLOX</span>
          </div>
          <div
            className="feature-selector"
            role="group"
            aria-label="Choose featured project"
          >
            {featured.map((item, itemIndex) => (
              <button
                type="button"
                key={item.id}
                aria-label={`Feature ${item.name}`}
                aria-pressed={index === itemIndex}
                onClick={() => setIndex(itemIndex)}
              >
                <img src={item.cover} alt="" width="48" height="36" />
                <span className="selector-copy">
                  <strong>
                    {item.id === "aquatica"
                      ? "Aquatica"
                      : item.id === "samurai"
                        ? "Samurai"
                        : "Ranger"}
                  </strong>
                  <small>0{itemIndex + 1}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="hero-bottom">
        <span>GOOD FEEL. SOLID FOUNDATIONS.</span>
        <a href="#work">
          SCROLL TO EXPLORE <Icon name="down" />
        </a>
      </div>
    </section>
  );
}
