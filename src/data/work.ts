import type { IconName } from "../components/Icon";
import { projects, type Project } from "./projects";

export const workFilters = [
  "All work",
  "Apps & tools",
  "Web & UI",
  "Contributions",
  "Games",
] as const;
export type WorkFilter = (typeof workFilters)[number];

export type SoftwareProject = {
  kind: "software";
  id: string;
  name: string;
  category: Exclude<WorkFilter, "All work" | "Games">;
  role: "Personal project" | "Merged contribution" | "Fork development";
  discipline: string;
  summary: string;
  tags: string[];
  icon: IconName;
  tone: "blue" | "violet" | "mint" | "amber";
  url: string;
  details: string[];
  links: { label: string; url: string }[];
};

// Curated from public source and merged PRs; see docs/portfolio-sources.md.
// A fork alone is not treated as a contribution. No GitHub activity is invented.
export const softwareProjects: SoftwareProject[] = [
  {
    kind: "software",
    id: "abraxius-workspace",
    name: "Abraxius Workspace",
    category: "Apps & tools",
    role: "Personal project",
    discipline: "Agent runtime & desktop app",
    summary:
      "A C# agent runtime and Avalonia workstation. Parallel tasks, execution graphs, memory, and live activity share one runtime across the desktop app and CLI.",
    tags: ["C#", ".NET", "Avalonia", "AI agents", "Concurrency"],
    icon: "layers",
    tone: "violet",
    url: "https://github.com/velumix/Abraxius-Workspace",
    details: [
      "Dependency-aware scheduling with bounded worker queues, cancellation, deadlines, and retries.",
      "Live execution graphs built from immutable, frame-coalesced runtime snapshots.",
      "Shared model providers, evidence storage, event telemetry, and an append-only execution ledger.",
    ],
    links: [
      {
        label: "Architecture",
        url: "https://github.com/velumix/Abraxius-Workspace/blob/main/docs/architecture.md",
      },
    ],
  },
  {
    kind: "software",
    id: "abraxius-lattice",
    name: "Abraxius Lattice",
    category: "Apps & tools",
    role: "Personal project",
    discipline: "Native code intelligence",
    summary:
      "A Rust engine for understanding Luau workspaces: syntax analysis, dependency graphs, source search, and revision tracking, exposed through a native CLI and MCP bridge.",
    tags: ["Rust", "C++ interop", "SQLite", "Tantivy", "MCP"],
    icon: "code",
    tone: "blue",
    url: "https://github.com/velumix/Abraxius-Lattice",
    details: [
      "Parses source through the official Luau C++ AST and extracts functions, types, references, and calls.",
      "Combines SQLite metadata, BLAKE3 content-addressed storage, and incremental Tantivy indexing.",
      "Separates the native domain model from CLI, daemon, desktop, and protocol adapters.",
    ],
    links: [
      {
        label: "Implementation",
        url: "https://github.com/velumix/Abraxius-Lattice/tree/main/crates",
      },
    ],
  },
  {
    kind: "software",
    id: "projectvite",
    name: "ProjectVite",
    category: "Web & UI",
    role: "Personal project",
    discipline: "Interactive interfaces & tooling",
    summary:
      "A React and TypeScript UI workspace with interactive inventory and phone interfaces, reactive state, scenario playback, and a browser preview for Roblox UI development.",
    tags: ["React", "TypeScript", "Vite", "UI/UX", "Playwright"],
    icon: "grid",
    tone: "blue",
    url: "https://github.com/velumix/ProjectVite",
    details: [
      "Inventory interactions include search, equip, consume, split, drop and undo, with keyboard and focus handling.",
      "Feature compilation, reactive bindings, effects, and scenario playback support repeatable previews.",
      "Browser previews and native Roblox exports have explicit boundaries; the new inventory preview is not a shipped Studio UI.",
    ],
    links: [
      {
        label: "UI implementation",
        url: "https://github.com/velumix/ProjectVite/tree/main/my-ui/src",
      },
    ],
  },
  {
    kind: "software",
    id: "stride",
    name: "Stride engine",
    category: "Contributions",
    role: "Merged contribution",
    discipline: "C# engine & UI correctness",
    summary:
      "Two merged fixes in the Stride game engine: keeping slider values within changing bounds and preventing invalid tick calculations when a range collapses.",
    tags: ["C#", "Open source", "UI controls", "Regression testing"],
    icon: "check",
    tone: "mint",
    url: "https://github.com/stride3d/stride/pull/3401",
    details: [
      "Re-coerces slider values when bounds change while preserving value-change notifications.",
      "Handles collapsed ranges without producing NaN, including negative and zero bounds.",
      "Adds regression coverage for fractional tick frequencies, subnormal values, and extreme floating-point ranges.",
    ],
    links: [
      {
        label: "Bounds fix #3401",
        url: "https://github.com/stride3d/stride/pull/3401",
      },
      {
        label: "Tick fix #3395",
        url: "https://github.com/stride3d/stride/pull/3395",
      },
    ],
  },
  {
    kind: "software",
    id: "vscodroid",
    name: "VSCodroid",
    category: "Contributions",
    role: "Fork development",
    discipline: "Android editor & compatibility",
    summary:
      "Changes in my fork of the Android VS Code port: tighter mobile layouts, slimmer scrollbars, and extension runtime compatibility, with execution tests wired into CI.",
    tags: ["Android", "JavaScript", "Developer tools", "CI"],
    icon: "code",
    tone: "blue",
    url: "https://github.com/velumix/VSCodroid",
    details: [
      "Adjusts editor tabs, line-number spacing, glyph margins, and scrollbar sizing for Android screens.",
      "Covers extension-host platform detection and child-process execution, including script and binary launch paths.",
      "Adds extension execution tests and manual build workflow dispatch. These changes are published in my fork.",
    ],
    links: [
      {
        label: "My changes",
        url: "https://github.com/velumix/VSCodroid/commit/e98420fdc49bbf5a6add59d1adb3df61ce68f413",
      },
      {
        label: "CI integration",
        url: "https://github.com/velumix/VSCodroid/commit/3ea10131249ce3868e21ac8d144939d5de13115b",
      },
    ],
  },
  {
    kind: "software",
    id: "gojo",
    name: "Gojo",
    category: "Apps & tools",
    role: "Personal project",
    discipline: "Windows process & protocol tooling",
    summary:
      "A small Go proxy that connects MCP clients to Roblox Studio’s local server, supervises the server process, and exports scripts into a mapped local project.",
    tags: ["Go", "MCP", "Windows", "Process supervision"],
    icon: "terminal",
    tone: "mint",
    url: "https://github.com/velumix/gojo",
    details: [
      "Forwards MCP over stdio while keeping diagnostics on stderr.",
      "Optional watcher follows Studio’s process lifecycle and manages the local MCP server.",
      "Batches script exports and splits oversized sources into continuations before writing local files.",
    ],
    links: [
      {
        label: "Source",
        url: "https://github.com/velumix/gojo/tree/main/internal",
      },
    ],
  },
  {
    kind: "software",
    id: "abraxius",
    name: "Abraxius",
    category: "Apps & tools",
    role: "Personal project",
    discipline: "Desktop companion & sync tooling",
    summary:
      "A WinUI desktop companion backed by a Rust host, Node CLI, and Studio plugin. It connects local development tools to live project inspection and verified Luau sync.",
    tags: ["Rust", "C#", "WinUI 3", "Node.js", "Luau"],
    icon: "layers",
    tone: "violet",
    url: "https://github.com/velumix/Abraxius",
    details: [
      "App-owned daemon lifecycle with taskbar, tray, health, and restart controls.",
      "Revision-checked script patches and explicit handling for edits pending in Studio Draft Mode.",
      "A read-only GitHub integration supplies repository, PR, release, and Actions context to development tools.",
    ],
    links: [
      { label: "Documentation", url: "https://velumix.github.io/Abraxius/" },
    ],
  },
  {
    kind: "software",
    id: "nerve",
    name: "Nerve",
    category: "Apps & tools",
    role: "Personal project",
    discipline: "Framework & multiplayer infrastructure",
    summary:
      "A Luau framework that brings typed networking, service lifecycles, persistence integrations, and React UI together for Roblox developers.",
    tags: ["Luau", "ByteNet", "Networking", "React", "Frameworks"],
    icon: "orbit",
    tone: "mint",
    url: "https://github.com/velumix/Nerve",
    details: [
      "Automatic server and client startup with supervised service and controller lifecycles.",
      "Typed methods and signals with middleware, timeouts, cancellation, and per-player limits.",
      "Bundled React UI and persistence dependencies, with generated API documentation and integration tests.",
    ],
    links: [
      { label: "Documentation", url: "https://velumix.github.io/Nerve/" },
    ],
  },
  {
    kind: "software",
    id: "claude-system",
    name: "claude-system",
    category: "Contributions",
    role: "Merged contribution",
    discipline: "Repository automation",
    summary:
      "A merged GitHub Actions workflow for maintaining inactive good-first issues, with label-based exclusions and documentation for contributors.",
    tags: ["GitHub Actions", "Automation", "Open source"],
    icon: "check",
    tone: "amber",
    url: "https://github.com/hariomlohardev/claude-system/pull/24",
    details: [
      "Limits processing to issues labeled good first issue and excludes pull requests.",
      "Marks inactivity after 30 days, closes after seven more, and exempts pinned and help-wanted issues.",
      "Documents the behavior in the contribution guide; the workflow was merged upstream.",
    ],
    links: [
      {
        label: "Merged PR #24",
        url: "https://github.com/hariomlohardev/claude-system/pull/24",
      },
    ],
  },
];

