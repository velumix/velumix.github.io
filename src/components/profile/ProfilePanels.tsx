import { Icon } from "../Icon";
import { skills } from "../../data/projects";

export function AboutPanel() {
  return (
    <div className="panel about-panel">
      <div className="panel-heading">
        <h2>About Velumix</h2>
        <span>Gameplay & software engineer</span>
      </div>
      <div className="about-body">
        <h3>A bit about me</h3>
        <p>
          I’m a gameplay and software engineer based in Canada. For over seven
          years, I’ve been building on Roblox, from custom movement and combat
          to the systems that keep a live game running.
        </p>
        <p>
          I care about how a game feels in your hands, and what it takes to make
          that feeling hold up in production.
        </p>
        <h3>Experience & skills</h3>
        <div className="skills-list">
          {skills.map((skill) => (
            <article key={skill.name}>
              <span className="skill-icon">
                <Icon name={skill.icon} />
              </span>
              <div>
                <h4>{skill.name}</h4>
                <p>{skill.detail}</p>
                <span>{skill.tags}</span>
              </div>
            </article>
          ))}
        </div>
        <a className="docs-link" href="/observatory/">
          <Icon name="layers" />
          <span>
            <strong>Aquatica engineering docs</strong>
            <small>Explore the gameplay systems in more detail</small>
          </span>
          <Icon name="diagonal" />
        </a>
      </div>
    </div>
  );
}

export function SourcePanel() {
  const tools = [
    {
      name: "Nerve",
      description:
        "A Roblox framework with typed networking, service lifecycles, and production essentials.",
      tags: ["Luau", "ByteNet", "MIT"],
      letter: "N",
    },
    {
      name: "Abraxius",
      description:
        "A bridge between code and Roblox Studio. Inspect live projects, sync Luau, and connect your development tools.",
      tags: ["Rust", "WinUI 3", "Luau"],
      letter: "A",
    },
  ];
  return (
    <div className="source-panel">
      <div className="panel panel-heading">
        <h2>Open source</h2>
        <p>Frameworks and tools I build for other developers.</p>
      </div>
      {tools.map((tool) => (
        <article key={tool.name} className="panel repository">
          <div className="repository-heading">
            <span className={`repository-icon repo-${tool.name.toLowerCase()}`}>
              {tool.letter}
            </span>
            <div>
              <span>velumix /</span>
              <h3>{tool.name}</h3>
            </div>
            <Icon name="code" />
          </div>
          <p>{tool.description}</p>
          <div className="repository-tags">
            {tool.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="repository-links">
            <a
              className="button button-secondary"
              href={`https://github.com/velumix/${tool.name}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="github" />
              Repository
              <Icon name="diagonal" />
            </a>
            <a
              className="button button-plain"
              href={`https://velumix.github.io/${tool.name}/`}
              target="_blank"
              rel="noreferrer"
            >
              Documentation
              <Icon name="diagonal" />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
