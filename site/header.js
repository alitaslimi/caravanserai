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
      '<nav class="header-nav" aria-label="Primary">',
      links.map(function (link) {
        var active = page === link[0] ? ' aria-current="page"' : '';
        return '<a href="' + link[0] + '"' + active + '>' + link[1] + '</a>';
      }).join(''),
      '</nav>',
      '</div>'
    ].join('');
  }

  document.addEventListener('DOMContentLoaded', renderHeader);
})();
