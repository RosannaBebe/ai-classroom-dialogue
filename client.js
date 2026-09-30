(() => {
  const articles = [...document.querySelectorAll('.chapter')];
  const answers = [...document.querySelectorAll('.answer')];
  const links = [...document.querySelectorAll('.toc a')];
  const search = document.querySelector('#search');
  const status = document.querySelector('#search-status');
  const defaultStatus = status.textContent;
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
    status.textContent = query ? `找到 ${matches} 个相关话题` : defaultStatus;
    document.querySelector('#empty').hidden = matches !== 0;
    updateProgress();
  });
  document.querySelector('#expand').addEventListener('click', () => answers.forEach(d => d.open = true));
  document.querySelector('#collapse').addEventListener('click', () => answers.forEach(d => d.open = false));
  links.forEach(link => link.addEventListener('click', () => {
    document.querySelector(link.getAttribute('href'))?.querySelectorAll('details').forEach(d => d.open = true);
  }));
  document.querySelectorAll('.copy-link').forEach(button => button.addEventListener('click', async () => {
    const url = new URL(location.href); url.hash = button.dataset.id;
    try { await navigator.clipboard.writeText(url.href); toast('话题链接已复制'); }
    catch { location.hash = button.dataset.id; toast('已定位此话题，可复制浏览器地址分享'); }
  }));
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
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
})();
