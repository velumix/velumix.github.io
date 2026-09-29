import { randomSource, type LabConfig } from "./config";

export type Vec = { x: number; y: number; z: number };
export const vec = (x = 0, y = 0, z = 0): Vec => ({ x, y, z });
const sub = (a: Vec, b: Vec): Vec => vec(a.x - b.x, a.y - b.y, a.z - b.z);
const length = (a: Vec) => Math.hypot(a.x, a.y, a.z);
const scale = (a: Vec, n: number): Vec => vec(a.x * n, a.y * n, a.z * n);
const add = (a: Vec, b: Vec, weight = 1) => {
  a.x += b.x * weight;
  a.y += b.y * weight;
  a.z += b.z * weight;
};
const unit = (a: Vec): Vec => scale(a, 1 / (length(a) || 1));
const limit = (a: Vec, max: number): Vec =>
  scale(a, Math.min(1, max / (length(a) || 1)));
const distanceSquared = (a: Vec, b: Vec) =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
const smooth = (t: number) => {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
};
const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y + a.z * b.z;
const blend = (a: Vec, b: Vec, t: number): Vec =>
  vec(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);

function turnToward(current: Vec, desired: Vec, maxAngle: number): Vec {
  const cosine = Math.max(-1, Math.min(1, dot(current, desired)));
  const angle = Math.acos(cosine);
  if (angle <= maxAngle) return desired;
  let tangent = sub(desired, scale(current, cosine));
  if (length(tangent) < 0.00001) {
    tangent = vec(-current.z, 0, current.x);
    if (length(tangent) < 0.00001) tangent = vec(1, 0, 0);
  }
  const heading = scale(current, Math.cos(maxAngle));
  add(heading, unit(tangent), Math.sin(maxAngle));
  return unit(heading);
}

export const BOUNDS = { x: 24, floor: 2, ceiling: 22, z: 16 };
export const REEF = [
  { center: vec(-8, 2.3, -3), radius: 5.1 },
  { center: vec(9, 1.4, -5), radius: 4.4 },
  { center: vec(2, 0.6, 8), radius: 3.5 },
];
export const SCHOOL_COLORS = ["#79dcd2", "#f2d54e", "#f3a36e"];
export const SCHOOL_NAMES = ["Chromis", "Yellow tang", "Clownfish"];
export type Forces = Record<
  "separation" | "alignment" | "cohesion" | "navigation",
  Vec
>;
export type Fish = {
  id: number;
  school: number;
  position: Vec;
  velocity: Vec;
  acceleration: Vec;
  steering: Vec;
  previousPosition: Vec;
  previousVelocity: Vec;
  avoidanceSides: number[];
  danger: number;
  swimPhase: number;
  previousSwimPhase: number;
  swimEffort: number;
  previousSwimEffort: number;
  phase: number;
  size: number;
  speedFactor: number;
  tier: number;
  neighbors: number;
  forces: Forces;
};

export class Simulation {
  config: LabConfig;
  fish: Fish[] = [];
  time = 0;
  tick = 0;
  leaders = [0, 1, 2];
  targets: Vec[] = [];
  guide: Vec | null = null;
  disturbance: { point: Vec; expires: number } | null = null;
  private cells = new Map<number, number[]>();
  private random: () => number;
  private candidateIds: number[] = [];

  constructor(config: LabConfig) {
    this.config = { ...config };
    this.random = randomSource(config.seed);
    this.reset();
  }

  configure(config: LabConfig) {
    const restart =
      config.count !== this.config.count || config.seed !== this.config.seed;
    this.config = { ...config };
    if (restart) this.reset();
    else this.rebuildGrid();
  }

  reset() {
    this.random = randomSource(this.config.seed);
    this.time = 0;
    this.tick = 0;
    this.guide = null;
    this.disturbance = null;
    this.leaders = [0, 1, 2];
    this.updateTargets();
    this.fish = Array.from({ length: this.config.count }, (_, id) => {
      const school = id % 3;
      const target = this.targets[school];
      const angle = (school * Math.PI * 2) / 3;
      const fish: Fish = {
        id,
        school,
        position: vec(
          target.x + (this.random() - 0.5) * 12,
          target.y + (this.random() - 0.5) * 7,
          target.z + (this.random() - 0.5) * 9,
        ),
        velocity: scale(
          unit(
            vec(-Math.sin(angle), (this.random() - 0.5) * 0.2, Math.cos(angle)),
          ),
          this.config.speed * 0.8,
        ),
        acceleration: vec(),
        steering: vec(),
        previousPosition: vec(),
        previousVelocity: vec(),
        avoidanceSides: REEF.map(() => 0),
        danger: 0,
        swimPhase: 0,
        previousSwimPhase: 0,
        swimEffort: 0.6,
        previousSwimEffort: 0.6,
        phase: this.random() * 100,
        size: 0.72 + this.random() * 0.45,
        speedFactor: 0.75 + this.random() * 0.25,
        tier: 0,
        neighbors: 0,
        forces: {
          separation: vec(),
          alignment: vec(),
          cohesion: vec(),
          navigation: vec(),
        },
      };
      this.contain(fish);
      fish.previousPosition = { ...fish.position };
      fish.previousVelocity = { ...fish.velocity };
      fish.swimPhase = fish.previousSwimPhase =
        (fish.phase / (Math.PI * 2)) % 1;
      return fish;
    });
    this.rebuildGrid();
  }

