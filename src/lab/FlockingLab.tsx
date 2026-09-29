import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import {
  DEFAULT_CONFIG,
  PRESETS,
  parseConfig,
  serializeConfig,
  configToLuau,
  type LabConfig,
} from "./config";
import { AquariumScene, type Interaction, type LabStats } from "./scene";
import { Simulation, SCHOOL_NAMES, SCHOOL_COLORS } from "./simulation";
import { DEFAULT_LIGHTING, type LightingSettings } from "./lighting";
import "./lab.css";

const CURRENT_KEY = "velumix:flocking:current";
const SAVED_KEY = "velumix:flocking:presets";
const LIGHTING_KEY = "velumix:flocking:lighting";
type SavedPreset = { name: string; config: LabConfig };
const EMPTY_STATS: LabStats = {
  fps: 0,
  simulationMs: 0,
  coherence: 0,
  time: 0,
  selected: 0,
  neighbors: 0,
  speed: 0,
  tier: 0,
  leader: false,
  tiers: [0, 0, 0],
  guided: false,
};

function startingConfig(): { config: LabConfig; notice: string } {
  try {
    const encoded = new URLSearchParams(
      window.location.hash.split("?")[1] ?? "",
    ).get("config");
    if (encoded) {
      if (encoded.length > 6000)
        throw new Error("The shared preset is too large.");
      return {
        config: parseConfig(JSON.parse(atob(encoded))),
        notice: "Shared settings loaded. Playback starts from the saved seed.",
      };
    }
    const saved = localStorage.getItem(CURRENT_KEY);
    if (saved)
      return {
        config: parseConfig(JSON.parse(saved)),
        notice: "Your last settings are restored.",
      };
  } catch {
    return {
      config: { ...DEFAULT_CONFIG },
      notice:
        "The saved or shared settings could not be read. The reef preset is ready instead.",
    };
  }
  return { config: { ...DEFAULT_CONFIG }, notice: "" };
}

