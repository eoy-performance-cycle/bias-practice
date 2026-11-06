(function () {
  var WM = "<svg role=\"img\" aria-label=\"Floward\" viewBox=\"0 0 1659.58 304.87\" fill=\"currentColor\"><path d=\"M228.83,294.79V1.56h-30.44v301.98h151.26v-33.13l-3.26,1.3c-37.58,15.03-77.13,22.79-117.57,23.07Z\"/> <path d=\"M0,303.54h30.44V126.78c40.44.28,79.98,8.04,117.57,23.07l3.26,1.3v-33.13H30.44V10.32c40.45.28,79.99,8.04,117.57,23.07l3.26,1.3V1.56H0v301.98Z\"/> <path d=\"M494.76,0c-.24,0-.48,0-.72,0-40.06,0-77.84,15.61-106.44,44-29.04,28.82-45.1,67.25-45.21,108.21-.11,40.78,15.54,79.09,44.07,107.87,28.53,28.78,66.63,44.69,107.29,44.79h.39c40.21,0,78.17-15.83,106.94-44.6,28.85-28.86,44.79-67.09,44.86-107.63C646.09,68.87,578.28.39,494.76,0ZM551.68,283.07c-21.76,7.35-45.19,7.06-69.63-.85-25.83-8.36-48.88-23.85-68.52-46.04-22.65-25.59-36.93-55.26-42.43-88.16-.95-5.66-1.35-11.33-1.68-15.88-.12-1.7-.23-3.21-.34-4.18.38-33.04,8.35-57.66,25.08-77.49,17.37-20.59,39.95-31.84,67.12-33.46,2.66-.16,5.29-.24,7.91-.24,31.53,0,60.44,11.47,88.12,34.92,25.25,21.39,43.36,48.5,53.82,80.56,9.14,27.98,10.52,53.74,4.22,78.76-9.22,36.67-30.64,60.92-63.67,72.06Z\"/> <path d=\"M1338.94,208.8c-2.24-1.48-4.48-2.96-6.7-4.45-4.93-3.3-10.19-6.51-15.28-9.61-22.09-13.46-44.91-27.37-47.57-53.27h44.84c50,0,72.38-34.53,72.38-68.75,0-26.14-10.12-45.65-30.08-57.99-19.24-11.89-41.86-13.18-50.69-13.18h-99.53v301.98h30.42V9.46h55.31c42.81,0,62.3,32.79,62.3,63.25,0,29.31-18.04,60.85-57.66,60.86h-35.41v2.37c0,48.5,29.75,71.41,58.53,93.57,25.05,19.29,48.71,37.51,48.45,71.5l-.02,2.39h33.04v-2.37c0-51.09-31.68-72-62.32-92.23Z\"/> <path d=\"M1622.77,52.59c-19.17-22.87-53.45-50.3-107.87-51.06h-74.21v302.02h65.78c99.45,0,153.11-79.19,153.11-153.7,0-33.39-13.76-69.75-36.81-97.25ZM1471.11,9.46h38.73c47.67,0,113.7,48.18,113.7,138.63,0,72.53-42.93,147.54-114.77,147.54h-37.66V9.46Z\"/> <path d=\"M965.5,1.56l-63.27,251.29L835.83,1.56h-22.6v2.37c0,19.28-2.16,38.58-6.41,57.38l-43.23,190.99L695.37,1.56h-34.02l82.62,300.24.48,1.74h23.32v-2.37c0-21.88,2.46-43.77,7.31-65.09l42-184.53,63.94,250.21.45,1.79h24.77v-2.37c0-21.85,2.71-43.67,8.04-64.86L973.45,1.56h-7.95Z\"/> <path d=\"M1043.74,1.56v2.37c0,27.55-4.55,54.71-13.53,80.74l-75.48,218.87h8.69l34.22-101.23,1.94-2.09h104.08s1.8,1.86,1.8,1.86l37.97,101.46h33.39L1059.51,1.56h-15.78ZM1101.56,192.4h-100.23l46.53-134.75,53.7,134.75Z\"/></svg>";
  var s = document.querySelector("header .wm"); if (s) s.outerHTML = WM;
})();
if (window.C) {

const SUPABASE_URL = 'https://ilpppwfqddnvzkdtpilu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscHBwd2ZxZGRudnprZHRwaWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5MzQzNDAsImV4cCI6MjEwOTUxMDM0MH0.POvuevB-ooKOyUCJd5msHyzIZ5u1nopJ3ZNlgc8VHAU';
const TABLE = 'bias_practice_responses';
const MIN_WHY = 10;

const app = document.getElementById('app');
const params = new URLSearchParams(location.search);
const configured = !SUPABASE_URL.startsWith('[') && !SUPABASE_ANON_KEY.startsWith('[');
const db = configured && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const sessionId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
const started = Date.now();
const answers = [];
let rewrite = '', confidence = null;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (ok) => ok
  ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>'
  : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 16.5v.5"/></svg>';
const total = C.items.length + 2;
const progress = (n) => '<div class="progress" aria-hidden="true">' + Array.from({ length: total }, (_, i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</div>';
const toTop = () => window.scrollTo(0, 0);

function intro() {
  app.innerHTML = '<div class="hero"><p class="eyebrow">Manager Evaluation · 8 to 15 Nov · Practice ' + C.num + '</p><h1>' + esc(C.title) + '</h1><p style="margin:0">' + esc(C.intro) + '</p></div>' +
    (configured ? '' : '<p class="notice">Preview mode: responses are not being saved yet.</p>') +
    '<ul class="steps"><li><b>1</b><span>Read ' + C.items.length + ' short review comments.</span></li><li><b>2</b><span>Choose: <strong>' + esc(C.labels[0]) + '</strong> or <strong>' + esc(C.labels[1]) + '</strong>, and justify your answer.</span></li><li><b>3</b><span>Rewrite one comment so it rests on evidence.</span></li></ul>' +
    '<p class="muted">About three minutes.</p><button class="btn" id="go">Start</button>';
  document.getElementById('go').addEventListener('click', () => item(0));
}

function item(i) {
  const it = C.items[i];
  let choice = null;
  app.innerHTML = progress(i + 1) + '<p class="eyebrow">Comment ' + (i + 1) + ' of ' + C.items.length + '</p>' +
    '<p class="who">' + esc(it.who) + '</p><blockquote class="quote">“' + esc(it.text) + '”</blockquote>' +
    '<h2>Which is it?</h2><div class="choices" role="group" aria-label="Your answer">' +
    C.labels.map((l, k) => '<button class="choice" aria-pressed="false" data-k="' + k + '">' + esc(l) + '</button>').join('') + '</div>' +
    '<label for="why">Justify your answer</label><textarea id="why" maxlength="400" placeholder="What in the comment led you to this answer?"></textarea>' +
    '<p class="hint">A sentence is enough.</p><div id="fb"></div><button class="btn" id="check" disabled>Check my answer</button>';
  const why = document.getElementById('why'), check = document.getElementById('check');
  const ready = () => { check.disabled = !(choice !== null && why.value.trim().length >= MIN_WHY); };
  app.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
    choice = +b.dataset.k;
    app.querySelectorAll('.choice').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    ready();
  }));
  why.addEventListener('input', ready);
  check.addEventListener('click', () => {
    const ok = choice === it.answer;
    answers.push({ item: i + 1, choice: C.labels[choice], correct: ok, reason: why.value.trim().slice(0, 400) });
    app.querySelectorAll('.choice').forEach((b) => {
      const k = +b.dataset.k; b.disabled = true; b.setAttribute('aria-pressed', 'false');
      if (k === it.answer) b.classList.add('right'); else if (k === choice) b.classList.add('wrong');
    });
    why.readOnly = true;
    document.getElementById('fb').innerHTML = '<div class="feedback ' + (ok ? 'good' : 'bad') + '">' + icon(ok) +
      '<div><p><strong>' + (ok ? 'Well spotted.' : 'Not quite.') + '</strong> This one is <strong>' + esc(C.labels[it.answer]) + '</strong>.</p><p>' + esc(it.why) + '</p></div></div>';
    check.textContent = i + 1 < C.items.length ? 'Next comment' : 'Continue';
    check.replaceWith(check.cloneNode(true));
    const next = document.getElementById('check');
    next.disabled = false; next.focus();
    next.addEventListener('click', () => { toTop(); i + 1 < C.items.length ? item(i + 1) : fix(); });
  });
}

