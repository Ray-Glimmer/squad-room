# squad-room

[English](README.md) | [简体中文](README.zh-CN.md)

Squad Room，中文名“小队会议室”，是一个面向个人使用的多 Agent 会议室。它适合用于比赛准备、项目规划、方案讨论和结构化头脑风暴。

输入主题和项目资料后，小队会围绕目标展开讨论、质疑、检索和总结，并把讨论结果整理为可继续执行的简报与任务。

[在线前端](https://ray-glimmer.github.io/squad-room_agents/) · [安全说明](SECURITY.md) · [架构说明](docs/ARCHITECTURE.md)

## 功能概览

| 模块 | 说明 |
| --- | --- |
| 多 Agent 讨论 | 默认提供 Captain、Ideator、Engineer、Strategist、Designer、Critic 六个角色。 |
| 流式会议室 | Agent 回复会实时显示，并以安全 Markdown 渲染。 |
| 会议简报 | 会议页突出展示当前方向、下一步行动、风险提醒和待确认问题。 |
| 任务中心 | 将讨论结果整理为带负责人和交付物的行动项。 |
| 后台检索 | 开启后，Agent 可以执行受控网页检索，结果会聚合为研究更新。 |
| 项目资料 | 支持在会议开始前粘贴笔记或导入常见格式文件。 |
| 资料检索 | API 会切分项目资料，并在每次 Agent 发言前检索相关片段。 |
| 运行看板 | 工具运行、后台任务、用量、工作区和运行轨迹集中展示在 Dashboard。 |
| 技能与工具配置 | Agent 方法以 Markdown 和 skill pack 形式存放，便于开发者修改。 |
| 本地优先的密钥管理 | 浏览器不保存模型 API key；模型请求由 API 服务转发。 |
| 中英文界面 | 前端支持英文和简体中文切换。 |

## 页面结构

- **首页**：输入主题、目标、约束和项目资料，创建会议室。
- **会议室**：与小队讨论、介入会议、查看简报和任务。
- **看板**：查看共享工作区、后台任务、工具运行、用量和运行轨迹。
- **设置**：查看队友、技能、工具、API 地址、自动检索和探索模式。

## 快速开始

环境要求：

- Node.js 20+
- 当前 MVP 不需要安装 npm 依赖。

克隆仓库并启动 API：

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

打开静态前端：

```text
apps/web/index.html
```

也可以直接访问托管前端：

```text
https://ray-glimmer.github.io/squad-room_agents/
```

前端默认连接 `http://localhost:8787`。如需修改，请在 **Settings / 设置** 页面调整 API 地址。

## Mock 模式

如果只想体验界面，可以留空 `OPENAI_API_KEY`，或设置：

```env
SQUAD_ROOM_MOCK=true
```

Mock 模式适合界面测试、演示和开发调试。

## 模型配置

复制 `.env.example` 到 `apps/api/.env`，然后配置：

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
API_PORT=8787
ALLOW_ORIGIN=*
SQUAD_ROOM_MOCK=false
```

只要兼容 OpenAI API 格式，就可以通过 `OPENAI_BASE_URL` 和 `OPENAI_MODEL` 接入其他模型服务。

## 基本流程

1. 在首页输入主题、目标、约束和可选项目资料。
2. 打开会议室。
3. 逐阶段推进讨论，或使用 **Run Meeting** 自动推进。
4. 需要介入时，可以暂停、打断、补充上下文或发送控制指令。
5. 根据会议简报和任务中心，把讨论结果转化为行动方案。
6. 在看板和设置页查看运行状态与配置项。

## 项目资料

会议开始前可以粘贴笔记，也可以导入文件。

支持的文本格式：

```text
TXT, Markdown, CSV, TSV, JSON, HTML, XML, YAML, YML
```

支持的文档格式：

```text
PDF, DOCX, XLS, XLSX
```

文件会在浏览器本地解析。打开会议后，提取出的文本会作为会议上下文发送给已配置的 API 服务。单个文件最大 10 MB，合并后的上下文最多保留 12,000 个字符。

## Agent 角色

| Agent | 分工 |
| --- | --- |
| Captain | 定义目标、推进会议、收束结论。 |
| Ideator | 提供备选方案、创意角度和内容钩子。 |
| Engineer | 检查可行性、实现路径和技术风险。 |
| Strategist | 评估用户、市场、定位和价值。 |
| Designer | 打磨体验、叙事、视觉和演示流程。 |
| Critic | 检验假设，并提出评委视角的质疑。 |

每个 Agent 的技能文件都在 `skills/` 中，可以直接编辑 Markdown。项目也支持目录式 skill pack：

```text
skills/captain/meeting-qa/
  manifest.json
  SKILL.md
  smoke-test.md
```

## 工具

| 工具 | 用途 | 是否需要批准 |
| --- | --- | --- |
| Read Project Context | 读取用户明确提供的项目资料。 | 否 |
| Create Brief Artifact | 刷新结构化会议简报。 | 否 |
| Create Tasks | 将决策整理为可见任务。 | 否 |
| Create Research Plan | 将 framing 阶段的问题整理为研究计划。 | 否 |
| Create Option Board | 对比头脑风暴阶段出现的方向。 | 否 |
| Create Feasibility Checklist | 将可行性问题转化为检查清单。 | 否 |
| Create Risk Register | 汇总风险、缓解方式和证据需求。 | 否 |
| Create Decision Matrix | 比较收敛阶段的备选方案。 | 否 |
| Create Pitch Outline | 将方案整理为逐页路演故事。 | 否 |
| Web Research | 开启后检索阶段相关信息。 | 可选 |

产物工具会同时返回适合阅读的 Markdown 和适合后续筛选、导出、渲染的结构化 JSON。自动网页检索默认关闭。

## 开发命令

```bash
npm run api
npm run check
npm run eval
npm run verify:screenshot
```

Windows PowerShell：

```powershell
npm.cmd run api
npm.cmd run check
npm.cmd run eval
npm.cmd run verify:screenshot
```

`eval` 会运行轻量 harness 检查，覆盖工具注册、skill pack、结构化产物、资料检索，以及可选的本地 API smoke test。`verify:screenshot` 会调用本机 Edge 或 Chrome 的 headless 模式生成前端截图。

## GitHub Pages

前端是静态页面，可以从 `apps/web` 发布到 GitHub Pages。

公开部署时请注意：

- 模型 API key 只应放在 API 服务端环境变量中。
- 不要把真实 API key 写入前端代码、GitHub Pages 变量或已提交文件。
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
  skills/         # 可编辑的 Agent 工作方法
  scripts/        # 本地验证工具
  .env.example
  SECURITY.md
```

## 当前状态

Squad Room 仍处于早期 MVP 阶段，适合个人使用和开发者实验。核心流程已经可用，界面、工具和 Agent 工作流仍在持续迭代。
