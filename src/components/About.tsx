import { skills } from "../data/projects";
export function About() {
  return (
    <section
      id="about"
      className="about-section section shell"
      aria-labelledby="about-title"
    >
      <div className="about-label">
        <p className="eyebrow">03 — A BIT ABOUT ME</p>
        <span className="about-years">
          7<span>+</span>
        </span>
        <p>
          years building
          <br />
          on Roblox
        </p>
      </div>
      <div className="about-content">
        <h2 id="about-title">
          The small details
          <br />
          make the <em>game.</em>
        </h2>
        <div className="about-prose">
          <p>
            I’m Velumix, a gameplay and software engineer based in Canada. My
            work ranges from swimming controllers and sword combat to creature
            behaviour and live game systems.
          </p>
          <p>
            I like the point where engineering becomes something you can feel: a
            movement that clicks, a fight that reads clearly, a world that
            reacts to you.
          </p>
        </div>
        <div className="capabilities" id="capabilities">
          {skills.map((skill, index) => (
            <article className="capability" key={skill.name}>
              <span>0{index + 1}</span>
              <h3>{skill.name}</h3>
              <p>{skill.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
