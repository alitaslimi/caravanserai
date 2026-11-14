(function () {
  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.dataset.page === 'home') renderHome();
    if (document.body.dataset.page === 'catalog') renderCatalog();
    if (document.body.dataset.page === 'lesson') renderLesson();
    if (document.body.dataset.page === 'glossary') renderGlossary();
  });

  function lessonUrl(lesson) {
    return 'lesson.html?id=' + encodeURIComponent(lesson.id);
  }

  function phaseLessons(number) {
    return LESSONS.filter(function (lesson) { return lesson.phaseNumber === number; });
  }

  function lessonCode(lesson) {
    return pad(lesson.phaseNumber) + '.' + pad(lesson.lessonNumber);
  }

  // Sidebar contents: one collapsible group per stop, current stop open.
  // On narrow screens the whole list sits behind a toggle (see .docs-nav-toggle).
  function renderDocsNav(current) {
    var nav = document.querySelector('[data-docs-nav]');
    var wasOpen = nav.classList.contains('is-open');
    var currentPhase = current ? PHASES.find(function (phase) { return phase.number === current.phaseNumber; }) : null;
    var groups = PHASES.map(function (phase) {
      var chapters = phaseLessons(phase.number);
      if (!chapters.length) {
        return '<li class="nav-stop" data-planned><span class="nav-stop-head"><span class="nav-stop-number">' + pad(phase.number) +
          '</span><span class="nav-stop-title">' + escapeHtml(phase.title) + '</span><span class="nav-stop-count">Planned</span></span></li>';
      }
      var read = chapters.filter(function (lesson) { return BookProgress.isComplete(lesson.id); }).length;
      var isCurrent = currentPhase && currentPhase.number === phase.number;
      return '<li class="nav-stop"><details' + (isCurrent ? ' open' : '') + '>' +
        '<summary class="nav-stop-head"><span class="nav-stop-number">' + pad(phase.number) + '</span>' +
        '<span class="nav-stop-title">' + escapeHtml(phase.title) + '</span>' +
        '<span class="nav-stop-count">' + read + '/' + chapters.length + '</span></summary>' +
        '<ul>' + chapters.map(function (lesson) {
          var complete = BookProgress.isComplete(lesson.id);
          return '<li><a href="' + lessonUrl(lesson) + '"' +
            (current && current.id === lesson.id ? ' aria-current="page"' : '') +
            (complete ? ' data-complete' : '') + '>' +
            '<span class="nav-lesson-mark" aria-hidden="true"></span>' +
            '<span>' + escapeHtml(lesson.title) + (complete ? '<span class="visually-hidden"> (read)</span>' : '') + '</span></a></li>';
        }).join('') + '</ul></details></li>';
    }).join('');
    var label = current ? 'Stop ' + pad(current.phaseNumber) + ' · ' + escapeHtml(current.phase) : 'Contents';
    nav.innerHTML =
      '<button type="button" class="docs-nav-toggle" aria-expanded="' + wasOpen + '" aria-controls="docs-nav-list">' +
      '<span class="docs-nav-toggle-label"><span class="eyebrow">Contents</span><span>' + label + '</span></span>' +
      '<span class="stop-toggle" aria-hidden="true"></span></button>' +
      '<div class="docs-nav-list" id="docs-nav-list">' +
      '<a class="docs-nav-back" href="index.html#curriculum"><span aria-hidden="true">&larr;</span> The route</a>' +
      '<ol class="nav-stops">' + groups + '</ol></div>';
    nav.querySelector('.docs-nav-toggle').addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      this.setAttribute('aria-expanded', String(open));
    });
    var active = nav.querySelector('[aria-current="page"]');
    if (active && nav.scrollHeight > nav.clientHeight) {
      nav.scrollTop += active.getBoundingClientRect().top - nav.getBoundingClientRect().top - nav.clientHeight / 3;
    }
  }

  function minutes(lesson) {
    var match = String(lesson.time || '').match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function formatDuration(total) {
    if (total < 60) return total + ' min';
    var hours = Math.floor(total / 60);
    var rest = total % 60;
    return hours + ' h' + (rest ? ' ' + rest + ' min' : '');
  }

  function renderHome() {
    var start = document.querySelector('[data-start-reading]');
    var done = LESSONS.filter(function (lesson) { return BookProgress.isComplete(lesson.id); });
    var next = LESSONS.find(function (lesson) { return !BookProgress.isComplete(lesson.id); });
    var target = next || LESSONS[0];
    if (!target) start.hidden = true;
    else {
      start.href = lessonUrl(target);
      start.innerHTML = (!done.length ? 'Start reading' : next ? 'Continue: ' + escapeHtml(next.title) : 'Read again') +
        ' <span aria-hidden="true">&rarr;</span>';
    }

    var openStops = PHASES.filter(function (phase) { return phase.lessons.length; }).length;
    var totalTime = LESSONS.reduce(function (sum, lesson) { return sum + minutes(lesson); }, 0);
    document.querySelector('[data-route-summary]').textContent = [
      PHASES.length + ' stops',
      LESSONS.length + ' chapters',
      'about ' + Math.round(totalTime / 60) + ' hours of reading',
      done.length ? done.length + ' of ' + LESSONS.length + ' read' : ''
    ].filter(Boolean).join(' · ');
    document.querySelector('[data-book-count]').textContent = openStops + ' of ' + PHASES.length + ' stops open';

    var hashPhase = PHASES.find(function (phase) { return '#' + phase.slug === location.hash; });
    var currentPhase = hashPhase ? hashPhase.number : target ? target.phaseNumber : null;
    document.querySelector('[data-route]').innerHTML = PHASES.map(function (phase) {
      return routeStop(phase, phase.number === currentPhase);
    }).join('');

    // Hero strip: the whole road at a glance; each node jumps to (and opens) its stop.
    document.querySelector('[data-route-strip]').innerHTML = '<ol>' + PHASES.map(function (phase) {
      var state = stopState(phase);
      return '<li data-state="' + state + '"' + (phase.number === (target && target.phaseNumber) && next ? ' data-here' : '') + '>' +
        '<a href="#' + escapeAttr(phase.slug) + '" title="Stop ' + pad(phase.number) + ' · ' + escapeAttr(phase.title) + '">' +
        '<span class="strip-node" aria-hidden="true"></span>' +
        '<span class="strip-number">' + pad(phase.number) + '</span>' +
        '<span class="visually-hidden">' + escapeHtml(phase.title) + ', ' + STATE_LABELS[state] + '</span></a></li>';
    }).join('') + '</ol>';

    window.addEventListener('hashchange', openHashedStop);
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }

  function openHashedStop() {
    var stop = location.hash && document.getElementById(location.hash.slice(1));
    if (stop && stop.tagName === 'DETAILS') stop.open = true;
  }

  var STATE_LABELS = { planned: 'Planned', done: 'Completed', active: 'In progress', todo: 'Not started' };

  function stopState(phase) {
    var chapters = phaseLessons(phase.number);
    var read = chapters.filter(function (lesson) { return BookProgress.isComplete(lesson.id); }).length;
    return !chapters.length ? 'planned' : read === chapters.length ? 'done' : read ? 'active' : 'todo';
  }

  function routeStop(phase, open) {
    var chapters = LESSONS.filter(function (lesson) { return lesson.phaseNumber === phase.number; });
    var read = chapters.filter(function (lesson) { return BookProgress.isComplete(lesson.id); }).length;
    var state = stopState(phase);
    var stateLabel = STATE_LABELS[state];
    var meta = chapters.length
      ? chapters.length + (chapters.length === 1 ? ' chapter' : ' chapters') + ' · ' +
        formatDuration(chapters.reduce(function (sum, lesson) { return sum + minutes(lesson); }, 0))
      : phase.topics.length + ' topics planned';
    var body = chapters.length
      ? '<ol class="stop-lessons">' + chapters.map(function (lesson) {
          var complete = BookProgress.isComplete(lesson.id);
          return '<li><a href="' + lessonUrl(lesson) + '"' + (complete ? ' data-complete' : '') + '>' +
            '<span class="stop-lesson-number">' + pad(lesson.phaseNumber) + '.' + pad(lesson.lessonNumber) + '</span>' +
            '<span class="stop-lesson-title">' + escapeHtml(lesson.title) + '</span>' +
            '<span class="stop-lesson-meta">' + (complete ? '<span aria-hidden="true">&check;</span> Read' : escapeHtml(lesson.time || lesson.type)) + '</span>' +
            '</a></li>';
        }).join('') + '</ol>'
      : '<ul class="stop-topics">' + phase.topics.map(function (topic) {
          return '<li>' + escapeHtml(topic) + '</li>';
        }).join('') + '</ul>';
    return '<li class="stop" data-state="' + state + '">' +
      '<details id="' + escapeAttr(phase.slug) + '"' + (open ? ' open' : '') + '>' +
      '<summary class="stop-head">' +
      '<span class="stop-node" aria-hidden="true"></span>' +
      '<span class="stop-label">Stop ' + pad(phase.number) + '<span class="visually-hidden">, ' + stateLabel + '</span></span>' +
      '<span class="stop-title"><strong>' + escapeHtml(phase.title) + '</strong><small>' + escapeHtml(phase.summary) + '</small></span>' +
      '<span class="stop-meta">' + meta +
      (chapters.length ? '<span class="stop-progress" aria-label="' + read + ' of ' + chapters.length + ' read">' +
        '<span style="width:' + Math.round(read / chapters.length * 100) + '%"></span></span>' : '<span class="stop-tag">Planned</span>') +
      '</span>' +
      '<span class="stop-toggle" aria-hidden="true"></span>' +
      '</summary>' + body + '</details></li>';
  }

  function renderCatalog() {
    var params = new URLSearchParams(location.search);
    var search = document.querySelector('[data-filter-search]');
    var controls = document.querySelector('[data-catalog-filters]');
    var reset = document.querySelector('[data-reset-filters]');
    var target = document.querySelector('[data-catalog-results]');
    var count = document.querySelector('[data-catalog-count]');
    // [url key, label, values of a lesson, fixed options]
    var facets = [
      ['phase', 'Stop', function (l) { return [String(l.phaseNumber)]; }, PHASES.map(function (phase) {
        return [String(phase.number), pad(phase.number) + ' · ' + phase.title];
      })],
      ['type', 'Type', function (l) { return [l.type]; }],
      ['tool', 'Tool', function (l) { return l.tools; }],
      ['chain', 'Chain', function (l) { return l.chains; }],
      ['protocol', 'Protocol', function (l) { return l.protocols; }],
      ['status', 'Status', function (l) { return [l.status]; }],
      ['progress', 'Progress', function (l) { return [BookProgress.isComplete(l.id) ? 'read' : 'unread']; }, [['unread', 'Unread'], ['read', 'Read']]]
    ];
    var selected = Object.create(null);
    search.value = params.get('q') || '';

    var groups = facets.flatMap(function (facet) {
      var options = facet[3] || unique(LESSONS.flatMap(facet[2])).sort().map(function (value) { return [value, value]; });
      var initial = params.get(facet[0]);
      if (options.some(function (option) { return option[0] === initial; })) selected[facet[0]] = initial;
      var useful = facet[0] === 'progress' || options.length > 1 || (options.length === 1 && LESSONS.some(function (lesson) {
        return !facet[2](lesson).includes(options[0][0]);
      }));
      return useful || selected[facet[0]] ? [{ key: facet[0], label: facet[1], options: options }] : [];
    });
    controls.innerHTML = groups.map(function (group) {
      return '<label class="filter-select"><span>' + escapeHtml(group.label) + '</span>' +
        '<select data-facet="' + escapeAttr(group.key) + '"><option value="">All</option>' +
        group.options.map(function (option) {
          return '<option value="' + escapeAttr(option[0]) + '"' + (selected[group.key] === option[0] ? ' selected' : '') + '>' +
            escapeHtml(option[1]) + '</option>';
        }).join('') + '</select></label>';
    }).join('');

    controls.addEventListener('change', function (event) {
      var select = event.target.closest('[data-facet]');
      if (!select) return;
      selected[select.dataset.facet] = select.value;
      draw();
    });
    search.addEventListener('input', draw);
    reset.addEventListener('click', function () {
      selected = Object.create(null);
      controls.querySelectorAll('select').forEach(function (select) { select.value = ''; });
      search.value = '';
      search.focus();
      draw();
    });
    target.addEventListener('change', function (event) {
      var box = event.target.closest('[data-read-toggle]');
      if (!box) return;
      BookProgress.toggleComplete(box.dataset.readToggle);
      draw();
      var again = target.querySelector('[data-read-toggle="' + CSS.escape(box.dataset.readToggle) + '"]');
      if (again) again.focus();
    });
    draw();

    function draw() {
      var query = search.value.trim().toLowerCase();
      var words = query.split(/\s+/).filter(Boolean);
      var rows = LESSONS.filter(function (lesson) {
        var haystack = [lesson.title, lesson.phase, lesson.body, lesson.datasets.join(' ')]
          .concat(facets.slice(0, -1).flatMap(function (facet) { return facet[2](lesson); })).join(' ').toLowerCase();
        return words.every(function (word) { return haystack.includes(word); }) && facets.every(function (facet) {
          return !selected[facet[0]] || facet[2](lesson).includes(selected[facet[0]]);
        });
      });
      var active = Object.keys(selected).filter(function (key) { return selected[key]; });
      var url = new URL(location.href);
      facets.forEach(function (facet) { url.searchParams.delete(facet[0]); });
      url.searchParams.delete('q');
      if (search.value.trim()) url.searchParams.set('q', search.value.trim());
      active.forEach(function (key) { url.searchParams.set(key, selected[key]); });
      history.replaceState(null, '', url);
      reset.hidden = !query && !active.length;
      var read = LESSONS.filter(function (lesson) { return BookProgress.isComplete(lesson.id); }).length;
      count.textContent = (rows.length === LESSONS.length ? 'All ' : 'Showing ' + rows.length + ' of ') +
        LESSONS.length + ' chapters · ' + read + ' read';

      // Planned stops appear when nothing narrows the list except, possibly, the stop itself.
      var showPlanned = !query && active.every(function (key) { return key === 'phase'; });
      var body = PHASES.map(function (phase) {
        var chapters = rows.filter(function (lesson) { return lesson.phaseNumber === phase.number; });
        var all = phaseLessons(phase.number);
        var planned = showPlanned && !all.length && (!selected.phase || selected.phase === String(phase.number));
        if (!chapters.length && !planned) return '';
        var head = '<tr class="catalog-stop"><th colspan="5" scope="rowgroup"><a href="index.html#' + escapeAttr(phase.slug) + '">' +
          '<span class="catalog-stop-number">Stop ' + pad(phase.number) + '</span>' +
          '<span class="catalog-stop-title">' + escapeHtml(phase.title) + '</span></a>' +
          '<span class="catalog-stop-meta">' + (all.length
            ? all.length + (all.length === 1 ? ' chapter' : ' chapters') + ' · ' +
              all.filter(function (lesson) { return BookProgress.isComplete(lesson.id); }).length + ' read'
            : 'Planned') + '</span></th></tr>';
        if (!all.length) {
          return '<tbody>' + head + phase.topics.map(function (topic) {
            return '<tr class="catalog-planned"><td class="catalog-done"></td><td class="catalog-number">&mdash;</td>' +
              '<td class="catalog-title" colspan="3">' + escapeHtml(topic) + '</td></tr>';
          }).join('') + '</tbody>';
        }
        return '<tbody>' + head + chapters.map(catalogRow).join('') + '</tbody>';
      }).join('');

      if (body) {
        target.innerHTML = '<table class="catalog-table"><thead><tr>' +
          '<th scope="col" class="catalog-done">Read</th><th scope="col">No.</th><th scope="col">Chapter</th>' +
          '<th scope="col">Type</th><th scope="col" class="catalog-time">Time</th></tr></thead>' + body + '</table>';
      } else target.innerHTML = '<p class="empty">No chapters match your search and filters.</p>';
    }
  }

  function catalogRow(lesson) {
    var done = BookProgress.isComplete(lesson.id);
    var tags = [].concat(lesson.tools, lesson.chains, lesson.protocols).filter(Boolean);
    return '<tr class="catalog-row"' + (done ? ' data-complete' : '') + '>' +
      '<td class="catalog-done"><input type="checkbox" data-read-toggle="' + escapeAttr(lesson.id) + '"' + (done ? ' checked' : '') +
      ' aria-label="Mark ' + escapeAttr(lesson.title) + ' as read"></td>' +
      '<td class="catalog-number">' + lessonCode(lesson) + '</td>' +
      '<td class="catalog-title"><a href="' + lessonUrl(lesson) + '">' + escapeHtml(lesson.title) + '</a>' +
      (tags.length ? '<span class="catalog-tags">' + tags.map(escapeHtml).join(' · ') + '</span>' : '') + '</td>' +
      '<td class="catalog-type">' + escapeHtml(lesson.type) + '</td>' +
      '<td class="catalog-time">' + escapeHtml((lesson.time || '').replace(' minutes', ' min')) + '</td></tr>';
  }

  function renderLesson() {
    var params = new URLSearchParams(location.search);
    var id = params.get('id') || params.get('path') || (LESSONS[0] && LESSONS[0].id);
    var lesson = LESSONS.find(function (item) {
      return item.id === id || item.path === id || item.lessonSlug === id;
    });
    var mount = document.querySelector('[data-lesson]');
    if (!mount) return;
    renderDocsNav(lesson);
    if (!lesson) {
      mount.innerHTML = '<section class="panel"><h1>Lesson Not Found</h1><p><a href="catalog.html">Open the catalog</a> and choose an available lesson.</p></section>';
      return;
    }

    document.title = lesson.title + ' - ' + BOOK.title;
    mount.innerHTML = [
      '<article class="reader">',
      '<header class="lesson-head">',
      '<p class="docs-breadcrumb"><a href="index.html#' + escapeAttr(lesson.phaseSlug) + '">Stop ' + pad(lesson.phaseNumber) + ' · ' + escapeHtml(lesson.phase) + '</a></p>',
      '<h1>' + escapeHtml(lesson.title) + '</h1>',
      '<div class="lesson-band">',
      '<dl class="lesson-facts">',
      fact('Chapter', lessonCode(lesson)),
      fact('Type', lesson.type),
      lesson.time ? fact('Reading', lesson.time) : '',
      lesson.status && lesson.status !== 'complete' ? fact('Status', lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)) : '',
      '</dl>',
      '<div class="lesson-progress" data-lesson-progress>' + stopProgressHtml(lesson) + '</div>',
      '</div>',
      metaHtml(lesson),
      '</header>',
      '<div class="markdown-body">' + markdownToHtml(lesson.body.replace(/^# [^\r\n]+\r?\n+/, '')) + '</div>',
      quizHtml(lesson),
      '<div class="reader-actions">',
      '<span data-completion-mount></span>',
      (lesson.links.code ? '<a href="' + escapeAttr(lesson.links.code) + '">Code</a>' : ''),
      (lesson.links.outputs ? '<a href="' + escapeAttr(lesson.links.outputs) + '">Outputs</a>' : ''),
      (lesson.links.docs ? '<a href="' + escapeAttr(lesson.links.docs) + '">Source</a>' : ''),
      '</div>',
      '</article>',
      lessonNav(lesson)
    ].join('');

    renderPageNav(mount);
    BookUI.completion(mount.querySelector('[data-completion-mount]'), BookProgress.isComplete(lesson.id));
    var toggle = document.querySelector('[data-complete-toggle]');
    if (toggle) {
      toggle.addEventListener('click', function () {
        BookProgress.toggleComplete(lesson.id);
        var complete = BookProgress.isComplete(lesson.id);
        toggle.setAttribute('aria-pressed', String(complete));
        toggle.querySelector('span').textContent = complete ? 'Mark incomplete' : 'Mark complete';
        mount.querySelector('[data-lesson-progress]').innerHTML = stopProgressHtml(lesson);
        renderDocsNav(lesson);
      });
    }
    bindQuiz(lesson);
  }

  function renderPageNav(mount) {
    var nav = document.querySelector('[data-page-nav]');
    var headings = Array.from(mount.querySelectorAll('.markdown-body h2, .quiz h2'));
    var used = new Set();
    nav.innerHTML = '<p class="eyebrow">On this page</p><ul>' + headings.map(function (heading) {
      var base = heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
      var id = base;
      for (var suffix = 2; used.has(id); suffix++) id = base + '-' + suffix;
      used.add(id);
      heading.id = id;
      return '<li><a href="#' + id + '">' + escapeHtml(heading.textContent) + '</a></li>';
    }).join('') + '</ul>';
    nav.hidden = !headings.length;
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }

  // Lessons whose prose mentions a term (whole words, case-insensitive, optional plural).
  function lessonsUsing(term) {
    var pattern = new RegExp('(^|[^a-z0-9])' + term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+') + 's?(?![a-z0-9])', 'i');
    return LESSONS.filter(function (lesson) { return pattern.test(lesson.body); });
  }

  function renderGlossary() {
    var search = document.querySelector('[data-glossary-search]');
    var target = document.querySelector('[data-glossary-list]');
    var jump = document.querySelector('[data-glossary-jump]');
    var count = document.querySelector('[data-glossary-count]');
    if (!target) return;
    var terms = GLOSSARY.map(function (item) {
      return { item: item, letter: item.term.charAt(0).toUpperCase(), used: lessonsUsing(item.term) };
    }).sort(function (a, b) { return a.item.term.localeCompare(b.item.term, undefined, { sensitivity: 'base' }); });
    var USED_LIMIT = 4;
    if (search) search.addEventListener('input', draw);
    target.addEventListener('click', function (event) {
      var more = event.target.closest('[data-term-more]');
      if (!more) return;
      var expanded = more.parentNode.classList.toggle('is-expanded');
      more.setAttribute('aria-expanded', String(expanded));
      more.textContent = expanded ? 'Show fewer' : '+' + more.parentNode.querySelectorAll('[data-extra]').length + ' more';
    });
    draw();
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();

    function draw() {
      var q = (search && search.value || '').toLowerCase().trim();
      var rows = terms.filter(function (entry) {
        return !q || entry.item.term.toLowerCase().indexOf(q) !== -1 || entry.item.definition.toLowerCase().indexOf(q) !== -1;
      });
      var letters = unique(rows.map(function (entry) { return entry.letter; }));
      if (count) count.textContent = (rows.length === terms.length ? terms.length : rows.length + ' of ' + terms.length) + ' terms';
      if (jump) {
        jump.innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(function (letter) {
          return letters.indexOf(letter) !== -1
            ? '<a href="#letter-' + letter + '">' + letter + '</a>'
            : '<span aria-hidden="true">' + letter + '</span>';
        }).join('');
      }
      target.innerHTML = letters.map(function (letter) {
        return '<section class="glossary-letter" id="letter-' + letter + '" aria-labelledby="letter-' + letter + '-title">' +
          '<h2 class="glossary-letter-title" id="letter-' + letter + '-title">' + letter + '</h2><div>' +
          rows.filter(function (entry) { return entry.letter === letter; }).map(termHtml).join('') +
          '</div></section>';
      }).join('') || '<p class="empty">No terms match your search.</p>';
    }

    function termHtml(entry) {
      var item = entry.item;
      return '<article class="term" id="' + escapeAttr(item.slug) + '">' +
        '<h3><a class="term-anchor" href="#' + escapeAttr(item.slug) + '">' + escapeHtml(item.term) +
        '<span aria-hidden="true">#</span></a></h3>' +
        '<div class="markdown-body">' + markdownToHtml(item.definition) + '</div>' +
        (entry.used.length
          ? '<p class="term-used"><span>Appears in</span>' + entry.used.map(function (lesson, index) {
              return '<a href="' + lessonUrl(lesson) + '"' + (index >= USED_LIMIT ? ' data-extra' : '') + '>' +
                '<span class="term-used-code">' + lessonCode(lesson) + '</span> ' + escapeHtml(lesson.title) + '</a>';
            }).join('') +
            (entry.used.length > USED_LIMIT
              ? '<button type="button" class="term-more" data-term-more aria-expanded="false">+' + (entry.used.length - USED_LIMIT) + ' more</button>'
              : '') + '</p>'
          : '') +
        '</article>';
    }
  }

  function fact(label, value) {
    return '<div><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + '</dd></div>';
  }

  // One segment per chapter in this stop: filled = read, outlined = current.
  function stopProgressHtml(lesson) {
    var chapters = phaseLessons(lesson.phaseNumber);
    var index = chapters.findIndex(function (item) { return item.id === lesson.id; });
    var read = chapters.filter(function (item) { return BookProgress.isComplete(item.id); }).length;
    return '<p class="lesson-progress-label">Chapter ' + (index + 1) + ' of ' + chapters.length + ' in this stop · ' + read + ' read</p>' +
      '<ol class="lesson-segments" aria-hidden="true">' + chapters.map(function (item) {
        return '<li' + (BookProgress.isComplete(item.id) ? ' data-complete' : '') + (item.id === lesson.id ? ' data-current' : '') + '></li>';
      }).join('') + '</ol>';
  }

  function metaHtml(lesson) {
    var values = [].concat(lesson.tools, lesson.chains, lesson.protocols, lesson.datasets).filter(Boolean);
    if (!values.length) return '';
    return '<ul class="meta-grid" aria-label="Tools and data">' + values.map(function (value) {
      return '<li>' + escapeHtml(value) + '</li>';
    }).join('') + '</ul>';
  }

  function quizHtml(lesson) {
    if (!lesson.quiz || !lesson.quiz.length) return '';
    return '<section class="quiz panel"><h2>Quiz</h2>' + lesson.quiz.map(function (q, qi) {
      return '<div class="quiz-question" data-quiz-question="' + qi + '">' +
        '<p><strong>' + escapeHtml(q.question) + '</strong></p>' +
        q.options.map(function (opt, oi) {
          return '<button type="button" data-quiz-option="' + oi + '">' + escapeHtml(opt) + '</button>';
        }).join('') +
        '<p class="quiz-explanation">' + escapeHtml(q.explanation || '') + '</p>' +
        '</div>';
    }).join('') + '</section>';
  }

  function bindQuiz(lesson) {
    var saved = BookProgress.getQuiz(lesson.id);
    document.querySelectorAll('[data-quiz-question]').forEach(function (questionEl) {
      var qi = questionEl.getAttribute('data-quiz-question');
      var q = lesson.quiz[Number(qi)];
      questionEl.querySelectorAll('[data-quiz-option]').forEach(function (button) {
        var selected = saved[qi] === Number(button.getAttribute('data-quiz-option'));
        if (selected) markQuiz(questionEl, q, saved[qi]);
        button.addEventListener('click', function () {
          saved[qi] = Number(button.getAttribute('data-quiz-option'));
          BookProgress.saveQuiz(lesson.id, saved);
          markQuiz(questionEl, q, saved[qi]);
        });
      });
    });
  }

  function markQuiz(questionEl, q, selected) {
    questionEl.querySelectorAll('[data-quiz-option]').forEach(function (button) {
      var oi = Number(button.getAttribute('data-quiz-option'));
      button.classList.toggle('correct', oi === q.answer);
      button.classList.toggle('incorrect', oi === selected && selected !== q.answer);
    });
    var explanation = questionEl.querySelector('.quiz-explanation');
    if (explanation) explanation.classList.add('visible');
  }

  function lessonNav(lesson) {
    var idx = LESSONS.findIndex(function (item) { return item.id === lesson.id; });
    var prev = LESSONS[idx - 1];
    var next = LESSONS[idx + 1];
    function card(item, direction) {
      if (!item) return '<span></span>';
      return '<a class="lesson-nav-' + direction + '" href="' + lessonUrl(item) + '" rel="' + direction + '">' +
        '<span class="eyebrow">' + (direction === 'prev' ? '&larr; Previous' : 'Next &rarr;') + ' · ' + lessonCode(item) + '</span>' +
        '<strong>' + escapeHtml(item.title) + '</strong>' +
        (item.phaseNumber !== lesson.phaseNumber ? '<small>Stop ' + pad(item.phaseNumber) + ' · ' + escapeHtml(item.phase) + '</small>' : '') +
        '</a>';
    }
    return '<nav class="lesson-nav" aria-label="Chapter">' + card(prev, 'prev') + card(next, 'next') + '</nav>';
  }

  function markdownToHtml(markdown) {
    var html = [];
    var lines = markdown.split(/\r?\n/);
    var inCode = false;
    var code = [];
    var codeLang = '';
    var list = null;
    var table = null;

    function closeList() {
      if (list) {
        html.push('</' + list + '>');
        list = null;
      }
    }

    function closeTable() {
      if (table) {
        html.push('</tbody></table>');
        table = null;
      }
    }

    lines.forEach(function (line) {
      var fence = line.match(/^```(\w+)?/);
      if (fence) {
        if (inCode) {
          html.push(renderCodeBlock(codeLang, code.join('\n')));
          code = [];
          codeLang = '';
          inCode = false;
        } else {
          closeList();
          closeTable();
          inCode = true;
          codeLang = fence[1] || '';
        }
        return;
      }
      if (inCode) {
        code.push(line);
        return;
      }
      if (!line.trim()) {
        closeList();
        closeTable();
        return;
      }
      var heading = line.match(/^(#{1,3})\s+(.+)/);
      if (heading) {
        closeList();
        closeTable();
        var level = heading[1].length;
        html.push('<h' + level + '>' + inline(heading[2]) + '</h' + level + '>');
        return;
      }
      if (/^\|.+\|$/.test(line)) {
        closeList();
        var cells = line.split('|').slice(1, -1).map(function (cell) { return cell.trim(); });
        var separator = cells.every(function (cell) { return /^:?-{3,}:?$/.test(cell); });
        if (separator) return;
        if (!table) {
          table = { headerDone: false };
          html.push('<table><thead><tr>' + cells.map(function (cell) { return '<th>' + inline(cell) + '</th>'; }).join('') + '</tr></thead><tbody>');
        } else {
          html.push('<tr>' + cells.map(function (cell) { return '<td>' + inline(cell) + '</td>'; }).join('') + '</tr>');
        }
        return;
      }
      var ul = line.match(/^- (.+)/);
      if (ul) {
        closeTable();
        if (list !== 'ul') {
          closeList();
          list = 'ul';
          html.push('<ul>');
        }
        html.push('<li>' + inline(ul[1]) + '</li>');
        return;
      }
      var ol = line.match(/^\d+\. (.+)/);
      if (ol) {
        closeTable();
        if (list !== 'ol') {
          closeList();
          list = 'ol';
          html.push('<ol>');
        }
        html.push('<li>' + inline(ol[1]) + '</li>');
        return;
      }
      var quote = line.match(/^>\s?(.+)/);
      if (quote) {
        closeList();
        closeTable();
        html.push('<blockquote>' + inline(quote[1]) + '</blockquote>');
        return;
      }
      closeList();
      closeTable();
      html.push('<p>' + inline(line) + '</p>');
    });
    closeList();
    closeTable();
    return html.join('\n');
  }

  function renderCodeBlock(language, source) {
    var fallback = '<pre><code class="language-' + escapeAttr(language) + '">' + escapeHtml(source) + '</code></pre>';
    if (language !== 'flow' && language !== 'bars') return fallback;

    var data;
    try {
      data = JSON.parse(source);
    } catch (_) {
      return fallback;
    }
    if (!data || typeof data.caption !== 'string') return fallback;
    var caption = '<figcaption>' + escapeHtml(data.caption) + '</figcaption>';

    if (language === 'flow') {
      if (!Array.isArray(data.steps) || !data.steps.length || data.steps.some(function (step) {
        return typeof step !== 'string';
      })) return fallback;
      return '<figure class="lesson-figure"><ol class="flow-steps">' + data.steps.map(function (step) {
        return '<li>' + escapeHtml(step) + '</li>';
      }).join('') + '</ol>' + caption + '</figure>';
    }

    if (!Array.isArray(data.rows) || !data.rows.length || typeof data.unit !== 'string' ||
      data.rows.some(function (row) {
        return !Array.isArray(row) || typeof row[0] !== 'string' || !Number.isFinite(row[1]) || row[1] < 0;
      })) return fallback;
    var max = data.max ?? Math.max.apply(null, data.rows.map(function (row) { return row[1]; }));
    if (!Number.isFinite(max) || max <= 0 || data.rows.some(function (row) { return row[1] > max; })) return fallback;
    return '<figure class="lesson-figure"><ul class="chart-bars">' + data.rows.map(function (row) {
      return '<li><span>' + escapeHtml(row[0]) + '</span><strong>' +
        escapeHtml(String(row[1]) + ' ' + data.unit) + '</strong><div class="bar-track" aria-hidden="true">' +
        '<span style="width:' + (row[1] / max * 100) + '%"></span></div></li>';
    }).join('') + '</ul>' + caption + '</figure>';
  }

  function inline(textValue) {
    return escapeHtml(textValue)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean))).sort();
  }

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, '&quot;');
  }
})();
