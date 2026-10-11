<p align="center"><strong>Cortex CLI</strong> 让你在终端里使用 Cortex Agent，运行在你自己的电脑上。</p>

<p align="center"><a href="./README.md">English</a> · <strong>简体中文</strong></p>

<p align="center">如果你在用 Cortex 桌面，运行 <code>cortex --desktop</code> 即可共用桌面的供应商、权限和对话。</p>

---

## 快速开始

### 安装并运行 Cortex CLI

需要 Node.js 22.19 或更高版本。用 npm 从 GitHub 安装：

```shell
npm install -g github:createpjf/cortex-cli --loglevel=error
```

然后运行 `cortex`。首次运行会引导你选择供应商、模型并填写 API Key。

```shell
cortex
```

<details>
<summary>关于 <code>--loglevel=error</code>、更新与卸载</summary>

`--loglevel=error` 让 npm 只输出错误。去掉它会看到几条来自上游依赖的废弃与安装脚本警告，不影响使用。

- **更新：** `cortex update` 显示当前与最新版本、更新内容和安装进度。交互界面每天最多检查一次新版本，有新版本时在输入框下方提示；设置 `CORTEX_NO_UPDATE_CHECK=1` 可关闭。
- **卸载：** `npm uninstall -g cortex-cli`

</details>

### 使用 Cortex CLI

**独立模式**的设置和对话保存在 `~/.cortex-cli-preview`。可以同时在多个终端打开 `cortex`；同一个对话同一时间只在一个终端运行。

**共享模式**连接本机正在运行的 Cortex 桌面，沿用桌面的供应商、模型、权限和对话。使用时保持桌面开着。

```shell
cortex --desktop
```

**无人值守执行**适合写进脚本，结果写到标准输出；把输出重定向到文件时会自动按这种方式运行：

```shell
cortex exec "总结当前项目" --output-format json
cortex "总结当前项目" > 总结.txt
```

**MCP 服务器**两种模式都能用。共享模式沿用桌面里配置的服务器；独立模式自己添加，对话里 `/mcp` 查看，工具调用会先请你确认：

```shell
cortex mcp add files -- npx -y @modelcontextprotocol/server-filesystem ~/Documents
cortex mcp add docs --url https://example.com/mcp --header "Authorization: Bearer $TOKEN"
cortex mcp list
```

**操作电脑**在共享模式里、你正看着的对话中可用，需先在桌面扩展中心打开。首次使用某个应用、每次点击或输入都会在终端里请你确认，`exec` 不能使用。

对话里按 `?` 查看快捷键，按 `/` 打开命令与 Skills。`cortex --help` 查看全部参数。

<details>
<summary>Shell 补全</summary>

```shell
source <(cortex completions zsh)
```

</details>

## 限制

- 预览版，命令和配置格式可能变化。
- 知识库相关的本地模型（ONNX、tokenizers）不随本包安装。
- Windows 不支持共享模式；Linux 的共享模式尚未验收。

## 源码与许可

本仓库只放构建产物。源码在 Cortex 主仓库的 `apps/cli/`，本仓库由 `apps/cli/scripts/package.ts` 生成，请不要直接改这里的文件。

`dist/cortex.cjs` 与 `dist/worker.cjs` 打包了第三方 npm 包，各包的许可证与版权声明见 [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt)；作为依赖安装的包（见 `package.json`）随包自带许可证。终端符号的 ASCII 降级规则与六套主题的色值改写自 [termcn](https://github.com/shadcn-labs/termcn)（MIT License，Copyright (c) 2026 Aniket Pawar）。
