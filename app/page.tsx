const systems = [
  {
    index: "01",
    title: "Combat & Interaction",
    copy: "Responsive input, authoritative outcomes, expressive movement, and combat architecture built around the player’s hands.",
    tags: ["State machines", "Prediction", "Hit validation"],
  },
  {
    index: "02",
    title: "AI & World Simulation",
    copy: "Readable agents and living worlds driven by reusable behavior, navigation, perception, and simulation systems.",
    tags: ["Navigation", "Behaviors", "Simulation"],
  },
  {
    index: "03",
    title: "Live Systems & Tooling",
    copy: "Data-driven workflows that let teams tune, ship, observe, and extend gameplay without turning every change into a rewrite.",
    tags: ["Data pipelines", "Developer tools", "Telemetry"],
  },
];

const principles = [
  ["01", "Feel first", "Prototype the player experience early. Measure the result, not the amount of code."],
  ["02", "Authority with empathy", "Secure the server without making the client feel slow, brittle, or unresponsive."],
  ["03", "Design for change", "Build boundaries that let mechanics evolve without destabilizing the entire game."],
  ["04", "Make it observable", "Expose state, timing, and failure clearly so production problems become fixable problems."],
];

const capabilities = [
  "Roblox Studio",
  "Luau",
  "Gameplay architecture",
  "Client–server networking",
  "State machines",
  "AI & navigation",
  "Performance profiling",
  "Data-driven systems",
  "Developer tooling",
  "Live-game reliability",
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
      <div className="noise" aria-hidden="true" />

      <header className="nav shell">
        <a className="brand" href="#top" aria-label="Velumix home">
          <span className="brand-mark">V</span>
          <span>VELUMIX</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#systems">Systems</a>
          <a href="#approach">Approach</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="nav-cta" href="#contact">
          Start a conversation <Arrow />
        </a>
      </header>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="pulse" /> Roblox gameplay engineer · Software engineer
          </p>
          <h1>
            I build systems
            <span>players can feel.</span>
          </h1>
          <p className="lede">
            Gameplay engineering focused on responsive mechanics, clean
            architecture, and production-ready systems that scale beyond the
            prototype.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#systems">
              Explore my work <Arrow />
            </a>
            <a className="button ghost" href="#contact">
              Let&apos;s talk
            </a>
          </div>
        </div>

        <div className="system-card" aria-label="Gameplay system visualization">
          <div className="system-head">
            <span>PLAYER_RUNTIME</span>
            <span className="status">ONLINE</span>
          </div>
          <div className="runtime">
            <div className="reticle" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <span />
            </div>
            <div className="runtime-label label-a">INPUT</div>
            <div className="runtime-label label-b">SIMULATION</div>
            <div className="runtime-label label-c">AUTHORITY</div>
            <div className="runtime-label label-d">FEEDBACK</div>
            <svg className="connections" viewBox="0 0 460 360" aria-hidden="true">
              <path d="M92 78 C185 85 158 164 230 180" />
              <path d="M365 82 C284 94 306 155 230 180" />
              <path d="M89 288 C180 270 161 211 230 180" />
              <path d="M368 287 C292 270 302 209 230 180" />
            </svg>
          </div>
          <div className="metric-row">
            <div><span>MODE</span><strong>AUTHORITATIVE</strong></div>
            <div><span>STATE</span><strong>SYNCHRONIZED</strong></div>
            <div><span>FRAME</span><strong>WITHIN BUDGET</strong></div>
          </div>
        </div>
      </section>

      <section className="signal">
        <div className="signal-track">
          <span>GAMEPLAY SYSTEMS</span><b>◆</b>
          <span>NETWORKING</span><b>◆</b>
          <span>AI & SIMULATION</span><b>◆</b>
          <span>PERFORMANCE</span><b>◆</b>
          <span>DEVELOPER TOOLS</span><b>◆</b>
          <span>GAMEPLAY SYSTEMS</span><b>◆</b>
          <span>NETWORKING</span>
        </div>
      </section>

      <section className="section shell" id="systems">
        <div className="section-heading">
          <p className="eyebrow">Selected disciplines</p>
          <h2>Systems that hold up<br />under real play.</h2>
          <p>
            I work where design intent meets technical reality: the moment a
            mechanic must feel great, stay secure, and remain maintainable.
          </p>
        </div>

        <div className="systems-grid">
          {systems.map((system) => (
            <article className="discipline-card" key={system.index}>
              <div className="card-top">
                <span>{system.index}</span>
                <span className="crosshair">＋</span>
              </div>
              <div>
                <h3>{system.title}</h3>
                <p>{system.copy}</p>
              </div>
              <ul>
                {system.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="manifesto" id="approach">
        <div className="shell manifesto-grid">
          <div className="manifesto-copy">
            <p className="eyebrow">Engineering approach</p>
            <h2>Good gameplay is a conversation.</h2>
            <p>
              Between player intent and system response. Between design,
              animation, networking, and code. My job is to make that
              conversation immediate, legible, and resilient.
            </p>
            <div className="code-window" aria-label="Luau code example">
              <div className="window-bar"><i /><i /><i /><span>ability_controller.luau</span></div>
              <pre><code><em>local</em> ability = Ability.new(config){"\n\n"}ability:<b>onInput</b>(<em>function</em>(intent){"\n"}  predictor:<b>simulate</b>(intent){"\n"}  authority:<b>validate</b>(intent){"\n"}  feedback:<b>render</b>(intent){"\n"}<em>end</em>)</code></pre>
            </div>
          </div>

          <div className="principles">
            {principles.map(([number, title, copy]) => (
              <article key={number}>
                <span>{number}</span>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell capabilities">
        <div className="section-heading compact">
          <p className="eyebrow">Capability matrix</p>
          <h2>Built for the whole gameplay loop.</h2>
        </div>
        <div className="capability-grid">
          {capabilities.map((capability, index) => (
            <div key={capability}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{capability}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="contact shell" id="contact">
        <div>
          <p className="eyebrow">Next mission</p>
          <h2>Let&apos;s build something<br /><span>players remember.</span></h2>
        </div>
        <div className="contact-copy">
          <p>
            Looking for a gameplay engineer who cares equally about player
            feel, system boundaries, and the realities of shipping?
          </p>
          <a className="button primary" href="#top">
            Contact details coming next <Arrow />
          </a>
          <small>Add your email, Discord, Roblox, GitHub, and project links here.</small>
        </div>
      </section>

      <footer className="shell">
        <a className="brand" href="#top"><span className="brand-mark">V</span><span>VELUMIX</span></a>
        <p>Gameplay engineer · Roblox developer · Software engineer</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
