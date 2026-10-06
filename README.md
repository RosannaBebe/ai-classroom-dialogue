# 三 Agent 课堂 · 设计对话

AI 老师、AI 助教与 AI 学生课堂的产品与研发讨论记录。

公开阅读：[打开对话网页](https://RosannaBebe.github.io/ai-classroom-dialogue/)

## 收录范围

2026-09-30 关于 Agent 课堂构建方法的 18 条用户消息与正式答复，共 9 个话题。仅收录课堂角色、学生 Persona、能力与记忆、状态更新、作答判定、变更追溯和学习规则的讨论。分享、网页生成、部署及页面维护对话不在收录范围内。正文按原始顺序保留，标题与目录为阅读辅助；不包含系统指令、工具日志、内部推理或过程提示。讨论包含提案和后续修正，不能将所有早期建议视为最终方案。

## 文件

2026-10-06 新增学生、老师、助教三个 Agent 的 Persona 结构图谱，共 21 个模块。每个模块保留包含内容、三个构建步骤、运行机制和行为边界；老师与助教还包含行为例子，三个角色均注明稳定项与变量。首页快捷入口和侧栏目录可直达图谱，搜索覆盖全部模块并自动展示首个匹配项，打印会包含全部 21 个模块。此部分明确标注为后续设计补充，不计入原始对话的 18 条消息。

网页顶部和底部均提供右侧匿名留言抽屉，访客不需要填写昵称或登录。留言通过 Sites 托管的独立后端共享保存，所有访客均可阅读；`comments-config.json` 的 `endpoint` 指向已部署的 `/api/comments` 地址。每条留言最多 2000 字，同一网络每分钟最多发布 5 条。

站点所有者可在[留言管理页面](https://ai-classroom-comments.rosannabebe.chatgpt.site/admin)使用独立管理密钥删除留言、暂停新留言或导出记录。管理密钥不得提交到本仓库。

- `index.html`：包含完整对话的静态页面，可离线阅读；共享留言需要通过线上网页联网使用。
- `conversation.md`：可下载的 Markdown 对话原文。
- `conversation.json`：用于生成网页的对话数据。
- `personas.json`：三角色 Persona 的完整结构化数据。
- `personas.md`：可下载的三角色 Persona 文档。
- `personas.css`：与现有网页统一的图谱样式，构建时内嵌到 HTML。
- `template.html`、`styles.css`、`client.js`、`build.mjs`：页面生成源码。
- `comments-config.json`：公开留言接口地址，不得放置任何密钥。

## 更新与构建

使用 Node.js 20 或以上版本：

```sh
npm install
npm run build
```

修改 `conversation.json` 或 `personas.json` 后重新构建，将同步生成 `index.html`、`conversation.md` 和 `personas.md`。图谱已移植为普通 HTML 和原生交互，不依赖 Codex 或 Cursor 的专用运行环境。GitHub Pages 从 `main` 分支根目录发布。页面是静态快照，后续聊天不会自动同步；后续更新也应仅收录 Agent 构建方法相关讨论。
