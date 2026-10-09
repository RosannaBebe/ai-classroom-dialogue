import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const { marked } = process.env.MARKED_MODULE
  ? await import(pathToFileURL(process.env.MARKED_MODULE).href)
  : await import('marked');
const root = new URL('./', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const data = JSON.parse(read('conversation.json'));
const personas = JSON.parse(read('personas.json'));
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
// Render text and code as text; allow only ordinary web citations as Markdown links.
marked.use({ renderer: {
  html({ text }) { return escape(text); },
  code({ text, lang }) {
    if (lang !== 'mermaid' || !/^flowchart TD\n(?:\s+\w+(?:\[[^\]\n]+\])? --> \w+(?:\[[^\]\n]+\])?\n?)+$/.test(text)) return false;
    const steps = [...text.matchAll(/\w+\[([^\]]+)\]/g)].map(match => match[1]);
    return `<figure class="memory-flow"><figcaption>记忆的形成、使用与更新</figcaption><ol>${steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol><p>生成行为后产生新的课堂事件，流程继续循环。</p></figure>`;
  },
  link({ href, tokens }) {
    const label = this.parser.parseInline(tokens);
    if (!/^https?:\/\//i.test(href)) return label;
    return `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  }
}});
const renderProse = text => marked.parse(text).replaceAll('<table>', '<div class="table-scroll" role="region" aria-label="记忆类型对照表" tabindex="0"><table>').replaceAll('</table>', '</table></div>');
const messageCount = data.chapters.reduce((n, c) => n + c.messages.length, 0);
const nav = data.chapters.map((c, i) => `<a href="#${c.id}" data-topic="${c.id}"><span>${String(i + 1).padStart(2, '0')}</span>${escape(c.title)}</a>`).join('');
const chapters = data.chapters.map((c, i) => `<article class="chapter" id="${c.id}">
  <div class="chapter-heading"><span class="chapter-number">${String(i + 1).padStart(2, '0')}</span><h2>${escape(c.title)}</h2><button class="copy-link" data-id="${c.id}" aria-label="复制话题链接：${escape(c.title)}" title="复制此话题链接">↗</button></div>
  ${c.messages.map(m => m.role === 'user'
    ? `<div class="question"><div class="speaker">用户 · 提问</div><div class="prose">${renderProse(m.text)}</div></div>`
    : `<details class="answer" open><summary><span class="speaker">AI · 回答</span><span class="toggle-hint">展开 / 收起</span></summary><div class="prose">${renderProse(m.text)}</div></details>`).join('')}
</article>`).join('');
const personaNav = personas.roles.map((role, i) => `<a href="#${role.id}" data-topic="${role.id}"><span>P${i + 1}</span>${escape(role.label)} Persona 图谱</a>`).join('');
const personaLinks = personas.roles.map(role => `<a href="#${role.id}">${escape(role.label)} Persona <span aria-hidden="true">↗</span></a>`).join('');
const fieldLabels = { fields:'包含内容', mechanism:'运行机制', example:'可观察例子', updates:'稳定项与变量', boundary:'边界与验收' };
const personaArticles = personas.roles.map((role, index) => `<article class="chapter persona-chapter" id="${role.id}">
  <div class="chapter-heading"><span class="chapter-number">P${index + 1}</span><h2>${escape(role.title)}</h2><button class="copy-link" data-id="${role.id}" aria-label="复制${escape(role.label)} Persona 链接">↗</button></div>
  <p class="persona-definition">${escape(role.definition)}</p>
  <div class="persona-map">
    <div class="persona-picker"><label for="${role.id}-select">查看构建模块</label><select id="${role.id}-select" aria-controls="${role.id}-panels">${role.modules.map((module, i) => `<option value="${i}">${i + 1}．${escape(module.name)}</option>`).join('')}</select><span class="persona-module-count">${role.modules.length} 个模块</span></div>
    <div id="${role.id}-panels" class="persona-panels" aria-live="polite">
      ${role.modules.map((module, i) => `<section class="persona-panel" data-module="${i}" aria-labelledby="${role.id}-heading-${i}">
        <h3 id="${role.id}-heading-${i}">${i + 1}．${escape(module.name)}</h3><p class="persona-question">${escape(module.question)}</p>
        <dl><dt>包含内容</dt><dd>${escape(module.fields)}</dd></dl>
        <h4>构建步骤与机制</h4><ol class="persona-steps">${module.steps.map(([title, detail]) => `<li><strong>${escape(title)}</strong><p>${escape(detail)}</p></li>`).join('')}</ol>
        <dl>${Object.entries(fieldLabels).filter(([key]) => key !== 'fields' && module[key]).map(([key, label]) => `<dt>${label}</dt><dd>${escape(module[key])}</dd>`).join('')}</dl>
      </section>`).join('')}
    </div>
  </div>
</article>`).join('');
const replacements = {
  TITLE: escape(data.title), DATE: escape(data.date), UPDATED: escape(data.updated || data.date), NAV: nav + personaNav, CHAPTERS: chapters,
  PERSONAS: personaArticles, PERSONA_LINKS: personaLinks, PERSONA_DATE: escape(personas.updated), PERSONA_NOTE: escape(personas.note),
  MESSAGE_COUNT: String(messageCount), TOPIC_COUNT: String(data.chapters.length),
  CSS: read('styles.css') + '\n' + read('personas.css'), JS: read('client.js'), SCOPE: escape(data.scope),
  COMMENT_CONFIG: read('comments-config.json').replaceAll('<', '\\u003c')
};
const html = read('template.html').replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => replacements[key] ?? '');
fs.writeFileSync(new URL('index.html', root), html);
const markdown = [`# ${data.title}`, `讨论开始：${data.date}；更新至：${data.updated || data.date}`, data.scope];
for (const chapter of data.chapters) {
  markdown.push(`## ${chapter.title}`);
  for (const message of chapter.messages) {
    markdown.push(`### ${message.role === 'user' ? '用户' : 'AI'}`, message.text);
  }
}
fs.writeFileSync(new URL('conversation.md', root), markdown.join('\n\n').replace(/ {2,}\n/g, '\\\n') + '\n');
const personaMarkdown = ['# 学生、老师与助教 · Persona 结构图谱', `更新日期：${personas.updated}`, personas.note,
  '学生 persona 描述条件明确、相对稳定的行为倾向；知识能力、当前状态和记忆分别建模。老师统筹课堂，助教提供个体支持；角色职责、知识正确性、权限和评价标准由系统规定，persona 描述约束内的行为倾向。年龄、语言、课程体系及学情用于适配，不按国籍预设性格或能力。'];
for (const role of personas.roles) {
  personaMarkdown.push(`## ${role.title}`, role.definition);
  for (const module of role.modules) {
    personaMarkdown.push(`### ${module.name}`, module.question, `**包含内容：**${module.fields}`, '**构建步骤与机制：**', module.steps.map(([title, detail], i) => `${i + 1}. **${title}：**${detail}`).join('\n'));
    for (const [key, label] of Object.entries(fieldLabels)) if (key !== 'fields' && module[key]) personaMarkdown.push(`**${label}：**${module[key]}`);
  }
}
fs.writeFileSync(new URL('personas.md', root), personaMarkdown.join('\n\n') + '\n');
console.log(`Built ${data.chapters.length} topics / ${messageCount} messages / ${personas.roles.length} persona maps / ${Buffer.byteLength(html)} bytes`);
