import { Icon } from "../Icon";
import {
  projects,
  compact,
  totalVisits,
  snapshotDate,
  type Project,
} from "../../data/projects";
import { softwareProjects, type WorkFilter } from "../../data/work";
import { GameCard } from "./GameCard";
import { SoftwareCard } from "./SoftwareCard";

export function WorkOverview({
  saved,
  onSave,
  onSelect,
  onFilter,
}: {
  saved: string[];
  onSave: (id: string) => void;
  onSelect: (project: Project) => void;
  onFilter: (filter: WorkFilter) => void;
}) {
  const personal = softwareProjects.filter(
    (project) => project.role === "Personal project" && !project.status,
  );
  const contributions = softwareProjects.filter(
    (project) => project.role !== "Personal project",
  );
  const past = softwareProjects.filter(
    (project) => project.status === "Past project",
  );
  const featuredSoftware = personal.find(
    (project) => project.id === "projectvite",
  )!;
  return (
    <div className="work-overview">
      <div className="featured-work">
        <section
          className="featured-collection"
          aria-labelledby="featured-games-title"
        >
          <div className="collection-heading">
            <div>
              <h2 id="featured-games-title">
                <Icon name="gamepad" />
                Roblox & gameplay
              </h2>
              <p>
                7+ years · {projects.length} experiences ·{" "}
                {compact(totalVisits)} game visits
              </p>
            </div>
            <button
              onClick={() => onFilter("Games")}
              aria-label="View all Roblox projects"
            >
              View all
              <Icon name="arrow" />
            </button>
          </div>
          <GameCard
            project={projects[0]}
            saved={saved.includes(projects[0].id)}
            onSave={onSave}
            onSelect={onSelect}
            featured
          />
        </section>
        <section
          className="featured-collection"
          aria-labelledby="featured-software-title"
        >
          <div className="collection-heading">
            <div>
              <h2 id="featured-software-title">
                <Icon name="code" />
                Software & tools
              </h2>
              <p>Native apps, developer tools, and web interfaces</p>
            </div>
            <a href="#software-projects" aria-label="Browse software projects">
              Browse
              <Icon name="down" />
            </a>
          </div>
          <SoftwareCard
            project={featuredSoftware}
            saved={saved.includes(featuredSoftware.id)}
            onSave={onSave}
            featured
          />
        </section>
      </div>

      <section className="work-collection" aria-labelledby="more-games-title">
        <div className="collection-heading">
          <div>
            <h2 id="more-games-title">More Roblox work</h2>
            <p>Combat, simulation, progression, and live operations.</p>
          </div>
          <button
            onClick={() => onFilter("Games")}
            aria-label="Explore all Roblox projects"
          >
            All {projects.length} experiences
            <Icon name="arrow" />
          </button>
        </div>
        <div className="game-collection-grid">
          {projects.slice(1).map((project) => (
            <GameCard
              key={project.id}
              project={project}
              saved={saved.includes(project.id)}
              onSave={onSave}
              onSelect={onSelect}
              featured
            />
          ))}
        </div>
        <p className="feed-note">
          Game metrics from Roblox · {snapshotDate}. Visits describe the whole
          experience; each project details my contribution.
        </p>
      </section>

      <section
        id="software-projects"
        className="work-collection"
        aria-labelledby="more-software-title"
      >
        <div className="collection-heading">
          <div>
            <h2 id="more-software-title">More software & tools</h2>
            <p>
              Code intelligence, interfaces, protocol tooling, and frameworks.
            </p>
          </div>
          <a
            href="https://github.com/velumix?tab=repositories"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
            <Icon name="diagonal" />
          </a>
        </div>
        <div className="software-collection-grid">
          {personal
            .filter((project) => project.id !== featuredSoftware.id)
            .map((project) => (
              <SoftwareCard
                key={project.id}
                project={project}
                saved={saved.includes(project.id)}
                onSave={onSave}
              />
            ))}
        </div>
      </section>

      <section
        className="work-collection"
        aria-labelledby="contributions-title"
      >
        <div className="collection-heading">
          <div>
            <h2 id="contributions-title">Open-source contributions</h2>
            <p>
              Engine fixes, Android compatibility, and repository automation.
            </p>
          </div>
          <button onClick={() => onFilter("Contributions")}>
            View contributions
            <Icon name="arrow" />
          </button>
        </div>
        <div className="contribution-collection-grid">
          {contributions.map((project) => (
            <SoftwareCard
              key={project.id}
              project={project}
              saved={saved.includes(project.id)}
              onSave={onSave}
            />
          ))}
        </div>
      </section>
      {past.length > 0 && (
        <section
          className="work-collection past-work"
          aria-labelledby="past-work-title"
        >
          <div className="collection-heading">
            <div>
              <h2 id="past-work-title">Past projects</h2>
              <p>
                Earlier work, kept here as part of my engineering experience.
              </p>
            </div>
          </div>
          <div className="software-collection-grid">
            {past.map((project) => (
              <SoftwareCard
                key={project.id}
                project={project}
                saved={saved.includes(project.id)}
                onSave={onSave}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
