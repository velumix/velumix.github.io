import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const accounts = JSON.parse(
  await readFile(resolve(root, "src/data/social-accounts.json"), "utf8"),
);
const publicDir = resolve(root, "public");
const snapshotPath = resolve(publicDir, "data/social-profiles.json");

async function getJson(url, headers, fetcher) {
  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Velumix portfolio profile refresh",
      ...headers,
    },
    signal: AbortSignal.timeout(12000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(`Profile API returned HTTP ${response.status}`);
  return response.json();
}

export async function fetchGitHubProfile({ token, fetcher = fetch } = {}) {
  const user = await getJson(
    `https://api.github.com/users/${accounts.githubUsername}`,
    {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    fetcher,
  );
  if (
    user.login?.toLowerCase() !== accounts.githubUsername ||
    !user.id ||
    !user.avatar_url ||
    !Number.isInteger(user.public_repos) ||
    !Number.isInteger(user.followers)
  ) {
    throw new Error("GitHub returned an incomplete or different profile");
  }
  return {
    id: String(user.id),
    username: user.login,
    displayName: user.name || user.login,
    avatarUrl: user.avatar_url,
    bannerUrl: null,
    bio: user.bio || null,
    publicRepos: user.public_repos,
    followers: user.followers,
    source: "GitHub API",
  };
}

export async function fetchDiscordProfile({ token, fetcher = fetch } = {}) {
  let user;
  let source;
  if (token) {
    user = await getJson(
      `https://discord.com/api/v10/users/${accounts.discordId}`,
      { Authorization: `Bot ${token}` },
      fetcher,
    );
    source = "Discord API";
  } else {
    const result = await getJson(
      `https://api.lanyard.rest/v1/users/${accounts.discordId}`,
      {},
      fetcher,
    );
    if (!result.success)
      throw new Error("Discord profile is not available through Lanyard");
    user = result.data?.discord_user;
    source = "Lanyard Discord API";
  }
  if (
    user?.id !== accounts.discordId ||
    typeof user.username !== "string" ||
    !("avatar" in user)
  ) {
    throw new Error("Discord returned an incomplete or different profile");
  }
  const validHash = (value) =>
    typeof value === "string" && /^(?:a_)?[a-f0-9]{32}$/.test(value);
  if (user.avatar !== null && !validHash(user.avatar))
    throw new Error("Invalid Discord avatar hash");
  const index =
    user.discriminator && user.discriminator !== "0"
      ? Number(user.discriminator) % 5
      : Number((BigInt(user.id) >> 22n) % 6n);
  return {
    id: user.id,
    username: user.username,
    displayName: user.global_name || user.username,
    avatarUrl: user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${index}.png`,
    bannerUrl: validHash(user.banner)
      ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=600`
      : null,
    source,
  };
}

async function saveImage(url, service) {
  const target = new URL(url);
  const allowedHost =
    service === "github"
      ? "avatars.githubusercontent.com"
      : "cdn.discordapp.com";
  if (target.protocol !== "https:" || target.hostname !== allowedHost)
    throw new Error("Unexpected profile image host");
  if (service === "github") target.searchParams.set("s", "256");
  const response = await fetch(target, {
    signal: AbortSignal.timeout(12000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(`Profile image returned HTTP ${response.status}`);
  const extensions = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const extension =
    extensions[response.headers.get("content-type")?.split(";")[0]];
  if (!extension) throw new Error("Profile image has an unsupported format");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 5_000_000)
    throw new Error("Profile image has an invalid size");
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const imagePath = `/images/profiles/${service}-${hash}.${extension}`;
  await mkdir(resolve(publicDir, "images/profiles"), { recursive: true });
  await writeFile(resolve(publicDir, imagePath.slice(1)), bytes);
  return imagePath;
}

export async function refreshProfiles(previous, { github, discord }) {
  const next = { ...previous };
  const failures = [];
  const results = await Promise.allSettled([github(), discord()]);
  for (const [index, service] of ["github", "discord"].entries()) {
    const result = results[index];
    if (result.status === "fulfilled") next[service] = result.value;
    else failures.push(service);
  }
  return { profiles: next, failures };
}

async function hydrate(profile, service) {
  const avatarPath = await saveImage(profile.avatarUrl, service);
  let bannerPath = null;
  if (profile.bannerUrl) {
    try {
      bannerPath = await saveImage(profile.bannerUrl, service);
    } catch {
      console.warn(
        `${service}: banner unavailable; keeping the verified avatar`,
      );
    }
  }
  return {
    ...profile,
    avatarPath,
    bannerPath,
    fetchedAt: new Date().toISOString(),
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const previous = JSON.parse(await readFile(snapshotPath, "utf8"));
  const result = await refreshProfiles(previous, {
    github: async () =>
      hydrate(
        await fetchGitHubProfile({ token: process.env.GITHUB_TOKEN }),
        "github",
      ),
    discord: async () =>
      hydrate(
        await fetchDiscordProfile({ token: process.env.DISCORD_BOT_TOKEN }),
        "discord",
      ),
  });
  await mkdir(dirname(snapshotPath), { recursive: true });
  await writeFile(
    snapshotPath,
    `${JSON.stringify(result.profiles, null, 2)}\n`,
  );
  for (const service of ["github", "discord"]) {
    if (result.failures.includes(service)) {
      console.warn(
        `${service}: profile refresh unavailable; ${previous[service] ? "preserving the last successful snapshot" : "no profile data published"}`,
      );
      if (service === "discord")
        console.warn(
          "Set DISCORD_BOT_TOKEN as an Actions secret, or enable this account through Lanyard.",
        );
    } else
      console.log(
        `Refreshed ${service} profile and avatar from ${result.profiles[service].source}`,
      );
  }
}
