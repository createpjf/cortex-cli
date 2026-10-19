<h1 align="center">Cortex CLI</h1>
<p align="center">终端里的 AI Agent。选择自己的模型，处理代码、文件与调研任务。</p>
<p align="center"><a href="./README.md">English</a> · <strong>简体中文</strong></p>
<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT 许可证" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-%E2%89%A522.19-43853d" alt="需要 Node.js 22.19 或更高版本" /></a>
  <a href="https://github.com/createpjf/cortex-cli/commits/main"><img src="https://img.shields.io/badge/status-preview-8b5cf6" alt="预览版" /></a>
</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./media/session.png" />
  <img src="./media/session-light.png" alt="Cortex CLI：工具执行、并行代理与下一步输入建议" width="100%" />
</picture>

## 快速开始

需要 **Node.js 22.19+**，以及所选供应商的 API Key。

```sh
npm install -g github:createpjf/cortex-cli --loglevel=error
cortex
```

首次启动会引导你选择供应商、模型并填写 API Key。界面默认英文，可在 **`/settings` → Language** 中切换中文。

**支持的平台：** Anthropic、OpenAI、Google、DeepSeek、FLock API Platform、xAI / Grok、OpenRouter、Kimi、智谱 AI、MiniMax、豆包、通义千问及自定义 OpenAI 兼容端点。`/config` 修改连接，`/model` 切换模型；可用模型取决于供应商与账户权限。

## 对话中的操作

| 操作 | 快捷键或命令 |
| --- | --- |
| 发送消息 / 换行 | Enter / Ctrl+J |
| 选择工作方式 | Shift+Tab |
| 切换模型 / 思考强度 | `/model` / Ctrl+S |
| 查找命令与 Skills / 引用文件 | Ctrl+P 或 `/` / `@` |
| 查看代理 / 待处理会话 | `/agents` / `/inbox` |
| 停止当前运行 / 重开待确认请求 | Esc / `/pending` |
| 恢复对话 / 修改设置 | `/resume` / `/settings` |

默认按需确认。**Plan** 只读；**Auto-approve** 减少确认，但仍保留不可逆操作保护。运行中按 Enter 将消息排队，Alt+Enter 向当前运行插话。`/keymap` 自定义快捷键，`/help` 查看更多操作。

<details>
<summary>欢迎页、命令面板与代理看板</summary>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./media/start.png" />
  <img src="./media/start-light.png" alt="使用 CX 点阵标志的 Cortex 欢迎页" width="100%" />
</picture>

![命令面板](./media/commands.png)
![代理看板](./media/agents.png)

截图由真实 TUI 使用示例数据渲染。
</details>

## 脚本与集成

```sh
cortex exec "总结当前项目" --output-format json
cortex review                         # 只读审查未提交的改动
cortex sessions                      # 查看已保存的对话
cortex resume <session-id>
cortex mcp add files -- npx -y @modelcontextprotocol/server-filesystem ~/Documents
```

`--output-schema schema.json` 校验 JSON 回复，`-o answer.md` 保存最终回复且拒绝覆盖已有文件。`cortex --help` 查看全部参数。

**已经在用 Cortex 桌面？** 运行 `cortex --desktop` 共用桌面的供应商、权限和对话，并保持兼容的桌面应用运行。Windows 不支持共享模式，Linux 共享模式尚未验收；操作电脑还需交互审批和桌面扩展。

## 设置与更新

独立模式的设置和对话保存在 `~/.cortex-cli-preview`，外观与语言保存在 `~/.cortex-cli-ui.json`。模型请求发往你配置的供应商，工具在本机执行。`CORTEX_LANGUAGE=en` 或 `zh-CN` 优先于保存的语言；`NO_COLOR=1` 关闭颜色，`/motion` 减少动画。下一步预测仍为 Beta，每轮会额外请求一次模型，可在 `/settings` 关闭。

```sh
cortex update                        # 从本仓库更新
cortex doctor                        # 检查安装与终端
npm uninstall -g cortex-cli
```

当前是预览版，命令和配置可能变化；知识库所需的本地模型依赖不随包安装。问题请附复现步骤，提交到 [Issues](https://github.com/createpjf/cortex-cli/issues)。

## 许可与仓库范围

采用 [MIT 许可证](./LICENSE)。本仓库分发 Cortex CLI 构建产物、文档与图片；TypeScript 源码仍保留在私有 Cortex 仓库中，不在此公开。

打包组件保留各自的许可，包括 Cortex shared/core 组件原有的 Apache-2.0。详见 [NOTICE](./NOTICE)、[第三方声明](./THIRD-PARTY-NOTICES.txt) 与 [Apache-2.0](./licenses/Apache-2.0.txt)；安装依赖随包附带许可证。终端主题和 ASCII 降级包含对 [termcn](https://github.com/shadcn-labs/termcn) 的改写（MIT）。
