import { Icon } from "./Icon";
const tools = [
  {
    name: "Nerve",
    number: "01",
    description:
      "A solid starting point for Roblox projects. Typed networking, service lifecycles, and the essentials for production, in one framework.",
    stack: "Luau / ByteNet / MIT",
    type: "Roblox framework",
  },
  {
    name: "Abraxius",
    number: "02",
    description:
      "A bridge between your editor and Roblox Studio. Inspect live projects, sync Luau, and keep your development tools connected to the game.",
    stack: "Rust / WinUI 3 / Luau",
    type: "Developer tooling",
  },
];
export function OpenSource() {
  return (
    <section
      id="systems"
      className="systems-section section shell"
      aria-labelledby="systems-title"
    >
      <div className="section-heading">
        <p className="eyebrow">02 — OPEN SOURCE</p>
        <div>
          <h2 id="systems-title">
            From my <em>toolbox.</em>
          </h2>
          <p>
            A couple of things I built for the work, and kept building for other
            developers.
          </p>
        </div>
      </div>
      <div className="tools-list">
        {tools.map((tool) => (
          <article className="tool-row" key={tool.name}>
            <span className="tool-number">{tool.number}</span>
            <div className="tool-identity">
              <span>{tool.type}</span>
              <h3>
                <a
                  href={`https://github.com/velumix/${tool.name}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {tool.name}
                  <Icon name="diagonal" />
                </a>
              </h3>
            </div>
            <div className="tool-description">
              <p>{tool.description}</p>
              <span>{tool.stack}</span>
            </div>
            <div className="tool-links">
              <a
                href={`https://github.com/velumix/${tool.name}`}
                target="_blank"
                rel="noreferrer"
              >
                Repository <Icon name="diagonal" />
              </a>
              <a
                href={`https://velumix.github.io/${tool.name}/`}
                target="_blank"
                rel="noreferrer"
              >
                Documentation <Icon name="diagonal" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
