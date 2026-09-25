type EngineeringNote = {
  role: string;
  summary: string;
  highlights: string[];
  tags: string[];
  filename: string;
  code: string;
};

export const engineering: Record<string, EngineeringNote> = {
  aquatica: {
    role: "Gameplay systems engineer",
    summary:
      "Connected underwater movement, creature behavior, scanning, discoveries, persistence, interface feedback, and scheduled world encounters.",
    highlights: [
      "Force-driven custom swimming controller with keyboard, touch, gamepad, and VR input.",
      "Adaptive boid simulation with navigation baking, obstacle avoidance, and scheduled updates.",
      "Server-authoritative phenomena, discovery persistence, achievements, and analytics.",
    ],
    tags: ["Custom controller", "Boids", "Parallel Luau", "Persistence"],
    filename: "SwimmingController.luau",
    code: "movementForce.Force = desiredForce\norientation.CFrame = CFrame.lookAt(position, position + direction)\nvelocity.VectorVelocity = targetVelocity",
  },
  ranger: {
    role: "Gameplay systems engineer",
    summary:
      "Engineered emergency-response gameplay where incidents grow, spread, and are resolved cooperatively without surrendering authority to clients.",
    highlights: [
      "Vehicle physics using local velocity, suspension, impulses, and force application.",
      "Behavior-tree responders, pathfinding, autonomous bot decisions, and creature behavior.",
      "Replicated emergency objectives spanning wildfire, spill, rescue, and contribution systems.",
    ],
    tags: ["Vehicle physics", "Behavior trees", "Pathfinding", "Co-op"],
    filename: "VehiclePhysics.luau",
    code: "local velocity = root.CFrame:VectorToObjectSpace(root.AssemblyLinearVelocity)\nlocal motorImpulse = forward * throttle\nroot:ApplyImpulseAtPosition(motorImpulse, contactPoint)",
  },
  samurai: {
    role: "Combat designer / gameplay engineer",
    summary:
      "Designed the fighting mechanics around readable commitment: charge a swing, control spacing, read the opponent, and win through timing rather than input spam.",
    highlights: [
      "Charge-to-commit sword attacks with a readable risk and reward curve.",
      "Round-based PvP flow and clear combat-state boundaries.",
      "Responsive feedback designed around timing, spacing, and opponent reads.",
    ],
    tags: ["Combat design", "PvP", "Charge timing", "Round flow"],
    filename: "Combat system model",
    code: "local charge = math.clamp(now - heldAt, 0, maxCharge)\ncombat:commitSwing(aimDirection, charge)\nround:awaitResolution()",
  },
  paint: {
    role: "Gameplay systems engineer",
    summary:
      "Built round-driven camouflage gameplay where players paint themselves to blend into the map while seekers use cross-platform tools to expose them.",
    highlights: [
      "Match orchestration across intermission, hiding, play, reveal, and resolution.",
      "Validated paint, projectile, inventory, marketplace, and reward systems.",
      "Cross-platform UI and input plus additional modes such as Reverse Race.",
    ],
    tags: ["State machines", "Camouflage", "Projectiles", "Cross-platform"],
    filename: "MatchManager.luau",
    code: "match:transitionTo(HIDING)\npaintService:lockPalette(roundPalette)\nmatch:transitionTo(SEEKING)",
  },
  garden: {
    role: "Gameplay and LiveOps contributor",
    summary:
      "Contributed progression and live-operations systems that keep the garden loop moving while protecting rewards and state changes on the server.",
    highlights: [
      "NPC chase-and-escape loops, navigation, and progression gameplay.",
      "Server-validated plant growth, rerolls, rewards, and economy integrations.",
      "Scheduled world events with replicated state and safe resolution.",
    ],
    tags: ["Progression", "LiveOps", "Validation", "Economy"],
    filename: "PlantGrower.luau",
    code: "if not validateInteraction(player, plant) then return end\nplant:advanceGrowth(serverTime)\nrewards:grant(player, result)",
  },
};
