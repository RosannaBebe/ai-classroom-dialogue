# 三 Agent 课堂 · 设计对话

AI 老师、AI 助教与 AI 学生课堂的产品与研发讨论记录。

公开阅读：[打开对话网页](https://RosannaBebe.github.io/ai-classroom-dialogue/)

## 收录范围

2026-09-30 关于 Agent 课堂构建方法的 18 条用户消息与正式答复，共 9 个话题。仅收录课堂角色、学生 Persona、能力与记忆、状态更新、作答判定、变更追溯和学习规则的讨论。分享、网页生成、部署及页面维护对话不在收录范围内。正文按原始顺序保留，标题与目录为阅读辅助；不包含系统指令、工具日志、内部推理或过程提示。讨论包含提案和后续修正，不能将所有早期建议视为最终方案。

## 文件

网页顶部和底部均提供留言入口，指向[专用留言讨论帖](https://github.com/RosannaBebe/ai-classroom-dialogue/issues/1)。访客登录 GitHub 后可发表评论和回复；评论公开可见，保存在 GitHub Issues 中。

- `index.html`：无需网络依赖的完整静态页面，可直接打开。
- `conversation.md`：可下载的 Markdown 对话原文。
- `conversation.json`：用于生成网页的对话数据。
- `template.html`、`styles.css`、`client.js`、`build.mjs`：页面生成源码。

## 更新与构建

使用 Node.js 20 或以上版本：

```sh
npm install
npm run build
```

修改 `conversation.json` 后重新构建，将同步生成 `index.html` 和 `conversation.md`。GitHub Pages 从 `main` 分支根目录发布。页面是静态快照，后续聊天不会自动同步；后续更新也应仅收录 Agent 构建方法相关讨论。
