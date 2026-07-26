"use client";

import { useEffect, useState } from "react";

type MediaGame = {
  id: string;
  name: string;
  url: string;
  icon: string | null;
  images: string[];
  description: string;
  creator: { name: string; hasVerifiedBadge: boolean } | null;
  stats: {
    playing: number;
    visits: number;
    favorites: number;
    maxPlayers: number;
    upVotes: number;
    downVotes: number;
  } | null;
  metadata: { created: string; updated: string; avatarType: string; genres: string[] } | null;
  video: { poster: string | null; streamUrl: string | null } | null;
};

type EngineeringNote = {
  role: string;
  summary: string;
  highlights: string[];
  tags: string[];
  filename: string;
  code: string;
};

const engineering: Record<string, EngineeringNote> = {
  aquatica: {
    role: "Gameplay systems engineer",
    summary: "Connected underwater movement, creature behavior, scanning, discoveries, persistence, interface feedback, and scheduled world encounters.",
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
    summary: "Engineered emergency-response gameplay where incidents grow, spread, and are resolved cooperatively without surrendering authority to clients.",
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
    summary: "Designed the fighting mechanics around readable commitment: charge a swing, control spacing, read the opponent, and win through timing rather than input spam.",
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
    summary: "Built round-driven camouflage gameplay where players paint themselves to blend into the map while seekers use cross-platform tools to expose them.",
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
    summary: "Contributed progression and live-operations systems that keep the garden loop moving while protecting rewards and state changes on the server.",
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

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function GameCard({ game, index }: { game: MediaGame; index: number }) {
  const note = engineering[game.id];
  const media = [
    ...(game.video?.poster ? [{ image: game.video.poster, video: true }] : []),
    ...game.images.map((image) => ({ image, video: false })),
    ...(!game.video?.poster && game.images.length === 0 && game.icon ? [{ image: game.icon, video: false }] : []),
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const [view, setView] = useState<"overview" | "engineering">("overview");
  const [videoFailed, setVideoFailed] = useState(false);
  const active = media[Math.min(activeIndex, Math.max(media.length - 1, 0))];
  const votes = (game.stats?.upVotes ?? 0) + (game.stats?.downVotes ?? 0);
  const rating = votes ? Math.round(((game.stats?.upVotes ?? 0) / votes) * 100) : null;

  if (!active) return null;
  const canPlayVideo = active.video && Boolean(game.video?.streamUrl) && !videoFailed;

  return (
    <article className="roblox-media-card">
      <div className="media-stage">
        {canPlayVideo ? (
          <video src={game.video?.streamUrl ?? undefined} poster={active.image} controls playsInline preload="metadata" onError={() => setVideoFailed(true)} />
        ) : (
          <img src={active.image} alt={`${game.name} gameplay preview`} />
        )}
        <div className="media-overlay" />
        <span className="media-number">{String(index + 1).padStart(2, "0")}</span>
        <span className="media-status"><i /> Live Roblox data</span>
        {active.video && !canPlayVideo && <span className="video-note">Preview video restricted by Roblox</span>}
        <div className="media-title">
          <p>{note?.role ?? "Gameplay contributor"}</p>
          <h3>{game.name.replace(/^(?:\[[^\]]+\]\s*)+/, "")}</h3>
        </div>
      </div>

      {media.length > 1 && (
        <div className="media-thumbnails" aria-label={`${game.name} media`}>
          {media.slice(0, 6).map((item, mediaIndex) => (
            <button
              type="button"
              className={mediaIndex === activeIndex ? "active" : ""}
              onClick={() => { setActiveIndex(mediaIndex); setVideoFailed(false); }}
              aria-label={`Show preview ${mediaIndex + 1}`}
              key={`${item.image}-${mediaIndex}`}
            >
              <img src={item.image} alt="" loading="lazy" />
              {item.video && <span>▶</span>}
            </button>
          ))}
        </div>
      )}

      <div className="game-tabs" role="tablist" aria-label={`${game.name} details`}>
        <button type="button" role="tab" aria-selected={view === "overview"} className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}>
          Experience
        </button>
        <button type="button" role="tab" aria-selected={view === "engineering"} className={view === "engineering" ? "active" : ""} onClick={() => setView("engineering")}>
          My engineering
        </button>
      </div>

      {view === "overview" ? (
        <div className="game-panel" role="tabpanel">
          <div className="game-byline">
            <span>By {game.creator?.name ?? "Roblox creator"}{game.creator?.hasVerifiedBadge ? " ✓" : ""}</span>
            <span>{game.metadata?.genres.join(" · ") || "Experience"}</span>
          </div>
          {game.stats && (
            <div className="game-stats">
              <div><strong>{compact.format(game.stats.playing)}</strong><span>Playing</span></div>
              <div><strong>{compact.format(game.stats.visits)}</strong><span>Visits</span></div>
              <div><strong>{compact.format(game.stats.favorites)}</strong><span>Favorites</span></div>
              <div><strong>{rating ?? "—"}{rating !== null && "%"}</strong><span>Rating</span></div>
            </div>
          )}
          <p className="game-description">{game.description || "Live description unavailable."}</p>
          <a className="game-link" href={game.url} target="_blank" rel="noreferrer">
            Open on Roblox <span>↗</span>
          </a>
        </div>
      ) : (
        <div className="game-panel engineering-panel" role="tabpanel">
          <p className="engineering-summary">{note?.summary}</p>
          <ul>
            {note?.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
          </ul>
          <div className="engineering-tags">
            {note?.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          {note && (
            <div className="code-snapshot">
              <div><i /><i /><i /><strong>{note.filename}</strong></div>
              <pre><code>{note.code}</code></pre>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function RobloxMediaGallery() {
  const [games, setGames] = useState<MediaGame[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/roblox-media.json", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Roblox media unavailable");
        return response.json();
      })
      .then((payload) => { setGames(payload.games ?? []); setState("ready"); })
      .catch((error) => { if (error.name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, []);

  return (
    <div className="roblox-gallery">
      <div className="gallery-heading">
        <div>
          <p className="eyebrow">Selected work</p>
          <h2>Games I&apos;ve<br /><span>worked on.</span></h2>
        </div>
        <p>
          The numbers and media come directly from Roblox. Open “My engineering”
          to see what I contributed to each project.
        </p>
      </div>
      <p className="gallery-swipe-hint">Swipe to browse all five games →</p>
      {state === "loading" && <div className="media-loading"><span /> Syncing Roblox experiences…</div>}
      {state === "error" && <div className="media-loading">Roblox data is temporarily unavailable.</div>}
      {state === "ready" && (
        <div className="roblox-media-grid">
          {games.map((game, index) => <GameCard game={game} index={index} key={game.id} />)}
        </div>
      )}
    </div>
  );
}
