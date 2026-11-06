// Bias Lab engine. Same model as STAR Lab: Floward email gate first, then the activity, with engagement tracked in Supabase.
(function () {
  var SUPABASE_URL = 'https://ilpppwfqddnvzkdtpilu.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscHBwd2ZxZGRudnprZHRwaWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5MzQzNDAsImV4cCI6MjEwOTUxMDM0MH0.POvuevB-ooKOyUCJd5msHyzIZ5u1nopJ3ZNlgc8VHAU';
  var RESPONSES = 'bias_practice_responses', EVENTS = 'bias_practice_events';
  var EMAIL_RE = /^[a-z0-9._%+\-]+@floward\.com$/, EMAIL_KEY = 'bias_lab_email', MIN_WHY = 10;
  var C = window.C || null, params = new URLSearchParams(location.search);
  var sessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
  var email = null, stage = 'gate', started = Date.now();
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var store = {
    get: function () { try { return localStorage.getItem(EMAIL_KEY) || ''; } catch (e) { return ''; } },
    set: function (v) { try { v ? localStorage.setItem(EMAIL_KEY, v) : localStorage.removeItem(EMAIL_KEY); } catch (e) {} }
  };

  function post(table, row, keepalive) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table, { method: 'POST', keepalive: !!keepalive, body: JSON.stringify(row),
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' } });
  }

  // Engagement: one row per event. Active time counts only while the tab is visible and the person
  // interacted in the last 2 minutes; saved every minute and when the page is hidden or closed.
  var Track = (function () {
    var active = 0, since = 0, last = Date.now(), ended = false;
    function send(event, detail, keepalive) {
      if (!email) return;
      post(EVENTS, { session_id: sessionId, email: email, bias: C ? C.key : 'hub', event: event, step: stage,
        active_seconds: active, detail: detail || {}, user_agent: navigator.userAgent.slice(0, 250) }, keepalive)
        .then(function (r) { if (!r.ok) console.warn('[Bias Lab] tracking', r.status); })
        .catch(function (e) { console.warn('[Bias Lab] tracking', e.message); });
    }
    setInterval(function () {
      if (!email || ended || document.visibilityState !== 'visible' || (Date.now() - last) / 1000 > 120) return;
      active++; since++;
      if (since >= 60) { since = 0; send('checkpoint'); }
    }, 1000);
    ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach(function (ev) { window.addEventListener(ev, function () { last = Date.now(); }, { passive: true }); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') send('checkpoint', {}, true); else last = Date.now(); });
    window.addEventListener('pagehide', function () { if (!ended && email) { ended = true; send('session_end', {}, true); } });
    return { event: send, active: function () { return active; } };
  })();

  // ---------- Email gate ----------
  function signIn(v) {
    email = v; store.set(v);
    $('emailGate').classList.add('hidden');
    var d = $('learnerDisplay'); d.textContent = v; d.title = v; d.classList.remove('hidden');
    var first = v.split('@')[0].split(/[._\-+]/).filter(Boolean)[0] || '';
    var w = $('welcome'); if (w && first) w.textContent = 'Welcome, ' + first.charAt(0).toUpperCase() + first.slice(1) + '. ';
    Track.event('session_start', { device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      screen: screen.width + 'x' + screen.height, source: (params.get('src') || (C ? 'qr' : 'hub')).slice(0, 40) });
    if (C) { stage = 'case1'; Track.event('activity_open'); caseScreen(0); }
  }
  $('emailInput').value = store.get();
  $('gateForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('emailInput'), err = $('emailError'), v = input.value.trim().toLowerCase();
    if (!v) { err.textContent = 'Please enter your Floward email.'; input.focus(); return; }
    if (!EMAIL_RE.test(v)) { err.textContent = 'Please use your Floward email (name@floward.com).'; input.focus(); return; }
    err.textContent = ''; signIn(v);
  });
  $('learnerDisplay').addEventListener('click', function () {
    if (!confirmSwitch()) return;
    Track.event('switched_user'); email = null; store.set('');
    $('learnerDisplay').classList.add('hidden'); $('emailInput').value = ''; $('emailGate').classList.remove('hidden'); $('emailInput').focus();
  });
  function confirmSwitch() { return true; }

  // ---------- Timer (as in STAR Lab) ----------
  var tsec = 0, trun = null;
  function tshow() { var t = $('timer'); if (t) t.textContent = String(Math.floor(tsec / 60)).padStart(2, '0') + ':' + String(tsec % 60).padStart(2, '0'); }
  if ($('tbtn')) {
    $('tbtn').addEventListener('click', function () {
      if (trun) { clearInterval(trun); trun = null; $('tbtn').textContent = '▶'; }
      else { trun = setInterval(function () { tsec++; tshow(); }, 1000); $('tbtn').textContent = '❚❚'; }
    });
    $('treset').addEventListener('click', function () { tsec = 0; tshow(); });
  }

  if (!C) return;
  var content = $('activityContent'), answers = [], rewrite = '', confidence = null, n = C.items.length, steps = n + 2;
  var top = function () { window.scrollTo(0, 0); };
  function bar(i, label) {
    return '<div class="progress-label">' + label + '</div><div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:' + Math.round(100 * i / steps) + '%"></div></div>';
  }

  function caseScreen(i) {
    stage = 'case' + (i + 1);
    var it = C.items[i], choice = null;
    content.innerHTML = bar(i, 'Case ' + (i + 1) + ' of ' + n) +
      '<div class="case-card"><div class="case-number">Case ' + (i + 1) + ' of ' + n + '</div>' +
      '<div class="case-who">' + esc(it.who) + '</div>' +
      '<div class="case-scenario">“' + esc(it.text) + '”</div>' +
      '<div class="case-question">Does this comment rest on ' + esc(C.labels[0].toLowerCase()) + ' or on ' + esc(C.bias === 'Halo Effect' ? 'a halo' : C.labels[1].toLowerCase()) + '?</div>' +
      '<div class="choice-row" role="radiogroup" aria-label="Your answer">' + C.labels.map(function (l, k) {
        return '<div class="option-item" role="radio" aria-checked="false" tabindex="0" data-k="' + k + '"><div class="option-check"></div><div class="option-text"><strong>' + esc(l) + '</strong></div></div>';
      }).join('') + '</div>' +
      '<div class="form-row"><label class="form-label" for="why">Justify your answer</label><textarea class="form-textarea" id="why" maxlength="400" placeholder="What in the comment led you to this answer?"></textarea><div class="form-hint">A sentence is enough.</div></div>' +
      '<div class="feedback-box" id="fb"></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">' +
      '<button class="btn btn-primary" id="check" disabled>Check Answer</button>' +
      '<button class="btn btn-secondary" id="next" disabled title="Check your answer first">' + (i + 1 < n ? 'Next Case →' : 'Continue →') + '</button>' +
      '<span class="next-lock" id="lock">Check your answer to unlock the next ' + (i + 1 < n ? 'case' : 'step') + '.</span></div></div>';
    var why = $('why'), check = $('check'), next = $('next');
    var ready = function () { check.disabled = !(choice !== null && why.value.trim().length >= MIN_WHY); };
    content.querySelectorAll('.option-item').forEach(function (o) {
      var pick = function () {
        if (o.classList.contains('locked')) return;
        choice = +o.dataset.k;
        content.querySelectorAll('.option-item').forEach(function (x) { var on = x === o; x.classList.toggle('selected', on); x.setAttribute('aria-checked', String(on)); x.querySelector('.option-check').textContent = on ? '✓' : ''; });
        ready();
      };
      o.addEventListener('click', pick);
      o.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
    why.addEventListener('input', ready);
    check.addEventListener('click', function () {
      var ok = choice === it.answer;
      answers.push({ item: i + 1, choice: C.labels[choice], correct: ok, reason: why.value.trim().slice(0, 400) });
      Track.event('case_checked', { case: i + 1, correct: ok });
      content.querySelectorAll('.option-item').forEach(function (o) {
        var k = +o.dataset.k; o.classList.add('locked'); o.classList.remove('selected');
        if (k === it.answer) { o.classList.add('correct'); o.querySelector('.option-check').textContent = '✓'; }
        else if (k === choice) { o.classList.add('incorrect'); o.querySelector('.option-check').textContent = '✕'; }
      });
      why.readOnly = true; check.disabled = true; next.disabled = false; next.title = ''; $('lock').remove();
      var fb = $('fb'); fb.className = 'feedback-box visible ' + (ok ? 'success' : 'error');
      fb.innerHTML = '<strong>' + (ok ? 'Well spotted.' : 'Not quite.') + '</strong> This one is <strong>' + esc(C.labels[it.answer]) + '</strong>. ' + esc(it.why);
      next.focus();
    });
    next.addEventListener('click', function () { top(); i + 1 < n ? caseScreen(i + 1) : rewriteScreen(); });
  }

  function rewriteScreen() {
    stage = 'rewrite';
    content.innerHTML = bar(n, 'Your turn') +
      '<div class="form-section"><div class="case-number">Your turn to fix it</div><div class="case-question">' + esc(C.fixPrompt) + '</div>' +
      '<div class="form-row"><textarea class="form-textarea" id="rw" maxlength="400" placeholder="Rewrite the comment here"></textarea><div class="form-hint">' + esc(C.fixHint) + '</div></div>' +
      '<button class="btn btn-primary" id="go" disabled>Continue →</button></div>';
    var rw = $('rw'), go = $('go');
    rw.addEventListener('input', function () { go.disabled = rw.value.trim().length < MIN_WHY; });
    go.addEventListener('click', function () { rewrite = rw.value.trim().slice(0, 400); Track.event('rewrite_done'); top(); confidenceScreen(); });
  }

  function confidenceScreen() {
    stage = 'confidence';
    content.innerHTML = bar(n + 1, 'Before you go') +
      '<div class="form-section"><div class="case-number">Before you go</div>' +
      '<div class="case-question" id="confL">How confident are you that you would spot ' + esc(C.bias) + ' in your own evaluations?</div>' +
      '<div class="conf-row" role="radiogroup" aria-labelledby="confL">' + [1, 2, 3, 4, 5].map(function (v) { return '<div class="comp-chip" role="radio" aria-checked="false" tabindex="0" data-v="' + v + '">' + v + '</div>'; }).join('') + '</div>' +
      '<div class="conf-labels"><span>Not confident</span><span>Very confident</span></div>' +
      '<button class="btn btn-primary" id="submit" disabled>Submit</button><div class="feedback-box error" id="err"></div></div>';
    content.querySelectorAll('.conf-row .comp-chip').forEach(function (c) {
      var pick = function () {
        confidence = +c.dataset.v;
        content.querySelectorAll('.conf-row .comp-chip').forEach(function (x) { var on = x === c; x.classList.toggle('selected', on); x.setAttribute('aria-checked', String(on)); });
        $('submit').disabled = false;
      };
      c.addEventListener('click', pick);
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
    $('submit').addEventListener('click', submit);
  }

  function submit() {
    var btn = $('submit'), err = $('err');
    btn.disabled = true; btn.textContent = 'Saving…';
    var score = answers.filter(function (a) { return a.correct; }).length;
    var row = { session_id: sessionId, email: email, bias: C.key, answers: answers, score: score, total: n, rewrite: rewrite, confidence: confidence,
      duration_seconds: Math.round((Date.now() - started) / 1000), source: (params.get('src') || 'qr').slice(0, 40) };
    post(RESPONSES, row).then(function (r) {
      if (!r.ok) throw new Error('status ' + r.status);
      stage = 'done'; Track.event('completed', { score: score, total: n, confidence: confidence }); done(score);
    }).catch(function (e) {
      console.warn('[Bias Lab] save', e.message);
      err.className = 'feedback-box error visible'; err.textContent = 'We could not save your response. Please check your connection and try again.';
      btn.disabled = false; btn.textContent = 'Try again';
    });
  }

  function done(score) {
    content.innerHTML = bar(steps, 'Complete') +
      '<div class="score-display"><div class="score-number">' + score + ' / ' + n + '</div><div class="score-label">' + (score === n ? 'Every one spotted.' : 'Now you know what to look for.') + '</div></div>' +
      '<div class="feedback-box info visible"><strong>Before you submit each evaluation, ask yourself:</strong> ' + esc(C.reflect) + '</div>' +
      '<div class="done-links"><div class="section-label">Practice another bias</div><div class="card-grid">' + C.others.map(function (o) {
        return '<a class="activity-card" href="' + o[0] + '"><div class="card-module">Part ' + o[3] + ': Bias Series</div><h3 class="card-title">' + esc(o[1]) + '</h3><p class="card-desc">' + esc(o[2]) + '</p><div class="card-footer"><span class="card-badge">3 Cases</span><span class="card-arrow">→</span></div></a>';
      }).join('') + '</div></div>';
    top();
  }
})();
