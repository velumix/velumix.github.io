"use client";

import { useEffect, useState } from "react";

const DISCORD_HANDLE = "velumix";
const DISCORD_PROFILE_URL = "https://discord.com/users/499413963310891017";

type DiscordHireLinkProps = {
  className: string;
  label: string;
  showArrow?: boolean;
};

export default function DiscordHireLink({
  className,
  label,
  showArrow = true,
}: DiscordHireLinkProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 3600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyDiscordHandle = () => {
    navigator.clipboard?.writeText(DISCORD_HANDLE)
      .then(() => setCopied(true))
      .catch(() => setCopied(true));
  };

  return (
    <>
      <a
        className={className}
        href={DISCORD_PROFILE_URL}
        target="_blank"
        rel="noreferrer"
        onClick={copyDiscordHandle}
        aria-label={`${label}. Opens Discord and copies the username ${DISCORD_HANDLE}.`}
      >
        {label}
        {showArrow && (
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <path d="M4 14 14 4M6 4h8v8" />
          </svg>
        )}
      </a>
      <div
        className={`discord-toast${copied ? " visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        <span>Discord profile opened</span>
        <strong>@{DISCORD_HANDLE} copied</strong>
      </div>
    </>
  );
}
