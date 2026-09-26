# Portfolio content sources

Reviewed against public GitHub source on September 26, 2026 (UTC). This is a
curated account of published projects and contributions, not a live GitHub
activity feed or an employment history. Project and contribution counts in
the UI are derived from `src/data/work.ts`.

The separate GitHub account card uses public profile fields from
`https://api.github.com/users/velumix`, including its avatar, public repository
count, and followers. Its repository count describes the whole account, not
the curated portfolio. Discord identity is read from the official Get User
endpoint when a bot secret is configured, or from Lanyard after account opt-in.
Source names and successful fetch timestamps are recorded per account in
`public/data/social-profiles.json`; absent data is not replaced with fabricated
profile details. See the README for access and refresh configuration.

| Work               | Evidence                                                                                                                                                                                                                                                               | Attribution / boundary                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Abraxius Workspace | [README](https://github.com/velumix/Abraxius-Workspace), [architecture](https://github.com/velumix/Abraxius-Workspace/blob/main/docs/architecture.md)                                                                                                                  | Personal C#/.NET runtime and Avalonia application. Does not claim every platform host is production-tested or include features from the open Design Studio PR. |
| Abraxius Lattice   | [README](https://github.com/velumix/Abraxius-Lattice), [native crates](https://github.com/velumix/Abraxius-Lattice/tree/main/crates)                                                                                                                                   | Personal Rust implementation. Describes the current indexing/storage/CLI implementation, not roadmap integrations.                                             |
| ProjectVite        | [React source](https://github.com/velumix/ProjectVite/tree/main/my-ui/src), [inventory README](https://github.com/velumix/ProjectVite/blob/main/my-ui/src/inventory/README.md), [package scripts](https://github.com/velumix/ProjectVite/blob/main/my-ui/package.json) | Personal UI workspace. Interactive browser inventory is distinct from native Roblox export and live services.                                                  |
| Stride             | [merged PR #3401](https://github.com/stride3d/stride/pull/3401), [merged PR #3395](https://github.com/stride3d/stride/pull/3395)                                                                                                                                       | Contributor to slider correctness and regression coverage. Does not claim authorship of the engine.                                                            |
| VSCodroid          | [implementation commit](https://github.com/velumix/VSCodroid/commit/e98420fdc49bbf5a6add59d1adb3df61ce68f413), [CI commit](https://github.com/velumix/VSCodroid/commit/3ea10131249ce3868e21ac8d144939d5de13115b)                                                       | Changes authored by velumix in a fork. Not presented as an upstream merge or authorship of the Android port.                                                   |
| Gojo               | [README and source](https://github.com/velumix/gojo)                                                                                                                                                                                                                   | Personal Go MCP proxy, process watcher, and script-export tool.                                                                                                |
| Abraxius           | [README](https://github.com/velumix/Abraxius), [documentation](https://velumix.github.io/Abraxius/)                                                                                                                                                                    | Personal Windows companion with Rust, Node, WinUI, and Luau components. Does not present the open Tauri PR as part of main.                                    |
| Nerve              | [README and source](https://github.com/velumix/Nerve), [documentation](https://velumix.github.io/Nerve/)                                                                                                                                                               | Personal Luau framework. Bundled libraries remain their respective authors' work.                                                                              |
| claude-system      | [merged upstream PR #24](https://github.com/hariomlohardev/claude-system/pull/24)                                                                                                                                                                                      | Contribution limited to issue maintenance automation and its documentation.                                                                                    |

The five existing game case studies retain their contribution descriptions in
`src/data/engineering.ts` and real Roblox snapshots in
`src/data/roblox-media.json`. Seven-plus years is explicitly scoped to Roblox;
it is not applied to every language or discipline.

Abraxius and ProjectVite are categorized as past projects based on the owner's corrections,
not inferred from GitHub archive flags. Both remain part of the experience
catalog, below the Roblox showcase and other software.

`public/images/projectvite-preview.jpg` was captured directly from the
inventory interface at [ProjectVite's public browser preview](https://velumix.github.io/ProjectVite/)
on September 26, 2026 (UTC). Its link is labeled as a browser preview, not a
released Roblox experience.

Monolith and Genesis-Hermes contained only starter repository content when
reviewed. Unchanged forks (including Zed and Hermes Agent) are not counted as
authored projects or contributions. Visitors can reach the complete public
repository list from the Open source panel.

When updating this catalog, read the actual implementation or contribution
before changing descriptions. Preserve the distinction between a personal
project, a fork change, and an upstream contribution. Do not infer employment,
release readiness, usage counts, or expertise duration from repository names.
