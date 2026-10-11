# Cortex CLI

在终端里使用 Cortex Agent。这是预览版的构建产物；源码在 Cortex 主仓库的 `apps/cli/`，本仓库由 `apps/cli/scripts/package.ts` 生成，请不要直接改这里的文件。

Cortex Agent in your terminal. Preview build; the source lives in the Cortex repository under `apps/cli/`.

## 安装

需要 Node.js 22.19 或更高版本。

```bash
npm install -g github:createpjf/cortex-cli
```

更新时重新执行同一条命令。卸载用 `npm uninstall -g cortex-cli`。

## 使用

独立模式：首次运行会引导设置供应商、模型和 API Key，配置保存在 `~/.cortex-cli-preview`。

```bash
cortex
```

共享模式：连接本机正在运行的 Cortex 桌面，沿用桌面的供应商、模型、权限和会话。开发版桌面需要加 `--config-dir "$HOME/.cortex-kb-dev"`。

```bash
cortex --desktop
```

无人值守执行，结果写到标准输出；把输出重定向到文件时会自动按这种方式运行：

```bash
cortex exec "总结当前项目" --output-format json
cortex "总结当前项目" > 总结.txt
```

`cortex --help` 查看全部参数。对话里按 `?` 查看快捷键，`/` 打开命令与 Skills。

Shell 补全：

```bash
source <(cortex completions zsh)
```

## 限制

- 预览版，命令和配置格式可能变化。
- 知识库相关的本地模型（ONNX、tokenizers）不随本包安装。
- Windows 不支持共享模式；Linux 的共享模式尚未验收。

## 第三方许可

终端符号的 ASCII 降级规则改写自 [termcn](https://github.com/shadcn-labs/termcn)（MIT License，Copyright (c) 2026 Aniket Pawar）。