type GameWork = {
  kind: "game";
  id: string;
  name: string;
  category: "Games";
  summary: string;
  tags: string[];
  project: Project;
};
export type Work = SoftwareProject | GameWork;
const gameWork: GameWork[] = projects.map((project) => ({
  kind: "game",
  id: project.id,
  name: project.name,
  category: "Games",
  summary: project.engineering.summary,
  tags: [
    "Roblox",
    ...project.categories,
    project.engineering.role,
    ...project.engineering.tags,
  ],
  project,
}));

export const portfolio: Work[] = [
  ...softwareProjects.slice(0, 3),
  ...gameWork.slice(0, 1),
  ...softwareProjects.slice(3, 5),
  ...gameWork.slice(1, 2),
  ...softwareProjects.slice(5),
  ...gameWork.slice(2),
];

export const experience = [
  {
    name: "Native applications & agent systems",
    icon: "layers",
    detail:
      "Desktop interfaces, parallel execution, runtime observability, and shared application architecture.",
    tags: "C# · .NET · Avalonia · Rust · WinUI",
    projects: ["abraxius-workspace", "abraxius"],
  },
  {
    name: "Developer tools & code intelligence",
    icon: "terminal",
    detail:
      "Syntax analysis, incremental search, protocol adapters, process supervision, and source synchronization.",
    tags: "Rust · Go · SQLite · Tantivy · MCP",
    projects: ["abraxius-lattice", "gojo"],
  },
  {
    name: "Web interfaces & interaction design",
    icon: "grid",
    detail:
      "Stateful React interfaces, keyboard interactions, reactive bindings, scenario previews, and browser testing.",
    tags: "React · TypeScript · Vite · Playwright",
    projects: ["projectvite"],
  },
  {
    name: "Open-source engineering",
    icon: "code",
    detail:
      "Merged C# engine fixes, Android editor compatibility work in my fork, and repository automation.",
    tags: "UI correctness · Floating-point edge cases · Regression tests · CI",
    projects: ["stride", "vscodroid", "claude-system"],
  },
  {
    name: "Gameplay, simulation & live systems",
    icon: "gamepad",
    detail:
      "Seven-plus years on Roblox: movement, combat, creature behavior, multiplayer networking, persistence, and live operations.",
    tags: "Luau · Physics · Behavior trees · Parallel Luau · Networking",
    projects: ["nerve"],
  },
] as const satisfies ReadonlyArray<{
  name: string;
  icon: IconName;
  detail: string;
  tags: string;
  projects: string[];
}>;
