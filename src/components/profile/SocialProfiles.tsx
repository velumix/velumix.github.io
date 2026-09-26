import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "../Icon";
import accounts from "../../data/social-accounts.json";
import { discordUrl, githubUrl } from "../../data/links";

type Provider = "github" | "discord";
type SocialProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string;
  bannerPath: string | null;
  bio?: string | null;
  publicRepos?: number;
  followers?: number;
  fetchedAt: string;
};
type Profiles = Record<Provider, SocialProfile | null>;
const empty: Profiles = { github: null, discord: null };
const ProfilesContext = createContext<Profiles>(empty);

function isProfile(
  value: unknown,
  provider: Provider,
): value is SocialProfile | null {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  const profile = value as SocialProfile;
  const imagePath =
    /^\/images\/profiles\/[a-z]+-[a-f0-9]{16}\.(png|jpg|webp|gif)$/;
  return (
    typeof profile.id === "string" &&
    typeof profile.username === "string" &&
    typeof profile.displayName === "string" &&
    typeof profile.avatarPath === "string" &&
    imagePath.test(profile.avatarPath) &&
    (profile.bannerPath === null ||
      (typeof profile.bannerPath === "string" &&
        imagePath.test(profile.bannerPath))) &&
    typeof profile.fetchedAt === "string" &&
    !Number.isNaN(Date.parse(profile.fetchedAt)) &&
    (provider === "discord"
      ? profile.id === accounts.discordId
      : profile.username.toLowerCase() === accounts.githubUsername) &&
    (profile.publicRepos === undefined ||
      Number.isInteger(profile.publicRepos)) &&
    (profile.followers === undefined || Number.isInteger(profile.followers))
  );
}

export function SocialProfilesProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profiles>(empty);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/data/social-profiles.json", {
          cache: "no-cache",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10000),
          ]),
        });
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (!data || typeof data !== "object") return;
        const next = data as Profiles;
        if (
          isProfile(next.github, "github") &&
          isProfile(next.discord, "discord")
        )
          setProfiles(next);
      } catch {
        /* Keep the last loaded profile if the snapshot is unavailable. */
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 300000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return (
    <ProfilesContext.Provider value={profiles}>
      {children}
    </ProfilesContext.Provider>
  );
}

export function useSocialProfiles() {
  return useContext(ProfilesContext);
}

export function AccountAvatar({
  provider,
  large = false,
}: {
  provider: Provider;
  large?: boolean;
}) {
  const profile = useSocialProfiles()[provider];
  const [failedPath, setFailedPath] = useState<string | null>(null);
  return (
    <span
      className={`account-avatar${large ? " account-avatar-large" : ""}`}
      data-provider={provider}
      aria-hidden="true"
    >
      {profile && profile.avatarPath !== failedPath ? (
        <img
          src={profile.avatarPath}
          alt=""
          width="256"
          height="256"
          decoding="async"
          onError={() => setFailedPath(profile.avatarPath)}
        />
      ) : (
        <Icon name={provider} />
      )}
    </span>
  );
}

export function SocialProfileCard({ provider }: { provider: Provider }) {
  const profile = useSocialProfiles()[provider];
  const label = provider === "github" ? "GitHub" : "Discord";
  return (
    <a
      className="account-card"
      data-provider={provider}
      href={provider === "github" ? githubUrl : discordUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${profile?.displayName ?? "Velumix"} on ${label}`}
    >
      {profile?.bannerPath && (
        <img
          className="account-banner"
          src={profile.bannerPath}
          alt=""
          loading="lazy"
        />
      )}
      <div className="account-service">
        <Icon name={provider} />
        <span>{label}</span>
        <Icon name="diagonal" />
      </div>
      <div className="account-identity">
        <AccountAvatar provider={provider} large />
        <span>
          <strong>{profile?.displayName ?? label}</strong>
          <small>{profile ? `@${profile.username}` : "Open my profile"}</small>
        </span>
      </div>
      {profile?.bio && <p className="account-bio">{profile.bio}</p>}
      {provider === "github" && profile && (
        <div className="account-stats">
          {profile.publicRepos !== undefined && (
            <span>
              <strong>{profile.publicRepos}</strong> public repos
            </span>
          )}
          {profile.followers !== undefined && (
            <span>
              <strong>{profile.followers}</strong>{" "}
              {profile.followers === 1 ? "follower" : "followers"}
            </span>
          )}
        </div>
      )}
    </a>
  );
}
