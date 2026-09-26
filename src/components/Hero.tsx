import { useState } from "react";
import { Icon } from "./Icon";
import { compact, projects, totalVisits, type Project } from "../data/projects";

export function Hero({ onSelect }: { onSelect: (project: Project) => void }) {
  const featured = projects.slice(0, 3);
  const [index, setIndex] = useState(0);
  const project = featured[index];
  return (
    <section id="top" className="hero shell" aria-labelledby="hero-title">
      <div className="hero-masthead">
        <h1 id="hero-title">
          velumix<span>.</span>
        </h1>
        <p className="hero-discipline">
          Gameplay &<br /> <em>software</em>
          <br /> engineer.
        </p>
      </div>
      <div className="hero-intro">
        <span className="hero-index">
          Independent developer
          <br />
          Based in Canada
        </span>
        <p>
          I build the movement, combat, and simulations behind Roblox games.
          Seven years in, I still care most about how it feels to play.
        </p>
        <a className="text-link" href="#work">
          Selected work <Icon name="down" />
        </a>
      </div>
      <div className="hero-feature">
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
            width="768"
            height="432"
          />
          <span className="feature-image-link">
            <Icon name="diagonal" />
          </span>
        </button>
        <div className="feature-rail">
          <div className="feature-topline">
            <span>IN FOCUS</span>
            <span>0{index + 1} / 03</span>
          </div>
          <div className="feature-caption" aria-live="polite">
            <span className="feature-category">
              {project.id === "samurai" ? "Combat design" : "Gameplay systems"}
            </span>
            <h2>{project.name}</h2>
            <p>{project.summary}</p>
            <button className="text-link" onClick={() => onSelect(project)}>
              Inside the project <Icon name="diagonal" />
            </button>
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
                <span>0{itemIndex + 1}</span>
                <strong>
                  {item.id === "aquatica"
                    ? "Aquatica"
                    : item.id === "samurai"
                      ? "Samurai"
                      : "Ranger"}
                </strong>
                <Icon name="arrow" />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="hero-footnote">
        <p>
          <strong>{compact(totalVisits)}</strong> visits across games I’ve
          contributed to
        </p>
        <a href="#contact">
          <span className="status-dot" /> Open to the right project
        </a>
      </div>
    </section>
  );
}
