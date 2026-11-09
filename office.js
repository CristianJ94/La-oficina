/* La Oficina — maqueta isométrica en estilo juguete 3D.
   Escena estática (suelo, paredes, muebles) + personajes vivos que caminan según su estado. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const T = 34, Q = 17, OX = 302, OY = 112, VW = 680, VH = 470;
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const iso = (x, y, z = 0) => [OX + (x - y) * T, OY + (x + y) * Q - z];
  const P = (pts) => pts.map(([a, b]) => a.toFixed(1) + ',' + b.toFixed(1)).join(' ');

  function sh(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f > 1) { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
    else { r *= f; g *= f; b *= f; }
    const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
  }

  // ---------- gradientes compartidos ----------
  let defs, gcount = 0;
  const gcache = {};
  function lin(c1, c2) {
    const k = 'l' + c1 + c2; if (gcache[k]) return gcache[k];
    const id = 'g' + (++gcount);
    defs.insertAdjacentHTML('beforeend', `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`);
    return (gcache[k] = `url(#${id})`);
  }
  function rad(c1, c2) {
    const k = 'r' + c1 + c2; if (gcache[k]) return gcache[k];
    const id = 'g' + (++gcount);
    defs.insertAdjacentHTML('beforeend', `<radialGradient id="${id}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>`);
    return (gcache[k] = `url(#${id})`);
  }
  function box(x, y, z, w, d, h, c) {
    const top = [iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)];
    const left = [iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x, y + d, z + h)];
    const right = [iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x + w, y, z + h)];
    return `<polygon points="${P(left)}" fill="${lin(sh(c, .92), sh(c, .8))}" stroke="${sh(c, .8)}" stroke-linejoin="round"/>` +
      `<polygon points="${P(right)}" fill="${lin(sh(c, .8), sh(c, .68))}" stroke="${sh(c, .68)}" stroke-linejoin="round"/>` +
      `<polygon points="${P(top)}" fill="${sh(c, 1.1)}" stroke="${sh(c, 1.25)}" stroke-width="1.4" stroke-linejoin="round"/>`;
  }
  const shadow = (x, y, rx = 22, ry = 9, op = .16) => { const [a, b] = iso(x, y); return `<ellipse cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" rx="${rx}" ry="${ry}" fill="#1B2A4A" opacity="${op}" filter="url(#of-blur)"/>`; };

  // ---------- personajes ----------
  const LOOK = {
    lucia: { hair: '#6B3E26', skin: '#F4C9A3', shirt: '#22B5A8', style: 'long' },
    olga: { hair: '#F2C14E', skin: '#F8D8BC', shirt: '#8B5CF6', style: 'bun' },
    marta: { hair: '#2A2430', skin: '#D9A07A', shirt: '#F0524F', style: 'long' },
    dani: { hair: '#D9692B', skin: '#F2C6A0', shirt: '#3FB66B', style: 'short' },
    inspector: { hair: '#6B5640', skin: '#E9BE96', shirt: '#C9A46C', style: 'hat' },
    gabinete: { hair: '#A7B0BC', skin: '#EDC5A3', shirt: '#2F4B7C', style: 'bun' },
    cristian: { hair: '#2B221C', skin: '#E5B48C', shirt: '#1F2A44', style: 'short', tie: '#E5484D' }
  };
  function headSVG(cx, cy, L, r = 13) {
    let o = '';
    if (L.style === 'long') o += `<rect x="${cx - r - 2}" y="${cy - 3}" width="${2 * r + 4}" height="${r + 12}" rx="${(r * .7).toFixed(1)}" fill="${sh(L.hair, .9)}"/>`;
    o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${rad(sh(L.skin, 1.18), sh(L.skin, .9))}"/>`;
    if (L.style === 'hat') {
      o += `<ellipse cx="${cx}" cy="${cy - r * .55}" rx="${r + 7}" ry="5" fill="${sh(L.hair, .85)}"/>`;
      o += `<path d="M${cx - r * .75},${cy - r * .55} Q${cx},${cy - r * 1.9} ${cx + r * .75},${cy - r * .55} Z" fill="${rad(sh(L.hair, 1.25), L.hair)}"/>`;
      o += `<rect x="${cx - r * .75}" y="${cy - r * .85}" width="${r * 1.5}" height="3.5" fill="#3A2E24"/>`;
    } else {
      o += `<path d="M${cx - r - .5},${cy + 1} A${r + .5},${r + .5} 0 0 1 ${cx + r + .5},${cy + 1} Q${cx + r * .3},${cy - r * .35} ${cx - r * .2},${cy - r * .15} Q${cx - r * .7},${cy - r * .05} ${cx - r - .5},${cy + 1} Z" fill="${rad(sh(L.hair, 1.3), L.hair)}"/>`;
      if (L.style === 'bun') o += `<circle cx="${cx + 2}" cy="${cy - r - 3}" r="5.5" fill="${rad(sh(L.hair, 1.3), L.hair)}"/>`;
    }
    o += `<g class="eyes"><ellipse cx="${cx - 4.5}" cy="${cy + 2.5}" rx="1.7" ry="2.3" fill="#1F2430"/><ellipse cx="${cx + 4.5}" cy="${cy + 2.5}" rx="1.7" ry="2.3" fill="#1F2430"/></g>`;
    o += `<circle cx="${cx - 7.5}" cy="${cy + 6.5}" r="2.3" fill="#FF8A8A" opacity=".45"/><circle cx="${cx + 7.5}" cy="${cy + 6.5}" r="2.3" fill="#FF8A8A" opacity=".45"/>`;
    o += `<path d="M${cx - 2.5},${cy + 7} Q${cx},${cy + 9.2} ${cx + 2.5},${cy + 7}" stroke="#1F2430" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    o += `<ellipse cx="${cx - 4}" cy="${cy - r * .55}" rx="4" ry="2" fill="#fff" opacity=".35"/>`;
    return o;
  }
  // Un personaje centrado en (0,0) = sus pies.
  function personSVG(who) {
    const L = LOOK[who] || LOOK.dani;
    const legs = `<g class="legs"><rect class="leg-l" x="-8" y="-14" width="6.5" height="13" rx="3" fill="${sh(L.shirt, .55)}"/><rect class="leg-r" x="1.5" y="-14" width="6.5" height="13" rx="3" fill="${sh(L.shirt, .5)}"/></g>`;
    const tie = L.tie ? `<path d="M0,-34 l3,5 l-3,11 l-3,-11 z" fill="${L.tie}"/>` : '';
    const torso = `<g class="torso"><rect x="-12" y="-36" width="24" height="24" rx="11" fill="${lin(sh(L.shirt, 1.15), sh(L.shirt, .85))}"/>${tie}` +
      `<rect class="arm arm-l" x="-15" y="-32" width="6" height="17" rx="3" fill="${sh(L.shirt, .9)}"/>` +
      `<rect class="arm arm-r" x="9" y="-32" width="6" height="17" rx="3" fill="${sh(L.shirt, .9)}"/>` +
      `<g class="raise"><rect x="10" y="-56" width="6" height="22" rx="3" fill="${sh(L.shirt, .95)}"/><circle cx="13" cy="-57" r="4" fill="${L.skin}"/></g>` +
      `<g class="cup"><rect x="11" y="-26" width="9" height="10" rx="2.5" fill="#fff" stroke="#D8DEE8"/><path class="steam" d="M14,-29 q2,-4 0,-7" stroke="#C3CCD8" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>` +
      headSVG(0, -56, L) + `</g>`;
    return `<g class="ring-wrap"><ellipse class="ring" cx="0" cy="0" rx="20" ry="10"/></g>` +
      `<ellipse cx="0" cy="0" rx="13" ry="5.5" fill="#1B2A4A" opacity=".2" filter="url(#of-blur)"/>` +
      `<g class="figure">${legs}${torso}</g><g class="bubble-slot"></g>`;
  }
  function bubbleSVG(kind) {
    const col = { '?': '#FFC93C', '!': '#FF5A5F', '...': '#FFFFFF', ok: '#3CCB7F', no: '#FF5A5F' }[kind];
    let inner = '';
    if (kind === '...') inner = [0, 1, 2].map((i) => `<circle class="dot d${i}" cx="${-7 + i * 7}" cy="-18" r="2.6" fill="#22B5A8"/>`).join('');
    else if (kind === 'ok') inner = `<path d="M-6,-18 l4,4 l8,-9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    else if (kind === 'no') inner = `<path d="M-5,-23 l10,10 M5,-23 l-10,10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
    else inner = `<text x="0" y="-12" text-anchor="middle" font-family="Fredoka, Inter, sans-serif" font-weight="600" font-size="16" fill="#1F2430">${kind}</text>`;
    return `<g class="bubble b-${kind === '?' ? 'q' : kind === '!' ? 'x' : kind === '...' ? 't' : kind}" filter="url(#of-soft)"><rect x="-15" y="-30" width="30" height="24" rx="10" fill="${col}"/><path d="M-4,-7 l4,7 l4,-7 z" fill="${col}"/>${inner}</g>`;
  }

  // ---------- plano ----------
  const DESK = { lucia: [0.9, 2.0], olga: [3.0, 2.0], marta: [5.1, 2.0], dani: [0.9, 4.4], inspector: [3.0, 4.4], gabinete: [5.1, 4.4] };
  const ROW = { lucia: 1, olga: 1, marta: 1, dani: 2, inspector: 2, gabinete: 2 };
  const LANES = { 1: 1.0, 2: 3.45, 3: 6.05 };
  const seatOf = (id) => ({ x: DESK[id][0] + .85, y: DESK[id][1] - .3, lane: ROW[id] === 1 ? 1 : 2, kind: 'seat' });
  const POI = {
    cafe: { x: 5.85, y: 1.0, lane: 1, kind: 'cafe' },
    ventana: { x: 2.6, y: 0.75, lane: 1, kind: 'ventana' },
    sofa: { x: 8.6, y: 6.15, lane: 3, kind: 'sofa' },
    agua: { x: 0.95, y: 7.05, lane: 3, kind: 'agua' }
  };
  const DOOR = { x: 8.0, y: 3.95, lane: 2, kind: 'door' };
  const LED = { trabajando: '#22C55E', esperando: '#FFC93C', alerta: '#FF5A5F', libre: '#C3CCD8', fuera: '#E3E8EF' };
  const RING = { trabajando: '#22C55E', esperando: '#FFB800', alerta: '#FF5A5F', libre: '#C3CCD8' };

  function staticScene() {
    let o = '';
    const [a, b] = iso(5, 4, 0);
    o += `<ellipse cx="${a}" cy="${b + 70}" rx="330" ry="70" fill="#1B2A4A" opacity=".10" filter="url(#of-bigblur)"/>`;
    o += box(0, 0, -16, 10, 8, 16, '#E9EEF5');
    for (let i = 0; i < 10; i++) for (let j = 0; j < 8; j++) {
      let c = (i + j) % 2 ? '#F7F9FC' : '#F1F4F9';
      if (i >= 7.4 && j < 3) c = (i + j) % 2 ? '#F3E6D6' : '#EFDFCB';
      if (i >= 7 && j >= 4.5) c = (i + j) % 2 ? '#FFE6D5' : '#FFDFCA';
      o += `<polygon points="${P([iso(i, j), iso(i + 1, j), iso(i + 1, j + 1), iso(i, j + 1)])}" fill="${c}"/>`;
    }
    o += box(-0.3, 0, 0, 0.3, 8, 58, '#FFFFFF') + box(-0.3, -0.3, 0, 10.3, 0.3, 58, '#FFFFFF');
    for (const x1 of [1.2, 3.2]) {
      o += `<polygon class="win" points="${P([iso(x1, 0, 20), iso(x1 + 1.5, 0, 20), iso(x1 + 1.5, 0, 48), iso(x1, 0, 48)])}" stroke="#DCE5EF" stroke-width="3" stroke-linejoin="round"/>`;
      const m = x1 + .75, [m1, m2] = iso(m, 0, 20), [n1, n2] = iso(m, 0, 48);
      o += `<line x1="${m1}" y1="${m2}" x2="${n1}" y2="${n2}" stroke="#DCE5EF" stroke-width="3"/>`;
    }
    o += `<polygon points="${P([iso(0, 1.4, 22), iso(0, 4.2, 22), iso(0, 4.2, 48), iso(0, 1.4, 48)])}" fill="#FFFFFF" stroke="#DCE3EC" stroke-width="3" stroke-linejoin="round"/>`;
    [[1.8, 8, '#22B5A8'], [2.3, 14, '#8B5CF6'], [2.8, 11, '#FFC93C'], [3.3, 18, '#F26B1D'], [3.8, 21, '#3FB66B']].forEach(([y, h, c], i) => {
      o += `<polygon class="bar" style="--i:${i}" points="${P([iso(0, y, 26), iso(0, y + .3, 26), iso(0, y + .3, 26 + h), iso(0, y, 26 + h)])}" fill="${c}"/>`;
    });
    const [ca, cb] = iso(6.4, 0, 40);
    o += `<g class="clock" transform="translate(${ca.toFixed(1)} ${cb.toFixed(1)})"><circle r="9" fill="#fff" stroke="#DCE3EC" stroke-width="2.5"/><line class="hh" x1="0" y1="0" x2="0" y2="-4.5" stroke="#1F2430" stroke-width="1.8" stroke-linecap="round"/><line class="mm" x1="0" y1="0" x2="0" y2="-6.5" stroke="#E5484D" stroke-width="1.4" stroke-linecap="round"/></g>`;
    return o;
  }

  // Objetos con profundidad: [clave, html]
  function propItems() {
    const it = [];
    const plant = (x, y, s = 1) => { const [a, b] = iso(x + .22, y + .22, 22 * s); return shadow(x + .22, y + .22, 13, 5) + box(x, y, 0, .45, .45, 12 * s, '#FF9F6B') + `<g class="leaf"><circle cx="${a}" cy="${b}" r="${14 * s}" fill="${rad('#7BE08F', '#2FA35B')}"/><circle cx="${a - 8 * s}" cy="${b - 7 * s}" r="${9 * s}" fill="${rad('#8CEA9E', '#38B064')}"/></g>`; };
    it.push([5.7, box(4.5, .05, 0, 1.6, .6, 20, '#FFFFFF') + box(4.75, .12, 20, .55, .4, 16, '#3A4256') + `<g class="machine-led">${box(4.85, .4, 21, .2, .2, 4, '#FFFFFF')}</g>`]);
    it.push([7.2, shadow(.45, 7.05, 12, 5) + box(.2, 6.8, 0, .5, .5, 26, '#FFFFFF') + box(.25, 6.85, 26, .4, .4, 14, '#9AD8FF')]);
    it.push([16.8, plant(9.3, 7.3)]);
    it.push([.55, plant(.15, .15, .9)]);
    it.push([15.4, shadow(8.6, 6.9, 48, 14) + box(7.5, 6.6, 0, 2.2, .8, 10, '#6C8BFF') + box(7.5, 7.2, 0, 2.2, .25, 22, '#5B79F0') + box(7.5, 6.6, 0, .3, .8, 16, '#5B79F0') + box(9.4, 6.6, 0, .3, .8, 16, '#5B79F0')]);
    it.push([13.7, shadow(8.3, 5.4, 26, 9) + box(7.8, 5.1, 0, 1.1, .6, 9, '#FFFFFF') + box(8.2, 5.25, 9, .22, .22, 4, '#FFC93C')]);
    return it;
  }
  function deskHTML(id) {
    const [dx, dy] = DESK[id];
    let s = shadow(dx + .85, dy + .45, 40, 14, .13);
    s += box(dx, dy, 0, 1.7, .8, 16, '#FFFFFF') + box(dx + .15, dy + .65, 0, .12, .12, 15, '#DDE3EC') + box(dx + 1.45, dy + .65, 0, .12, .12, 15, '#DDE3EC');
    const [ga, gb] = iso(dx + .85, dy + .4, 16.2);
    s += `<ellipse class="glow" cx="${ga}" cy="${gb}" rx="26" ry="9"/>`;
    s += box(dx + .5, dy + .1, 16, .75, .12, 15, '#2E3446') + box(dx + .8, dy + .15, 16, .12, .12, 3, '#2E3446');
    const [la, lb] = iso(dx + .88, dy + .22, 26);
    s += `<circle class="led" cx="${la}" cy="${lb}" r="2.6"/>`;
    s += box(dx + .25, dy + .5, 16, .55, .2, 1.2, '#EEF2F7');
    const [ma, mb] = iso(dx + 1.35, dy + .35, 22);
    s += `<rect class="mug" x="${ma - 4}" y="${mb - 3}" width="8" height="8" rx="2.5" fill="#fff" stroke="#DCE3EC"/>`;
    const [sa, sb] = iso(dx + 1.26, dy + .41, 26);
    s += `<g class="vacante">${box(dx + 1.05, dy + .35, 16, .42, .06, 14, '#FFE07A')}<text x="${sa}" y="${sb}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="6" fill="#7A5A00">SE BUSCA</text></g>`;
    return s;
  }
  const chairHTML = (id) => { const [dx, dy] = DESK[id]; return box(dx + .6, dy - .55, 0, .5, .4, 9, '#C9D3E3') + box(dx + .6, dy - .65, 0, .5, .1, 26, '#B7C3D6'); };
  function bossHTML() {
    let s = shadow(8.9, 1.3, 40, 13, .12);
    const [a, b] = iso(8.95, .75);
    s += `<g class="boss idle sitting" transform="translate(${a.toFixed(1)} ${(b - 4).toFixed(1)})">${personSVG('cristian')}</g>`;
    s += box(8.1, 1.0, 0, 1.7, .75, 16, '#F2E2CC') + box(8.55, 1.05, 16, .75, .12, 13, '#2E3446');
    for (const pts of [[iso(7.4, 0), iso(7.4, 2.8), iso(7.4, 2.8, 50), iso(7.4, 0, 50)], [iso(7.4, 2.8), iso(8.2, 2.8), iso(8.2, 2.8, 50), iso(7.4, 2.8, 50)], [iso(9.1, 2.8), iso(10, 2.8), iso(10, 2.8, 50), iso(9.1, 2.8, 50)]])
      s += `<polygon points="${P(pts)}" fill="#BFE6FF" opacity=".32" stroke="#AFCBE3" stroke-width="2" stroke-linejoin="round"/>`;
    const [ta, tb] = iso(8.65, 2.8, 66);
    s += `<rect x="${ta - 34}" y="${tb - 10}" width="68" height="18" rx="9" fill="#1F2A44"/><text x="${ta}" y="${tb + 3}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="9" fill="#fff">DIRECCIÓN</text>`;
    return s;
  }

  // ---------- motor ----------
  function Office(host, opts) {
    this.host = host; this.opts = opts || {};
    this.bots = {}; this.agents = {}; this.desks = {};
    this.build();
  }
  Office.prototype.build = function () {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.setAttribute('class', 'office-svg' + (RM ? '' : ' intro'));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'La oficina en maqueta con tus agentes');
    svg.innerHTML = `<defs><filter id="of-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter><filter id="of-bigblur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter><filter id="of-soft" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#1B2A4A" flood-opacity=".18"/></filter><linearGradient id="of-sky-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE6FF"/><stop offset="1" stop-color="#E9F6FF"/></linearGradient><linearGradient id="of-sky-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB98A"/><stop offset="1" stop-color="#FFE3C9"/></linearGradient><linearGradient id="of-sky-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2C3E73"/><stop offset="1" stop-color="#55679E"/></linearGradient></defs><g class="diorama"><g class="scene"></g><g class="world"></g></g>`;
    defs = svg.querySelector('defs');
    this.svg = svg; this.world = svg.querySelector('.world');
    svg.querySelector('.scene').innerHTML = staticScene();
    const items = propItems().map(([k, h]) => this.mk(h, k, 'prop'));
    for (const id of Object.keys(DESK)) {
      const [dx, dy] = DESK[id];
      this.desks[id] = this.mk(deskHTML(id), dx + .85 + dy + .4, 'desk st-fuera');
      this.desks[id].dataset.id = id;
      this.mk(chairHTML(id), dx + .85 + dy - .45, 'chair');
    }
    this.mk(bossHTML(), 10.3, 'boss-office');
    this.host.appendChild(svg);
    this.sky(); this.clock();
    setInterval(() => { this.sky(); this.clock(); }, 30000);
    svg.addEventListener('click', (e) => {
      const g = e.target.closest('[data-id]');
      if (g && this.opts.onPick) this.opts.onPick(g.dataset.id);
    });
    this.last = performance.now();
    const loop = (t) => { this.tick(Math.min(64, t - this.last)); this.last = t; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  };
  Office.prototype.mk = function (html, k, cls) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', cls); g.innerHTML = html; g._k = k;
    this.world.appendChild(g); return g;
  };
  Office.prototype.sky = function () {
    const h = new Date().getHours();
    const s = h < 7 || h >= 20 ? 'night' : (h === 7 || h === 19) ? 'dusk' : 'day';
    this.svg.querySelectorAll('.win').forEach((w) => w.setAttribute('fill', `url(#of-sky-${s})`));
  };
  Office.prototype.clock = function () {
    const n = new Date(), hh = (n.getHours() % 12 + n.getMinutes() / 60) * 30, mm = n.getMinutes() * 6;
    const c = this.svg.querySelector('.clock');
    c.querySelector('.hh').setAttribute('transform', `rotate(${hh})`);
    c.querySelector('.mm').setAttribute('transform', `rotate(${mm})`);
  };

  // Actualiza el estado de todos los agentes
  Office.prototype.update = function (agents) {
    for (const id of Object.keys(DESK)) {
      const a = agents[id] || { status: 'fuera' };
      const prev = this.agents[id], st = a.status || 'libre';
      this.agents[id] = a;
      const d = this.desks[id];
      d.setAttribute('class', 'desk st-' + st);
      d.style.setProperty('--led', LED[st] || LED.libre);
      if (st === 'fuera') { if (this.bots[id]) { this.bots[id].g.remove(); delete this.bots[id]; } continue; }
      let b = this.bots[id];
      if (!b) {
        const s = seatOf(id);
        const g = this.mk(personSVG(id), 0, 'bot');
        g.dataset.id = id;
        b = this.bots[id] = { g, x: s.x, y: s.y, lane: s.lane, path: [], st: null, wait: 0, target: s };
        if (!RM) b.wander = 2000 + Math.random() * 4000;
      }
      if (b.st !== st) {
        const changed = b.st !== null;
        b.st = st;
        b.g.style.setProperty('--ring', RING[st] || RING.libre);
        if (changed) this.burst(b);
        if (st === 'trabajando' || st === 'alerta') this.go(b, seatOf(id));
        else if (st === 'esperando') this.go(b, DOOR);
        else this.go(b, pick(id));
      }
      this.decorate(b);
    }
  };
  function pick(id) {
    const keys = Object.keys(POI);
    return Math.random() < .3 ? seatOf(id) : POI[keys[Math.floor(Math.random() * keys.length)]];
  }
  Office.prototype.go = function (b, t) {
    b.target = t;
    if (RM) { b.x = t.x; b.y = t.y; b.lane = t.lane; b.path = []; this.decorate(b); return; }
    const pts = [], la = LANES[b.lane], lb = LANES[t.lane];
    pts.push({ x: b.x, y: la });
    if (la !== lb) {
      const cx = Math.abs(b.x - .45) + Math.abs(t.x - .45) < Math.abs(b.x - 7.1) + Math.abs(t.x - 7.1) ? .45 : 7.1;
      pts.push({ x: cx, y: la }, { x: cx, y: lb });
    }
    pts.push({ x: t.x, y: lb }, { x: t.x, y: t.y });
    b.path = pts; b.lane = t.lane;
    this.decorate(b);
  };
  Office.prototype.decorate = function (b) {
    const walking = b.path.length > 0, at = !walking ? b.target.kind : null, st = b.st;
    const cls = ['bot', 'st-' + st];
    if (walking) cls.push('walking'); else cls.push('idle');
    if (at === 'seat' && st === 'trabajando') cls.push('sitting', 'typing');
    if (at === 'door' && st === 'esperando') cls.push('raising');
    if (at === 'cafe' || (st === 'libre' && b.hasCup)) { cls.push('has-cup'); b.hasCup = true; }
    if (at && at !== 'cafe' && at !== 'sofa' && at !== 'ventana' && at !== 'agua') b.hasCup = false;
    if (b.flip) cls.push('flip');
    b.g.setAttribute('class', cls.join(' '));
    let kind = null;
    if (b.decision && performance.now() < b.decision.until) kind = b.decision.kind;
    else if (st === 'alerta' && !walking) kind = '!';
    else if (st === 'esperando' && !walking) kind = '?';
    else if (st === 'trabajando' && !walking) kind = '...';
    if (kind !== b.bubble) {
      b.bubble = kind;
      const slot = b.g.querySelector('.bubble-slot');
      slot.innerHTML = kind ? `<g class="bubble-pos" transform="translate(0 -${b.g.classList.contains('sitting') ? 66 : 74})">${bubbleSVG(kind)}</g>` : '';
    }
  };
  Office.prototype.burst = function (b) {
    if (RM) return;
    const e = document.createElementNS(NS, 'ellipse');
    e.setAttribute('class', 'burst'); e.setAttribute('rx', '20'); e.setAttribute('ry', '10');
    b.g.insertBefore(e, b.g.firstChild);
    setTimeout(() => e.remove(), 1000);
  };
  Office.prototype.decision = function (id, ok) {
    const b = this.bots[id]; if (!b) return;
    b.decision = { kind: ok ? 'ok' : 'no', until: performance.now() + 3500 };
    this.decorate(b);
    setTimeout(() => { if (b.decision) { b.decision = null; this.decorate(b); } }, 3600);
  };
  Office.prototype.tick = function (dt) {
    const speed = 1.35 / 1000; // casillas por ms
    for (const id in this.bots) {
      const b = this.bots[id];
      if (b.path.length) {
        let left = speed * dt;
        while (left > 0 && b.path.length) {
          const p = b.path[0], dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy);
          if (d <= left) { b.x = p.x; b.y = p.y; b.path.shift(); left -= d; }
          else { b.x += dx / d * left; b.y += dy / d * left; b.flip = (dx - dy) < 0; left = 0; }
        }
        if (!b.path.length) this.decorate(b);
      } else if (b.st === 'libre' && !RM) {
        b.wander -= dt;
        if (b.wander <= 0) { this.go(b, pick(id)); b.wander = 7000 + Math.random() * 9000; }
      }
      const sitting = b.g.classList.contains('sitting');
      const [a, c] = iso(b.x, b.y);
      b.g.setAttribute('transform', `translate(${a.toFixed(1)} ${(c - (sitting ? 6 : 0)).toFixed(1)})`);
      b.g._k = b.x + b.y + (sitting ? .02 : 0);
    }
    this.sort();
  };
  Office.prototype.sort = function () {
    const kids = Array.from(this.world.children);
    const sorted = kids.slice().sort((p, q) => p._k - q._k);
    for (let i = 0; i < kids.length; i++) if (kids[i] !== sorted[i]) { sorted.forEach((n) => this.world.appendChild(n)); break; }
  };

  window.Office = Office;
})();
