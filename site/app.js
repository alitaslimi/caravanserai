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

  function chapterLink(lesson, current) {
    return '<a href="' + lessonUrl(lesson) + '"' +
      (current && current.id === lesson.id ? ' aria-current="page"' : '') +
      '>' + escapeHtml(lesson.title) + '</a>';
  }

  function renderDocsNav(current) {
    var nav = document.querySelector('[data-docs-nav]');
    var chapters = LESSONS.map(function (lesson) {
      return '<li>' + chapterLink(lesson, current) + '</li>';
    }).join('');
    nav.innerHTML = '<p class="docs-nav-title">Contents</p><ul>' +
      '<li><a href="index.html"' + (document.body.dataset.page === 'home' ? ' aria-current="page"' : '') + '>Introduction</a></li>' +
      chapters + '<li><a href="index.html#curriculum">Chapter outline</a></li></ul>';
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

  function renderHome() {
    var first = LESSONS[0];
    var start = document.querySelector('[data-start-reading]');
    if (first) start.href = lessonUrl(first);
    else start.hidden = true;
    document.querySelector('[data-book-count]').textContent = LESSONS.length + ' chapters';
    document.querySelector('[data-home-lessons]').innerHTML = LESSONS.map(lessonRow).join('');
    document.querySelector('[data-phase-overview]').innerHTML = PHASES.map(function (phase) {
      var chapters = LESSONS.filter(function (lesson) { return lesson.phaseNumber === phase.number; });
      return '<section class="curriculum-row" id="' + escapeAttr(phase.slug) + '">' +
        '<span class="index-number">' + pad(phase.number) + '</span><div>' +
        '<h3>' + escapeHtml(phase.title) + '</h3><p>' + escapeHtml(phase.summary) + '</p>' +
        (chapters.length ? '<ul>' + chapters.map(function (lesson) {
          return '<li>' + chapterLink(lesson) + '</li>';
        }).join('') + '</ul>' : '<p class="eyebrow">Planned</p>') +
        '</div></section>';
    }).join('');
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
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
      '<p class="docs-breadcrumb"><a href="index.html#' + escapeAttr(lesson.phaseSlug) + '">' + escapeHtml(lesson.phase) + '</a></p>',
      '<h1>' + escapeHtml(lesson.title) + '</h1>',
      '<div class="markdown-body">' + markdownToHtml(lesson.body.replace(/^# [^\r\n]+\r?\n+/, '')) + '</div>',
      quizHtml(lesson),
      metaHtml(lesson),
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

  function metaHtml(lesson) {
    var values = [
      lesson.phase,
      lesson.type,
      lesson.status,
      lesson.time
    ].concat(lesson.tools, lesson.chains, lesson.protocols, lesson.datasets).filter(Boolean);
    return '<div class="meta-grid">' + values.map(function (value) {
      return '<span>' + escapeHtml(value) + '</span>';
    }).join('') + '</div>';
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
    return '<nav class="lesson-nav">' +
      (prev ? '<a href="lesson.html?id=' + encodeURIComponent(prev.id) + '">Previous: ' + escapeHtml(prev.title) + '</a>' : '<span></span>') +
      (next ? '<a href="lesson.html?id=' + encodeURIComponent(next.id) + '">Next: ' + escapeHtml(next.title) + '</a>' : '<span></span>') +
      '</nav>';
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