function savedPresets(): SavedPreset[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, 8).flatMap((item: unknown) => {
      if (
        !item ||
        typeof item !== "object" ||
        !("name" in item) ||
        !("config" in item) ||
        typeof item.name !== "string"
      )
        return [];
      try {
        return [
          { name: item.name.slice(0, 36), config: parseConfig(item.config) },
        ];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

function startingLighting(): LightingSettings {
  const settings = { ...DEFAULT_LIGHTING };
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(LIGHTING_KEY) ?? "null",
    );
    if (saved && typeof saved === "object") {
      for (const key of ["sunlight", "caustics", "rays"] as const) {
        const value = (saved as Record<string, unknown>)[key];
        if (typeof value === "number" && Number.isFinite(value))
          settings[key] = Math.max(0, Math.min(2, value));
      }
    }
  } catch {
    /* Use the reef lighting when storage is unavailable. */
  }
  return settings;
}

function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Slider({
  label,
  value,
  min = 0,
  max = 3,
  step = 0.1,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  hint: string;
  onChange: (value: number) => void;
}) {
  const id = `lab-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div className="lab-slider">
      <div>
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{step >= 1 ? value : value.toFixed(1)}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-describedby={`${id}-hint`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <p id={`${id}-hint`}>{hint}</p>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="lab-toggle">
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="lab-switch" aria-hidden="true" />
    </label>
  );
}

export default function FlockingLab() {
  const [initial] = useState(startingConfig);
  const [config, setConfig] = useState(initial.config);
  const configRef = useRef(config);
  configRef.current = config;
  const [notice, setNotice] = useState(initial.notice);
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState<"school" | "world" | "lighting" | "inspect">(
    "school",
  );
  const [lighting, setLighting] = useState(startingLighting);
  const [interaction, setInteraction] = useState<Interaction>("inspect");
  const [bounds, setBounds] = useState(false);
  const [field, setField] = useState(false);
  const [selected, setSelected] = useState(0);
  const [stats, setStats] = useState<LabStats>(EMPTY_STATS);
  const [saved, setSaved] = useState(savedPresets);
  const [presetName, setPresetName] = useState("");
  const [error, setError] = useState("");
  const [modelsReady, setModelsReady] = useState(false);
  const [reload, setReload] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<AquariumScene | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let scene: AquariumScene | null = null;
    setModelsReady(false);
    try {
      scene = new AquariumScene(
        element,
        new Simulation(configRef.current),
        setStats,
        (id) => {
          setSelected(id);
          setTab("inspect");
        },
        setError,
        () => setModelsReady(true),
      );
      sceneRef.current = scene;
      setError("");
    } catch {
      setError(
        "This browser couldn’t start the 3D view. Try enabling hardware acceleration or opening the lab in another browser.",
      );
      element.replaceChildren();
    }
    return () => {
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [reload]);

  useEffect(() => {
    sceneRef.current?.simulation.configure(config);
    setSelected((id) => Math.min(id, config.count - 1));
    try {
      localStorage.setItem(CURRENT_KEY, serializeConfig(config));
    } catch {
      setNotice(
        "Browser storage is unavailable. Export your settings to keep them.",
      );
    }
  }, [config, reload]);

  useEffect(() => {
    sceneRef.current?.setLighting(lighting);
    try {
      localStorage.setItem(LIGHTING_KEY, JSON.stringify(lighting));
    } catch {
      setNotice(
        "Lighting changes work for this visit, but browser storage is unavailable.",
      );
    }
  }, [lighting, reload]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.paused = paused;
    scene.speed = speed;
    scene.selected = Math.min(selected, config.count - 1);
    scene.options = { inspect: tab === "inspect", bounds, field, interaction };
  }, [
    paused,
    speed,
    selected,
    tab,
    bounds,
    field,
    interaction,
    config.count,
    reload,
  ]);

  useEffect(() => {
    const loadShared = () => {
      if (!window.location.hash.startsWith("#lab?")) return;
      const next = startingConfig();
      setConfig(next.config);
      sceneRef.current?.simulation.configure(next.config);
      sceneRef.current?.simulation.reset();
      setSelected(0);
      setNotice(next.notice);
    };
    window.addEventListener("hashchange", loadShared);
    return () => window.removeEventListener("hashchange", loadShared);
  }, []);

  const update = <K extends keyof LabConfig>(key: K, value: LabConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));
  const applyPreset = (next: LabConfig, name: string) => {
    setConfig({ ...next });
    const sim = sceneRef.current?.simulation;
    if (sim) {
      sim.configure(next);
      sim.reset();
    }
    setSelected(0);
    setStats(EMPTY_STATS);
    setNotice(
      `${name} loaded. The simulation has restarted from seed ${next.seed}.`,
    );
  };
  const persistPresets = (next: SavedPreset[]) => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      setSaved(next);
      return true;
    } catch {
      setNotice("Couldn’t save in this browser. Export the preset instead.");
      return false;
    }
  };
  const savePreset = () => {
    const name = presetName.trim();
    if (!name) {
      setNotice("Give your preset a name first.");
      return;
    }
    const existing = saved.some((item) => item.name === name);
    if (!existing && saved.length >= 8) {
      setNotice(
        "You have eight saved presets. Remove one or reuse a name to replace it.",
      );
      return;
    }
    if (
      persistPresets([
        ...saved.filter((item) => item.name !== name),
        { name, config: { ...config } },
      ])
    ) {
      setNotice(`“${name}” saved in this browser.`);
      setPresetName("");
    }
  };
  const share = async () => {
    const url = new URL(window.location.href);
    url.hash = `lab?config=${encodeURIComponent(btoa(JSON.stringify(config)))}`;
    try {
      await navigator.clipboard.writeText(url.toString());
      setNotice(
        "Preset link copied. It shares settings and seed, starting a fresh simulation.",
      );
    } catch {
      setNotice(
        "Clipboard access was unavailable. Use Export JSON to share these settings.",
      );
    }
  };
  const exportFile = (format: "json" | "luau") => {
    download(
      format === "json" ? serializeConfig(config) : configToLuau(config),
      `aquatica-preset.${format}`,
      format === "json" ? "application/json" : "text/plain",
    );
    setNotice(
      format === "json"
        ? "JSON export requested. Import it here to restore these settings."
        : "Luau reference export requested. Tune these lab values for your Roblox scene.",
    );
  };
  const activePreset = PRESETS.find((preset) =>
    Object.keys(DEFAULT_CONFIG).every(
      (key) =>
        config[key as keyof LabConfig] ===
        preset.config[key as keyof LabConfig],
    ),
  );
  const elapsed = `${Math.floor(stats.time / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(stats.time % 60)
    .toString()
    .padStart(2, "0")}`;

  return (
    <div className="flocking-lab">
      <header className="lab-heading">
        <div>
          <p className="lab-eyebrow">
            <span /> GAME SYSTEMS LAB <span className="lab-slash">/</span>{" "}
            EXPERIMENT 001
          </p>
          <h1>
            Aquatica <span>Flocking Lab</span>
          </h1>
          <p className="lab-description">
            The fish system I built for Aquatica, adapted into an interactive
            browser lab. Explore the rules behind a living school.
          </p>
        </div>
        <a className="lab-origin" href="/observatory/api/FishController/">
          <Icon name="layers" />
          <span>
            From Aquatica Observatory
            <small>
              Explore the engineering docs <span aria-hidden="true">↗</span>
            </small>
          </span>
        </a>
      </header>

      <div className="lab-presets" role="group" aria-label="Starting presets">
        {PRESETS.map((preset, index) => (
          <button
            key={preset.id}
            className={activePreset?.id === preset.id ? "active" : ""}
            aria-pressed={activePreset?.id === preset.id}
            onClick={() => applyPreset({ ...preset.config }, preset.name)}
          >
            <svg
              viewBox="0 0 52 32"
              aria-hidden="true"
              style={{ color: preset.color }}
            >
              {Array.from({ length: 7 }, (_, i) => (
                <path
                  key={i}
                  d="M-3 -2 L4 0 L-3 2 L-1 0 Z"
                  transform={`translate(${8 + (i % 3) * (index === 1 ? 12 : 16)},${6 + Math.floor(i / 3) * 10}) rotate(${index === 2 ? i * 28 : -15})`}
                  fill="currentColor"
                />
              ))}
            </svg>
            <span>
              <strong>{preset.name}</strong>
              <small>{preset.subtitle}</small>
            </span>
            <span className="lab-preset-mark" aria-hidden="true">
              {activePreset?.id === preset.id ? "●" : "○"}
            </span>
          </button>
        ))}
      </div>

      <div className="lab-workspace">
        <section className="lab-viewer" aria-label="Aquarium simulation">
          <div className="lab-scene-wrap">
            <div ref={host} className="lab-canvas" />
            <div className="lab-vignette" />
            <div className="lab-scene-top">
              <span className={`lab-live${paused || error ? " paused" : ""}`}>
                <i />
                {error
                  ? "VIEW UNAVAILABLE"
                  : paused
                    ? "PAUSED"
                    : "LIVE SIMULATION"}
              </span>
              <span className="lab-scene-id">
                AQ—001 <span>/</span> {config.count} FISH
              </span>
            </div>
            <div className="lab-scene-title">
              <span>REEF FLOOR OBSERVATORY</span>
              <h2>A school of individuals.</h2>
              <p>Life between the coral banks and the open water.</p>
            </div>
            {!modelsReady && !error && (
              <div className="lab-model-loading" role="status">
                Bringing the reef to life…
              </div>
            )}
            {error && (
              <div className="lab-render-error" role="alert">
                <Icon name="eye" />
                <p>{error}</p>
                <button onClick={() => setReload((value) => value + 1)}>
                  Reload scene
                </button>
              </div>
            )}
            <div className="lab-camera" role="group" aria-label="Camera views">
              <button
                onClick={() => sceneRef.current?.setCamera("orbit")}
                title="Reset orbit camera"
              >
                Orbit
              </button>
              <button
                onClick={() => sceneRef.current?.setCamera("reef")}
                title="Explore the sand channel at reef level"
              >
                Reef floor
              </button>
              <button onClick={() => sceneRef.current?.setCamera("top")}>
                Top
              </button>
              <button onClick={() => sceneRef.current?.setCamera("side")}>
                Side
              </button>
              <button
                onClick={() => sceneRef.current?.setCamera("fish")}
                title="Follow the selected fish up close"
              >
                Close-up
              </button>
            </div>
            <div className="lab-scene-bottom">
              <div className="lab-school-legend">
                {SCHOOL_NAMES.map((name, i) => (
                  <span key={name}>
                    <i style={{ background: SCHOOL_COLORS[i] }} />
                    {name}
                  </span>
                ))}
              </div>
              <p>
                Drag to orbit <span>·</span> Scroll / pinch to zoom
              </p>
            </div>
          </div>
          <div className="lab-transport">
            <div className="lab-playback">
              <button
                className="lab-play"
                disabled={!!error}
                onClick={() => setPaused((value) => !value)}
                aria-label={paused ? "Play simulation" : "Pause simulation"}
              >
                {paused ? (
                  <Icon name="play" />
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M8 5v14M16 5v14"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                )}
                <span>{paused ? "Play" : "Pause"}</span>
              </button>
              <button
                disabled={!paused || !!error}
                onClick={() => sceneRef.current?.stepOnce()}
                title="Advance one simulation frame while paused"
                aria-label="Step simulation"
              >
                Step
              </button>
              <button
                onClick={() => {
                  sceneRef.current?.simulation.reset();
                  setStats(EMPTY_STATS);
                  setNotice(`Restarted from seed ${config.seed}.`);
                }}
              >
                Reset
              </button>
              <label className="lab-speed">
                <span className="sr-only">Playback speed</span>
                <select
                  aria-label="Playback speed"
                  value={speed}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                >
                  <option value={0.5}>0.5×</option>
                  <option value={1}>1×</option>
                  <option value={2}>2×</option>
                </select>
              </label>
            </div>
            <span
              className="lab-elapsed"
              aria-label={`Simulation time ${elapsed}`}
            >
              {elapsed}
            </span>
          </div>
          <div className="lab-tools">
            <div role="group" aria-label="Canvas interaction">
              {(
                [
                  ["inspect", "Inspect fish"],
                  ["guide", "Guide school"],
                  ["startle", "Startle"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={interaction === value}
                  onClick={() => setInteraction(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p>
              {interaction === "inspect"
                ? "Click a fish to see its world."
                : interaction === "guide"
                  ? "Click the water to place a shared target."
                  : "Click the water to create a brief disturbance."}
            </p>
          </div>
          <div
            className="lab-metrics"
            aria-label="Live simulation measurements"
          >
            <div>
              <span>RENDER RATE</span>
              <strong>
                {stats.fps || "—"}
                <small> fps</small>
              </strong>
            </div>
            <div>
              <span>SIMULATION STEP</span>
              <strong>
                {stats.simulationMs ? stats.simulationMs.toFixed(2) : "—"}
                <small> ms</small>
              </strong>
            </div>
            <div>
              <span>SCHOOL COHERENCE</span>
              <strong>
                {stats.coherence}
                <small>%</small>
              </strong>
            </div>
            <div>
              <span>POPULATION</span>
              <strong>
                {config.count}
                <small> / 3 schools</small>
              </strong>
            </div>
          </div>
        </section>

        <aside className="lab-controls" aria-label="Lab controls">
          <div className="lab-controls-heading">
            <span>THE PARAMETERS</span>
            <span>{activePreset ? "PRESET" : "CUSTOM"}</span>
          </div>
          <div
            className="lab-control-tabs"
            role="tablist"
            aria-label="Parameter sections"
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const tabs = ["school", "world", "lighting", "inspect"] as const;
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? tabs.length - 1
                    : (tabs.indexOf(tab) +
                        (event.key === "ArrowRight" ? 1 : tabs.length - 1)) %
                      tabs.length;
              setTab(tabs[next]);
              event.currentTarget
                .querySelectorAll<HTMLButtonElement>("button")
                [next]?.focus();
            }}
          >
            {(
              [
                ["school", "School"],
                ["world", "World"],
                ["lighting", "Lighting"],
                ["inspect", "Inspect"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                id={`lab-tab-${id}`}
                role="tab"
                aria-selected={tab === id}
                aria-controls="lab-controls-panel"
                tabIndex={tab === id ? 0 : -1}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            id="lab-controls-panel"
            className="lab-controls-panel"
            role="tabpanel"
            aria-labelledby={`lab-tab-${tab}`}
          >
            {tab === "school" && (
              <>
                <Slider
                  label="Population"
                  value={config.count}
                  min={30}
                  max={600}
                  step={30}
                  hint="Total fish, split evenly across three schools."
                  onChange={(value) => update("count", value)}
                />
                <Slider
                  label="Separation"
                  value={config.separation}
                  hint="Give nearby fish room to move."
                  onChange={(value) => update("separation", value)}
                />
                <Slider
                  label="Alignment"
                  value={config.alignment}
                  hint="Match the direction of your neighbors."
                  onChange={(value) => update("alignment", value)}
                />
                <Slider
                  label="Cohesion"
                  value={config.cohesion}
                  hint="Steer toward the center of nearby fish."
                  onChange={(value) => update("cohesion", value)}
                />
                <Slider
                  label="Perception radius"
                  value={config.perception}
                  min={2}
                  max={10}
                  step={0.5}
                  hint="How far each fish can find schoolmates."
                  onChange={(value) => update("perception", value)}
                />
                <Slider
                  label="Swim speed"
                  value={config.speed}
                  min={1}
                  max={8}
                  hint="Maximum speed in lab units per second."
                  onChange={(value) => update("speed", value)}
                />
                <Toggle
                  label="School leaders"
                  hint="Periodically select a fish for others to follow."
                  checked={config.leaders}
                  onChange={(value) => update("leaders", value)}
                />
              </>
            )}
            {tab === "world" && (
              <>
                <Toggle
                  label="Reef obstacles"
                  hint="Steer around rocks in the swimming region."
                  checked={config.obstacles}
                  onChange={(value) => update("obstacles", value)}
                />
                <Slider
                  label="Avoidance"
                  value={config.avoidance}
                  max={5}
                  hint="Strength of early turns around the reef. Collision boundaries stay active."
                  onChange={(value) => update("avoidance", value)}
                />
                <Slider
                  label="Wander"
                  value={config.wander}
                  max={2}
                  hint="Add individual variation to each fish’s motion."
                  onChange={(value) => update("wander", value)}
                />
                <Slider
                  label="Water current"
                  value={config.current}
                  max={2}
                  hint="A gentle, changing flow through the scene."
                  onChange={(value) => update("current", value)}
                />
                <Toggle
                  label="Adaptive detail"
                  hint="Distant fish update their steering less often."
                  checked={config.adaptive}
                  onChange={(value) => update("adaptive", value)}
                />
                <Toggle
                  label="Show swimming bounds"
                  hint="Reveal the region that contains the schools."
                  checked={bounds}
                  onChange={setBounds}
                />
                <Toggle
                  label="Show obstacle clearance"
                  hint="See the collision envelope around each rock."
                  checked={field}
                  onChange={setField}
                />
                <div className="lab-world-actions">
                  <button
                    onClick={() => {
                      const sim = sceneRef.current?.simulation;
                      if (sim)
                        sim.startle({
                          ...sim.fish[Math.min(selected, sim.fish.length - 1)]
                            .position,
                        });
                    }}
                  >
                    Startle selected fish
                  </button>
                  <button
                    disabled={!stats.guided}
                    onClick={() => {
                      const sim = sceneRef.current?.simulation;
                      if (sim) sim.guide = null;
                    }}
                  >
                    Release guide target
                  </button>
                </div>
              </>
            )}
            {tab === "lighting" && (
              <>
                <div className="lab-inspector-intro">
                  <span className="lab-eyebrow">LIGHT THROUGH WATER</span>
                  <h3>Shape the atmosphere.</h3>
                  <p>
                    Follow the sunlight from the water above to the coral below.
                  </p>
                </div>
                <Slider
                  label="Sunlight"
                  value={lighting.sunlight}
                  max={2}
                  hint="Balance bright surface light with the reef's cool shade."
                  onChange={(sunlight) =>
                    setLighting((current) => ({ ...current, sunlight }))
                  }
                />
                <Slider
                  label="Caustics"
                  value={lighting.caustics}
                  max={2}
                  hint="Focused ribbons of light from the moving water surface."
                  onChange={(caustics) =>
                    setLighting((current) => ({ ...current, caustics }))
                  }
                />
                <Slider
                  label="Light rays"
                  value={lighting.rays}
                  max={2}
                  hint="Soft shafts of sunlight between the coral banks."
                  onChange={(rays) =>
                    setLighting((current) => ({ ...current, rays }))
                  }
                />
                <div className="lab-world-actions">
                  <button onClick={() => setLighting({ ...DEFAULT_LIGHTING })}>
                    Reset reef lighting
                  </button>
                </div>
              </>
            )}
            {tab === "inspect" && (
              <>
                <div className="lab-inspector-intro">
                  <span className="lab-eyebrow">THROUGH ONE FISH’S EYES</span>
                  <h3>
                    Local rules,
                    <br />
                    collective motion.
                  </h3>
                  <p>
                    Bright fish are nearby schoolmates. Lines connect the
                    selected fish to its neighbors.
                  </p>
                </div>
                <label className="lab-fish-select">
                  Selected fish
                  <select
                    aria-label="Selected fish"
                    value={Math.min(selected, config.count - 1)}
                    onChange={(event) =>
                      setSelected(Number(event.target.value))
                    }
                  >
                    {Array.from({ length: config.count }, (_, i) => (
                      <option key={i} value={i}>
                        Fish {String(i + 1).padStart(3, "0")} ·{" "}
                        {SCHOOL_NAMES[i % 3]}
                      </option>
                    ))}
                  </select>
                </label>
                <dl className="lab-fish-stats">
                  <div>
                    <dt>Nearby schoolmates</dt>
                    <dd>{stats.neighbors}</dd>
                  </div>
                  <div>
                    <dt>Swimming speed</dt>
                    <dd>{stats.speed.toFixed(1)} u/s</dd>
                  </div>
                  <div>
                    <dt>Steering detail</dt>
                    <dd>{["Near", "Mid", "Far"][stats.tier]}</dd>
                  </div>
                  <div>
                    <dt>Role</dt>
                    <dd>
                      {config.leaders && stats.leader
                        ? "School leader"
                        : "School member"}
                    </dd>
                  </div>
                </dl>
                <p className="lab-small-label">STEERING FORCES</p>
                <div className="lab-force-legend">
                  {[
                    ["#ff9b8e", "Separation", "Keep a little distance"],
                    ["#96b9f2", "Alignment", "Swim in a similar direction"],
                    ["#79dcd2", "Cohesion", "Stay with the school"],
                    ["#edcb8e", "Navigation", "Targets, currents & obstacles"],
                  ].map(([color, name, description]) => (
                    <div key={name}>
                      <i style={{ background: color }} />
                      <span>
                        <strong>{name}</strong>
                        <small>{description}</small>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="lab-inspect-note">
                  Pause and step to examine a turn. Perception shows up to 16
                  nearest schoolmates; distant fish use a smaller steering
                  budget.
                </p>
              </>
            )}
          </div>
          <div className="lab-controls-footer">
            <span>SEED {config.seed}</span>
            <button
              onClick={() =>
                update("seed", Math.floor(Math.random() * 999999) + 1)
              }
            >
              New seed <span aria-hidden="true">↗</span>
            </button>
          </div>
        </aside>
      </div>

      <section
        className="lab-preset-storage"
        aria-label="Save and share settings"
      >
        <div>
          <h2>Keep a good experiment.</h2>
          <p>
            Save your settings, share a starting point, or take the numbers into
            your own project.
          </p>
        </div>
        <div className="lab-save-form">
          <label className="sr-only" htmlFor="lab-preset-name">
            Preset name
          </label>
          <input
            id="lab-preset-name"
            value={presetName}
            maxLength={36}
            placeholder="Name your preset…"
            onChange={(event) => setPresetName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") savePreset();
            }}
          />
          <button onClick={savePreset}>Save preset</button>
        </div>
        <div className="lab-file-actions">
          <button onClick={share}>
            <Icon name="link" />
            Copy link
          </button>
          <button onClick={() => exportFile("json")}>
            <Icon name="down" />
            JSON
          </button>
          <button onClick={() => exportFile("luau")}>
            <Icon name="code" />
            Luau
          </button>
          <button onClick={() => fileInput.current?.click()}>
            Import JSON
          </button>
        </div>
        <input
          className="sr-only"
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          aria-label="Import lab preset JSON"
          tabIndex={-1}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            try {
              if (file.size > 16384)
                throw new Error("Choose a preset smaller than 16 KB.");
              applyPreset(
                parseConfig(JSON.parse(await file.text())),
                file.name,
              );
            } catch (error) {
              setNotice(
                error instanceof Error
                  ? `Import failed: ${error.message}`
                  : "The preset could not be imported.",
              );
            }
          }}
        />
        {saved.length > 0 && (
          <ul className="lab-saved-list">
            {saved.map((preset) => (
              <li key={preset.name}>
                <button onClick={() => applyPreset(preset.config, preset.name)}>
                  <Icon name="bookmark" />
                  {preset.name}
                </button>
                <button
                  aria-label={`Delete preset ${preset.name}`}
                  onClick={() => {
                    if (
                      persistPresets(
                        saved.filter((item) => item.name !== preset.name),
                      )
                    )
                      setNotice(`“${preset.name}” removed.`);
                  }}
                >
                  <Icon name="close" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="lab-notice" role="status">
          {notice ||
            "Settings save on this device. Exports and links contain settings and seed, not a recording of the simulation."}
        </p>
      </section>

      <section className="lab-notes" aria-label="About the simulation">
        <article>
          <span>01 / THE IDEA</span>
          <h2>There is no choreographer.</h2>
          <p>
            Each fish reacts to its neighbors. Separation, alignment, and
            cohesion combine into the motion of a school. Try setting alignment
            to zero and watch the group lose its shared direction.
          </p>
        </article>
        <article>
          <span>02 / FROM AQUATICA</span>
          <h2>From the system I built.</h2>
          <p>
            I created Aquatica’s fish system. This browser adaptation brings its
            school leaders, individual wandering, obstacle steering, and
            distance-based updates into a lab you can explore and tune.
          </p>
        </article>
        <article>
          <span>03 / READ THE NUMBERS</span>
          <h2>Measure what changes.</h2>
          <p>
            Coherence measures how closely fish in each school share a
            direction. Step time measures browser simulation work. These numbers
            describe this experiment, not Roblox performance.
          </p>
        </article>
      </section>
      <footer className="lab-footer">
        <span>
          VELUMIX <span>/</span> GAME SYSTEMS LAB
        </span>
        <p>
          Aquatica fish system by Velumix. Boids foundations:{" "}
          <a
            href="https://www.red3d.com/cwr/boids/"
            target="_blank"
            rel="noreferrer"
          >
            Craig Reynolds
          </a>
          . Lab format reference:{" "}
          <a
            href="https://github.com/SebLague/Boids"
            target="_blank"
            rel="noreferrer"
          >
            Sebastian Lague’s Boids
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
