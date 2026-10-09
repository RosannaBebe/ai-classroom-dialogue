(() => {
  const articles = [...document.querySelectorAll('.chapter')];
  const answers = [...document.querySelectorAll('.answer')];
  const links = [...document.querySelectorAll('.toc a')];
  const search = document.querySelector('#search');
  const status = document.querySelector('#search-status');
  const defaultStatus = status.textContent;
  const personaMaps = [...document.querySelectorAll('.persona-chapter')].map(article => {
    const select = article.querySelector('select');
    const panels = [...article.querySelectorAll('.persona-panel')];
    const selectModule = index => { select.value = String(index); panels.forEach((panel, i) => { panel.hidden = i !== index; }); };
    select.addEventListener('change', () => { selectModule(Number(select.value)); updateProgress(); });
    selectModule(0);
    return { article, select, panels, selectModule };
  });
  const texts = articles.map(a => a.textContent.toLocaleLowerCase());
  let toastTimer;
  function toast(text) {
    const el = document.querySelector('#toast');
    el.textContent = text; el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2400);
  }
  search.addEventListener('input', () => {
    const query = search.value.trim().toLocaleLowerCase();
    let matches = 0;
    articles.forEach((article, i) => {
      const visible = !query || texts[i].includes(query);
      article.hidden = !visible; links[i].hidden = !visible;
      if (visible) { matches++; if (query) article.querySelectorAll('details').forEach(d => d.open = true); }
    });
    personaMaps.forEach(({ select, panels, selectModule }) => {
      const first = panels.findIndex(panel => panel.textContent.toLocaleLowerCase().includes(query));
      if (query && first >= 0) selectModule(first);
      [...select.options].forEach((option, i) => { option.disabled = Boolean(query && first >= 0 && !panels[i].textContent.toLocaleLowerCase().includes(query)); });
    });
    document.querySelector('#personas').hidden = personaMaps.every(({ article }) => article.hidden);
    status.textContent = query ? `找到 ${matches} 个相关内容` : defaultStatus;
    document.querySelector('#empty').hidden = matches !== 0;
    updateProgress();
  });
  document.querySelector('#expand').addEventListener('click', () => answers.forEach(d => d.open = true));
  document.querySelector('#collapse').addEventListener('click', () => answers.forEach(d => d.open = false));
  document.querySelectorAll('.toc a, .persona-shortcuts a, .memory-shortcuts a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    if (search.value) { search.value = ''; search.dispatchEvent(new Event('input')); }
    document.querySelector(link.getAttribute('href'))?.querySelectorAll('details').forEach(d => d.open = true);
  }));
  document.querySelectorAll('.copy-link').forEach(button => button.addEventListener('click', async () => {
    const url = new URL(location.href); url.hash = button.dataset.id;
    try { await navigator.clipboard.writeText(url.href); toast('话题链接已复制'); }
    catch { location.hash = button.dataset.id; toast('已定位此话题，可复制浏览器地址分享'); }
  }));
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !document.querySelector('#comment-drawer')?.open && !event.ctrlKey && !event.metaKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      event.preventDefault(); search.focus();
    }
    if (event.key === 'Escape' && document.activeElement === search) {
      search.value = ''; search.dispatchEvent(new Event('input')); search.blur();
    }
  });
  let printState;
  window.addEventListener('beforeprint', () => { printState = answers.map(d => d.open); answers.forEach(d => d.open = true); });
  window.addEventListener('afterprint', () => { if (printState) answers.forEach((d, i) => d.open = printState[i]); });
  document.querySelector('#print').addEventListener('click', () => window.print());
  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    document.querySelector('.reading-progress').style.width = `${max > 0 ? Math.min(100, scrollY / max * 100) : 0}%`;
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      links.forEach(link => { const active = link.dataset.topic === entry.target.id; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    }
  }, { rootMargin: '-80px 0px -65% 0px', threshold: 0 });
  articles.forEach(article => observer.observe(article));
  updateProgress();

  const drawer = document.querySelector('#comment-drawer');
  const form = document.querySelector('#comment-form');
  const textarea = document.querySelector('#comment-text');
  const submit = document.querySelector('#submit-comment');
  const error = document.querySelector('#comment-error');
  const commentStatus = document.querySelector('#comments-status');
  const list = document.querySelector('#shared-comments');
  const more = document.querySelector('#more-comments');
  const config = JSON.parse(document.querySelector('#comment-config').textContent);
  let cursor = null, loading = false, sending = false, paused = false, pending = null;
  let opener = null;
  const renderedIds = new Set();
  const timeFormat = new Intl.DateTimeFormat('zh-CN', { month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
  async function commentRequest(path = '', options = {}) {
    if (!config.endpoint) throw new Error('留言服务尚未连接，请稍后再试。');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(config.endpoint + path, { ...options, signal: controller.signal, credentials: 'omit' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '暂时无法完成请求，请稍后再试。');
      return data;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('连接超时，你的内容仍在。请重试。');
      if (e instanceof TypeError) throw new Error('网络连接失败，请检查网络后重试。');
      throw e;
    } finally { clearTimeout(timer); }
  }
  function appendComment(comment, prepend = false) {
    if (renderedIds.has(comment.id)) return;
    renderedIds.add(comment.id);
    const item = document.createElement('article'); item.className = 'shared-comment';
    const meta = document.createElement('div'); meta.className = 'shared-comment-meta';
    const label = document.createElement('span'); label.textContent = '匿名留言';
    const time = document.createElement('time'); time.dateTime = comment.created_at;
    const date = new Date(comment.created_at); time.textContent = Number.isNaN(date.getTime()) ? '' : timeFormat.format(date);
    meta.append(label, time);
    const body = document.createElement('p'); body.textContent = comment.content;
    item.append(meta, body);
    prepend ? list.prepend(item) : list.append(item);
  }
  async function loadComments(append = false) {
    if (loading || sending) return;
    loading = true; more.disabled = true; submit.disabled = true; commentStatus.textContent = '正在加载留言…';
    try {
      const data = await commentRequest(append && cursor ? '?before=' + encodeURIComponent(cursor) : '');
      if (!append) { list.replaceChildren(); renderedIds.clear(); }
      data.comments.forEach(c => appendComment(c));
      cursor = data.next_cursor;
      paused = data.paused === true;
      more.hidden = !cursor;
      submit.textContent = paused ? '留言已暂停' : '发布留言';
      commentStatus.textContent = paused ? '新留言暂时关闭，已有留言仍可阅读。' : (renderedIds.size ? '' : '还没有留言。写下第一条想法吧。');
    } catch (e) { commentStatus.textContent = e.message + ' 可点击“刷新”重试。'; }
    finally { loading = false; more.disabled = false; submit.disabled = sending || paused; }
  }
  document.querySelectorAll('[data-open-comments]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    if (!drawer.open) drawer.showModal();
    document.body.classList.add('drawer-open');
    document.querySelector('#close-comments').focus();
    loadComments();
  }));
  function closeComments() { drawer.close(); }
  document.querySelector('#close-comments').addEventListener('click', closeComments);
  drawer.addEventListener('click', event => {
    const rect = drawer.getBoundingClientRect();
    if (event.target === drawer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeComments();
  });
  drawer.addEventListener('close', () => { document.body.classList.remove('drawer-open'); opener?.focus(); });
  textarea.addEventListener('input', () => { document.querySelector('#comment-count').textContent = `${textarea.value.length} / 2000`; error.textContent = ''; });
  textarea.addEventListener('keydown', event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); form.requestSubmit(); } });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const content = textarea.value.trim();
    if (!content) { error.textContent = '写一点内容再发布吧。'; textarea.focus(); return; }
    if (content.length > 2000) { error.textContent = '留言最多 2000 字。'; return; }
    if (!pending || pending.content !== content) pending = { content, request_id: crypto.randomUUID() };
    sending = true; submit.disabled = true; submit.textContent = '正在发布…'; error.textContent = ''; textarea.readOnly = true;
    try {
      const data = await commentRequest('', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(pending) });
      appendComment(data.comment, true);
      pending = null; textarea.value = ''; document.querySelector('#comment-count').textContent = '0 / 2000';
      commentStatus.textContent = ''; toast('留言已发布');
    } catch (e) { error.textContent = e.message; }
    finally { sending = false; submit.disabled = false; submit.textContent = '发布留言'; textarea.readOnly = false; }
  });
  document.querySelector('#refresh-comments').addEventListener('click', () => loadComments());
  more.addEventListener('click', () => loadComments(true));
})();
