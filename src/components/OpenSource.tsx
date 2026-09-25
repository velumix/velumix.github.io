import { Icon } from "./Icon";

export function OpenSource() {
  return (
    <section
      id="systems"
      className="section shell"
      aria-labelledby="systems-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <span>02 /</span> BEYOND THE GAME
          </p>
          <h2 id="systems-title">
            Good tools.
            <br className="mobile-break" />{" "}
            <span className="muted">Better building.</span>
          </h2>
        </div>
        <p>
          I build the tools I wish I had.
          <br />
          Then put them out there for other developers.
        </p>
      </div>
      <div className="tools-grid">
        <article className="tool-card nerve-card">
          <div className="tool-art nerve-art" aria-hidden="true">
            <div className="nerve-lines">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <span className="nerve-core">
              N<span>_</span>
            </span>
            <span className="art-label">SERVICE → CONTROLLER → WORLD</span>
            <span className="art-corner">[ NERVE ]</span>
          </div>
          <div className="tool-content">
            <div className="tool-title">
              <h3>
                Nerve<span>↗</span>
              </h3>
              <span className="open-source-badge">OPEN SOURCE</span>
            </div>
            <p>
              A nervous system for your next game. Typed networking, a clean
              service lifecycle, and production essentials in one Roblox
              framework.
            </p>
            <div className="tags">
              <span>Luau</span>
              <span>ByteNet</span>
              <span>MIT</span>
            </div>
            <div className="tool-links">
              <a
                className="text-link"
                href="https://github.com/velumix/Nerve"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="github" /> Repository <Icon name="diagonal" />
              </a>
              <a
                className="subtle-link"
                href="https://velumix.github.io/Nerve/"
                target="_blank"
                rel="noreferrer"
              >
                Documentation <Icon name="diagonal" />
              </a>
            </div>
          </div>
        </article>
        <article className="tool-card abraxius-card">
          <div className="tool-art abraxius-art" aria-hidden="true">
            <span className="art-corner">[ ABRAXIUS ]</span>
            <div className="bridge-node">
              <Icon name="code" />
              <span>CODE</span>
            </div>
            <div className="bridge-connection">
              <i />
              <span>VERIFIED SYNC</span>
              <Icon name="arrow" />
            </div>
            <div className="bridge-node studio-node">
              <span className="studio-mark" />
              <span>STUDIO</span>
            </div>
            <span className="art-label">
              A CLOSER CONNECTION TO YOUR PROJECT
            </span>
          </div>
          <div className="tool-content">
            <div className="tool-title">
              <h3>
                Abraxius<span>↗</span>
              </h3>
              <span className="open-source-badge">OPEN SOURCE</span>
            </div>
            <p>
              A verified bridge between code and Roblox Studio. Inspect live
              projects, sync Luau, and give your tools the context they need.
            </p>
            <div className="tags">
              <span>Rust</span>
              <span>WinUI 3</span>
              <span>Luau</span>
            </div>
            <div className="tool-links">
              <a
                className="text-link"
                href="https://github.com/velumix/Abraxius"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="github" /> Repository <Icon name="diagonal" />
              </a>
              <a
                className="subtle-link"
                href="https://velumix.github.io/Abraxius/"
                target="_blank"
                rel="noreferrer"
              >
                Documentation <Icon name="diagonal" />
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
