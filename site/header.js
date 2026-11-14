(function () {
  function currentPage() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  // Walled courtyard with a gate in the south wall and a well at the centre (see favicon.svg).
  function brandMark() {
    return '<svg class="brand-mark" viewBox="0 0 16 16" aria-hidden="true">' +
      '<path fill="currentColor" fill-rule="evenodd" d="M0 0h16v16h-6v-4H6v4H0zM4 4v8h8V4z"/>' +
      '<rect class="brand-well" x="6" y="6" width="4" height="4"/></svg>';
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
      themeMenu(),
      '</div>',
      '</div>'
    ].join('');
    bindThemeMenu(mount.querySelector('[data-theme-menu]'));
  }

  // Reader themes, e-reader style. html[data-theme] holds an explicit choice (saved per
  // browser); with none, the system's light/dark preference picks White or Dim.
  var THEME_KEY = 'caravanserai-theme';
  var THEMES = [
    ['white', 'White', '#ffffff', '#111a16'],
    ['paper', 'Paper', '#f6efdf', '#2a2317'],
    ['dim', 'Dim', '#15202b', '#e7ecf0'],
    ['black', 'Black', '#000000', '#ededed']
  ];

  function themeMenu() {
    return '<div class="theme-menu" data-theme-menu>' +
      '<button type="button" class="theme-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="theme-options" title="Reading theme">' +
      '<span aria-hidden="true">Aa</span><span class="visually-hidden">Reading theme</span></button>' +
      '<div class="theme-options" id="theme-options" role="menu" hidden>' +
      '<p>Reading theme</p>' +
      THEMES.map(function (theme) {
        return '<button type="button" class="theme-option" role="menuitemradio" aria-checked="false" data-theme-value="' + theme[0] + '">' +
          '<span class="theme-swatch" style="background:' + theme[2] + ';color:' + theme[3] + '" aria-hidden="true">Aa</span>' +
          '<span>' + theme[1] + '</span></button>';
      }).join('') +
      '<button type="button" class="theme-option theme-option-system" role="menuitemradio" aria-checked="false" data-theme-value="">' +
      '<span class="theme-swatch" style="background:linear-gradient(135deg,#ffffff 50%,#15202b 50%)" aria-hidden="true"></span>' +
      '<span>Match system</span></button>' +
      '</div></div>';
  }

  function bindThemeMenu(menu) {
    var button = menu.querySelector('.theme-toggle');
    var list = menu.querySelector('.theme-options');
    var options = Array.prototype.slice.call(list.querySelectorAll('[data-theme-value]'));

    function sync() {
      var chosen = document.documentElement.dataset.theme || '';
      options.forEach(function (option) {
        option.setAttribute('aria-checked', String(option.dataset.themeValue === chosen));
      });
    }
    function setOpen(open) {
      list.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      if (open) (list.querySelector('[aria-checked="true"]') || options[0]).focus();
    }

    sync();
    button.addEventListener('click', function () { setOpen(list.hidden); });
    options.forEach(function (option) {
      option.addEventListener('click', function () {
        var value = option.dataset.themeValue;
        if (value) document.documentElement.dataset.theme = value;
        else delete document.documentElement.dataset.theme;
        try {
          if (value) localStorage.setItem(THEME_KEY, value);
          else localStorage.removeItem(THEME_KEY);
        } catch (err) {}
        sync();
        setOpen(false);
        button.focus();
      });
    });
    list.addEventListener('keydown', function (event) {
      var index = options.indexOf(document.activeElement);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        options[(index + (event.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length].focus();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !list.hidden) { setOpen(false); button.focus(); }
    });
    document.addEventListener('click', function (event) {
      if (!list.hidden && !menu.contains(event.target)) setOpen(false);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderHeader();
    renderFooter();
  });
})();
