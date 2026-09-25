import type { CSSProperties } from "react";

const paths = {
  left: <path d="m14 6-6 6 6 6" />,
  right: <path d="m10 6 6 6-6 6" />,
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  diagonal: (
    <>
      <path d="M6 18 18 6M6 6h12v12" />
    </>
  ),
  down: (
    <>
      <path d="M12 4v16m-6-6 6 6 6-6" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M6 18 18 6" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 17h16" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V4H4v12h4" />
    </>
  ),
  check: (
    <>
      <path d="m5 12 4 4L19 6" />
    </>
  ),
  code: (
    <>
      <path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18" />
    </>
  ),
  gamepad: (
    <>
      <path d="M7 7h10c3 0 5 10 4 12s-4-1-6-3H9c-2 2-5 5-6 3S4 7 7 7Z" />
      <path d="M7 10v4m-2-2h4m7-1h.01M18 13h.01" />
    </>
  ),
  orbit: (
    <>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="11" ry="5" transform="rotate(-45 12 12)" />
      <path d="M4 7a9 9 0 0 1 13-3M7 20a9 9 0 0 0 13-13" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5" />
    </>
  ),
  pin: (
    <>
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  github: (
    <>
      <path d="M9 19c-4 1-4-2-6-2m12 5v-4c0-1-.3-2-1-2.5 4-.5 7-2 7-6 0-2-.7-3-2-4 .5-1 .5-2 0-4-2 0-3 1-4 2a14 14 0 0 0-6 0C8 2 7 1 5 1c-.5 2-.5 3 0 4-1.3 1-2 2-2 4 0 4 3 5.5 7 6-.7.5-1 1.5-1 2.5v4" />
    </>
  ),
  discord: (
    <>
      <path d="M8 5 5 6c-2 3-3 7-3 11l5 2 1-2m8-12 3 1c2 3 3 7 3 11l-5 2-1-2M7 16c3 2 7 2 10 0M8 6c3-1 5-1 8 0" />
      <circle cx="8" cy="12" r="1" />
      <circle cx="16" cy="12" r="1" />
    </>
  ),
};

export type IconName = keyof typeof paths;
export function Icon({
  name,
  className,
  style,
}: {
  name: IconName;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a
      className={`brand${footer ? " brand-footer" : ""}`}
      href="#top"
      aria-label="Velumix home"
    >
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="m3 6 9 21h7L10 6H3Zm16 0-5 11 4 10L29 6H19Z"
          fill="currentColor"
        />
      </svg>
      <span>
        velumix<span className="brand-period">.</span>
      </span>
    </a>
  );
}
