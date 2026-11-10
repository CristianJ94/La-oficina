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

  const ORDER = ['lucia', 'ana', 'marta', 'dani', 'marilyn', 'inspector', 'gabinete'];
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
        ana: { name: 'Ana', role: 'Métricas y scorecard', status: 'esperando', task: 'Análisis DSP WK45 listo para enviar', lastAction: 'Dejó el análisis para aprobar', lastAt: ago(12), next: 'Mensajes DA de la semana', schedule: 'Cuando le pases el scorecard', autonomy: 'Prepara; nunca envía', doneWeek: 4 },
        marta: { name: 'Marta', role: 'Selección y entrevistas', status: 'libre', task: '', lastAction: 'Cargó 18 candidatos de la WK46', lastAt: ago(95), next: 'Entrevistas DMZ4 del jueves', schedule: 'A demanda (WK##)', autonomy: 'Prepara; no descarta a nadie', doneWeek: 2 },
        dani: { name: 'Dani', role: 'Onboarding', status: 'alerta', task: 'Revisando diplomas pendientes', lastAction: 'Preparó MIGRAR 09/11', lastAt: ago(30), next: 'Carpetas INCORPORACIONES', schedule: 'L–V 9:10', autonomy: 'Renombra y mueve; no borra ni envía', doneWeek: 5 },
        marilyn: { name: 'Marilyn', role: 'WhatsApp de empresa', status: 'esperando', task: '', lastAction: 'Leyó 9 chats nuevos', lastAt: ago(8), next: 'Próxima ronda a las 12:02', schedule: 'L–V cada 2 horas, de 9:02 a 17:02', autonomy: 'Lee y avisa; solo envía lo que tú apruebas', doneWeek: 6 },
        inspector: { name: 'El Inspector', role: 'Auditoría y alertas', status: 'fuera' },
        gabinete: { name: 'Jefa de gabinete', role: 'Parte diario', status: 'fuera' }
      },
      approvals: [
        { id: 'd1', agent: 'ana', kind: 'lote', at: ago(15), station: 'VAD7', what: 'Daily metrics VAD7 · 3 conductores con fallos', detail: 'Reclamaciones y POD de los días 8 y 9/11.', priority: 'media', decision: 'pendiente', mensajes: [{ id: '1', nombre: 'Jorge Alonso', text: 'Hola Jorge. Soy Cristian, compañero de Álvaro y Antonio y responsable de calidad y métricas de la estación. Ayer tuviste 1 paquete que el cliente dice no haber recibido: ES2644343859 · Hogar · 31 m ⚠️ · SIN contacto. MARCAJES SIEMPRE EN EL PUNTO y pregunta siempre el nombre de quien recibe.' }, { id: '2', nombre: 'Laura Rosado', text: 'Hola Laura. … 2 fotos POD rechazadas (borrosas).' }, { id: '3', nombre: 'Hugo Villa', text: 'Hola Hugo. … entrega en vecino sin llamada previa.' }] },
        { id: 'w1', agent: 'marilyn', kind: 'libre', at: ago(8), nombre: 'Jorge Ruiz', fechas: ['19/11/2026'], what: 'Jorge Ruiz pide librar el 19/11', detail: 'Motivo: cita en el banco. Centro por confirmar.', priority: 'media', decision: 'pendiente' },
        { id: 'w2', agent: 'marilyn', kind: 'libre', at: ago(20), nombre: 'Sara Gil', fechas: ['21/11/2026', '22/11/2026'], station: 'VAD4', rrhhName: 'SARA GIL MORENO', what: 'Sara Gil Moreno pide librar el 21/11 y 22/11', detail: 'Motivo: boda familiar. Centro: VAD4.', priority: 'media', decision: 'pendiente' },
        { id: 'e1', agent: 'ana', at: ago(12), what: 'Enviar el Análisis DSP WK45 a Amazon', to: 'Amazon', detail: 'DCR, DSC DPMO y POD con causa raíz y plan de acción. Solo Transporter IDs.', priority: 'alta', decision: 'pendiente' },
        { id: 'e2', agent: 'lucia', at: ago(40), what: 'Responder a Angel sobre asistencia VAD7', to: 'Angel Martín', detail: 'Borrador listo en Outlook.', priority: 'media', decision: 'pendiente' },
        { id: 'e3', agent: 'dani', at: ago(120), what: 'Carpeta MIGRAR 09/11 · 12 diplomas', to: 'Amazon', priority: 'baja', decision: 'aprobado', decidedAt: ago(110) }
      ],
      alerts: [
        { id: 'a1', agent: 'dani', at: ago(30), level: 'rojo', station: 'DMZ4', text: '3 conductores llevan más de 7 días sin diploma', action: 'Revisar su módulo en Amiigo', state: 'abierta' },
        { id: 'a2', agent: 'lucia', at: ago(150), level: 'amarillo', station: 'Outlook', text: '2 emails de Amazon sin responder desde hace 48 h', action: 'Revisar los borradores', state: 'abierta' }
      ],
      rondas: [
        { id: 'r1', agent: 'marilyn', inicio: ago(14), fin: ago(8), status: 'esperando', resumen: 'Enviados 4 mensajes y leídos 9 chats: 2 peticiones de día libre', cifras: { 'Enviados': 4, 'Chats leídos': 9, 'Peticiones': 2, 'Fallidos': 1 }, items: [
          { k: 'enviado', at: ago(13), para: 'Jorge Alonso', station: 'VAD7', origen: 'Daily metrics VAD7 · 3 conductores', text: 'Hola Jorge. Soy Cristian, compañero de Álvaro y Antonio… Ayer tuviste 1 paquete que el cliente dice no haber recibido: ES2644343859 · Hogar · 31 m ⚠️ · SIN contacto.' },
          { k: 'enviado', at: ago(13), para: 'Laura Rosado', station: 'VAD7', origen: 'Daily metrics VAD7 · 3 conductores', text: 'Hola Laura. … 2 fotos POD rechazadas (borrosas).' },
          { k: 'enviado', at: ago(12), para: 'Pedro Sanz', station: 'VAD4', origen: 'Día libre aceptado', text: 'Hola Pedro, se ha aceptado tu petición de día libre para el 14/11. ¡Un saludo!' },
          { k: 'enviado', at: ago(12), para: 'Ana López', station: 'DMZ4', origen: 'Día libre denegado', text: 'Hola Ana, se ha denegado tu solicitud de día libre para el 15/11 por motivos de volumen. Un saludo.' },
          { k: 'fallido', at: ago(11), para: 'Hugo Villa', station: 'VAD7', text: 'Hay dos chats con ese nombre' },
          { k: 'contacto', at: ago(11), text: 'Laura Rosado' },
          { k: 'peticion', at: ago(9), text: 'Jorge Ruiz pide librar el 19/11' },
          { k: 'peticion', at: ago(9), text: 'Sara Gil Moreno pide librar el 21/11 y 22/11', station: 'VAD4' }] },
        { id: 'r2', agent: 'ana', inicio: ago(40), fin: ago(15), status: 'esperando', resumen: 'Daily del 8 y 9/11: 3 lotes con los conductores más críticos', cifras: { 'Con fallos': 31, 'Críticos': 9, 'Mensajes': 9 }, items: [
          { k: 'lote', at: ago(16), text: 'Daily metrics VAD7 · 3 conductores', station: 'VAD7', n: 3, para: ['Jorge Alonso', 'Laura Rosado', 'Hugo Villa'] },
          { k: 'lote', at: ago(16), text: 'Daily metrics VAD4 · 4 conductores', station: 'VAD4', n: 4, para: ['Pedro Sanz', 'Raúl Díaz', 'Iván Mora', 'Eva Ríos'] },
          { k: 'registro', at: ago(30), text: 'descargó 6 Daily Report de Amazon Logistics', state: 'ok' }] },
        { id: 'r3', agent: 'lucia', inicio: ago(6), status: 'trabajando', task: 'Revisando Outlook', items: [{ k: 'ausencia', ok: true, at: ago(5), station: 'VAD7', text: 'A a JORGE RUIZ PEREZ el 10/11 en RRHH VAD7' }, { k: 'ausencia', ok: false, at: ago(5), station: 'VAD4', text: '«Fulano Raro» del 10/11: no aparece en ningún RRHH' }] },
        { id: 'r4', agent: 'lucia', inicio: ago(125), fin: ago(118), status: 'alerta', resumen: 'Revisados 23 emails: 1 crítico, 4 altos', cifras: { 'Emails': 23, 'Críticos': 1, 'Altos': 4, 'Borradores': 2 }, items: [
          { k: 'alerta', level: 'rojo', at: ago(120), station: 'DMZ4', text: 'Amazon pide respuesta hoy sobre DCR de DMZ4' },
          { k: 'email', nivel: 1, at: ago(118), station: 'DMZ4', text: 'Amazon · DCR semana 45, respuesta hoy', quien: 'Ana' },
          { k: 'email', nivel: 2, at: ago(118), station: 'VAD7', text: 'Angel Martín · Asistencia VAD7 de la semana', quien: 'Cristian' },
          { k: 'email', nivel: 4, at: ago(118), station: 'General', text: 'no-reply · Daily Report DMZ4' },
          { k: 'aprobacion', at: ago(119), text: 'Responder a Angel sobre asistencia VAD7' },
          { k: 'borrador', at: ago(119), text: 'Respuesta al scorecard VAD4 WK45', station: 'VAD4' }] },
        { id: 'r5', agent: 'marilyn', inicio: ago(135), fin: ago(133), status: 'libre', resumen: 'Sin novedades', cifras: { 'Enviados': 0, 'Chats leídos': 0 }, items: [] }
      ],
      log: [
        { id: 'l0', agent: 'marilyn', at: ago(8), text: 'leyó 9 chats: 2 peticiones de día libre, 1 aviso de retraso', state: 'pendiente' },
        { id: 'l1', agent: 'lucia', at: ago(4), text: 'repartió 23 emails: 4 a Ana, 6 a Marta, 3 a Dani', state: 'ok' },
        { id: 'l2', agent: 'ana', at: ago(12), text: 'dejó el análisis WK45 para aprobar', state: 'pendiente' },
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
  let filter = 'todos', view = 'oficina', infFilter = store.get('infFilter', 'todos');
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
    renderInformes();
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
    if (x.kind === 'libre') return cardLibre(x, pending);
    if (x.kind === 'lote') return cardLote(x, pending);
    const foot = pending
      ? `<div class="acts"><button class="btn back" data-dec="devuelto" data-id="${esc(x.id)}">Devolver</button><button class="btn approve" data-dec="aprobado" data-id="${esc(x.id)}">Aprobar</button></div>`
      : `<span class="stamp ${ok ? 'ok' : 'no'}"><svg viewBox="0 0 24 24" aria-hidden="true">${ok ? '<path d="m5 12 4 4 10-10"/>' : '<path d="M6 6l12 12M18 6 6 18"/>'}</svg>${ok ? 'Aprobado' : 'Devuelto'} · ${esc(hm(x.decidedAt))}</span>`;
    return `<article class="card${fresh('ap' + x.id + (pending ? 'p' : 'd'))}" id="card-${esc(x.id)}"><div class="head"><img src="${AV(x.agent)}" alt=""><span class="who"><b>${esc(name(x.agent))}</b><small>${esc(rel(x.at))}</small></span>${prio}</div><div class="what">${esc(x.what)}</div>${det || link ? `<div class="det">${esc(det)}${link}</div>` : ''}${foot}</article>`;
  }

  function cardLibre(x, pending) {
    const st = x.station ? `<span class="pill centro">${esc(x.station)}</span>` : '<span class="pill esperando">Centro por confirmar</span>';
    const ok = x.decision === 'aprobado';
    const foot = pending
      ? `<div class="acts"><button class="btn back" data-libre="devuelto" data-id="${esc(x.id)}">Denegar</button><button class="btn approve" data-libre="aprobado" data-id="${esc(x.id)}">Aceptar</button></div>`
      : `<span class="stamp ${ok ? 'ok' : 'no'}"><svg viewBox="0 0 24 24" aria-hidden="true">${ok ? '<path d="m5 12 4 4 10-10"/>' : '<path d="M6 6l12 12M18 6 6 18"/>'}</svg>${ok ? 'Aceptado' + (x.station ? ' · fucsia en ' + esc(x.station) : '') : 'Denegado'} · ${esc(hm(x.decidedAt))}</span>`;
    const msg = !pending && x.mensaje ? `<div class="det">${(S.outbox || []).some((o) => o.approvalId === x.id && o.sent) ? 'Mensaje enviado' : 'Marilyn enviará'}: «${esc(x.mensaje)}»</div>` : '';
    return `<article class="card libre${fresh('ap' + x.id + (pending ? 'p' : 'd'))}" id="card-${esc(x.id)}"><div class="head"><img src="${AV(x.agent)}" alt=""><span class="who"><b>${esc(name(x.agent))} · día libre</b><small>${esc(rel(x.at))}</small></span>${st}</div><div class="what">${esc(x.what)}</div>${x.detail ? `<div class="det">${esc(x.detail)}</div>` : ''}${msg}${foot}</article>`;
  }

  function cardLote(x, pending) {
    const ms = x.mensajes || [], ok = x.decision === 'aprobado';
    const st = x.station ? `<span class="pill centro">${esc(x.station)}</span>` : '';
    const link = x.link ? ` <a href="${esc(x.link)}" target="_blank" rel="noopener">Abrir</a>` : '';
    const list = pending ? `<details class="lote"><summary>Ver los ${ms.length} mensajes · quita los que no quieras enviar</summary>${ms.map((m) => `<label class="msg"><input type="checkbox" checked data-lote="${esc(x.id)}" value="${esc(m.id)}"><span><b>${esc(m.nombre || m.tid)}</b><span class="tx">${esc(m.text)}</span></span></label>`).join('')}</details>` : '';
    const foot = pending
      ? `<div class="acts"><button class="btn back" data-dec="devuelto" data-id="${esc(x.id)}">Devolver</button><button class="btn approve" data-lotego="${esc(x.id)}">Aprobar y enviar</button></div>`
      : `<span class="stamp ${ok ? 'ok' : 'no'}"><svg viewBox="0 0 24 24" aria-hidden="true">${ok ? '<path d="m5 12 4 4 10-10"/>' : '<path d="M6 6l12 12M18 6 6 18"/>'}</svg>${ok ? 'Aprobado · ' + (x.enviados ?? ms.length) + ' a Marilyn' : 'Devuelto'} · ${esc(hm(x.decidedAt))}</span>`;
    return `<article class="card lote${fresh('ap' + x.id + (pending ? 'p' : 'd'))}" id="card-${esc(x.id)}"><div class="head"><img src="${AV(x.agent)}" alt=""><span class="who"><b>${esc(name(x.agent))} · mensajes a conductores</b><small>${esc(rel(x.at))}</small></span>${st}</div><div class="what">${esc(x.what)}</div>${x.detail || link ? `<div class="det">${esc(x.detail || '')}${link}</div>` : ''}${list}${foot}</article>`;
  }
  async function decideLote(id) {
    const x = (S.approvals || []).find((a) => a.id === id); if (!x) return;
    const quitar = [...document.querySelectorAll(`input[data-lote="${CSS.escape(id)}"]`)].filter((i) => !i.checked).map((i) => i.value);
    const n = (x.mensajes || []).length - quitar.length;
    if (!n) { toast('Has quitado todos los mensajes. Usa «Devolver».'); return; }
    const cardEl = $('card-' + id); cardEl && cardEl.querySelectorAll('button').forEach((b) => (b.disabled = true));
    try {
      if (cfg.demo) { x.decision = 'aprobado'; x.decidedAt = new Date().toISOString(); x.enviados = n; }
      else { const j = await post({ action: 'decidir', id, decision: 'aprobado', quitar }); if (j) { S = j; store.set('cache', j); } }
    } catch (e) { render(); toast('No se pudo guardar. Revisa la conexión e inténtalo otra vez.'); return; }
    cardEl && cardEl.classList.add('leaving');
    office.decision(x.agent, true);
    toast(n + (n === 1 ? ' mensaje pasa' : ' mensajes pasan') + ' a Marilyn. Los enviará en sus próximas rondas.');
    setTimeout(render, RM ? 0 : 900);
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

  // ---------- informes ----------
  const KINDS = [
    ['enviado', 'Mensajes enviados'], ['fallido', 'No se pudieron enviar'], ['peticion', 'Peticiones de día libre'], ['lote', 'Lotes de mensajes preparados'],
    ['aprobacion', 'Te ha dejado para aprobar'], ['alerta', 'Alertas'], ['ausencia', 'Ausencias en el RRHH'], ['borrador', 'Borradores en Outlook'],
    ['email', 'Emails revisados'], ['procesada', 'Tus decisiones aplicadas'], ['contacto', 'Directorio completado'], ['regla', 'Reglas nuevas'], ['nota', 'Más detalles'], ['registro', 'Pasos']
  ];
  const CIFRA = { enviado: 'Enviados', fallido: 'Fallidos', peticion: 'Peticiones', lote: 'Lotes', aprobacion: 'Para aprobar', alerta: 'Alertas', ausencia: 'Ausencias', borrador: 'Borradores' };
  const NIVEL = { 1: 'Crítico', 2: 'Alto', 3: 'Normal', 4: 'Info' };
  const estadoRonda = (r) => !r.fin ? 'curso' : r.cortada ? 'vacia' : (r.items || []).some((i) => i.k === 'alerta' && i.level === 'rojo') || r.status === 'alerta' ? 'alerta'
    : r.status === 'esperando' ? 'esperando' : !(r.items || []).length && !Object.values(r.cifras || {}).some(Boolean) ? 'vacia' : 'ok';
  const PILL_R = { curso: ['trabajando', 'En curso'], alerta: ['alerta', 'Con alerta'], esperando: ['esperando', 'Te espera'], vacia: ['libre', 'Sin novedades'], ok: ['trabajando', 'Hecho'] };
  const dur = (a, b) => { const m = Math.round((d(b) - d(a)) / 60000); return m < 1 ? 'menos de 1 min' : m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60 ? m % 60 + ' min' : ''); };

  function renderInformes() {
    const R = (S.rondas || []).filter((r) => S.agents[r.agent]);
    const ags = ORDER.filter((id) => R.some((r) => r.agent === id));
    if (infFilter !== 'todos' && !ags.includes(infFilter)) infFilter = 'todos';
    $('inf-filters').innerHTML = ['todos', ...ags].map((id) => `<button aria-pressed="${infFilter === id}" data-inf="${esc(id)}">${id === 'todos' ? 'Todos' : esc(name(id))}</button>`).join('');
    const L = R.filter((r) => infFilter === 'todos' || r.agent === infFilter).sort((a, b) => d(b.inicio) - d(a.inicio));
    const hoy = L.filter((r) => isToday(r.inicio));
    $('inf-meta').textContent = hoy.length ? hoy.length + (hoy.length === 1 ? ' ronda hoy' : ' rondas hoy') : '';
    // franja de hoy
    const H0 = 8, H1 = 19, pos = (v) => { const x = d(v); return Math.max(0, Math.min(100, ((x.getHours() + x.getMinutes() / 60) - H0) / (H1 - H0) * 100)); };
    const filas = (infFilter === 'todos' ? ags : [infFilter]).map((id) => {
      const rs = hoy.filter((r) => r.agent === id);
      const env = rs.reduce((n, r) => n + (r.items || []).filter((i) => i.k === 'enviado').length, 0);
      const sub = rs.length ? rs.length + (rs.length === 1 ? ' ronda' : ' rondas') + (env ? ' · ' + env + ' env.' : '') : 'Sin rondas';
      const segs = rs.map((r) => { const a = pos(r.inicio), b = r.fin ? pos(r.fin) : pos(new Date().toISOString()); return `<span class="${estadoRonda(r)}" style="left:${a}%;width:${Math.max(b - a, 0.8)}%" title="${esc(hm(r.inicio))}"></span>`; }).join('');
      return `<div class="row"><img src="${AV(id)}" alt=""><div><b>${esc(name(id))}</b><small>${esc(sub)}</small></div><div class="track" role="img" aria-label="${esc(name(id) + ': ' + sub)}">${segs}</div></div>`;
    }).join('');
    $('inf-hoy').hidden = !filas;
    $('inf-hoy').innerHTML = filas ? `<h2>Hoy</h2>${filas}<div class="hours"><span>8:00</span><span>11:00</span><span>14:00</span><span>17:00</span><span>19:00</span></div>
      <div class="legend"><span><i></i>Hecho</span><span><i class="esperando"></i>Te espera</span><span><i class="alerta"></i>Con alerta</span><span><i class="vacia"></i>Sin novedades</span></div>` : '';
    // tarjetas
    let lastDay = '', html = '';
    for (const r of L.slice(0, 40)) {
      const dl = dayLabel(r.inicio);
      if (dl !== lastDay) { html += `<div class="day">${esc(dl)}</div>`; lastDay = dl; }
      html += rondaCard(r);
    }
    $('inf-list').innerHTML = html || `<div class="empty"><b>Aún no hay informes</b>Cada vez que un agente termine una ronda, verás aquí qué ha hecho.</div>`;
  }
  function rondaCard(r) {
    const its = r.items || [], er = estadoRonda(r), [pc, pt] = PILL_R[er];
    const when = r.fin ? `${hm(r.inicio)} → ${hm(r.fin)} · ${dur(r.inicio, r.fin)}` : `Desde las ${hm(r.inicio)}`;
    let cif = Object.entries(r.cifras || {});
    if (!cif.length) cif = Object.keys(CIFRA).map((k) => [CIFRA[k], its.filter((i) => i.k === k).length]).filter((c) => c[1]);
    const tiles = cif.length ? `<div class="tiles">${cif.map(([k, v]) => `<div class="tile${/^(fallid|alerta|crític|error)/i.test(k) && v ? ' bad' : /envi/i.test(k) && v ? ' ok' : ''}"><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join('')}</div>` : '';
    const grupos = KINDS.map(([k, t]) => {
      const g = its.filter((i) => i.k === k); if (!g.length) return '';
      const abierto = k !== 'registro' && (g.length <= 6 || k === 'enviado' || k === 'alerta');
      return `<details class="grp"${abierto ? ' open' : ''}><summary><i class="dot ${k}"></i>${esc(t)}<span class="n">${g.length}</span></summary><ul class="items">${g.slice(0, 120).map(item).join('')}</ul>${g.length > 120 ? `<p class="mas">y ${g.length - 120} más</p>` : ''}</details>`;
    }).join('');
    const res = r.resumen || r.task || (r.cortada ? 'No fichó el fin de la ronda' : '');
    return `<article class="card ronda${fresh('rd' + r.id + (r.fin ? 'f' : ''))}"><div class="head"><img src="${AV(r.agent)}" alt=""><span class="who"><b>${esc(name(r.agent))}</b><small class="when">${esc(when)}</small></span><span class="pill ${pc}">${pt}</span></div>${res ? `<div class="res">${esc(res)}</div>` : ''}${tiles}${grupos}${r.recortados ? `<p class="mas">y ${r.recortados} acciones más que no caben</p>` : ''}${r.next ? `<div class="det">Después: ${esc(r.next)}</div>` : ''}</article>`;
  }
  function item(i) {
    const st = i.station ? `<span class="tagc">${esc(i.station)}</span>` : '';
    const t = `<time>${esc(hm(i.at))}</time>`;
    switch (i.k) {
      case 'enviado': return `<li><span class="t">${esc(i.para)}${st}</span>${t}${i.origen ? `<span class="o">${esc(i.origen)}</span>` : ''}${i.text ? `<details><summary>Ver mensaje</summary><p>${esc(i.text)}</p></details>` : ''}</li>`;
      case 'fallido': return `<li><span class="t bad">${esc(i.para)}${st}</span>${t}<span class="o">${esc(i.text || 'No se pudo enviar')}</span></li>`;
      case 'lote': return `<li><span class="t">${esc(i.text)}${st}</span>${t}${(i.para || []).length ? `<span class="o">${esc(i.para.join(', '))}</span>` : ''}</li>`;
      case 'ausencia': return `<li><span class="t ${i.ok ? 'okc' : 'bad'}">${i.ok ? '✓' : '✗'} ${esc(i.text)}</span>${t}</li>`;
      case 'alerta': return `<li><span class="t${i.level === 'rojo' ? ' bad' : ''}">${esc(i.text)}${st}</span>${t}</li>`;
      case 'email': return `<li><span class="t"><span class="niv n${i.nivel}">${esc(NIVEL[i.nivel] || i.nivel)}</span> ${esc(i.text)}${st}</span>${t}${i.quien ? `<span class="o">Le toca a ${esc(i.quien)}</span>` : ''}</li>`;
      case 'registro': return `<li><span class="t${i.state === 'error' ? ' bad' : ''}" style="font-weight:500">${esc(i.text)}</span>${t}</li>`;
      default: return `<li><span class="t">${esc(i.text)}${st}</span>${t}${i.link ? `<span class="o"><a href="${esc(i.link)}" target="_blank" rel="noopener">Abrir</a></span>` : ''}</li>`;
    }
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
      ((S.rondas || []).some((r) => r.agent === id) ? `<button class="btn" data-inf-go="${esc(id)}" type="button">Ver sus informes</button>` : '') +
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
  // Días libres: espera al servidor (pinta en RRHH) y, si hace falta, pregunta centro o nombre.
  async function decideLibre(id, dec, extra) {
    const x = (S.approvals || []).find((a) => a.id === id); if (!x) return;
    const cardEl = $('card-' + id); cardEl && cardEl.querySelectorAll('button').forEach((b) => (b.disabled = true));
    if (dec === 'aprobado' && !x.station && !(extra && extra.station)) { askCentro(x, dec); return; }
    let j;
    try {
      if (cfg.demo) j = demoLibre(x, dec, extra || {});
      else {
        const r = await fetch(cfg.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ clave: cfg.clave, action: 'decidir', id, decision: dec, ...(extra || {}) }) });
        j = await r.json();
      }
    } catch (e) { render(); toast('No se pudo guardar. Revisa la conexión e inténtalo otra vez.'); return; }
    if (j && j.pedir) { askCentro(x, dec, j); return; }
    if (j && j.error) { render(); toast(j.error); return; }
    if (j && !cfg.demo) { S = j; store.set('cache', j); }
    const y = (S.approvals || []).find((a) => a.id === id) || x;
    if (cardEl) cardEl.classList.add('leaving');
    office.decision(x.agent, dec === 'aprobado');
    toast(dec === 'aprobado' ? 'Marcado en fucsia en RRHH ' + (y.station || '') + '. Marilyn se lo dirá en su próxima ronda.' : 'Denegado. Marilyn se lo dirá en su próxima ronda.');
    setTimeout(render, RM ? 0 : 900);
  }
  function demoLibre(x, dec, extra) {
    if (extra.station) { x.station = extra.station; x.detail = (x.detail || '').replace('Centro por confirmar.', 'Centro: ' + extra.station + '.'); }
    if (extra.nombre) x.rrhhName = extra.nombre;
    x.decision = dec; x.decidedAt = new Date().toISOString();
    const pila = (x.nombre || '').split(' ')[0], f = (x.fechas || []).map((t) => t.split('/').slice(0, 2).join('/')).join(' y ');
    x.mensaje = dec === 'aprobado' ? `Hola ${pila}, se ha aceptado tu petición de día libre para el ${f}. ¡Un saludo!` : `Hola ${pila}, se ha denegado tu solicitud de día libre para el ${f} por motivos de volumen. Un saludo.`;
    (S.log = S.log || []).unshift({ id: 'c' + Date.now(), agent: 'cristian', at: x.decidedAt, text: (dec === 'aprobado' ? 'aceptó: ' : 'denegó: ') + x.what, state: 'ok' });
    return null;
  }
  // Ventana para elegir centro (y nombre en RRHH si no lo encuentra)
  function askCentro(x, dec, res) {
    const dlg = $('pick');
    const centro = (res && res.centro) || x.station || '';
    $('p-title').textContent = res && res.pedir === 'nombre' ? '¿Cuál es en el RRHH?' : '¿De qué centro es ' + (x.nombre || 'este conductor') + '?';
    $('p-msg').textContent = res && res.error && res.pedir === 'nombre' ? res.error : (res && res.error && !/^¿/.test(res.error) ? res.error : 'Lo marco en fucsia en su RRHH y Marilyn lo recordará para la próxima vez.');
    $('p-centros').innerHTML = ['VAD7', 'VAD4', 'DMZ4'].map((c) => `<button type="button" class="seg" aria-pressed="${c === centro}" data-c="${c}">${c}</button>`).join('');
    $('p-nombre').value = x.rrhhName || x.nombre || '';
    const cands = (res && res.candidatos) || [];
    $('p-cands').innerHTML = cands.map((n) => `<button type="button" class="cand" data-n="${esc(n)}">${esc(n)}</button>`).join('');
    $('p-cands').hidden = !cands.length;
    $('p-ok').textContent = dec === 'aprobado' ? 'Aceptar y marcar' : 'Denegar';
    dlg.dataset.pid = x.id; dlg.dataset.pdec = dec;
    try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }
  }
  $('p-centros') && $('p-centros').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (!b) return; $('p-centros').querySelectorAll('button').forEach((q) => q.setAttribute('aria-pressed', q === b)); });
  $('p-cands') && $('p-cands').addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (b) $('p-nombre').value = b.dataset.n; });
  $('p-cancel') && ($('p-cancel').onclick = () => { $('pick').close(); render(); });
  $('p-ok') && ($('p-ok').onclick = () => {
    const dlg = $('pick'), c = $('p-centros').querySelector('[aria-pressed="true"]');
    if (!c) { toast('Elige el centro'); return; }
    const nombre = $('p-nombre').value.trim();
    dlg.close();
    decideLibre(dlg.dataset.pid, dlg.dataset.pdec, { station: c.dataset.c, nombre });
  });

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
    if (!['oficina', 'aprobar', 'informes', 'registro', 'ajustes'].includes(v)) v = 'oficina';
    view = v;
    document.querySelectorAll('.view').forEach((el) => (el.hidden = el.dataset.view !== v));
    document.querySelectorAll('.tabbar button').forEach((b) => { if (b.dataset.go === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (push && location.hash !== '#' + v) history.pushState(null, '', v === 'oficina' ? location.pathname : '#' + v);
    if ($('sheet').open) $('sheet').close();
    window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
  }
  window.addEventListener('popstate', () => go((location.hash || '#oficina').slice(1), false));
  document.addEventListener('click', (e) => {
    const ig = e.target.closest('[data-inf-go]'); if (ig) { infFilter = ig.dataset.infGo; store.set('infFilter', infFilter); go('informes'); renderInformes(); return; }
    const t = e.target.closest('[data-go],[data-agent],[data-dec],[data-libre],[data-lotego],[data-resolve],[data-filter],[data-inf]');
    if (!t) return;
    if (t.dataset.go) go(t.dataset.go);
    else if (t.dataset.agent) openAgent(t.dataset.agent);
    else if (t.dataset.lotego) decideLote(t.dataset.lotego);
    else if (t.dataset.libre) decideLibre(t.dataset.id, t.dataset.libre);
    else if (t.dataset.dec) decide(t.dataset.id, t.dataset.dec, t);
    else if (t.dataset.resolve) resolve(t.dataset.resolve, t);
    else if (t.dataset.inf) { infFilter = t.dataset.inf; store.set('infFilter', infFilter); renderInformes(); }
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
    const ids = ['lucia', 'ana', 'marta', 'dani'], id = ids[Math.floor(Math.random() * ids.length)];
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
