// Bias practice engine: Floward email first, EN/AR, engagement tracked in Supabase (same model as the STAR practice).
(function () {
  var SUPABASE_URL = 'https://ilpppwfqddnvzkdtpilu.supabase.co', SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscHBwd2ZxZGRudnprZHRwaWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5MzQzNDAsImV4cCI6MjEwOTUxMDM0MH0.POvuevB-ooKOyUCJd5msHyzIZ5u1nopJ3ZNlgc8VHAU';
  var RESPONSES = 'bias_practice_responses', EVENTS = 'bias_practice_events';
  var EMAIL_RE = /^[a-z0-9._%+\-]+@floward\.com$/, MIN_WHY = 10;
  var P = window.PAGE, params = new URLSearchParams(location.search);
  var sessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
  var email = null, stage = 'gate', started = Date.now(), view = null;
  var answers = [], rewrite = '', confidence = null;
  var app = document.getElementById('app');
  var ls = { get: function (k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
             set: function (k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} } };
  var lang = ls.get('bias_lab_lang') === 'ar' ? 'ar' : 'en';
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var S = window.STRINGS;
  var t = function (k, v) { var s = S[lang][k]; for (var x in (v || {})) s = s.split('{' + x + '}').join(v[x]); return s; };
  var A = function () { return P.act ? P.act[lang] : null; };

  function post(table, row, keepalive) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table, { method: 'POST', keepalive: !!keepalive, body: JSON.stringify(row),
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' } });
  }
  var Track = (function () {
    var active = 0, since = 0, last = Date.now(), ended = false;
    function send(event, detail, keepalive) {
      if (!email) return;
      var d = detail || {}; d.lang = lang;
      post(EVENTS, { session_id: sessionId, email: email, bias: P.key || 'hub', event: event, step: stage, active_seconds: active,
        detail: d, user_agent: navigator.userAgent.slice(0, 250) }, keepalive)
        .then(function (r) { if (!r.ok) console.warn('[Bias practice] tracking', r.status); })
        .catch(function (e) { console.warn('[Bias practice] tracking', e.message); });
    }
    setInterval(function () {
      if (!email || ended || document.visibilityState !== 'visible' || (Date.now() - last) / 1000 > 120) return;
      active++; since++; if (since >= 60) { since = 0; send('checkpoint'); }
    }, 1000);
    ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach(function (ev) { window.addEventListener(ev, function () { last = Date.now(); }, { passive: true }); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') send('checkpoint', {}, true); else last = Date.now(); });
    window.addEventListener('pagehide', function () { if (!ended && email) { ended = true; send('session_end', {}, true); } });
    return { event: send };
  })();

  function head() {
    return '<p class="brand">Floward</p><div class="toggle" role="group" aria-label="Language"><button data-l="en" aria-pressed="' + (lang === 'en') + '">EN</button><button class="ar" data-l="ar" aria-pressed="' + (lang === 'ar') + '" aria-label="العربية">ع</button></div>';
  }
  function eyebrow() { return '<p class="eyebrow">' + (P.key ? t('practiceOf', { n: P.num }) : t('series')) + '</p>'; }
  function me() { return email ? '<p class="me">' + t('signedAs') + ' <span dir="ltr">' + esc(email) + '</span> · <button id="notme">' + t('notYou') + '</button></p>' : ''; }
  function progress(n) { var tot = A().items.length + 2; return '<div class="progress" aria-hidden="true">' + Array.from({ length: tot }, function (_, i) { return '<i class="' + (i < n ? 'on' : '') + '"></i>'; }).join('') + '</div>'; }
  function render(html, wire) {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = P.key ? A().title + ' | ' + t('docTitle') : t('docTitle');
    app.innerHTML = head() + html;
    app.querySelectorAll('.toggle button').forEach(function (b) { b.addEventListener('click', function () {
      if (b.dataset.l === lang) return; lang = b.dataset.l; ls.set('bias_lab_lang', lang); Track.event('language', { to: lang }); view();
    }); });
    var n = document.getElementById('notme');
    if (n) n.addEventListener('click', function () { Track.event('switched_user'); email = null; ls.set('bias_lab_email', ''); answers = []; gate(); });
    if (wire) wire();
    window.scrollTo(0, 0);
  }

  function gate() {
    stage = 'gate'; view = gate;
    render(eyebrow() + '<h1>' + esc(P.key ? A().title : t('hubTitle')) + '</h1><div class="rule"></div><p class="lead">' + t('gateDesc') + '</p>' +
      '<form id="gate" novalidate><label for="em">' + t('emailLabel') + '</label><input type="email" id="em" placeholder="name@floward.com" autocomplete="email" maxlength="80" required value="' + esc(ls.get('bias_lab_email')) + '">' +
      '<p class="err" id="emerr" role="alert"></p><button class="btn" type="submit">' + t(P.key ? 'start' : 'continue') + '</button></form><p class="note">' + t('note') + '</p>', function () {
      document.getElementById('gate').addEventListener('submit', function (e) {
        e.preventDefault();
        var input = document.getElementById('em'), err = document.getElementById('emerr'), v = input.value.trim().toLowerCase();
        if (!v) { err.textContent = t('errEmpty'); input.focus(); return; }
        if (!EMAIL_RE.test(v)) { err.textContent = t('errDomain'); input.focus(); return; }
        email = v; ls.set('bias_lab_email', v);
        Track.event('session_start', { device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop', source: (params.get('src') || (P.key ? 'qr' : 'hub')).slice(0, 40) });
        if (P.key) { Track.event('activity_open'); item(0); } else hub();
      });
    });
  }

  function hub() {
    stage = 'hub'; view = hub;
    render(eyebrow() + '<h1>' + t('hubTitle') + '</h1><div class="rule"></div>' + me() + '<p class="lead">' + t('hubDesc') + '</p><div class="list">' +
      P.all.map(function (a) { return '<a href="' + a.key + '.html"><span><small>' + t('practiceOf', { n: a.num }) + '</small><b>' + esc(a[lang].bias) + ': ' + esc(a[lang].title) + '</b></span><span class="arrow">' + (lang === 'ar' ? '←' : '→') + '</span></a>'; }).join('') + '</div>');
  }

  function item(i) {
    stage = 'case' + (i + 1); view = function () { item(i); };
    var a = A(), it = a.items[i];
    render(eyebrow() + progress(i + 1) + me() + '<p class="who">' + t('caseOf', { i: i + 1, n: a.items.length }) + ' · ' + esc(it.who) + '</p>' +
      '<blockquote class="quote">' + (lang === 'ar' ? '«' : '“') + esc(it.text) + (lang === 'ar' ? '»' : '”') + '</blockquote><h2>' + esc(a.question) + '</h2>' +
      '<div class="choices" role="group" aria-label="' + esc(a.question) + '">' + a.labels.map(function (l, k) { return '<button class="choice" aria-pressed="false" data-k="' + k + '">' + esc(l) + '</button>'; }).join('') + '</div>' +
      '<label for="why">' + t('justify') + '</label><textarea id="why" maxlength="400" placeholder="' + esc(t('whyPh')) + '"></textarea><p class="hint">' + t('sentence') + '</p>' +
      '<div id="fb"></div><button class="btn" id="check" disabled>' + t('check') + '</button>', function () {
      var why = document.getElementById('why'), check = document.getElementById('check'), sel = null;
      var ready = function () { check.disabled = !(sel !== null && why.value.trim().length >= MIN_WHY); };
      var showResult = function (rec) {
        var ok = rec.correct;
        app.querySelectorAll('.choice').forEach(function (b) {
          var k = +b.dataset.k; b.disabled = true; b.setAttribute('aria-pressed', 'false');
          if (k === P.answer[i]) b.classList.add('right'); else if (k === rec.k) b.classList.add('wrong');
        });
        why.value = rec.reason; why.readOnly = true;
        document.getElementById('fb').innerHTML = '<div class="feedback ' + (ok ? 'good' : 'bad') + '"><p><strong>' + t(ok ? 'right' : 'wrong') + '</strong> ' + t('thisOne') + ' <strong>' + esc(a.labels[P.answer[i]]) + '</strong>. ' + esc(it.why) + '</p></div>';
        check.disabled = false; check.textContent = i + 1 < a.items.length ? t('nextCase') : t('continue');
        check.onclick = function () { i + 1 < a.items.length ? item(i + 1) : fix(); };
      };
      app.querySelectorAll('.choice').forEach(function (b) { b.addEventListener('click', function () {
        sel = +b.dataset.k; app.querySelectorAll('.choice').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); ready();
      }); });
      why.addEventListener('input', ready);
      if (answers[i]) { showResult(answers[i]); return; }
      check.onclick = function () {
        var rec = { item: i + 1, k: sel, choice: P.act.en.labels[sel], correct: sel === P.answer[i], reason: why.value.trim().slice(0, 400) };
        answers[i] = rec; Track.event('case_checked', { case: i + 1, correct: rec.correct });
        showResult(rec); check.focus();
      };
    });
  }

  function fix() {
    stage = 'rewrite'; view = fix;
    var a = A();
    render(eyebrow() + progress(a.items.length + 1) + me() + '<p class="who">' + t('yourTurn') + '</p><h2>' + esc(a.fixPrompt) + '</h2>' +
      '<textarea id="rw" maxlength="400" placeholder="' + esc(t('rewritePh')) + '"></textarea><p class="hint">' + esc(a.fixHint) + '</p><button class="btn" id="go" disabled>' + t('continue') + '</button>', function () {
      var rw = document.getElementById('rw'), go = document.getElementById('go');
      rw.value = rewrite; go.disabled = rw.value.trim().length < MIN_WHY;
      rw.addEventListener('input', function () { rewrite = rw.value; go.disabled = rw.value.trim().length < MIN_WHY; });
      go.addEventListener('click', function () { rewrite = rw.value.trim().slice(0, 400); Track.event('rewrite_done'); reflect(); });
    });
  }

  function reflect() {
    stage = 'confidence'; view = reflect;
    var a = A();
    render(eyebrow() + progress(a.items.length + 2) + me() + '<p class="who">' + t('beforeGo') + '</p><h2 id="cl">' + t('conf', { bias: esc(a.bias) }) + '</h2>' +
      '<div class="scale" role="group" aria-labelledby="cl">' + [1, 2, 3, 4, 5].map(function (n) { return '<button aria-pressed="' + (confidence === n) + '" data-n="' + n + '">' + n + '</button>'; }).join('') + '</div>' +
      '<div class="scale-labels"><span>' + t('notConf') + '</span><span>' + t('veryConf') + '</span></div>' +
      '<button class="btn" id="submit"' + (confidence ? '' : ' disabled') + '>' + t('submit') + '</button><p class="err" id="err" role="alert"></p>', function () {
      app.querySelectorAll('.scale button').forEach(function (b) { b.addEventListener('click', function () {
        confidence = +b.dataset.n; app.querySelectorAll('.scale button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        document.getElementById('submit').disabled = false;
      }); });
      document.getElementById('submit').addEventListener('click', submit);
    });
  }

  function submit() {
    var btn = document.getElementById('submit'), err = document.getElementById('err');
    btn.disabled = true; btn.textContent = t('saving');
    var score = answers.filter(function (x) { return x.correct; }).length;
    var row = { session_id: sessionId, email: email, bias: P.key, score: score, total: answers.length, rewrite: rewrite, confidence: confidence,
      answers: answers.map(function (x) { return { item: x.item, choice: x.choice, correct: x.correct, reason: x.reason }; }),
      duration_seconds: Math.round((Date.now() - started) / 1000), source: ((params.get('src') || 'qr') + '|' + lang).slice(0, 40) };
    post(RESPONSES, row).then(function (r) {
      if (!r.ok) throw new Error('status ' + r.status);
      stage = 'done'; Track.event('completed', { score: score, total: answers.length, confidence: confidence }); done(score);
    }).catch(function (e) {
      console.warn('[Bias practice] save', e.message); err.textContent = t('saveErr'); btn.disabled = false; btn.textContent = t('tryAgain');
    });
  }

  function done(score) {
    view = function () { done(score); };
    var a = A(), n = a.items.length;
    render(eyebrow() + '<h1>' + t(score === n ? 'done1' : 'done2') + '</h1><div class="rule"></div><p class="score" dir="ltr">' + score + ' / ' + n + '</p>' +
      '<div class="ask"><p><strong>' + t('askYourself') + '</strong> ' + esc(a.reflect) + '</p></div>' +
      '<p class="label">' + t('another') + '</p><div class="list">' + P.all.filter(function (x) { return x.key !== P.key; }).map(function (x) {
        return '<a href="' + x.key + '.html"><span><small>' + t('practiceOf', { n: x.num }) + '</small><b>' + esc(x[lang].bias) + ': ' + esc(x[lang].title) + '</b></span><span class="arrow">' + (lang === 'ar' ? '←' : '→') + '</span></a>';
      }).join('') + '</div>');
  }

  gate();
})();
