import { Icon } from "../Icon";
import { experience, softwareProjects } from "../../data/work";
import { SoftwareCard } from "./SoftwareCard";

export function AboutPanel() {
  return (
    <div className="panel about-panel">
      <div className="panel-heading">
        <h2>Experience</h2>
        <p>Across applications, infrastructure, interfaces, and games.</p>
      </div>
      <div className="about-body">
        <h3>About me</h3>
        <p>
          I’m a software engineer and developer based in Canada. I build native
          applications, developer tools, interactive web interfaces, and games.
          My public work spans Rust, C#, Go, TypeScript, JavaScript, and Luau.
        </p>
        <p>
          I’ve spent over seven years building on Roblox. Alongside that work, I
          develop agent runtimes, code intelligence tools, desktop software, and
          UI systems, and contribute fixes to open-source projects.
        </p>
        <h3>Where I’ve put it to work</h3>
        <div className="skills-list">
          {experience.map((area) => (
            <article key={area.name}>
              <span className="skill-icon">
                <Icon name={area.icon} />
              </span>
              <div>
                <h4>{area.name}</h4>
                <p>{area.detail}</p>
                <span>{area.tags}</span>
                <div className="experience-links">
                  {area.projects.map((id) => {
                    const project = softwareProjects.find(
                      (item) => item.id === id,
                    )!;
                    return (
                      <a
                        key={id}
                        href={project.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {project.name}
                        <Icon name="diagonal" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
        <a className="docs-link" href="/observatory/">
          <Icon name="layers" />
          <span>
            <strong>Aquatica engineering docs</strong>
            <small>A closer look at my gameplay and simulation work</small>
          </span>
          <Icon name="diagonal" />
        </a>
      </div>
    </div>
  );
}

export function SourcePanel({
  saved,
  onSave,
}: {
  saved: string[];
  onSave: (id: string) => void;
}) {
  const personal = softwareProjects.filter(
    (project) => project.role === "Personal project",
  );
  const contributions = softwareProjects.filter(
    (project) => project.role !== "Personal project",
  );
  return (
    <div className="source-panel">
      <div className="panel panel-heading">
        <h2>Open source</h2>
        <p>Projects I build and contributions to the tools I use.</p>
        <a
          className="all-repositories"
          href="https://github.com/velumix?tab=repositories"
          target="_blank"
          rel="noreferrer"
        >
          All repositories on GitHub
          <Icon name="diagonal" />
        </a>
      </div>
      <h3 className="source-group-title">
        My projects <span>{personal.length}</span>
      </h3>
      {personal.map((project) => (
        <SoftwareCard
          key={project.id}
          project={project}
          saved={saved.includes(project.id)}
          onSave={onSave}
        />
      ))}
      <h3 className="source-group-title">
        Contributions <span>{contributions.length}</span>
      </h3>
      {contributions.map((project) => (
        <SoftwareCard
          key={project.id}
          project={project}
          saved={saved.includes(project.id)}
          onSave={onSave}
        />
      ))}
    </div>
  );
}