  private updateTargets() {
    this.targets = [0, 1, 2].map((school) => {
      const phase = this.time * 0.085 + (school * Math.PI * 2) / 3;
      return this.guide
        ? { ...this.guide }
        : vec(
            Math.cos(phase) * 14,
            11 + Math.sin(phase * 1.7 + school) * 3.5,
            Math.sin(phase) * 9,
          );
    });
  }

  private key(x: number, y: number, z: number) {
    return x + 128 + (y + 128) * 256 + (z + 128) * 65536;
  }

  private rebuildGrid() {
    this.cells.clear();
    const size = this.config.perception;
    for (const fish of this.fish) {
      const p = fish.position;
      const key = this.key(
        Math.floor(p.x / size),
        Math.floor(p.y / size),
        Math.floor(p.z / size),
      );
      const bucket = this.cells.get(key);
      if (bucket) bucket.push(fish.id);
      else this.cells.set(key, [fish.id]);
    }
  }

  neighborsFor(id: number, max = 16): number[] {
    const fish = this.fish[id];
    if (!fish) return [];
    const p = fish.position,
      radius = this.config.perception;
    const cx = Math.floor(p.x / radius),
      cy = Math.floor(p.y / radius),
      cz = Math.floor(p.z / radius);
    const found = this.candidateIds;
    found.length = 0;
    for (let x = cx - 1; x <= cx + 1; x++)
      for (let y = cy - 1; y <= cy + 1; y++)
        for (let z = cz - 1; z <= cz + 1; z++) {
          const bucket = this.cells.get(this.key(x, y, z));
          if (!bucket) continue;
          for (const otherId of bucket) {
            if (otherId === id) continue;
            const other = this.fish[otherId];
            if (
              other.school === fish.school &&
              distanceSquared(other.position, p) < radius * radius
            )
              found.push(otherId);
          }
        }
    found.sort(
      (a, b) =>
        distanceSquared(this.fish[a].position, p) -
          distanceSquared(this.fish[b].position, p) || a - b,
    );
    return found.slice(0, max);
  }

  private steer(fish: Fish, direction: Vec, weight: number): Vec {
    if (length(direction) < 0.00001 || !weight) return vec();
    return scale(
      limit(
        sub(
          scale(unit(direction), this.config.speed * fish.speedFactor),
          fish.velocity,
        ),
        4,
      ),
      weight,
    );
  }

  private chooseLeaders() {
    for (let school = 0; school < 3; school++) {
      let best = -Infinity;
      const incumbent = this.leaders[school];
      let next = incumbent;
      const target = this.targets[school];
      for (const fish of this.fish) {
        if (fish.school !== school) continue;
        const score =
          length(fish.velocity) -
          Math.sqrt(distanceSquared(fish.position, target)) * 0.13 +
          (fish.id === incumbent ? 0.9 : 0) +
          this.random() * 0.2;
        if (score > best) {
          best = score;
          next = fish.id;
        }
      }
      this.leaders[school] = next;
    }
  }

