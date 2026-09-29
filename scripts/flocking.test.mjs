import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

// Exercise the actual TypeScript simulation without a DOM or graphics context.
const compile = async (path) =>
  ts.transpileModule(await readFile(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText;
const moduleURL = (source) =>
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const configURL = moduleURL(await compile("../src/lab/config.ts"));
const { DEFAULT_CONFIG, PRESETS, parseConfig, serializeConfig, configToLuau } =
  await import(configURL);
const { Simulation, BOUNDS, REEF } = await import(
  moduleURL(
    (await compile("../src/lab/simulation.ts")).replace(
      '"./config"',
      JSON.stringify(configURL),
    ),
  )
);
const snapshot = (simulation) =>
  JSON.stringify(simulation.fish.map((fish) => [fish.position, fish.velocity]));

test("presets round-trip and malformed imports cannot create unbounded simulations", () => {
  assert.deepEqual(
    parseConfig(JSON.parse(serializeConfig(DEFAULT_CONFIG))),
    DEFAULT_CONFIG,
  );
  for (const invalid of [
    null,
    [],
    {},
    { count: 1000000 },
    { count: 30.5 },
    { seed: -1 },
    { speed: Infinity },
    { speed: "4" },
    { perception: 0 },
    { leaders: "yes" },
    { version: 2, config: DEFAULT_CONFIG },
  ]) {
    assert.throws(() => parseConfig(invalid));
  }
  assert.match(configToLuau(DEFAULT_CONFIG), /not a drop-in/);
});

test("the same seed and inputs reproduce a run and reset restores the initial state", () => {
  const a = new Simulation(DEFAULT_CONFIG),
    b = new Simulation(DEFAULT_CONFIG);
  const initial = snapshot(a);
  for (let i = 0; i < 180; i++) {
    a.step();
    b.step();
  }
  assert.equal(snapshot(a), snapshot(b));
  assert.notEqual(snapshot(a), initial);
  a.reset();
  assert.equal(snapshot(a), initial);
  assert.equal(a.time, 0);
});

test("spatial queries agree with a complete neighbor search", () => {
  const simulation = new Simulation({ ...DEFAULT_CONFIG, count: 150 });
  for (let i = 0; i < 20; i++) simulation.step();
  const squared = (a, b) =>
    (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
  for (const id of [0, 14, 55, 149]) {
    const fish = simulation.fish[id];
    const expected = simulation.fish
      .filter(
        (other) =>
          other.id !== id &&
          other.school === fish.school &&
          squared(other.position, fish.position) <
            DEFAULT_CONFIG.perception ** 2,
      )
      .sort(
        (a, b) =>
          squared(a.position, fish.position) -
            squared(b.position, fish.position) || a.id - b.id,
      )
      .slice(0, 16)
      .map((other) => other.id);
    assert.deepEqual(simulation.neighborsFor(id), expected);
  }
});

test("dense schools stay finite, in bounds, outside reef obstacles, and within the speed limit", () => {
  const cases = [
    ...PRESETS.map((preset) => preset.config),
    {
      ...DEFAULT_CONFIG,
      count: 600,
      speed: 8,
      separation: 3,
      alignment: 3,
      cohesion: 3,
      perception: 10,
      wander: 2,
      current: 2,
      avoidance: 0,
    },
  ];
  for (const config of cases) {
    const simulation = new Simulation(config);
    for (let frame = 0; frame < 420; frame++) {
      simulation.step();
      if (frame % 30) continue;
      for (const fish of simulation.fish) {
        const p = fish.position;
        assert.ok(
          [p.x, p.y, p.z, ...Object.values(fish.velocity)].every(
            Number.isFinite,
          ),
        );
        assert.ok(
          Math.abs(p.x) <= BOUNDS.x &&
            Math.abs(p.z) <= BOUNDS.z &&
            p.y >= BOUNDS.floor &&
            p.y <= BOUNDS.ceiling,
        );
        assert.ok(
          Math.hypot(...Object.values(fish.velocity)) <= config.speed + 1e-8,
        );
        if (config.obstacles)
          for (const rock of REEF)
            assert.ok(
              Math.hypot(
                p.x - rock.center.x,
                p.y - rock.center.y,
                p.z - rock.center.z,
              ) >=
                rock.radius + 0.65 - 1e-8,
            );
      }
    }
    assert.ok(simulation.coherence >= 0 && simulation.coherence <= 100);
  }
});

test("configuration edits change behavior without resetting playback; population edits safely restart", () => {
  const a = new Simulation(DEFAULT_CONFIG),
    b = new Simulation(DEFAULT_CONFIG);
  a.step();
  b.step();
  a.configure({ ...DEFAULT_CONFIG, alignment: 0, cohesion: 0, leaders: false });
  assert.equal(a.tick, 1);
  for (let i = 0; i < 60; i++) {
    a.step();
    b.step();
  }
  assert.notEqual(snapshot(a), snapshot(b));
  a.configure({ ...DEFAULT_CONFIG, count: 30 });
  assert.equal(a.fish.length, 30);
  assert.equal(a.tick, 0);
});

test("disturbances expire in simulation time and detail follows the camera", () => {
  const simulation = new Simulation({ ...DEFAULT_CONFIG, count: 30 });
  simulation.guide = { x: 0, y: 11, z: 0 };
  simulation.startle({ x: 0, y: 11, z: 0 });
  simulation.step(1 / 60, { x: 200, y: 100, z: 200 });
  assert.ok(simulation.fish.every((fish) => fish.tier === 2));
  for (let i = 0; i < 245; i++) simulation.step();
  assert.equal(simulation.disturbance, null);
  simulation.configure({ ...simulation.config, adaptive: false });
  simulation.step(1 / 60, { x: 200, y: 100, z: 200 });
  assert.ok(simulation.fish.every((fish) => fish.tier === 0));
  simulation.reset();
  assert.equal(simulation.guide, null);
});
