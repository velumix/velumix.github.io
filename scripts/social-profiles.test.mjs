import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchGitHubProfile,
  fetchDiscordProfile,
  refreshProfiles,
} from "./fetch-social-profiles.mjs";

const discordId = "499413963310891017";
const avatar = "0123456789abcdef0123456789abcdef";
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("GitHub uses its API, extracts actual profile fields, and excludes private response fields", async () => {
  const profile = await fetchGitHubProfile({
    token: "test-only-token",
    fetcher: async (url, options) => {
      assert.equal(url, "https://api.github.com/users/velumix");
      assert.equal(options.headers.Authorization, "Bearer test-only-token");
      return json({
        id: 159978288,
        login: "velumix",
        name: "Updated name",
        avatar_url: "https://avatars.githubusercontent.com/u/159978288?v=4",
        bio: "Updated bio",
        public_repos: 42,
        followers: 5,
        email: "private@example.test",
        private_repos: 12,
      });
    },
  });
  assert.equal(profile.displayName, "Updated name");
  assert.equal(profile.publicRepos, 42);
  assert.equal(profile.followers, 5);
  assert.ok(!("email" in profile) && !("private_repos" in profile));
  assert.ok(!JSON.stringify(profile).includes("test-only-token"));
});

test("Discord bot authentication stays in the request and profile URLs use the returned hashes", async () => {
  const profile = await fetchDiscordProfile({
    token: "test-only-bot-token",
    fetcher: async (url, options) => {
      assert.equal(url, `https://discord.com/api/v10/users/${discordId}`);
      assert.equal(options.headers.Authorization, "Bot test-only-bot-token");
      return json({
        id: discordId,
        username: "updated_handle",
        global_name: "Updated name",
        avatar,
        banner: avatar,
        email: "private@example.test",
      });
    },
  });
  assert.equal(profile.username, "updated_handle");
  assert.equal(
    profile.avatarUrl,
    `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png?size=256`,
  );
  assert.equal(
    profile.bannerUrl,
    `https://cdn.discordapp.com/banners/${discordId}/${avatar}.png?size=600`,
  );
  assert.ok(!("email" in profile));
  assert.ok(!JSON.stringify(profile).includes("test-only-bot-token"));
});

test("Lanyard fallback only publishes profile identity, not activities or presence", async () => {
  const profile = await fetchDiscordProfile({
    fetcher: async (url, options) => {
      assert.equal(url, `https://api.lanyard.rest/v1/users/${discordId}`);
      assert.equal(options.headers.Authorization, undefined);
      return json({
        success: true,
        data: {
          discord_user: {
            id: discordId,
            username: "updated_handle",
            avatar,
            global_name: null,
          },
          activities: [{ name: "Private activity" }],
          discord_status: "online",
        },
      });
    },
  });
  assert.equal(profile.displayName, "updated_handle");
  assert.ok(!JSON.stringify(profile).includes("Private activity"));
  assert.ok(!("discord_status" in profile));
});

test("An actual default Discord avatar is resolved only after the API confirms no custom avatar", async () => {
  const profile = await fetchDiscordProfile({
    token: "test-token",
    fetcher: async () =>
      json({
        id: discordId,
        username: "example",
        discriminator: "0",
        avatar: null,
      }),
  });
  const index = Number((BigInt(discordId) >> 22n) % 6n);
  assert.equal(
    profile.avatarUrl,
    `https://cdn.discordapp.com/embed/avatars/${index}.png`,
  );
});

test("Unavailable APIs, wrong identities, and malformed avatar hashes are rejected", async () => {
  await assert.rejects(
    fetchDiscordProfile({ fetcher: async () => json({ success: false }, 404) }),
    /HTTP 404/,
  );
  await assert.rejects(
    fetchDiscordProfile({
      token: "test-token",
      fetcher: async () => json({ id: "123", username: "other", avatar }),
    }),
    /different profile/,
  );
  await assert.rejects(
    fetchDiscordProfile({
      token: "test-token",
      fetcher: async () =>
        json({ id: discordId, username: "example", avatar: "../../bad" }),
    }),
    /avatar hash/,
  );
  await assert.rejects(
    fetchGitHubProfile({
      fetcher: async () => json({ id: 1, login: "other" }),
    }),
    /different profile/,
  );
});

test("One provider can refresh while a failed provider retains its last real data and timestamp", async () => {
  const oldDiscord = {
    username: "last_verified",
    fetchedAt: "2026-09-20T00:00:00Z",
  };
  const newGitHub = { username: "velumix", fetchedAt: "2026-09-26T00:00:00Z" };
  const result = await refreshProfiles(
    { github: null, discord: oldDiscord },
    {
      github: async () => newGitHub,
      discord: async () => {
        throw new Error("unavailable");
      },
    },
  );
  assert.deepEqual(result.profiles, { github: newGitHub, discord: oldDiscord });
  assert.deepEqual(result.failures, ["discord"]);
});
