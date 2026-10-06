import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const { marked } = process.env.MARKED_MODULE
  ? await import(pathToFileURL(process.env.MARKED_MODULE).href)
  : await import('marked');
const root = new URL('./', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const data = JSON.parse(read('conversation.json'));
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
// Render text and code as text; allow only ordinary web citations as Markdown links.
marked.use({ renderer: {
  html({ text }) { return escape(text); },
  link({ href, tokens }) {
    const label = this.parser.parseInline(tokens);
    if (!/^https?:\/\//i.test(href)) return label;
    return `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  }
}});
const messageCount = data.chapters.reduce((n, c) => n + c.messages.length, 0);
const nav = data.chapters.map((c, i) => `<a href="#${c.id}" data-topic="${c.id}"><span>${String(i + 1).padStart(2, '0')}</span>${escape(c.title)}</a>`).join('');
const chapters = data.chapters.map((c, i) => `<article class="chapter" id="${c.id}">
  <div class="chapter-heading"><span class="chapter-number">${String(i + 1).padStart(2, '0')}</span><h2>${escape(c.title)}</h2><button class="copy-link" data-id="${c.id}" aria-label="复制话题链接：${escape(c.title)}" title="复制此话题链接">↗</button></div>
  ${c.messages.map(m => m.role === 'user'
    ? `<div class="question"><div class="speaker">用户 · 提问</div><div class="prose">${marked.parse(m.text)}</div></div>`
    : `<details class="answer" open><summary><span class="speaker">AI · 回答</span><span class="toggle-hint">展开 / 收起</span></summary><div class="prose">${marked.parse(m.text)}</div></details>`).join('')}
</article>`).join('');
const replacements = {
  TITLE: escape(data.title), DATE: escape(data.date), NAV: nav, CHAPTERS: chapters,
  MESSAGE_COUNT: String(messageCount), TOPIC_COUNT: String(data.chapters.length),
  CSS: read('styles.css'), JS: read('client.js'), SCOPE: escape(data.scope),
  COMMENT_CONFIG: read('comments-config.json').replaceAll('<', '\\u003c')
};
const html = read('template.html').replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => replacements[key] ?? '');
fs.writeFileSync(new URL('index.html', root), html);
const markdown = [`# ${data.title}`, `日期：${data.date}`, data.scope];
for (const chapter of data.chapters) {
  markdown.push(`## ${chapter.title}`);
  for (const message of chapter.messages) {
    markdown.push(`### ${message.role === 'user' ? '用户' : 'AI'}`, message.text);
  }
}
fs.writeFileSync(new URL('conversation.md', root), markdown.join('\n\n') + '\n');
console.log(`Built ${data.chapters.length} topics / ${messageCount} messages / ${Buffer.byteLength(html)} bytes`);
