<h1 align="center">Cortex CLI</h1>
<p align="center">An AI agent for your terminal. Work on code, files and research with the model you choose.</p>
<p align="center"><strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a></p>
<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-%E2%89%A522.19-43853d" alt="Node.js 22.19 or later" /></a>
  <a href="https://github.com/createpjf/cortex-cli/commits/main"><img src="https://img.shields.io/badge/status-preview-8b5cf6" alt="Preview" /></a>
</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./media/session.png" />
  <img src="./media/session-light.png" alt="Cortex CLI: tool activity, parallel agents and a suggested next message" width="100%" />
</picture>

## Get started

Requires **Node.js 22.19+** and an API key for your chosen provider.

```sh
npm install -g github:createpjf/cortex-cli --loglevel=error
cortex
```

First launch guides you through choosing a provider, model and API key. The interface defaults to English; change it in **`/settings` → Language**.

**Providers:** Anthropic, OpenAI, Google, DeepSeek, FLock API Platform, xAI / Grok, OpenRouter, Kimi, Zhipu AI, MiniMax, Doubao, Qwen and custom OpenAI-compatible endpoints. Use `/config` to change connections and `/model` to switch models. Availability depends on your provider and account.

## In a conversation

| Action | Shortcut or command |
| --- | --- |
| Send a message / add a newline | Enter / Ctrl+J |
| Choose work mode | Shift+Tab |
| Switch model / thinking level | `/model` / Ctrl+S |
| Find commands and skills / reference a file | Ctrl+P or `/` / `@` |
| View agents / sessions needing attention | `/agents` / `/inbox` |
| Stop the current run / reopen a pending request | Esc / `/pending` |
| Resume a conversation / change settings | `/resume` / `/settings` |
| Attach an image | Ctrl+V, or drag the file into the terminal |
| Run a command on your computer | `!` followed by the command |
| Write an AGENTS.md for the project | `/init` |
| Clear the input / quit | Ctrl+C / Ctrl+C twice on an empty input |
| Suspend to the shell | Ctrl+Z, then `fg` |

The default mode asks for approval when needed. **Plan** is read-only; **Auto-approve** reduces prompts but retains protection for irreversible actions. Approvals open after you stop typing and take number keys, so a half-typed sentence can't answer them. Enter queues a follow-up while a run is active; Alt+Enter sends it into the current run. Stopping a run moves queued messages back to the input.

`!` commands run in your shell in the project folder, without the sandbox or approvals. Their output is shown in the conversation and sent along with your next message; remove it in `/attachments`. Use `/keymap` to customize bindings and `/help` for more.

<details>
<summary>Welcome screen, command palette and agent dashboard</summary>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./media/start.png" />
  <img src="./media/start-light.png" alt="Cortex welcome screen with the CX dot-matrix mark" width="100%" />
</picture>

![Command palette](./media/commands.png)
![Agent dashboard](./media/agents.png)

Screens are rendered from the real TUI with example data.
</details>

## Scripts and integrations

```sh
cortex exec "Summarize this project" --output-format json
cortex review                         # Read-only review of uncommitted changes
cortex sessions                      # List saved conversations
cortex resume                        # Choose a conversation to resume
cortex resume --last                 # Continue the latest one in this folder
echo "Summarize this project" | cortex exec
cortex mcp add files -- npx -y @modelcontextprotocol/server-filesystem ~/Documents
```

Use `--output-schema schema.json` to validate a JSON reply, or `-o answer.md` to save the final reply without overwriting an existing file. `exec` has no time limit unless you pass `--timeout <seconds>`. `cortex --help` lists every option.

**Already using Cortex desktop?** Run `cortex --desktop` to share its providers, permissions and conversations. Keep a compatible desktop app running. Desktop mode is unsupported on Windows and unverified on Linux; computer use requires desktop mode, interactive approval and the desktop extension.

## Settings and updates

Standalone settings and conversations live in `~/.cortex-cli-preview`; appearance and language live in `~/.cortex-cli-ui.json`. Model requests go to your configured provider; tools run on your computer. `CORTEX_LANGUAGE=en` or `zh-CN` overrides the saved language. `NO_COLOR=1` disables colors; `/motion` reduces animation. Next-message predictions are beta, make an extra model request per turn, and can be disabled in `/settings`. When the terminal is in the background, Cortex lets you know when it needs approval or finishes a long run: a system notification in Ghostty, iTerm2, Kitty, WezTerm and Warp, a bell elsewhere. Quitting prints a short summary of time, tokens, tools and changed files. Install [`fd`](https://github.com/sharkdp/fd) so `@` searches the whole project by name; `cortex doctor` checks for it.

```sh
cortex update                        # Update from this repository
cortex doctor                        # Check installation and terminal
cortex --debug                       # Write runtime logs to logs/ in the config folder, keys hidden
npm uninstall -g cortex-cli
```

This is a preview; commands and settings may change. Knowledge-base local model dependencies are not included. Report reproducible problems in [Issues](https://github.com/createpjf/cortex-cli/issues).

## License and repository scope

[MIT](./LICENSE). This repository distributes Cortex CLI builds, documentation and images. The TypeScript source remains in the private Cortex repository; it is not published here.

Bundled components retain their own licenses, including Apache-2.0 for Cortex shared/core components. See [NOTICE](./NOTICE), [third-party notices](./THIRD-PARTY-NOTICES.txt) and [Apache-2.0](./licenses/Apache-2.0.txt). Installed dependencies include their own license files. Terminal themes and ASCII fallback include adaptations from [termcn](https://github.com/shadcn-labs/termcn) (MIT).