  private steerFish(fish: Fish) {
    const c = this.config,
      p = fish.position;
    const neighbors = this.neighborsFor(
      fish.id,
      fish.tier === 0 ? 16 : fish.tier === 1 ? 8 : 4,
    );
    fish.neighbors = neighbors.length;
    const alignment = vec(),
      cohesion = vec(),
      separation = vec();
    let neighborWeight = 0;
    for (const id of neighbors) {
      const other = this.fish[id];
      const away = sub(p, other.position),
        distance = length(away);
      const weight = 1 - smooth(distance / c.perception);
      add(alignment, other.velocity, weight);
      add(cohesion, other.position, weight);
      neighborWeight += weight;
      if (distance < 2.1) {
        const strength = 1 - smooth(distance / 2.1);
        if (distance > 0.0001)
          add(separation, unit(away), strength / Math.max(0.45, distance));
        else add(separation, vec(fish.id < id ? -1 : 1, 0.3, 0));
      }
    }
    const forces = fish.forces;
    // Corrections approach zero continuously as velocity/position errors vanish.
    forces.alignment =
      neighborWeight > 0.0001
        ? scale(
            limit(sub(scale(alignment, 1 / neighborWeight), fish.velocity), 3),
            c.alignment,
          )
        : vec();
    forces.cohesion =
      neighborWeight > 0.0001
        ? scale(
            limit(
              scale(sub(scale(cohesion, 1 / neighborWeight), p), 0.32),
              2.4,
            ),
            c.cohesion,
          )
        : vec();
    forces.separation = scale(limit(scale(separation, 4.0), 5.5), c.separation);
    const navigation = vec();
    const isLeader = fish.id === this.leaders[fish.school];
    const target = this.targets[fish.school];
    const offset = sub(target, p);
    // A moving school anchor keeps the experiment in view without forcing a path.
    add(
      navigation,
      this.steer(
        fish,
        offset,
        (this.guide ? 0.7 : 0.22) * smooth(length(offset) / 4),
      ),
    );
    if (c.leaders && !isLeader) {
      const leader = this.fish[this.leaders[fish.school]];
      const leaderOffset = sub(leader.position, p);
      add(navigation, limit(scale(leaderOffset, 0.055), 0.65));
      add(navigation, sub(leader.velocity, fish.velocity), 0.2);
    }
    const wander = vec(
      Math.sin(this.time * 0.6 + fish.phase),
      Math.sin(this.time * 0.4 + fish.phase * 1.3) * 0.38,
      Math.cos(this.time * 0.5 + fish.phase),
    );
    add(navigation, wander, c.wander * (isLeader ? 1.2 : 0.75));
    add(
      navigation,
      vec(
        Math.cos(p.z * 0.08 + this.time * 0.13),
        0.12 * Math.sin(this.time * 0.2),
        Math.sin(p.x * 0.08 + this.time * 0.13),
      ),
      c.current,
    );
    const margin = 5;
    if (p.x > BOUNDS.x - margin)
      navigation.x -= (p.x - BOUNDS.x + margin) * 1.7;
    if (p.x < -BOUNDS.x + margin)
      navigation.x += (-BOUNDS.x + margin - p.x) * 1.7;
    if (p.z > BOUNDS.z - margin)
      navigation.z -= (p.z - BOUNDS.z + margin) * 1.7;
    if (p.z < -BOUNDS.z + margin)
      navigation.z += (-BOUNDS.z + margin - p.z) * 1.7;
    if (p.y < BOUNDS.floor + 3) navigation.y += (BOUNDS.floor + 3 - p.y) * 2;
    if (p.y > BOUNDS.ceiling - 3)
      navigation.y -= (p.y - BOUNDS.ceiling + 3) * 2;
    fish.danger = 0;
    if (c.obstacles) {
      const forward = unit(fish.velocity);
      for (const [index, obstacle] of REEF.entries()) {
        const away = sub(p, obstacle.center),
          distance = length(away);
        const ahead = sub(obstacle.center, p);
        const along =
          ahead.x * forward.x + ahead.y * forward.y + ahead.z * forward.z;
        const closest = sub(
          ahead,
          scale(forward, Math.max(0, Math.min(along, c.speed * 1.3))),
        );
        const threatened =
          distance < obstacle.radius + 3 ||
          (along > 0 &&
            along < c.speed * 1.3 + obstacle.radius &&
            length(closest) < obstacle.radius + 1.4);
        if (threatened) {
          const side = vec(-forward.z, 0, forward.x);
          if (!fish.avoidanceSides[index])
            fish.avoidanceSides[index] = dot(side, away) < 0 ? -1 : 1;
          side.x *= fish.avoidanceSides[index];
          side.z *= fish.avoidanceSides[index];
          side.y = 0.28;
          const escape = unit(away);
          add(escape, side, 1.15);
          const proximity = 1 - smooth((distance - obstacle.radius - 0.7) / 3);
          const onPath =
            along > 0
              ? (1 - smooth(length(closest) / (obstacle.radius + 1.4))) * 0.8
              : 0;
          const urgency = Math.max(proximity, onPath);
          fish.danger = Math.max(fish.danger, urgency);
          add(navigation, this.steer(fish, escape, c.avoidance * urgency));
        } else if (distance > obstacle.radius + 4)
          fish.avoidanceSides[index] = 0;
      }
    }
    if (this.disturbance) {
      const away = sub(p, this.disturbance.point),
        distance = length(away);
      if (distance < 11)
        add(
          navigation,
          this.steer(
            fish,
            distance < 0.01 ? wander : away,
            (1 - distance / 11) * 4,
          ),
        );
    }
    forces.navigation = navigation;
    fish.steering = vec();
    for (const force of Object.values(forces)) add(fish.steering, force);
    fish.steering = limit(fish.steering, 14);
  }

