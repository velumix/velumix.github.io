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
] as const;

type RobloxMedia = {
  assetType: string;
  imageId: number;
  approved: boolean;
  videoId?: string;
};

type AssetDeliveryResponse = {
  locations?: Array<{ location: string }>;
  errors?: Array<{ code: number; message: string }>;
};

type Thumbnail = {
  targetId: number;
  state: string;
  imageUrl: string;
};

type GameDetails = {
  id: number;
  name: string;
  description: string;
  creator: {
    id: number;
    name: string;
    type: string;
    hasVerifiedBadge: boolean;
  };
  playing: number;
  visits: number;
  maxPlayers: number;
  created: string;
  updated: string;
  universeAvatarType: string;
  genre_l1: string;
  genre_l2: string;
  favoritedCount: number;
};

type GameVotes = {
  id: number;
  upVotes: number;
  downVotes: number;
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`Roblox API returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function resolveVideoUrl(assetId?: string) {
  if (!assetId) return null;

  try {
    const delivery = await getJson<AssetDeliveryResponse>(
      `https://assetdelivery.roblox.com/v2/assetId/${assetId}`,
    );
    return delivery.locations?.[0]?.location ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const universeIds = experiences.map((experience) => experience.universeId).join(",");
  const iconUrl =
    `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds}` +
    "&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false";

  try {
    const [iconResponse, detailsResponse, votesResponse] = await Promise.all([
      getJson<{ data: Thumbnail[] }>(iconUrl),
      getJson<{ data: GameDetails[] }>(
        `https://games.roblox.com/v1/games?universeIds=${universeIds}`,
      ),
      getJson<{ data: GameVotes[] }>(
        `https://games.roblox.com/v1/games/votes?universeIds=${universeIds}`,
      ),
    ]);
    const icons = new Map(
      iconResponse.data
        .filter((item) => item.state === "Completed")
        .map((item) => [String(item.targetId), item.imageUrl]),
    );
    const details = new Map(detailsResponse.data.map((item) => [String(item.id), item]));
    const votes = new Map(votesResponse.data.map((item) => [String(item.id), item]));

    const games = await Promise.all(
      experiences.map(async (experience) => {
        let mediaResponse: { data: RobloxMedia[] } = { data: [] };
        try {
          mediaResponse = await getJson<{ data: RobloxMedia[] }>(
            `https://games.roblox.com/v2/games/${experience.universeId}/media`,
          );
        } catch {
          // Game details and icons are still useful when gallery media is unavailable.
        }

        const approved = mediaResponse.data.filter((item) => item.approved && item.imageId);
        const imageIds = [...new Set(approved.map((item) => item.imageId))];
        let thumbnailMap = new Map<number, string>();

        if (imageIds.length) {
          const thumbnailUrl =
            `https://thumbnails.roblox.com/v1/games/${experience.universeId}/thumbnails` +
            `?thumbnailIds=${imageIds.join(",")}&size=768x432&format=Png&isCircular=false`;
          try {
            const thumbnailResponse = await getJson<{ data: Thumbnail[] }>(thumbnailUrl);
            thumbnailMap = new Map(
              thumbnailResponse.data
                .filter((item) => item.state === "Completed")
                .map((item) => [item.targetId, item.imageUrl]),
            );
          } catch {
            // Fall back to the experience icon below.
          }
        }

        const videoItem = approved.find((item) => item.assetType === "GamePreviewVideo");
        const videoUrl = await resolveVideoUrl(videoItem?.videoId);
        const detail = details.get(experience.universeId);
        const vote = votes.get(experience.universeId);
        const images = approved
          .filter((item) => item.assetType === "Image")
          .map((item) => thumbnailMap.get(item.imageId))
          .filter((url): url is string => Boolean(url));

        return {
          id: experience.id,
          name: detail?.name.trim() || experience.name,
          url: experience.url,
          icon: icons.get(experience.universeId) ?? null,
          images,
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
                poster: thumbnailMap.get(videoItem.imageId) ?? null,
                robloxUrl: experience.url,
                assetId: videoItem.videoId ?? null,
                streamUrl:
                  process.env[`ROBLOX_VIDEO_${experience.id.toUpperCase()}_URL`] ??
                  videoUrl,
              }
            : null,
        };
      }),
    );

    return Response.json(
      { games, fetchedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        games: [],
        error: error instanceof Error ? error.message : "Unable to load Roblox media",
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }
}
