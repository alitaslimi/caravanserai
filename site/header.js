(function () {
  function currentPage() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  // Walled courtyard with a gate in the south wall and a well at the centre (see favicon.svg).
  function brandMark() {
    return '<svg class="brand-mark" viewBox="0 0 16 16" aria-hidden="true">' +
      '<path fill="currentColor" fill-rule="evenodd" d="M0 0h16v16h-6v-4H6v4H0zM4 4v8h8V4z"/>' +
      '<rect x="7" y="7" width="2" height="2" fill="currentColor"/></svg>';
  }

  function escapeText(value) {
    return String(value).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  }

  function renderFooter() {
    if (typeof BOOK === 'undefined' || document.querySelector('.site-footer')) return;
    var built = new Date(BOOK.generatedAt);
    var lines = BOOK.subtitle.split(/(?<=\.)\s+/);
    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.id = 'colophon';
    footer.innerHTML = [
      '<div class="footer-inner">',
      '<div class="footer-sign">',
      '<a class="brand" href="index.html">' + brandMark() + '<span class="brand-text">' + escapeText(BOOK.title) + '</span></a>',
      '<p class="footer-epigraph">' + lines.map(function (line) { return '<span>' + escapeText(line) + '</span>'; }).join('') + '</p>',
      '</div>',
      '<nav class="footer-nav" aria-label="Footer">',
      '<a href="index.html#curriculum">The route</a><a href="catalog.html">Catalog</a><a href="glossary.html">Glossary</a>',
      BOOK.sourceBaseUrl ? '<a href="' + escapeText(BOOK.sourceBaseUrl) + '">Source</a>' : '',
      '</nav>',
      '<p class="footer-ledger">',
      (typeof PHASES !== 'undefined' ? PHASES.length + ' stops · ' : '') +
      (typeof LESSONS !== 'undefined' ? LESSONS.length + ' chapters · ' : '') +
      (typeof GLOSSARY !== 'undefined' ? GLOSSARY.length + ' terms · ' : '') +
      (isNaN(built) ? '' : 'Built <time datetime="' + escapeText(BOOK.generatedAt) + '">' +
        built.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + '</time>'),
      '</p>',
      '</div>'
    ].join('');
    document.body.appendChild(footer);
  }

  function renderHeader() {
    var mount = document.querySelector('[data-header]');
    if (!mount) return;

    var page = currentPage();
    var links = [
      ['index.html', 'Book'],
      ['catalog.html', 'Catalog'],
      ['glossary.html', 'Glossary']
    ];

    mount.innerHTML = [
      '<div class="header-inner">',
      '<a class="brand" href="index.html" aria-label="Caravanserai home">',
      brandMark(),
      '<span class="brand-text">Caravanserai</span>',
      '</a>',
      '<div class="header-tools">',
      '<nav class="header-nav" aria-label="Primary">',
      links.map(function (link) {
        var active = page === link[0] ? ' aria-current="page"' : '';
        return '<a href="' + link[0] + '"' + active + '>' + link[1] + '</a>';
      }).join(''),
      '</nav>',
      '<button type="button" class="theme-toggle" data-theme-toggle>',
      '<svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>',
      '<svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
      '</button>',
      '</div>',
      '</div>'
    ].join('');
    bindThemeToggle(mount.querySelector('[data-theme-toggle]'));
  }

  // Theme: html[data-theme] overrides the system preference; the choice is per browser.
  var THEME_KEY = 'caravanserai-theme';

  function currentTheme() {
    var chosen = document.documentElement.dataset.theme;
    if (chosen === 'light' || chosen === 'dark') return chosen;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function bindThemeToggle(button) {
    function label() {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      button.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      button.title = 'Switch to ' + next + ' theme';
    }
    label();
    button.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch (err) {}
      label();
    });
    if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', label);
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderHeader();
    renderFooter();
  });
})();
