"use client";

import { useEffect, useRef, useState } from "react";

type HeroGame = {
  id: string;
  name: string;
  url: string;
  icon: string | null;
  images: string[];
  stats: { playing: number; visits: number } | null;
};

const roles: Record<string, string> = {
  aquatica: "Gameplay systems · simulation · custom controller",
  ranger: "Emergency systems · AI · vehicle physics",
  samurai: "Combat mechanics · PvP design",
  paint: "Round systems · camouflage gameplay",
  garden: "Gameplay progression · LiveOps",
};

const fallbackGames: HeroGame[] = [
  { id: "aquatica", name: "Aquatica Observatory", url: "#work", icon: null, images: [], stats: null },
  { id: "ranger", name: "Ranger Emergency", url: "#work", icon: null, images: [], stats: null },
  { id: "samurai", name: "Samurai DUELS", url: "#work", icon: null, images: [], stats: null },
  { id: "paint", name: "Paint And SEEK!", url: "#work", icon: null, images: [], stats: null },
  { id: "garden", name: "Escape a Garden", url: "#work", icon: null, images: [], stats: null },
];

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function Arrow() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M4 14 14 4M6 4h8v8" />
    </svg>
  );
}

export default function HeroGameShowcase() {
  const [games, setGames] = useState<HeroGame[]>(fallbackGames);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/roblox-media.json", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload) => {
        if (payload.games?.length) setGames(payload.games);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (paused || games.length < 2) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % games.length),
      5200,
    );
    return () => window.clearInterval(timer);
  }, [games.length, paused]);

  const game = games[active] ?? games[0];
  const image = game.images[0] ?? game.icon;
  const displayName = game.name.replace(/^(?:\[[^\]]+\]\s*)+/, "");

  const moveStage = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!stage.current) return;
    const bounds = stage.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    stage.current.style.setProperty("--hero-x", `${x * 100}%`);
    stage.current.style.setProperty("--hero-y", `${y * 100}%`);
    stage.current.style.setProperty("--image-x", `${(x - 0.5) * -12}px`);
    stage.current.style.setProperty("--image-y", `${(y - 0.5) * -8}px`);
  };

  return (
    <div
      className="hero-games"
      ref={stage}
      onPointerMove={moveStage}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="hero-frame" key={`${game.id}-${active}`}>
        {image ? (
          <img className="hero-image" src={image} alt={`${game.name} gameplay`} />
        ) : (
          <div className="hero-placeholder" />
        )}
        <div className="hero-shade" />
        <div className="hero-grid" />
        <div className="hero-scan" />

        <div className="hero-kicker">
          <span><i /> Selected shipped work</span>
          <span>{String(active + 1).padStart(2, "0")} / {String(games.length).padStart(2, "0")}</span>
        </div>

        <div className="hero-copy">
          <p>Roblox gameplay engineer · Software engineer</p>
          <h1>Systems<br />players <em>feel.</em></h1>
          <span>
            I build responsive mechanics, living simulations, and the
            production architecture that keeps them reliable.
          </span>
        </div>

        <div className="hero-game-caption">
          <p>{roles[game.id] ?? "Gameplay engineering"}</p>
          <h2>{displayName}</h2>
          <div className="hero-game-meta">
            {game.stats && <span>{compact.format(game.stats.playing)} playing</span>}
            {game.stats && <span>{compact.format(game.stats.visits)} visits</span>}
          </div>
          <a href={game.url} target="_blank" rel="noreferrer">
            View experience <Arrow />
          </a>
        </div>
      </div>

      <div className="hero-selector" aria-label="Select featured game">
        {games.map((item, index) => {
          const thumbnail = item.images[0] ?? item.icon;
          return (
            <button
              type="button"
              className={index === active ? "active" : ""}
              onClick={() => setActive(index)}
              aria-label={`Show ${item.name}`}
              aria-pressed={index === active}
              key={item.id}
            >
              {thumbnail && <img src={thumbnail} alt="" />}
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.name.replace(/^\[[^\]]+\]\s*/, "")}</strong>
              <i />
            </button>
          );
        })}
      </div>

      <a className="hero-scroll" href="#work">
        Explore the work <span>↓</span>
      </a>
    </div>
  );
}
