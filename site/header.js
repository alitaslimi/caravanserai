(function () {
  function currentPage() {
    return location.pathname.split('/').pop() || 'index.html';
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
      '<span class="brand-mark" aria-hidden="true"></span>',
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

  document.addEventListener('DOMContentLoaded', renderHeader);
})();