  private contain(fish: Fish) {
    const p = fish.position,
      v = fish.velocity;
    // A final collision constraint is always active, even with avoidance weight zero.
    if (this.config.obstacles)
      for (const obstacle of REEF) {
        const away = sub(p, obstacle.center),
          distance = length(away),
          radius = obstacle.radius + 0.65;
        if (distance < radius) {
          const normal =
            distance > 0.0001 ? scale(away, 1 / distance) : vec(0, 1, 0);
          p.x = obstacle.center.x + normal.x * radius;
          p.y = obstacle.center.y + normal.y * radius;
          p.z = obstacle.center.z + normal.z * radius;
          const inward = v.x * normal.x + v.y * normal.y + v.z * normal.z;
          if (inward < 0) add(v, normal, -inward);
        }
      }
    const limits: [keyof Vec, number, number][] = [
      ["x", -BOUNDS.x, BOUNDS.x],
      ["y", BOUNDS.floor, BOUNDS.ceiling],
      ["z", -BOUNDS.z, BOUNDS.z],
    ];
    for (const [axis, min, max] of limits) {
      if (p[axis] < min) {
        p[axis] = min;
        if (v[axis] < 0) v[axis] = 0;
      }
      if (p[axis] > max) {
        p[axis] = max;
        if (v[axis] > 0) v[axis] = 0;
      }
    }
  }

  step(dt = 1 / 60, camera: Vec = vec(35, 28, 45)) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 1 / 30);
    this.time += dt;
    this.tick++;
    this.updateTargets();
    if (this.tick === 1 || this.tick % 120 === 0) this.chooseLeaders();
    if (this.disturbance && this.time >= this.disturbance.expires)
      this.disturbance = null;
    this.rebuildGrid();
    // Steering uses a stable snapshot; integrate only after all forces are evaluated.
    for (const fish of this.fish) {
      const distance = Math.sqrt(distanceSquared(fish.position, camera));
      fish.tier = this.config.adaptive
        ? distance > 85
          ? 2
          : distance > 58
            ? 1
            : 0
        : 0;
      const interval =
        this.config.leaders && this.leaders[fish.school] === fish.id
          ? 2
          : 2 ** (fish.tier + 1);
      if (this.tick === 1 || (this.tick + fish.id) % interval === 0)
        this.steerFish(fish);
    }
    for (const fish of this.fish) {
      fish.previousPosition = { ...fish.position };
      fish.previousVelocity = { ...fish.velocity };
      fish.previousSwimPhase = fish.swimPhase;
      fish.previousSwimEffort = fish.swimEffort;
      const response = fish.danger > 0.5 || this.disturbance ? 9 : 4.5;
      fish.acceleration = blend(
        fish.acceleration,
        fish.steering,
        1 - Math.exp(-response * dt),
      );
      const next = { ...fish.velocity };
      add(next, fish.acceleration, dt);
      const max = this.config.speed * fish.speedFactor;
      const speed = Math.max(max * 0.4, Math.min(max, length(next)));
      const currentHeading =
        length(fish.velocity) > 0.0001 ? unit(fish.velocity) : vec(0, 0, 1);
      const desiredHeading =
        length(next) > 0.0001 ? unit(next) : currentHeading;
      const turnRate = this.disturbance ? 2.4 : 1.45 + fish.danger * 0.65;
      fish.velocity = scale(
        turnToward(currentHeading, desiredHeading, turnRate * dt),
        speed,
      );
      add(fish.position, fish.velocity, dt);
      this.contain(fish);
      const actualSpeed = length(fish.velocity);
      fish.swimEffort +=
        (smooth((actualSpeed / max - 0.3) / 0.7) - fish.swimEffort) *
        (1 - Math.exp(-3 * dt));
      fish.swimPhase =
        (fish.swimPhase +
          dt * (0.46 + actualSpeed * 0.16) * [1, 0.9, 1.15][fish.school]) %
        1;
    }
    this.rebuildGrid();
  }

  startle(point: Vec) {
    this.disturbance = { point, expires: this.time + 4 };
  }

  get coherence() {
    let total = 0;
    for (let school = 0; school < 3; school++) {
      const sum = vec();
      let count = 0;
      for (const fish of this.fish)
        if (fish.school === school) {
          add(sum, unit(fish.velocity));
          count++;
        }
      total += length(sum) / Math.max(count, 1);
    }
    return Math.round((total / 3) * 100);
  }
}
