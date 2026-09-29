export type LabConfig = {
  count: number;
  seed: number;
  separation: number;
  alignment: number;
  cohesion: number;
  perception: number;
  speed: number;
  wander: number;
  current: number;
  avoidance: number;
  leaders: boolean;
  obstacles: boolean;
  adaptive: boolean;
};

export const MAX_FISH = 600;
export const DEFAULT_CONFIG: LabConfig = {
  count: 240,
  seed: 42,
  separation: 1.4,
  alignment: 1,
  cohesion: 0.8,
  perception: 6,
  speed: 4,
  wander: 0.55,
  current: 0.2,
  avoidance: 2.5,
  leaders: true,
  obstacles: true,
  adaptive: true,
};

export const PRESETS = [
  {
    id: "reef",
    name: "Reef school",
    subtitle: "Together, around the reef",
    color: "#72dbcd",
    config: DEFAULT_CONFIG,
  },
  {
    id: "shoal",
    name: "Tight shoal",
    subtitle: "Many fish. One direction.",
    color: "#9bbdf5",
    config: {
      ...DEFAULT_CONFIG,
      count: 360,
      cohesion: 1.5,
      alignment: 1.7,
      perception: 8,
      separation: 1.1,
      wander: 0.2,
    },
  },
  {
    id: "drift",
    name: "Open water",
    subtitle: "Room to wander",
    color: "#e8c88b",
    config: {
      ...DEFAULT_CONFIG,
      count: 120,
      cohesion: 0.2,
      alignment: 0.4,
      separation: 1.9,
      wander: 1.4,
      obstacles: false,
      leaders: false,
      current: 0.6,
    },
  },
] as const;

export const NUMERIC_LIMITS: Record<
  Exclude<keyof LabConfig, "leaders" | "obstacles" | "adaptive">,
  readonly [number, number]
> = {
  count: [30, MAX_FISH],
  seed: [1, 999999],
  separation: [0, 3],
  alignment: [0, 3],
  cohesion: [0, 3],
  perception: [2, 10],
  speed: [1, 8],
  wander: [0, 2],
  current: [0, 2],
  avoidance: [0, 5],
};

export function parseConfig(value: unknown): LabConfig {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Choose a valid lab preset.");
  const envelope = value as Record<string, unknown>;
  if ("version" in envelope && envelope.version !== 1)
    throw new Error("This preset uses an unsupported version.");
  const raw = ("config" in envelope ? envelope.config : value) as Record<
    string,
    unknown
  >;
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("This file has no lab settings.");
  const config = { ...DEFAULT_CONFIG };
  let recognized = 0;
  for (const key of Object.keys(
    NUMERIC_LIMITS,
  ) as (keyof typeof NUMERIC_LIMITS)[]) {
    if (!(key in raw)) continue;
    const number = raw[key];
    const [min, max] = NUMERIC_LIMITS[key];
    if (
      typeof number !== "number" ||
      !Number.isFinite(number) ||
      number < min ||
      number > max
    ) {
      throw new Error(`${key} must be a number between ${min} and ${max}.`);
    }
    if ((key === "count" || key === "seed") && !Number.isInteger(number))
      throw new Error(`${key} must be a whole number.`);
    config[key] = number;
    recognized++;
  }
  for (const key of ["leaders", "obstacles", "adaptive"] as const) {
    if (!(key in raw)) continue;
    if (typeof raw[key] !== "boolean")
      throw new Error(`${key} must be true or false.`);
    config[key] = raw[key];
    recognized++;
  }
  if (!recognized)
    throw new Error("No Aquatica lab settings were found in this file.");
  return config;
}

export function serializeConfig(config: LabConfig): string {
  return JSON.stringify(
    { app: "velumix-flocking-lab", version: 1, config },
    null,
    2,
  );
}

export function configToLuau(config: LabConfig): string {
  return [
    "-- Aquatica Flocking Lab: browser experiment settings",
    "-- Lab units and weights need tuning for your Roblox scene.",
    "-- This table is a reference preset, not a drop-in FishBrain configuration.",
    "return {",
    ...Object.entries(config).map(
      ([key, value]) => `    ${key} = ${String(value)},`,
    ),
    "}",
    "",
  ].join("\n");
}

export function randomSource(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
