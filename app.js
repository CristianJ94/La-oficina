/* La Oficina — lógica de la app */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('lo.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('lo.' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };

  const ORDER = ['lucia', 'olga', 'marta', 'dani', 'inspector', 'gabinete'];
  const AV = (id) => 'icons/av_' + (ORDER.includes(id) || id === 'cristian' ? id : 'cristian') + '.svg';
  const ESTADO = { trabajando: 'Trabajando', esperando: 'Te espera', alerta: 'Alerta', libre: 'Libre', fuera: 'Sin cubrir' };
  const PRIO = { esperando: 0, alerta: 1, trabajando: 2, libre: 3, fuera: 9 };

  // ---------- tiempo ----------
  const d = (v) => { const x = v ? new Date(v) : null; return x && !isNaN(x) ? x : null; };
  const hm = (v) => { const x = d(v); return x ? x.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''; };
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  function rel(v) {
    const x = d(v); if (!x) return '';
    const s = (Date.now() - x) / 1000;
    if (s < 60) return 'Ahora mismo'; if (s < 3600) return 'Hace ' + Math.floor(s / 60) + ' min';
    if (sameDay(x, new Date())) return 'Hoy, ' + hm(v);
    const y = new Date(); y.setDate(y.getDate() - 1); if (sameDay(x, y)) return 'Ayer, ' + hm(v);
    return x.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ', ' + hm(v);
  }
  function dayLabel(v) {
    const x = d(v); if (!x) return '';
    if (sameDay(x, new Date())) return 'Hoy';
    const y = new Date(); y.setDate(y.getDate() - 1); if (sameDay(x, y)) return 'Ayer';
    return x.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  const isToday = (v) => { const x = d(v); return !!x && sameDay(x, new Date()); };

  // ---------- datos de ejemplo ----------
  function demoState() {
    const now = Date.now(), ago = (m) => new Date(now - m * 60000).toISOString();
    return {
      demo: true, updatedAt: ago(0),
      agents: {
        lucia: { name: 'Lucía', role: 'Recepción · email', status: 'trabajando', task: 'Revisando Outlook · 23 hilos nuevos', lastAction: 'Repartió 23 emails', lastAt: ago(4), next: 'Revisión de tarde a las 15:45', schedule: 'L–V 7:45 y 15:45', autonomy: 'Categoriza y deja borradores; no envía', doneWeek: 3 },
        olga: { name: 'Olga', role: 'Analista · métricas', status: 'esperando', task: 'Análisis DSP WK45 listo para enviar', lastAction: 'Dejó el análisis para aprobar', lastAt: ago(12), next: 'Mensajes DA de la semana', schedule: 'Cuando le pases el scorecard', autonomy: 'Prepara; nunca envía', doneWeek: 4 },
        marta: { name: 'Marta', role: 'Selección y entrevistas', status: 'libre', task: '', lastAction: 'Cargó 18 candidatos de la WK46', lastAt: ago(95), next: 'Entrevistas DMZ4 del jueves', schedule: 'A demanda (WK##)', autonomy: 'Prepara; no descarta a nadie', doneWeek: 2 },
        dani: { name: 'Dani', role: 'Onboarding', status: 'alerta', task: 'Revisando diplomas pendientes', lastAction: 'Preparó MIGRAR 09/11', lastAt: ago(30), next: 'Carpetas INCORPORACIONES', schedule: 'L–V 9:10', autonomy: 'Renombra y mueve; no borra ni envía', doneWeek: 5 },
        inspector: { name: 'El Inspector', role: 'Auditoría y alertas', status: 'fuera' },
        gabinete: { name: 'Jefa de gabinete', role: 'Parte diario', status: 'fuera' }
      },
      approvals: [
        { id: 'e1', agent: 'olga', at: ago(12), what: 'Enviar el Análisis DSP WK45 a Amazon', to: 'Amazon', detail: 'DCR, DSC DPMO y POD con causa raíz y plan de acción. Solo Transporter IDs.', priority: 'alta', decision: 'pendiente' },
        { id: 'e2', agent: 'lucia', at: ago(40), what: 'Responder a Angel sobre asistencia VAD7', to: 'Angel Martín', detail: 'Borrador listo en Outlook.', priority: 'media', decision: 'pendiente' },
        { id: 'e3', agent: 'dani', at: ago(120), what: 'Carpeta MIGRAR 09/11 · 12 diplomas', to: 'Amazon', priority: 'baja', decision: 'aprobado', decidedAt: ago(110) }
      ],
      alerts: [
        { id: 'a1', agent: 'dani', at: ago(30), level: 'rojo', station: 'DMZ4', text: '3 conductores llevan más de 7 días sin diploma', action: 'Revisar su módulo en Amiigo', state: 'abierta' },
        { id: 'a2', agent: 'lucia', at: ago(150), level: 'amarillo', station: 'Outlook', text: '2 emails de Amazon sin responder desde hace 48 h', action: 'Revisar los borradores', state: 'abierta' }
      ],
      log: [
        { id: 'l1', agent: 'lucia', at: ago(4), text: 'repartió 23 emails: 4 a Olga, 6 a Marta, 3 a Dani', state: 'ok' },
        { id: 'l2', agent: 'olga', at: ago(12), text: 'dejó el análisis WK45 para aprobar', state: 'pendiente' },
        { id: 'l3', agent: 'dani', at: ago(30), text: 'avisó: 3 conductores sin diploma desde hace 7 días', state: 'error' },
        { id: 'l4', agent: 'cristian', at: ago(110), text: 'aprobó MIGRAR 09/11', state: 'ok' },
        { id: 'l5', agent: 'dani', at: ago(120), text: 'renombró 12 diplomas y preparó MIGRAR 09/11', state: 'ok' },
        { id: 'l6', agent: 'marta', at: ago(95), text: 'cargó 18 candidatos de la semana 46', state: 'ok' },
        { id: 'l7', agent: 'lucia', at: ago(1440 + 30), text: 'cerró la revisión de tarde', state: 'ok' }
      ]
    };
  }

  // ---------- estado de la app ----------
  const cfg = { url: store.get('url', ''), clave: store.get('clave', ''), demo: store.get('demo', true), avisos: store.get('avisos', false) };
  let S = store.get('cache', null);
  if (cfg.demo || !S) S = cfg.demo ? demoState() : { agents: {}, approvals: [], alerts: [], log: [] };
  let filter = 'todos', view = 'oficina';
  const seen = new Set(), counts = {};
  let ready = false; setTimeout(() => { ready = true; }, 1200);
  const notified = new Set(store.get('notified', []));

  // ---------- oficina ----------
  const office = new window.Office($('stage-inner'), { onPick: (id) => openAgent(id) });

  // ---------- red ----------
  async function fetchState() {
    if (cfg.demo) return;
    if (!cfg.url || !cfg.clave) return;
    try {
      const r = await fetch(cfg.url + (cfg.url.includes('?') ? '&' : '?') + 'clave=' + encodeURIComponent(cfg.clave) + '&t=' + Date.now(), { cache: 'no-store' });
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      setState(j); store.set('cache', j);
    } catch (e) { if (navigator.onLine === false) toast('Sin conexión. Te enseño lo último que vi.'); }
  }
  async function post(body) {
    if (cfg.demo) return null;
    const r = await fetch(cfg.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ clave: cfg.clave, ...body }) });
    const j = await r.json(); if (j.error) throw new Error(j.error);
    return j;
  }
  function setState(next) {
    const prev = S; S = next;
    // cambios de estado → destello en la lista
    for (const id of ORDER) {
      const a = prev.agents && prev.agents[id], b = next.agents && next.agents[id];
      if (ready && a && b && a.status !== b.status) flashIds.add(id);
    }
    notify(next);
    render();
  }
  const flashIds = new Set();

  // ---------- avisos ----------
  async function notify(st) {
    const fresh = [];
    for (const x of st.approvals || []) if ((x.decision || 'pendiente') === 'pendiente' && !notified.has('ap' + x.id)) { notified.add('ap' + x.id); fresh.push({ t: name(x.agent) + ' te pide aprobación', b: x.what, tag: 'ap' + x.id }); }
    for (const x of st.alerts || []) if (x.level === 'rojo' && (x.state || 'abierta') === 'abierta' && !notified.has('al' + x.id)) { notified.add('al' + x.id); fresh.push({ t: 'Alerta de ' + name(x.agent), b: x.text, tag: 'al' + x.id }); }
    store.set('notified', Array.from(notified).slice(-300));
    if (!ready || st.demo || !fresh.length) return;
    if (!document.hidden) { toast(fresh[0].t + ': ' + fresh[0].b); return; }
    if (!cfg.avisos || !('Notification' in window) || Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker?.getRegistration();
    for (const f of fresh) reg ? reg.showNotification(f.t, { body: f.b, tag: f.tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' }) : new Notification(f.t, { body: f.b });
  }

  // ---------- render ----------
  const name = (id) => id === 'cristian' ? 'Cristian' : (S.agents[id] && S.agents[id].name) || id;
  function fresh(key) { if (seen.has(key)) return ''; seen.add(key); return ready && !RM ? ' enter' : ''; }
  function bump(el, n) { const p = counts[el.id]; counts[el.id] = n; el.textContent = n; if (ready && p !== undefined && n > p && !RM) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } }

  function render() {
    const A = S.agents || {};
    // saludo
    const h = new Date().getHours();
    $('saludo').textContent = h < 6 ? 'Buenas noches' : h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
    const f = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    $('fecha').textContent = f.charAt(0).toUpperCase() + f.slice(1);
    $('demo-banner').hidden = !cfg.demo;

    const ids = ORDER.filter((id) => A[id]);
    const n = (st) => ids.filter((id) => A[id].status === st).length;
    const pend = (S.approvals || []).filter((x) => (x.decision || 'pendiente') === 'pendiente');
    const open = (S.alerts || []).filter((x) => (x.state || 'abierta') === 'abierta');

    // chips
    const chips = [];
    if (n('trabajando')) chips.push(`<span class="chip ok"><i></i><b>${n('trabajando')}</b> trabajando</span>`);
    if (pend.length) chips.push(`<button class="chip warn" data-go="aprobar"><i></i><b>${pend.length}</b> ${pend.length === 1 ? 'te espera' : 'te esperan'}</button>`);
    if (open.length) chips.push(`<button class="chip bad" data-go="registro"><i></i><b>${open.length}</b> ${open.length === 1 ? 'alerta' : 'alertas'}</button>`);
    if (!chips.length) chips.push(`<span class="chip idle"><i></i>Todo tranquilo</span>`);
    $('chips').innerHTML = chips.join('');

    office.update(A);

    // ahora mismo
    const live = ids.filter((id) => A[id].status !== 'fuera').sort((p, q) => (PRIO[A[p].status] ?? 5) - (PRIO[A[q].status] ?? 5));
    $('people').innerHTML = live.map((id) => {
      const a = A[id], st = a.status || 'libre';
      const tk = a.task || (a.lastAction ? a.lastAction + ' · ' + rel(a.lastAt).toLowerCase() : 'Sin tarea ahora');
      const fl = flashIds.has(id) ? ' flash' : '';
      return `<button class="person${fl}" data-agent="${esc(id)}"><img src="${AV(id)}" alt=""><span class="who"><span class="nm">${esc(a.name)}</span><span class="tk">${esc(tk)}</span></span><span class="pill ${st}">${esc(ESTADO[st] || st)}</span></button>`;
    }).join('') || `<div class="empty"><b>Aún no hay nadie</b>Cuando tus agentes empiecen a trabajar aparecerán aquí.</div>`;
    flashIds.clear();
    const vac = ids.filter((id) => A[id].status === 'fuera').map((id) => A[id].name);
    $('vacantes').hidden = !vac.length;
    $('vacantes').textContent = vac.length ? 'Puestos por cubrir: ' + vac.join(' y ') + '.' : '';

    // badges
    bump($('badge'), pend.length); $('badge').hidden = !pend.length;
    const red = open.filter((x) => x.level === 'rojo').length;
    bump($('badge-al'), red); $('badge-al').hidden = !red;

    renderApprovals(pend);
    renderLog(open);
    if ($('sheet').open && $('sheet').dataset.id) fillAgent($('sheet').dataset.id);
  }

  function renderApprovals(pend) {
    $('apr-meta').textContent = pend.length ? pend.length + (pend.length === 1 ? ' pendiente' : ' pendientes') : 'Todo al día';
    $('apr-list').innerHTML = pend.map((x) => card(x, true)).join('') ||
      `<div class="empty"><b>Todo al día</b>Cuando un agente prepare algo que necesite tu sí, aparecerá aquí.</div>`;
    const done = (S.approvals || []).filter((x) => x.decision && x.decision !== 'pendiente' && isToday(x.decidedAt));
    $('apr-done-t').hidden = !done.length;
    $('apr-done').innerHTML = done.map((x) => card(x, false)).join('');
  }
  function card(x, pending) {
    const prio = x.priority === 'alta' ? '<span class="pill alerta">Urgente</span>' : '';
    const link = x.link ? ` <a href="${esc(x.link)}" target="_blank" rel="noopener">Abrir</a>` : '';
    const det = (x.detail || '') + (x.to ? (x.detail ? ' ' : '') + 'Para: ' + x.to + '.' : '');
    const ok = x.decision === 'aprobado';
    const foot = pending
      ? `<div class="acts"><button class="btn back" data-dec="devuelto" data-id="${esc(x.id)}">Devolver</button><button class="btn approve" data-dec="aprobado" data-id="${esc(x.id)}">Aprobar</button></div>`
      : `<span class="stamp ${ok ? 'ok' : 'no'}"><svg viewBox="0 0 24 24" aria-hidden="true">${ok ? '<path d="m5 12 4 4 10-10"/>' : '<path d="M6 6l12 12M18 6 6 18"/>'}</svg>${ok ? 'Aprobado' : 'Devuelto'} · ${esc(hm(x.decidedAt))}</span>`;
    return `<article class="card${fresh('ap' + x.id + (pending ? 'p' : 'd'))}" id="card-${esc(x.id)}"><div class="head"><img src="${AV(x.agent)}" alt=""><span class="who"><b>${esc(name(x.agent))}</b><small>${esc(rel(x.at))}</small></span>${prio}</div><div class="what">${esc(x.what)}</div>${det || link ? `<div class="det">${esc(det)}${link}</div>` : ''}${foot}</article>`;
  }

  function renderLog(open) {
    $('alerts').innerHTML = open.map((x) => `<div class="alert ${x.level === 'rojo' ? 'rojo' : 'amarillo'}${fresh('al' + x.id)}" id="al-${esc(x.id)}"><div class="hd"><span class="tag">${x.level === 'rojo' ? 'Grave' : 'Aviso'}</span><b>${esc(name(x.agent))}${x.station ? ' · ' + esc(x.station) : ''}</b><time>${esc(hm(x.at))}</time></div><div class="tx">${esc(x.text)}</div>${x.action ? `<div class="pr">Propone: ${esc(x.action)}</div>` : ''}<button class="btn" data-resolve="${esc(x.id)}">Marcar resuelta</button></div>`).join('');
    const ids = ['todos', ...ORDER.filter((id) => S.agents[id] && S.agents[id].status !== 'fuera')];
    $('filters').innerHTML = ids.map((id) => `<button aria-pressed="${filter === id}" data-filter="${esc(id)}">${id === 'todos' ? 'Todos' : esc(name(id))}</button>`).join('');
    const L = (S.log || []).filter((l) => filter === 'todos' || l.agent === filter).slice(0, 80);
    let lastDay = '', html = '';
    for (const l of L) {
      const dl = dayLabel(l.at);
      if (dl !== lastDay) { html += `<div class="day">${esc(dl)}</div>`; lastDay = dl; }
      const pill = l.state === 'pendiente' ? '<span class="pill esperando">pendiente</span>' : l.state === 'error' ? '<span class="pill alerta">error</span>' : '';
      html += `<div class="entry${fresh('lg' + l.id)}"><img src="${AV(l.agent)}" alt=""><span class="tx"><b>${esc(name(l.agent))}</b> ${esc(l.text)}${pill}</span><time>${esc(hm(l.at))}</time></div>`;
    }
    $('log').innerHTML = html || `<div class="empty"><b>Sin movimiento todavía</b>Aquí verás cada paso de tus agentes, con su hora.</div>`;
  }

  // ---------- ficha ----------
  function openAgent(id) {
    if (!S.agents[id] || S.agents[id].status === 'fuera') { toast((S.agents[id] && S.agents[id].name || 'Este puesto') + ' aún está por cubrir'); return; }
    $('sheet').dataset.id = id; fillAgent(id);
    try { $('sheet').showModal(); } catch (e) { $('sheet').setAttribute('open', ''); }
  }
  function fillAgent(id) {
    const a = S.agents[id], st = a.status || 'libre';
    const ring = { trabajando: '#7FD9A8', esperando: '#FFD861', alerta: '#FF9A9D', libre: '#E6EAF1' }[st];
    $('s-av').src = AV(id); $('s-av').parentElement.style.setProperty('--ring-c', ring);
    const bub = { esperando: ['?', '#FFC93C'], alerta: ['!', '#FF5A5F'], trabajando: ['…', '#FFFFFF'] }[st];
    $('s-bub').hidden = !bub; if (bub) { $('s-bub').textContent = bub[0]; $('s-bub').style.background = bub[1]; }
    $('s-name').textContent = a.name; $('s-role').textContent = a.role || '';
    $('s-pill').className = 'pill ' + st; $('s-pill').textContent = st === 'esperando' ? 'Esperándote en tu despacho' : ESTADO[st];
    const myPend = (S.approvals || []).filter((x) => x.agent === id && (x.decision || 'pendiente') === 'pendiente');
    $('s-now').innerHTML = `<div><small>Ahora</small><b>${esc(a.task || 'Sin tarea en curso')}</b></div>` +
      (a.next ? `<div><small>Después</small><span>${esc(a.next)}</span></div>` : '') +
      (myPend.length ? `<button class="btn primary" data-go="aprobar" type="button">Revisar ${myPend.length === 1 ? 'su petición' : 'sus ' + myPend.length + ' peticiones'}</button>` : '');
    $('s-week').innerHTML = `Esta semana: <b>${Number(a.doneWeek) || 0} ${Number(a.doneWeek) === 1 ? 'tarea' : 'tareas'}</b>` + (a.lastAction ? ` · última: ${esc(a.lastAction)} (${esc(rel(a.lastAt).toLowerCase())})` : '');
    const L = (S.log || []).filter((l) => l.agent === id).slice(0, 8);
    $('s-log').innerHTML = L.map((l) => `<time>${esc(isToday(l.at) ? hm(l.at) : rel(l.at))}</time><i class="${esc(l.state || '')}"></i><span>${esc(l.text)}</span>`).join('') || '<span style="grid-column:1/-1;color:var(--muted)">Todavía no ha registrado nada.</span>';
    $('s-kv').innerHTML = [['Horario', a.schedule], ['Autonomía', a.autonomy]].filter((r) => r[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
  }
  $('s-close').onclick = () => $('sheet').close();
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) $('sheet').close(); });

  // ---------- acciones ----------
  async function decide(id, dec, btn) {
    const x = (S.approvals || []).find((a) => a.id === id); if (!x) return;
    const cardEl = $('card-' + id); cardEl && cardEl.querySelectorAll('button').forEach((b) => (b.disabled = true));
    const before = JSON.parse(JSON.stringify(S));
    x.decision = dec; x.decidedAt = new Date().toISOString();
    (S.log = S.log || []).unshift({ id: 'c' + Date.now(), agent: 'cristian', at: x.decidedAt, text: (dec === 'aprobado' ? 'aprobó: ' : 'devolvió: ') + x.what, state: 'ok' });
    if (cardEl) {
      const ok = dec === 'aprobado';
      cardEl.querySelector('.acts').outerHTML = `<span class="stamp ${ok ? 'ok' : 'no'}"><svg viewBox="0 0 24 24" aria-hidden="true">${ok ? '<path d="m5 12 4 4 10-10"/>' : '<path d="M6 6l12 12M18 6 6 18"/>'}</svg>${ok ? 'Aprobado' : 'Devuelto'}</span>`;
      cardEl.classList.add('leaving');
    }
    office.decision(x.agent, dec === 'aprobado');
    toast(dec === 'aprobado' ? 'Aprobado. ' + name(x.agent) + ' lo verá en su próxima tanda.' : 'Devuelto a ' + name(x.agent) + '.');
    setTimeout(render, RM ? 0 : 1150);
    try { const j = await post({ action: 'decidir', id, decision: dec }); if (j) { S = j; store.set('cache', j); } }
    catch (e) { S = before; render(); toast('No se pudo guardar. Revisa la conexión e inténtalo otra vez.'); }
  }
  async function resolve(id, btn) {
    const x = (S.alerts || []).find((a) => a.id === id); if (!x) return;
    const el = $('al-' + id); btn.disabled = true; el && el.classList.add('leaving');
    const before = JSON.parse(JSON.stringify(S));
    x.state = 'resuelta';
    setTimeout(render, RM ? 0 : 500);
    try { const j = await post({ action: 'resolver', id }); if (j) { S = j; store.set('cache', j); } }
    catch (e) { S = before; render(); toast('No se pudo marcar. Inténtalo otra vez.'); }
  }

  // ---------- navegación ----------
  function go(v, push = true) {
    if (!['oficina', 'aprobar', 'registro', 'ajustes'].includes(v)) v = 'oficina';
    view = v;
    document.querySelectorAll('.view').forEach((el) => (el.hidden = el.dataset.view !== v));
    document.querySelectorAll('.tabbar button').forEach((b) => { if (b.dataset.go === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (push && location.hash !== '#' + v) history.pushState(null, '', v === 'oficina' ? location.pathname : '#' + v);
    if ($('sheet').open) $('sheet').close();
    window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
  }
  window.addEventListener('popstate', () => go((location.hash || '#oficina').slice(1), false));
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go],[data-agent],[data-dec],[data-resolve],[data-filter]');
    if (!t) return;
    if (t.dataset.go) go(t.dataset.go);
    else if (t.dataset.agent) openAgent(t.dataset.agent);
    else if (t.dataset.dec) decide(t.dataset.id, t.dataset.dec, t);
    else if (t.dataset.resolve) resolve(t.dataset.resolve, t);
    else if (t.dataset.filter) { filter = t.dataset.filter; renderLog((S.alerts || []).filter((x) => (x.state || 'abierta') === 'abierta')); }
  });
  $('go-ajustes').onclick = () => go('ajustes');

  // ---------- zoom y arrastre de la maqueta ----------
  (function zoom() {
    const stage = $('stage'), inner = $('stage-inner');
    let s = 1, tx = 0, ty = 0; const ptrs = new Map(); let start = null;
    const apply = (ease) => {
      const w = stage.clientWidth, h = stage.clientHeight;
      s = Math.min(3, Math.max(1, s));
      tx = Math.min(0, Math.max(w - w * s, tx)); ty = Math.min(0, Math.max(h - h * s, ty));
      inner.classList.toggle('ease', !!ease && !RM);
      inner.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
      stage.classList.toggle('zoomed', s > 1.01);
      $('z-out').disabled = s <= 1.01; $('z-in').disabled = s >= 2.99;
    };
    const zoomAt = (ns, cx, cy, ease) => { const k = ns / s; tx = cx - (cx - tx) * k; ty = cy - (cy - ty) * k; s = ns; apply(ease); };
    const hide = () => $('hint').classList.add('gone');
    $('z-in').onclick = () => { hide(); zoomAt(s * 1.5, stage.clientWidth / 2, stage.clientHeight / 2, true); };
    $('z-out').onclick = () => { zoomAt(s / 1.5, stage.clientWidth / 2, stage.clientHeight / 2, true); };
    let lastTap = 0;
    stage.addEventListener('pointerdown', (e) => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const r = stage.getBoundingClientRect();
      if (ptrs.size === 1) {
        start = { x: e.clientX, y: e.clientY, tx, ty, moved: false };
        const now = Date.now();
        if (now - lastTap < 300) { hide(); zoomAt(s > 1.5 ? 1 : 2.2, e.clientX - r.left, e.clientY - r.top, true); if (s <= 1.01) { tx = 0; ty = 0; apply(true); } }
        lastTap = now;
      } else if (ptrs.size === 2) {
        const [a, b] = Array.from(ptrs.values());
        start = { dist: Math.hypot(a.x - b.x, a.y - b.y), s, cx: (a.x + b.x) / 2 - r.left, cy: (a.y + b.y) / 2 - r.top, moved: true };
        hide();
      }
    });
    stage.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId) || !start) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2 && start.dist) {
        const [a, b] = Array.from(ptrs.values());
        zoomAt(start.s * Math.hypot(a.x - b.x, a.y - b.y) / start.dist, start.cx, start.cy, false);
      } else if (ptrs.size === 1 && s > 1.01) {
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) start.moved = true;
        tx = start.tx + dx; ty = start.ty + dy; apply(false);
      }
    });
    const end = (e) => { ptrs.delete(e.pointerId); if (ptrs.size === 0) setTimeout(() => { start = null; }, 0); };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    stage.addEventListener('click', (e) => { if (start && start.moved) { e.stopPropagation(); e.preventDefault(); } }, true);
    window.addEventListener('resize', () => apply(false));
    setTimeout(hide, 7000);
    apply(false);
  })();

  // ---------- ajustes ----------
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; renderInstall(); });
  window.addEventListener('appinstalled', () => { deferred = null; renderInstall(); toast('La Oficina ya está en tu pantalla de inicio'); });
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let osTab = /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : 'android';
  function renderInstall() {
    const b = $('install-body');
    if (standalone()) { b.innerHTML = `<p class="ok-line">✓ Instalada. La abres desde tu pantalla de inicio.</p>`; return; }
    const steps = osTab === 'ios'
      ? ['Abre esta página en Safari.', 'Toca Compartir y luego «Añadir a pantalla de inicio».', 'Ábrela desde el icono nuevo.']
      : ['Abre esta página en Chrome.', 'Pulsa «Instalar La Oficina».', 'Acepta y aparecerá en tu pantalla de inicio.'];
    b.innerHTML = `<div class="seg" role="tablist" aria-label="Tu móvil"><button type="button" role="tab" aria-selected="${osTab === 'android'}" data-os="android">Android</button><button type="button" role="tab" aria-selected="${osTab === 'ios'}" data-os="ios">iPhone</button></div><ol class="steps">${steps.map((s) => `<li>${s}</li>`).join('')}</ol>` +
      (osTab === 'android' ? `<button class="btn orange" type="button" id="do-install" ${deferred ? '' : 'disabled'}>${deferred ? 'Instalar La Oficina' : 'Ábrela en Chrome para instalar'}</button>` : '');
    b.querySelectorAll('[data-os]').forEach((x) => (x.onclick = () => { osTab = x.dataset.os; renderInstall(); }));
    const di = $('do-install'); if (di) di.onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; renderInstall(); };
  }
  $('f-url').value = cfg.url; $('f-clave').value = cfg.clave; $('demo').checked = cfg.demo; $('avisos').checked = cfg.avisos;
  $('conn').addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = $('f-url').value.trim(), clave = $('f-clave').value.trim(), st = $('conn-state');
    st.className = 'conn-state'; st.textContent = 'Conectando…';
    try {
      const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'clave=' + encodeURIComponent(clave), { cache: 'no-store' });
      const j = await r.json();
      if (j.error) throw new Error(j.error === 'clave' ? 'La clave no coincide con la del Apps Script.' : j.error);
      Object.assign(cfg, { url, clave, demo: false });
      store.set('url', url); store.set('clave', clave); store.set('demo', false); $('demo').checked = false;
      st.className = 'conn-state ok'; st.textContent = '✓ Conectada';
      seen.clear(); setState(j); store.set('cache', j);
    } catch (err) {
      st.className = 'conn-state bad';
      st.textContent = err.message && err.message.includes('clave') ? err.message : 'No responde. Revisa la dirección y que el Apps Script esté implementado para «Cualquiera».';
    }
  });
  $('demo').addEventListener('change', () => {
    cfg.demo = $('demo').checked; store.set('demo', cfg.demo);
    if (cfg.demo) setState(demoState()); else if (cfg.url) fetchState(); else { $('demo').checked = true; cfg.demo = true; store.set('demo', true); toast('Primero conecta tu oficina'); }
  });
  $('avisos').addEventListener('change', async () => {
    if ($('avisos').checked && 'Notification' in window && Notification.permission !== 'granted') {
      const p = await Notification.requestPermission();
      if (p !== 'granted') { $('avisos').checked = false; toast('Los avisos están bloqueados en los ajustes del móvil'); }
    }
    cfg.avisos = $('avisos').checked; store.set('avisos', cfg.avisos);
  });
  if (!('Notification' in window)) { $('avisos').disabled = true; $('avisos').closest('.panel').querySelector('small').textContent = 'Este navegador no permite avisos. En iPhone, instala la app primero.'; }

  // ---------- toast ----------
  let tt = 0;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 3200); }

  // ---------- simulación en modo ejemplo ----------
  const CYCLE = ['libre', 'trabajando', 'trabajando', 'esperando', 'libre', 'alerta', 'trabajando'];
  setInterval(() => {
    if (!cfg.demo || document.hidden) return;
    const ids = ['lucia', 'olga', 'marta', 'dani'], id = ids[Math.floor(Math.random() * ids.length)];
    const a = S.agents[id], next = JSON.parse(JSON.stringify(S));
    const st = CYCLE[(CYCLE.indexOf(a.status) + 1) % CYCLE.length];
    next.agents[id] = { ...a, status: st, task: st === 'trabajando' ? a.next || a.task || 'Trabajando' : st === 'libre' ? '' : a.task, lastAt: new Date().toISOString() };
    next.log.unshift({ id: 'sim' + Date.now(), agent: id, at: new Date().toISOString(), text: st === 'trabajando' ? 'se puso a trabajar' : st === 'libre' ? 'terminó y se fue a por un café' : st === 'esperando' ? 'te espera en tu despacho' : 'levantó una alerta', state: st === 'alerta' ? 'error' : st === 'esperando' ? 'pendiente' : 'ok' });
    setState(next);
  }, 11000);

  // ---------- arranque ----------
  go((location.hash || '#oficina').slice(1), false);
  render(); renderInstall(); fetchState();
  setInterval(() => { if (!document.hidden) fetchState(); }, 20000);
  setInterval(() => { if (!document.hidden) render(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) fetchState(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
