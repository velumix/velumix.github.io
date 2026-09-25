import snapshot from "./roblox-media.json";
import { engineering } from "./engineering";

export const filters = [
  "All work",
  "Gameplay",
  "Simulation",
  "LiveOps",
] as const;
export type Filter = (typeof filters)[number];

const categories: Record<string, Filter[]> = {
  aquatica: ["Gameplay", "Simulation"],
  ranger: ["Gameplay", "Simulation"],
  samurai: ["Gameplay"],
  paint: ["Gameplay"],
  garden: ["LiveOps"],
};

const descriptions: Record<string, string> = {
  aquatica: "An ocean full of life. The systems that bring it together.",
  samurai: "Every swing is a decision. Combat built around timing and feel.",
  ranger: "Dynamic emergencies. A world that responds to its players.",
  paint: "Blend in. Stand out. A new twist on hide-and-seek.",
  garden: "Growing the gameplay loop, from progression to live events.",
};

const order = ["aquatica", "samurai", "ranger", "paint", "garden"];

export const projects = snapshot.games
  .map((game) => ({
    ...game,
    name: game.name.replace(/^(?:\[[^\]]+\]\s*)+/, ""),
    cover: `/images/${game.id}.png`,
    gallery: [
      `/images/${game.id}.png`,
      ...(["paint", "garden"].includes(game.id)
        ? [1, 2].map((index) => `/images/${game.id}-${index}.png`)
        : []),
    ],
    categories: categories[game.id] ?? [],
    summary: descriptions[game.id],
    engineering: engineering[game.id],
  }))
  .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

export type Project = (typeof projects)[number];
export const snapshotDate = new Date(snapshot.fetchedAt).toLocaleDateString(
  "en",
  {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  },
);
export const totalVisits = projects.reduce(
  (sum, game) => sum + (game.stats?.visits ?? 0),
  0,
);
export const compact = (number: number) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);

export const skills = [
  {
    name: "Gameplay & feel",
    detail:
      "Custom controllers, combat, cameras, and interactions that feel right.",
    tags: "Luau · Physics · Cross-platform input",
    icon: "gamepad",
  },
  {
    name: "Living worlds",
    detail:
      "Creature AI, boid simulations, and vehicles with performance in mind.",
    tags: "Behavior trees · Parallel Luau · Navigation",
    icon: "orbit",
  },
  {
    name: "Systems that scale",
    detail:
      "Server authority, reliable player data, and the tools to ship confidently.",
    tags: "Networking · Persistence · Developer tools",
    icon: "layers",
  },
] as const;
