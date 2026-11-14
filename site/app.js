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

  function lessonRow(lesson) {
    var done = BookProgress.isComplete(lesson.id);
    return '<li><a class="index-row" href="' + lessonUrl(lesson) + '">' +
      '<span class="index-number">' + pad(lesson.phaseNumber) + '.' + pad(lesson.lessonNumber) + '</span>' +
      '<span class="index-copy"><strong>' + escapeHtml(lesson.title) + '</strong>' +
      '<small>' + escapeHtml(lesson.phase) + '</small></span>' +
      '<span class="index-meta">' + escapeHtml(done ? 'Completed' : lesson.time || lesson.type) + '</span>' +
      '<span class="index-arrow" aria-hidden="true">&rarr;</span></a></li>';
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
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }

  function routeStop(phase, open) {
    var chapters = LESSONS.filter(function (lesson) { return lesson.phaseNumber === phase.number; });
    var read = chapters.filter(function (lesson) { return BookProgress.isComplete(lesson.id); }).length;
    var state = !chapters.length ? 'planned' : read === chapters.length ? 'done' : read ? 'active' : 'todo';
    var stateLabel = { planned: 'Planned', done: 'Completed', active: 'In progress', todo: 'Not started' }[state];
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
    var facets = [
      ['phase', 'Phase', function (l) { return [String(l.phaseNumber)]; }, PHASES.map(function (phase) {
        return [String(phase.number), phase.title];
      })],
      ['type', 'Type', function (l) { return [l.type]; }],
      ['tool', 'Tool', function (l) { return l.tools; }],
      ['chain', 'Chain', function (l) { return l.chains; }],
      ['protocol', 'Protocol', function (l) { return l.protocols; }],
      ['status', 'Status', function (l) { return [l.status]; }]
    ];
    var selected = Object.create(null);
    search.value = params.get('q') || '';

    var groups = facets.flatMap(function (facet) {
      var options = facet[3] || unique(LESSONS.flatMap(facet[2])).map(function (value) { return [value, value]; });
      var initial = params.get(facet[0]);
      if (options.some(function (option) { return option[0] === initial; })) selected[facet[0]] = initial;
      var useful = options.length > 1 || (options.length === 1 && LESSONS.some(function (lesson) {
        return !facet[2](lesson).includes(options[0][0]);
      }));
      if (!useful && !selected[facet[0]]) return [];
      return [{ key: facet[0], label: facet[1], options: [['', 'All']].concat(options) }];
    });
    BookUI.facets(controls, groups);

    controls.addEventListener('click', function (event) {
      var button = event.target.closest('[data-facet]');
      if (!button) return;
      selected[button.dataset.facet] = button.dataset.value;
      draw();
    });
    search.addEventListener('input', draw);
    reset.addEventListener('click', function () {
      selected = Object.create(null);
      search.value = '';
      search.focus();
      draw();
    });
    draw();

    function draw() {
      var query = search.value.trim().toLowerCase();
      var words = query.split(/\s+/).filter(Boolean);
      var rows = LESSONS.filter(function (lesson) {
        var haystack = [lesson.title, lesson.phase, lesson.body, lesson.datasets.join(' ')]
          .concat(facets.flatMap(function (facet) { return facet[2](lesson); })).join(' ').toLowerCase();
        return words.every(function (word) { return haystack.includes(word); }) && facets.every(function (facet) {
          return !selected[facet[0]] || facet[2](lesson).includes(selected[facet[0]]);
        });
      });
      controls.querySelectorAll('[data-facet]').forEach(function (button) {
        button.setAttribute('aria-pressed', String((selected[button.dataset.facet] || '') === button.dataset.value));
      });
      var active = Object.keys(selected).filter(function (key) { return selected[key]; });
      var url = new URL(location.href);
      facets.forEach(function (facet) { url.searchParams.delete(facet[0]); });
      url.searchParams.delete('q');
      if (search.value.trim()) url.searchParams.set('q', search.value.trim());
      active.forEach(function (key) { url.searchParams.set(key, selected[key]); });
      history.replaceState(null, '', url);
      reset.hidden = !query && !active.length;
      count.textContent = rows.length + (rows.length === 1 ? ' chapter' : ' chapters');
      var phase = PHASES.find(function (item) { return String(item.number) === selected.phase; });
      if (rows.length) target.innerHTML = '<ol class="index-list">' + rows.map(lessonRow).join('') + '</ol>';
      else if (phase && !phase.lessons.length && !query && active.length === 1) {
        target.innerHTML = '<section class="planned-section"><h2>' + escapeHtml(phase.title) + '</h2><p>' +
          escapeHtml(phase.summary) + '</p><ul>' + phase.topics.map(function (topic) {
            return '<li>' + escapeHtml(topic) + '</li>';
          }).join('') + '</ul><p class="eyebrow">Chapters planned</p></section>';
      } else target.innerHTML = '<p class="empty">No chapters match your search and filters.</p>';
    }
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
      mount.innerHTML = '<section class="panel"><h1>Lesson Not Found</h1><p>Open the catalog and choose an available lesson.</p></section>';
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

  function renderGlossary() {
    var search = document.querySelector('[data-glossary-search]');
    var target = document.querySelector('[data-glossary-list]');
    if (!target) return;
    if (search) search.addEventListener('input', draw);
    draw();

    function draw() {
      var q = (search && search.value || '').toLowerCase().trim();
      var rows = GLOSSARY.filter(function (item) {
        return !q || item.term.toLowerCase().indexOf(q) !== -1 || item.definition.toLowerCase().indexOf(q) !== -1;
      });
      target.innerHTML = rows.map(function (item) {
        return '<section class="term" id="' + escapeAttr(item.slug) + '">' +
          '<h2>' + escapeHtml(item.term) + '</h2>' +
          '<div class="markdown-body">' + markdownToHtml(item.definition) + '</div>' +
          '</section>';
      }).join('') || '<p class="empty">No terms match your search.</p>';
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
