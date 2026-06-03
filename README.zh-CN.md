# squad-room

[English](README.md) | [简体中文](README.zh-CN.md)

Squad Room 是一个面向个人的 AI 小队会议室，适合比赛、项目策划和认真脑暴。

中文名：Agents小队会议室

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
- 一键运行完整会议，跑完固定阶段后生成总结。
- 暂停正在进行的会议，保留被中断的流式输出；暂停期间可以补充信息，恢复时会先处理这些补充，再继续讨论。
- 队友发言时，用户消息进入插话队列，也可以选择立即打断。
- 用户插话会保留在队列中，直到小队回复成功；发送失败时可以重试，再次插话时会合并上下文，不会丢失原消息。
- 可以直接在聊天框输入 `stop`、`pause`、`resume`、`interrupt`、`next`、`run`、`summary`、`retry`、`clear queue`、`help` 等命令控制会议；也支持“你先停一下”“暂停一下会议”“继续吧”等明确的自然语言控制意图。
- 静默研究任务可以和前台讨论并行执行。
- 查看每个队友专属的技能和工具权限。
- 在 Task Center 中跟踪工作项、负责人和交付物类型。
- 查看按 agent 分类的 token 用量和已完成工具调用。
- 使用共享会议 workspace、安静的 Team Inbox 和每位 agent 的 workspace 摘要。
- 默认使用有边界的机会型探索，也可以开启 Exploration mode 进行更深入的后台研究。
- 允许队友申请高价值的追加发言，同时保持每个会议阶段有边界并由 Captain 收束。
- 向小队追问或补充约束。
- 生成最终 brief。
- 队友发言会以流式方式逐段显示。
- 队友消息会以安全清洗后的 Markdown 渲染。
- 每个阶段结束后，由一次受限的记录员步骤生成结构化简报。
- 从可编辑的 Markdown 文件加载队友技能。
- 将常用格式的项目资料文件导入会议上下文。
- 使用可见、本地优先的工具读取项目资料、生成产物、创建任务和发起需批准的网页搜索请求。
- 查看自动提取的产出：方案、行动项、风险和评委问题。

## 项目资料

创建会议前，可以直接粘贴笔记，也可以导入文件。TXT、Markdown、CSV、TSV、JSON、HTML、XML、YAML 和 YML 会直接在浏览器中读取。PDF、DOCX、XLS 和 XLSX 也支持导入，解析时会按需从 jsDelivr 加载解析库。

文件在浏览器本地解析，文件本身不会上传到 jsDelivr。打开会议后，提取出的文本会作为会议上下文发送给你配置的 API 服务。单个文件最大为 10 MB，合并后的文本上下文最多保留 12,000 个字符。

## 技能与工具

每个队友都有位于 `skills/` 下的 Markdown 技能文件。API 会把相应工作方法注入该队友的 prompt。

当前工具集刻意保持克制：

| 工具 | 自动行为 | 是否需要批准 |
| --- | --- | --- |
| Read Project Context | Captain 在 Framing 阶段读取用户显式提供的资料。 | 不需要 |
| Create Brief Artifact | Captain 在 Convergence 和 Summary 阶段刷新 Markdown 简报产物。 | 不需要 |
| Create Tasks | Engineer 在 Action Plan 和 Summary 阶段整理行动项。 | 不需要 |
| Web Research | Agent 会按阶段提出相关检索请求。默认情况下每条关键词都等待批准；开启 Automatic web research 后，agent 可以直接发送关键词。结果会加入共享上下文。 | 可选用户点击 |

低风险工具会在限定的会议阶段自动执行，并显示在 Tool Activity 中。Task Center 会把行动项整理为带负责人和交付物类型的可见任务。自动检索默认关闭，可以在创建会议时或会议室顶部开启。开启后，agent 可以直接发送可见的检索关键词，不再逐条等待批准。只有搜索关键词会发送给搜索服务，项目资料不会被发送。当前版本不会读取你电脑上的任意文件，也不会运行代码。

机会型探索默认保持安静：结果会进入 Team Inbox，不会直接打断讨论。普通模式下，每个阶段最多允许两次机会型工具调用；开启 Exploration mode 后，上限提高到四次，用于更深入的后台研究。共享 workspace 会汇总 mission、决策、开放问题、产物和活动记录；每位 agent 的 workspace 摘要会显示其任务、后台工作和发现。

会议阶段不再是完全写死的脚本。每个阶段先由少量必需角色建立主线；静默调度器只会在出现新证据、关键风险、决策变化或重要执行改进时允许追加发言。每个阶段最多六次可见发言，每位队友最多发言两次；有价值的追加讨论最后由 Captain 做出裁决。

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
  skills/         # 可编辑的队友工作方法
  .env.example
  SECURITY.md
```

## 当前状态

这是一个早期 MVP 脚手架，适合个人使用和开发者实验。

