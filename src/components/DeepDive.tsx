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
      className="deep-dive"
      aria-labelledby="dive-title"
    >
      <div className="shell dive-layout">
        <div className="dive-aside">
          <p className="eyebrow">FIELD NOTES / AQUATICA</p>
          <span className="dive-mark" aria-hidden="true">
            a<span>q</span>
          </span>
          <a href="/observatory/">
            Browse the documentation <Icon name="diagonal" />
          </a>
        </div>
        <div className="dive-copy">
          <h2 id="dive-title">
            What makes an ocean
            <br />
            <em>feel alive?</em>
          </h2>
          <p>
            For Aquatica, I worked on the systems underneath the scenery: how
            you swim, how fish move together, and how the world remembers what
            you discover.
          </p>
          <div className="dive-features">
            <span>
              01 <strong>Custom swimming</strong>
            </span>
            <span>
              02 <strong>Creature simulation</strong>
            </span>
            <span>
              03 <strong>Persistent discovery</strong>
            </span>
          </div>
          <button
            type="button"
            className="text-link"
            onClick={() => onSelect(projects[0])}
          >
            A closer look at my contribution <Icon name="arrow" />
          </button>
        </div>
      </div>
    </section>
  );
}
