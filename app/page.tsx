import DiscordHireLink from "./DiscordHireLink";
import HeroGameShowcase from "./HeroGameShowcase";
import RobloxMediaGallery from "./RobloxMediaGallery";
import SiteExperience from "./SiteExperience";

const proof = [
  ["01", "Custom controllers", "Force-driven swimming, camera control, IK, and responsive input across keyboard, touch, gamepad, and VR."],
  ["02", "Living simulation", "Behavior trees, pathfinding, boid schools, dynamic incidents, and frame-budgeted world systems."],
  ["03", "Server authority", "Validated combat, progression, purchases, rewards, networking, rate limits, and exploit-resistant state."],
  ["04", "Production data", "Profile lifecycles, session locking, reconciliation, schema migrations, receipt safety, and analytics."],
];

const observatorySystems = [
  {
    index: "A",
    title: "Underwater movement",
    copy: "A custom controller built with LinearVelocity, VectorForce, and AlignOrientation. It translates intent into responsive 3D swimming while handling drag, character state, IK, and multiple input families.",
    meta: ["Vector math", "Physics constraints", "Gamepad + VR"],
  },
  {
    index: "B",
    title: "Creature intelligence",
    copy: "Schools coordinate through separation, cohesion, leadership, obstacle avoidance, and safe fallback vectors. Work is scheduled against device-aware budgets so the aquarium stays alive without sacrificing frame time.",
    meta: ["Boids", "Adaptive budgets", "Navigation"],
  },
  {
    index: "C",
    title: "Discovery pipeline",
    copy: "Target acquisition, cinematic camera control, anatomy tracing, unlock persistence, interface feedback, achievements, and server-validated world phenomena operate as one connected gameplay loop.",
    meta: ["Cross-input UX", "Persistence", "Live orchestration"],
  },
];

const productionSkills = [
  ["Gameplay", "Controllers · combat · state machines · interactions"],
  ["Simulation", "AI · behavior trees · boids · pathfinding · vehicles"],
  ["Networking", "Server authority · validation · ByteNet · rate limiting"],
  ["Data", "ProfileService · migrations · receipts · analytics"],
  ["Engine", "Physics · lighting · audio · particles · camera · IK"],
  ["Platforms", "Desktop · touch · gamepad · console-ready · VR"],
  ["Architecture", "OOP · CollectionService · components · Knit · Mince"],
  ["Quality", "Selene · StyLua · Luau LSP · unit + integration tests"],
  ["Libraries", "Trove · Replica · Signal · FastCast · Promise"],
  ["Performance", "Parallel Luau · Actors · profiling · frame budgets"],
  ["Workflow", "GitHub · Git · Rojo · Wally · Studio tooling"],
  ["Tooling", "Rust · TypeScript · Node.js · Windows services"],
];

