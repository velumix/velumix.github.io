import DiscordHireLink from "./DiscordHireLink";
import HeroGameShowcase from "./HeroGameShowcase";
import RobloxMediaGallery from "./RobloxMediaGallery";
import SiteExperience from "./SiteExperience";

const observatorySystems = [
  {
    index: "A",
    title: "Underwater movement",
    copy: "I built the swimming controller around Roblox physics constraints, with support for keyboard, touch, gamepad, and VR. The goal was simple: movement had to feel responsive without looking weightless.",
    meta: ["Vector math", "Physics constraints", "Gamepad + VR"],
  },
  {
    index: "B",
    title: "Creature intelligence",
    copy: "Fish move in schools using boid rules, obstacle avoidance, and baked navigation data. Updates are spread across frames so busy exhibits still run well on lower-end devices.",
    meta: ["Boids", "Adaptive budgets", "Navigation"],
  },
  {
    index: "C",
    title: "Discovery pipeline",
    copy: "Scanning ties together target selection, camera control, anatomy tracing, unlocks, achievements, and saved progress. The client handles the feel; the server owns the result.",
    meta: ["Cross-input UX", "Persistence", "Live orchestration"],
  },
];

const productionSkills = [
  ["Gameplay", "Custom controllers · combat · interactions · cameras"],
  ["Simulation", "AI · behavior trees · boids · pathfinding · vehicles"],
  ["Multiplayer", "Server authority · validation · replication · rate limits"],
  ["Data", "Profiles · migrations · receipts · analytics · live events"],
  ["Performance", "Parallel Luau · Actors · profiling · frame budgets"],
  ["Workflow", "GitHub · Rojo · Wally · Selene · StyLua · Luau LSP"],
];

const originalSystems = [
  {
    index: "01",
    name: "Nerve",
    kind: "Open source Roblox framework",
    tagline: "Give your game a nervous system.",
    copy: "A drop-in framework for building Roblox games around a clean service and controller lifecycle. Nerve turns typed contracts into ByteNet packets and carries the everyday infrastructure a production game needs inside one package.",
    features: [
      "Typed ByteNet requests, responses, events, and rate limits",
      "Automatic client and server startup from one package",
      "Profiles, promises, signals, components, cleanup, and input included",
    ],
    stack: ["Luau", "ByteNet", "Moonwave", "MIT"],
    links: [
      { label: "View repository", href: "https://github.com/velumix/Nerve" },
      { label: "Read the docs", href: "https://velumix.github.io/Nerve/" },
    ],
  },
  {
    index: "02",
    name: "Abraxius",
    kind: "Roblox Studio development companion",
    tagline: "A verified bridge between code and Studio.",
    copy: "A Windows-hosted companion for inspecting live Roblox projects, syncing Luau safely, and giving AI tools accurate Studio context. Every edit travels through revision-aware operations and Roblox Studio remains the authority.",
    features: [
      "Verified pull and granular script push workflow",
      "Live DataModel inspection, context, memory, and AXL commands",
      "WinUI supervisor with a Rust host and Studio companion",
    ],
    stack: ["Rust", "WinUI 3", "Luau", "Node.js"],
    links: [
      { label: "View repository", href: "https://github.com/velumix/Abraxius" },
      { label: "Read the docs", href: "https://velumix.github.io/Abraxius/" },
    ],
  },
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
            <a href="#observatory">Aquatica</a>
            <a href="#systems">Systems</a>
            <a href="#capabilities">Skills</a>
          </nav>
          <DiscordHireLink className="nav-cta" label="Hire me" />
        </div>
      </header>

      <section className="hero shell" id="top">
        <HeroGameShowcase />
      </section>

      <section className="recruiter-strip" aria-label="Professional focus">
        <div className="shell">
          <span><i /> Gameplay engineering</span>
          <span>Luau</span>
          <span>7+ years on Roblox</span>
          <span>Canada · Remote</span>
        </div>
      </section>

      <section className="work shell" id="work">
        <RobloxMediaGallery />
      </section>

      <section className="case-study" id="observatory">
        <div className="shell">
          <div className="case-heading">
            <div>
              <p className="eyebrow">A closer look</p>
              <h2>Aquatica<br /><span>Observatory.</span></h2>
            </div>
            <div className="case-lede">
              <p>
                Aquatica is the project that best shows how I work. I handled
                player movement, creature simulation, discovery systems, and
                the services connecting them.
              </p>
              <div className="case-links">
                <a href="https://www.roblox.com/games/78959878729166/Aquatica-Observatory" target="_blank" rel="noreferrer">
                  Play on Roblox <Arrow />
                </a>
                <a href="/observatory/">
                  Engineering docs <Arrow />
                </a>
              </div>
            </div>
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

        </div>
      </section>

      <section className="systems shell" id="systems">
        <div className="section-heading systems-heading">
          <div>
            <p className="eyebrow">Original systems</p>
            <h2>Tools built beyond<br /><span>the game.</span></h2>
          </div>
          <p>
            I turn the infrastructure I want on real projects into reusable
            software. These are complete, public systems built to move between
            games and development environments.
          </p>
        </div>

        <div className="system-showcase">
          {originalSystems.map((system) => (
            <article className="system-showcase-card" key={system.name}>
              <div className="system-card-topline">
                <span>{system.index}</span>
                <p>{system.kind}</p>
              </div>
              <div className="system-card-copy">
                <div>
                  <h3>{system.name}</h3>
                  <strong>{system.tagline}</strong>
                </div>
                <p>{system.copy}</p>
              </div>
              <ul className="system-features">
                {system.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <div className="system-card-footer">
                <div className="system-stack">
                  {system.stack.map((item) => <span key={item}>{item}</span>)}
                </div>
                <div className="system-links">
                  {system.links.map((link) => (
                    <a href={link.href} target="_blank" rel="noreferrer" key={link.href}>
                      {link.label} <Arrow />
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="capabilities shell" id="capabilities">
        <div className="section-heading">
          <div>
            <p className="eyebrow">What I use</p>
            <h2>Gameplay first.<br /><span>Production ready.</span></h2>
          </div>
          <p>
            I specialize in gameplay, but I&apos;m comfortable owning the
            networking, data, tooling, and performance work around it.
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

      <section className="contact shell" id="contact">
        <p className="eyebrow">Get in touch</p>
        <h2>Building something<br /><span>ambitious?</span></h2>
        <p>
          I&apos;m interested in Roblox teams that care about gameplay feel,
          strong systems, and shipping work players notice.
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
