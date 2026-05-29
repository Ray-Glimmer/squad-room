# squad-room

[English](README.md) | [简体中文](README.zh-CN.md)

Squad Room 是一个面向个人的 AI 小队会议室，适合比赛、项目策划和认真脑暴。

中文名：小队会议室

当前开源初版刻意保持轻量：

- 一个可以托管到 GitHub Pages 的静态前端。
- 一个本地 Node.js API 服务，用来把模型密钥留在浏览器之外。
- 一个无需 API key 也能运行的 mock 模式。
- 一个 OpenAI-compatible provider，用于真实的多 agent 讨论。

## 为什么这样设计

多 agent 应用很容易快速消耗 token，而且把 API key 放在浏览器里很容易泄露。Squad Room 保持前端静态，并让所有模型请求都经过后端网关。

```text
GitHub Pages / 静态前端
  -> 本地或云端 API 服务
  -> OpenAI-compatible 模型服务
```

## 快速开始

环境要求：

- Node.js 20+
- 当前 MVP 不需要安装 npm 依赖。

启动 API 服务：

```bash
cp .env.example apps/api/.env
npm run api
```

拉取更新后请重启 API 服务，尤其是前端或 API 路由发生变化时。

打开前端：

```text
apps/web/index.html
```

默认情况下，如果 `OPENAI_API_KEY` 为空，应用会自动进入 mock 模式。

运行语法检查：

```bash
npm run check
```

如果 Windows PowerShell 阻止执行 `npm` 脚本，可以运行：

```powershell
npm.cmd run check
```

## 环境变量

复制 `.env.example` 到 `apps/api/.env`。

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
API_PORT=8787
ALLOW_ORIGIN=*
SQUAD_ROOM_MOCK=false
```

任何兼容 OpenAI API 格式的模型服务，都可以通过修改 `OPENAI_BASE_URL` 和 `OPENAI_MODEL` 接入。
测试流式界面时，可以设置 `SQUAD_ROOM_MOCK=true` 强制进入 mock 模式。

## 当前 MVP

- 从项目或比赛主题创建会议。
- 与 6 个默认队友讨论：
  - Captain / 队长
  - Ideator / 点子王
  - Engineer / 技术手
  - Strategist / 商业手
  - Designer / 设计手
  - Critic / 毒舌评委
- 按阶段继续推进讨论。
- 向小队追问或补充约束。
- 生成最终 brief。
- 队友发言会以流式方式逐段显示。
- 队友消息会以安全清洗后的 Markdown 渲染。
- 查看自动提取的产出：方案、行动项、风险和评委问题。

## GitHub Pages

前端是静态页面，可以直接把 `apps/web` 发布到 GitHub Pages。

公开部署时，请只把 API key 放在 API 服务端环境变量里。不要把真实模型密钥写进前端代码、GitHub Pages 变量或已提交文件。

## 项目结构

```text
squad-room/
  apps/
    api/          # 本地 API 服务和模型网关
    web/          # 可部署到 GitHub Pages 的静态前端
  docs/           # 产品、架构、部署和安全说明
  packages/
    shared/       # 共享配置参考
  .env.example
  SECURITY.md
```

## 当前状态

这是一个早期 MVP 脚手架，适合个人使用和开发者实验。

