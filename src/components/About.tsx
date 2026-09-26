import { Icon } from "./Icon";
import { skills } from "../data/projects";

export function About() {
  return (
    <section
      id="about"
      className="about-section section shell"
      aria-labelledby="about-title"
    >
      <div className="about-intro">
        <p className="eyebrow">
          <span>03 /</span> THE PERSON BEHIND THE CODE
        </p>
        <h2 id="about-title">
          Player mindset.
          <br />
          <span className="muted">Engineer’s instinct.</span>
        </h2>
        <p>
          I’m Velumix, a gameplay and software engineer based in Canada. For
          over seven years, I’ve been building on Roblox — from that first
          satisfying movement mechanic to the systems that keep a live game
          running.
        </p>
        <p>
          I care about how a game feels in your hands, and what it takes to make
          that feeling hold up in production.
        </p>
        <div className="about-signature">
          velumix<span>✳</span>
        </div>
      </div>
      <div className="capabilities" id="capabilities">
        {skills.map((skill, index) => (
          <article className="capability" key={skill.name}>
            <span className="capability-icon">
              <Icon name={skill.icon} />
            </span>
            <div>
              <span className="capability-number">0{index + 1}</span>
              <h3>{skill.name}</h3>
              <p>{skill.detail}</p>
              <span className="capability-tags">{skill.tags}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