function fix() {
  app.innerHTML = progress(C.items.length + 1) + '<p class="eyebrow">Your turn to fix it</p><h2>' + esc(C.fixPrompt) + '</h2>' +
    '<textarea id="rw" maxlength="400" placeholder="Rewrite the comment here"></textarea><p class="hint">' + esc(C.fixHint) + '</p>' +
    '<button class="btn" id="next" disabled>Continue</button>';
  const rw = document.getElementById('rw'), next = document.getElementById('next');
  rw.addEventListener('input', () => { next.disabled = rw.value.trim().length < MIN_WHY; });
  next.addEventListener('click', () => { rewrite = rw.value.trim().slice(0, 400); toTop(); reflect(); });
}

function reflect() {
  app.innerHTML = progress(C.items.length + 2) + '<p class="eyebrow">Before you go</p>' +
    '<h2 id="conf-l">How confident are you that you would spot ' + esc(C.bias) + ' in your own evaluations?</h2>' +
    '<div class="scale" role="group" aria-labelledby="conf-l">' + [1, 2, 3, 4, 5].map((n) => '<button aria-pressed="false" data-n="' + n + '">' + n + '</button>').join('') + '</div>' +
    '<div class="scale-labels"><span>Not confident</span><span>Very confident</span></div>' +
    '<button class="btn" id="submit" disabled>Submit</button><p class="err" id="err" hidden></p>';
  app.querySelectorAll('.scale button').forEach((b) => b.addEventListener('click', () => {
    confidence = +b.dataset.n;
    app.querySelectorAll('.scale button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    document.getElementById('submit').disabled = false;
  }));
  document.getElementById('submit').addEventListener('click', submit);
}

async function submit() {
  const btn = document.getElementById('submit'), err = document.getElementById('err');
  btn.disabled = true; btn.textContent = 'Saving…';
  const score = answers.filter((a) => a.correct).length;
  const row = { session_id: sessionId, bias: C.key, answers: answers, score: score, total: C.items.length,
    rewrite: rewrite, confidence: confidence, duration_seconds: Math.round((Date.now() - started) / 1000), source: (params.get('src') || 'qr').slice(0, 40) };
  if (db) {
    const { error } = await db.from(TABLE).insert(row);
    if (error) { err.hidden = false; err.textContent = 'We could not save your response. Please check your connection and try again.'; btn.disabled = false; btn.textContent = 'Try again'; return; }
  } else { console.info('[Preview mode] Not saved:', row); }
  done(score);
}

function done(score) {
  app.innerHTML = '<p class="eyebrow">Thank you</p><p class="score">' + score + ' / ' + C.items.length + '</p>' +
    '<h1>' + (score === C.items.length ? 'Every one spotted.' : 'Now you know what to look for.') + '</h1>' +
    '<p>Before you submit each evaluation, ask yourself: ' + esc(C.reflect) + '</p>' +
    '<h2 style="margin-top:32px">Practice another bias</h2><div class="links">' + C.others.map((o) => '<a href="' + o[0] + '">' + esc(o[1]) + ': ' + esc(o[2]) + '</a>').join('') + '</div>';
  toTop();
}

intro();
}
