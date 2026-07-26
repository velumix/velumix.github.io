import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const experiences = [
  {
    id: "aquatica",
    name: "Aquatica Observatory",
    universeId: "6657534906",
    url: "https://www.roblox.com/games/78959878729166/Aquatica-Observatory",
  },
  {
    id: "ranger",
    name: "Ranger Emergency",
    universeId: "9601385931",
    url: "https://www.roblox.com/games/120488756421319/Ranger-Emergency",
  },
  {
    id: "samurai",
    name: "Samurai DUELS",
    universeId: "10059548251",
    url: "https://www.roblox.com/games/72248722616845/Samurai-DUELS",
  },
  {
    id: "paint",
    name: "Paint And SEEK!",
    universeId: "9977954973",
    url: "https://www.roblox.com/games/78724049937437/Paint-And-SEEK",
  },
  {
    id: "garden",
    name: "Escape a Garden",
    universeId: "9926075798",
    url: "https://www.roblox.com/games/133356782383463/Escape-a-Garden",
  },
];

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "velumix.github.io portfolio data refresh",
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`Roblox API returned ${response.status} for ${url}`);
  }

  return response.json();
}

async function resolveVideoUrl(assetId) {
  if (!assetId) return null;

  try {
    const delivery = await getJson(
      `https://assetdelivery.roblox.com/v2/assetId/${assetId}`,
    );
    return delivery.locations?.[0]?.location ?? null;
  } catch {
    return null;
  }
}

async function fetchGame(experience, icons, details, votes) {
  let media = [];

  try {
    const response = await getJson(
      `https://games.roblox.com/v2/games/${experience.universeId}/media`,
    );
    media = response.data ?? [];
  } catch (error) {
    console.warn(`Media unavailable for ${experience.name}: ${error.message}`);
  }

  const approved = media.filter((item) => item.approved && item.imageId);
  const imageIds = [...new Set(approved.map((item) => item.imageId))];
  let thumbnails = new Map();

  if (imageIds.length) {
    try {
      const response = await getJson(
        `https://thumbnails.roblox.com/v1/games/${experience.universeId}/thumbnails` +
          `?thumbnailIds=${imageIds.join(",")}&size=768x432&format=Png&isCircular=false`,
      );
      thumbnails = new Map(
        (response.data ?? [])
          .filter((item) => item.state === "Completed")
          .map((item) => [item.targetId, item.imageUrl]),
      );
    } catch (error) {
      console.warn(`Thumbnails unavailable for ${experience.name}: ${error.message}`);
    }
  }

  const detail = details.get(experience.universeId);
  const vote = votes.get(experience.universeId);
  const videoItem = approved.find((item) => item.assetType === "GamePreviewVideo");
  const streamUrl = await resolveVideoUrl(videoItem?.videoId);

  return {
    id: experience.id,
    name: detail?.name?.trim() || experience.name,
    url: experience.url,
    icon: icons.get(experience.universeId) ?? null,
    images: approved
      .filter((item) => item.assetType === "Image")
      .map((item) => thumbnails.get(item.imageId))
      .filter(Boolean),
    description: detail?.description ?? "",
    creator: detail?.creator ?? null,
    stats: detail
      ? {
          playing: detail.playing,
          visits: detail.visits,
          favorites: detail.favoritedCount,
          maxPlayers: detail.maxPlayers,
          upVotes: vote?.upVotes ?? 0,
          downVotes: vote?.downVotes ?? 0,
        }
      : null,
    metadata: detail
      ? {
          created: detail.created,
          updated: detail.updated,
          avatarType: detail.universeAvatarType,
          genres: [detail.genre_l1, detail.genre_l2].filter(Boolean),
        }
      : null,
    video: videoItem
      ? {
          poster: thumbnails.get(videoItem.imageId) ?? null,
          robloxUrl: experience.url,
          assetId: videoItem.videoId ?? null,
          streamUrl,
        }
      : null,
  };
}

async function main() {
  const universeIds = experiences.map((item) => item.universeId).join(",");
  const [iconResponse, detailsResponse, votesResponse] = await Promise.all([
    getJson(
      `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds}` +
        "&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false",
    ),
    getJson(`https://games.roblox.com/v1/games?universeIds=${universeIds}`),
    getJson(`https://games.roblox.com/v1/games/votes?universeIds=${universeIds}`),
  ]);

  const icons = new Map(
    (iconResponse.data ?? [])
      .filter((item) => item.state === "Completed")
      .map((item) => [String(item.targetId), item.imageUrl]),
  );
  const details = new Map(
    (detailsResponse.data ?? []).map((item) => [String(item.id), item]),
  );
  const votes = new Map(
    (votesResponse.data ?? []).map((item) => [String(item.id), item]),
  );
  const games = await Promise.all(
    experiences.map((experience) => fetchGame(experience, icons, details, votes)),
  );

  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const outputPath = resolve(scriptDirectory, "../public/data/roblox-media.json");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify({ games, fetchedAt: new Date().toISOString() }, null, 2)}\n`,
    "utf8",
  );
  console.log(`Wrote ${games.length} Roblox experiences to ${outputPath}`);
}

await main();
