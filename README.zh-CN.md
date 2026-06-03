# squad-room

[English](README.md) | [简体中文](README.zh-CN.md)

Squad Room，中文名“小队会议室”，是一个给个人使用的 AI 顾问团。

输入一个比赛、项目或想法，小队会像一个小型团队一样讨论、质疑、检索、总结，并把结论整理成可以继续执行的方案。

[在线前端](https://ray-glimmer.github.io/squad-room_agents/) · [安全说明](SECURITY.md) · [架构说明](docs/ARCHITECTURE.md)

## 你可以用它做什么

| 模块 | 作用 |
| --- | --- |
| 小队讨论 | 6 个默认 agent 从不同角色参与：Captain、Ideator、Engineer、Strategist、Designer、Critic。 |
| 流式聊天 | 队友会边生成边显示，消息支持安全 Markdown 渲染。 |
| 当前简报 | 右侧自动整理当前方向、行动项、风险和开放问题。 |
| Task Center | 把讨论结论整理成带负责人和交付物的任务。 |
| Team Inbox | 后台检索结果不会打断讨论，会聚合成发现卡片。 |
| 项目资料 | 开会前可以粘贴资料，也可以导入常见格式文件。 |
| 聊天控制 | 支持 `pause`、`resume`、`next`、`run`、`summary`、`clear queue` 等命令，也能识别明确的自然语言控制意图。 |
| 本地优先密钥 | 浏览器不保存模型 API key，模型请求通过 API 服务转发。 |

## 快速开始

环境要求：

- Node.js 20+
- 当前 MVP 不需要安装 npm 依赖。

克隆并启动 API：

```bash
git clone https://github.com/Ray-Glimmer/squad-room_agents.git
cd squad-room_agents
cp .env.example apps/api/.env
npm run api
```

Windows PowerShell：

```powershell
Copy-Item .env.example apps/api/.env
npm.cmd run api
```

打开前端：

```text
apps/web/index.html
```

也可以直接访问 GitHub Pages 前端：

```text
https://ray-glimmer.github.io/squad-room_agents/
```

前端默认连接 `http://localhost:8787`，你也可以在创建会议页面修改 API endpoint。

## 不配置模型也能试

如果只是想体验界面，可以留空 `OPENAI_API_KEY`，或者设置：

```env
SQUAD_ROOM_MOCK=true
```

Mock mode 适合 UI 测试、演示和开发调试。

## 配置模型

复制 `.env.example` 到 `apps/api/.env`，然后修改：

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
API_PORT=8787
ALLOW_ORIGIN=*
SQUAD_ROOM_MOCK=false
```

只要兼容 OpenAI API 格式，就可以通过 `OPENAI_BASE_URL` 和 `OPENAI_MODEL` 接入其他模型服务。

## 使用流程

1. 输入主题、目标、约束和可选项目资料。
2. 选择是否允许 agent 自动进行网页检索。
3. 打开会议室。
4. 一阶段一阶段推进，或者点击 **Run Meeting** 自动推进。
5. 需要介入时，可以暂停、打断、补充信息或直接发送控制指令。
6. 根据右侧简报、Team Inbox 和 Task Center，把讨论变成行动方案。

## 项目资料

开会前可以粘贴笔记，也可以导入文件。

支持的文本格式：

```text
TXT, Markdown, CSV, TSV, JSON, HTML, XML, YAML, YML
```

支持的文档格式：

```text
PDF, DOCX, XLS, XLSX
```

文件会在浏览器本地解析。打开会议后，提取出的文本会作为会议上下文发送给你配置的 API 服务。单个文件最大 10 MB，合并后的上下文最多保留 12,000 个字符。

## 小队角色

| Agent | 分工 |
| --- | --- |
| Captain | 定义目标、推进会议、收束结论。 |
| Ideator | 提供新角度、钩子和备选方案。 |
| Engineer | 检查可行性、实现路径和技术风险。 |
| Strategist | 思考用户、市场、定位和价值。 |
| Designer | 打磨体验、故事、视觉和演示流程。 |
| Critic | 找出脆弱假设和评委可能追问的问题。 |

每个 agent 的技能文件都在 `skills/` 中，可以直接编辑 Markdown。

## 工具

| 工具 | 自动行为 | 是否需要批准 |
| --- | --- | --- |
| Read Project Context | 读取你明确提供的项目资料。 | 不需要 |
| Create Brief Artifact | 刷新结构化会议简报。 | 不需要 |
| Create Tasks | 把决策整理成可见任务。 | 不需要 |
| Web Research | 开启后按阶段检索相关信息。 | 可选 |

自动网页检索默认关闭。开启后，agent 可以按需发送检索关键词。检索结果会加入共享上下文，并在 Team Inbox 中聚合展示。

## 开发命令

```bash
npm run api
npm run check
npm run verify:screenshot
```

Windows PowerShell：

```powershell
npm.cmd run api
npm.cmd run check
npm.cmd run verify:screenshot
```

`verify:screenshot` 会调用本机 Edge 或 Chrome 的 headless 模式，生成前端截图用于检查页面。

## GitHub Pages

前端是静态页面，可以从 `apps/web` 发布到 GitHub Pages。

公开部署时请注意：

- 模型 API key 只放在 API 服务端环境变量里。
- 不要把真实 API key 写进前端代码、GitHub Pages 变量或已提交文件。
- 前端可以指向本地或云端 API endpoint。

## 项目结构

```text
squad-room/
  apps/
    api/          # 本地 API 服务和模型网关
    web/          # 可部署到 GitHub Pages 的静态前端
  docs/           # 产品、架构、部署和安全说明
  packages/
    shared/       # 共享配置参考
  skills/         # 可编辑的队友工作方法
  scripts/        # 本地验证工具
  .env.example
  SECURITY.md
```

## 当前状态

Squad Room 仍是早期 MVP，适合个人使用和开发者实验。它已经可以上手使用，但产品界面和 agent 工作流还在持续迭代。
