import { Icon } from "./Icon";
import { projects, type Project } from "../data/projects";

export function DeepDive({
  onSelect,
}: {
  onSelect: (project: Project) => void;
}) {
  return (
    <section
      id="observatory"
      className="deep-dive shell"
      aria-labelledby="dive-title"
    >
      <div className="dive-image">
        <img
          src="/images/aquatica.png"
          alt="A diver exploring the Aquatica Observatory"
          loading="lazy"
        />
        <div className="dive-image-shade" />
        <span className="dive-coordinate">↓ BELOW THE SURFACE</span>
        <span className="dive-word">
          aquatica<span>OBSERVATORY</span>
        </span>
      </div>
      <div className="dive-copy">
        <p className="eyebrow">THE ENGINEERING, UP CLOSE</p>
        <h2 id="dive-title">
          There’s a whole world
          <br />
          under the surface.
        </h2>
        <p>
          Responsive swimming. Schools of curious fish. Discoveries that stay
          with you. Aquatica brings my favorite engineering challenges into one
          living ocean.
        </p>
        <div className="dive-features">
          <span>
            <Icon name="check" /> Custom movement
          </span>
          <span>
            <Icon name="check" /> Creature simulation
          </span>
          <span>
            <Icon name="check" /> Persistent discovery
          </span>
        </div>
        <div className="dive-actions">
          <button
            type="button"
            className="text-link"
            onClick={() => onSelect(projects[0])}
          >
            Explore the project <Icon name="arrow" />
          </button>
          <a className="subtle-link" href="/observatory/">
            Read the engineering docs <Icon name="diagonal" />
          </a>
        </div>
      </div>
    </section>
  );
}
