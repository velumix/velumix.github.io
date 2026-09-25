import { useState } from "react";
import { Brand, Icon } from "./components/Icon";
import { ProjectDialog } from "./components/ProjectDialog";
import { compact, totalVisits, type Project } from "./data/projects";
import { discordUrl } from "./data/links";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Work } from "./components/Work";
import { DeepDive } from "./components/DeepDive";
import { OpenSource } from "./components/OpenSource";
import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { useEntranceMotion } from "./hooks/useEntranceMotion";

export default function App() {
  useEntranceMotion();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero onSelect={setSelectedProject} />
        <div className="metrics-strip">
          <div className="shell metrics-inner">
            <div>
              <strong>{compact(totalVisits)}</strong>
              <span>Visits across games I’ve worked on</span>
            </div>
            <div>
              <strong>
                7<span>+</span>
              </strong>
              <span>Years building on Roblox</span>
            </div>
            <div>
              <strong>5</strong>
              <span>Featured experiences</span>
            </div>
            <a
              href="https://github.com/velumix"
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="code" />
              <span>
                Gameplay is the craft.
                <br />
                <strong>Engineering is the foundation.</strong>
              </span>
              <Icon name="diagonal" />
            </a>
          </div>
        </div>
        <Work onSelect={setSelectedProject} />
        <DeepDive onSelect={setSelectedProject} />
        <OpenSource />
        <About />
        <Contact />
      </main>
      <footer className="site-footer shell">
        <div className="footer-top">
          <Brand footer />
          <p>Thoughtfully engineered. Made to be played.</p>
          <a href="#top">
            Back to top <Icon name="down" />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Velumix</span>
          <div>
            <a
              href="https://github.com/velumix"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <Icon name="diagonal" />
            </a>
            <a href={discordUrl} target="_blank" rel="noreferrer">
              Discord <Icon name="diagonal" />
            </a>
          </div>
          <span>BUILT WITH CARE & A LITTLE LUAU ENERGY.</span>
        </div>
      </footer>
      {selectedProject && (
        <ProjectDialog
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onNavigate={setSelectedProject}
        />
      )}
    </>
  );
}