function Arrow() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M4 14 14 4M6 4h8v8" />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <SiteExperience />
      <div className="noise" aria-hidden="true" />

      <header className="nav">
        <div className="nav-inner shell">
          <a className="brand" href="#top" aria-label="Velumix home">
            <span className="brand-mark">V</span><span>VELUMIX</span>
          </a>
          <nav aria-label="Primary navigation">
            <a href="#work">Work</a>
            <a href="#observatory">Case study</a>
            <a href="#capabilities">Capabilities</a>
          </nav>
          <DiscordHireLink className="nav-cta" label="Hire me" />
        </div>
      </header>

      <section className="hero shell" id="top">
        <HeroGameShowcase />
      </section>

      <section className="recruiter-strip" aria-label="Professional focus">
        <div className="shell">
          <span><i /> Roblox gameplay engineer</span>
          <span>Software engineer</span>
          <span>Production systems</span>
          <span>Remote collaboration</span>
        </div>
      </section>

      <section className="proof shell" aria-labelledby="proof-title">
        <div className="proof-heading">
          <p className="eyebrow">The 30-second version</p>
          <h2 id="proof-title">I solve the hard parts<br />behind the fun.</h2>
          <p>
            My work spans the player-facing mechanic and the production architecture
            supporting it. I prototype for feel, validate on the server, profile
            under load, and ship across devices.
          </p>
        </div>
        <div className="proof-grid">
          {proof.map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span><h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="work shell" id="work">
        <RobloxMediaGallery />
      </section>

      <section className="case-study" id="observatory">
        <div className="shell">
          <div className="case-heading">
            <div>
              <p className="eyebrow">Flagship engineering case study</p>
              <h2>Aquatica<br /><span>Observatory.</span></h2>
            </div>
            <div className="case-lede">
              <p>
                An immersive aquarium where underwater movement, hundreds of
                creatures, scanning, discovery, scheduled encounters, data, and
                interface feedback behave as one living product.
              </p>
              <a href="https://www.roblox.com/games/78959878729166/Aquatica-Observatory" target="_blank" rel="noreferrer">
                Play on Roblox <Arrow />
              </a>
            </div>
          </div>

          <div className="case-stats" aria-label="Aquatica Observatory system scale">
            <div><strong>266+</strong><span>tagged creatures</span></div>
            <div><strong>323</strong><span>animation controllers</span></div>
            <div><strong>3D</strong><span>custom swimming</span></div>
            <div><strong>4</strong><span>input families</span></div>
          </div>

          <div className="observatory-systems">
            {observatorySystems.map((system) => (
              <article key={system.index}>
                <div className="system-index">{system.index}</div>
                <div>
                  <h3>{system.title}</h3>
                  <p>{system.copy}</p>
                  <ul>{system.meta.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                </div>
              </article>
            ))}
          </div>

          <div className="architecture" aria-label="Observatory architecture flow">
            <div className="architecture-copy">
              <p className="eyebrow">Runtime architecture</p>
              <h3>Intent becomes a trusted world state.</h3>
              <p>
                Every interaction crosses clear boundaries: responsive local feedback,
                validated requests, authoritative simulation, persistent outcomes,
                and observable production signals.
              </p>
            </div>
            <div className="architecture-flow">
              <div><span>01</span><strong>Input</strong><small>Mouse · touch · gamepad · VR</small></div>
              <i>→</i>
              <div><span>02</span><strong>Gameplay</strong><small>Controllers · AI · interaction</small></div>
              <i>→</i>
              <div><span>03</span><strong>Authority</strong><small>Validation · simulation · data</small></div>
              <i>→</i>
              <div><span>04</span><strong>Feedback</strong><small>World · UI · analytics</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="capabilities shell" id="capabilities">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Production capability</p>
            <h2>Useful across<br />the entire stack.</h2>
          </div>
          <p>
            Gameplay is the specialty. Reliable architecture, tooling, and
            cross-functional delivery are how it reaches players.
          </p>
        </div>
        <div className="capability-grid">
          {productionSkills.map(([title, detail], index) => (
            <div key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{title}</strong><small>{detail}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="team-value">
        <div className="shell">
          <p className="eyebrow">How I work</p>
          <blockquote>
            “Make the mechanic feel right. Make the server trust nothing.
            Make the system easy for the next engineer to change.”
          </blockquote>
          <div className="team-points">
            <span>Designer-friendly iteration</span>
            <span>Clear technical communication</span>
            <span>QA-ready observability</span>
            <span>Performance as a feature</span>
          </div>
        </div>
      </section>

      <section className="contact shell" id="contact">
        <p className="eyebrow">Available for the right team</p>
        <h2>Let&apos;s ship something<br /><span>players remember.</span></h2>
        <p>
          I’m looking for ambitious Roblox work where gameplay feel,
          simulation, and production engineering all matter.
        </p>
        <div className="contact-actions">
          <DiscordHireLink className="button primary" label="Message me on Discord" />
          <a className="button ghost" href="https://www.roblox.com/games/78959878729166/Aquatica-Observatory" target="_blank" rel="noreferrer">
            Play flagship work <Arrow />
          </a>
        </div>
        <small>Discord: @velumix · Also available through Roblox Talent Hub.</small>
      </section>

      <footer>
        <div className="shell">
          <a className="brand" href="#top"><span className="brand-mark">V</span><span>VELUMIX</span></a>
          <p>Gameplay engineer · Roblox developer · Software engineer</p>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}
