import * as THREE from 'three';

const O = window.OEUVRES;
const T = {
  fr: {demo:'Démonstration · salle imaginée, ce n’est pas la galerie réelle', tour:'Visite guidée', pause:'Pause', courtesy:'Courtesy de l’artiste et de la Galerie Cécile Fakhoury',
    ask:'Demander le dossier', name:'Nom et prénom', mail:'E-mail', send:'Envoyer la demande', nosend:'Démonstration : rien n’est envoyé.', thanks:'Merci.',
    thanks2:'Dans la version en service, la galerie recevrait votre demande et enverrait le dossier de l’œuvre. Ici, rien n’a été envoyé.',
    kick:'Exposition personnelle · Abidjan', dates:'5 novembre 2026 — 9 janvier 2027', lead:'Quatorze peintures, acrylique sur velours libre noir, accrochées à l’échelle de leurs dimensions réelles.',
    loading:'Chargement des œuvres', enter:'Entrer dans la salle', entertour:'Commencer par la visite guidée',
    note:'Salle imaginée pour la démonstration : ce n’est pas le lieu réel. Images : Galerie Cécile Fakhoury, cecilefakhoury.com.',
    nogl:'Votre navigateur n’affiche pas la 3D. Les œuvres restent visibles sur le site de la galerie.',
    hintDesk:'Glissez pour regarder autour de vous · flèches ou ZQSD pour avancer · molette pour approcher · cliquez sur une œuvre pour son cartel',
    hintTouch:'Glissez pour regarder · touchez le sol pour avancer · touchez une œuvre pour son cartel', w:'Œuvre'},
  en: {demo:'Demonstration · imagined room, not the actual gallery', tour:'Guided tour', pause:'Pause', courtesy:'Courtesy of the artist and Galerie Cécile Fakhoury',
    ask:'Request the file', name:'Full name', mail:'Email', send:'Send request', nosend:'Demonstration: nothing is sent.', thanks:'Thank you.',
    thanks2:'In the live version, the gallery would receive your request and send the file for this work. Nothing has been sent here.',
    kick:'Solo exhibition · Abidjan', dates:'5 November 2026 — 9 January 2027', lead:'Fourteen paintings, acrylic on free black velvet, hung at the scale of their actual dimensions.',
    loading:'Loading the works', enter:'Enter the room', entertour:'Start with the guided tour',
    note:'Room imagined for this demonstration: not the actual venue. Images: Galerie Cécile Fakhoury, cecilefakhoury.com.',
    nogl:'Your browser cannot display 3D. The works remain visible on the gallery website.',
    hintDesk:'Drag to look around · arrow keys or WASD to walk · scroll to move closer · click a work to see its label',
    hintTouch:'Drag to look · tap the floor to walk · tap a work to see its label', w:'Work'}
};
let lang = 'fr';
try { const l = localStorage.getItem('cf-lang'); if (l === 'en' || l === 'fr') lang = l; } catch (e) {}
const $ = s => document.querySelector(s);
const touch = matchMedia('(pointer:coarse)').matches;

function setLang(l) {
  lang = l; document.documentElement.lang = l;
  document.querySelectorAll('[data-k]').forEach(e => { const v = T[l][e.dataset.k]; if (v) e.textContent = v; });
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === l));
  $('#tour [data-k]').textContent = touring ? T[l].pause : T[l].tour;
  if (current >= 0 && !$('#cartel').hidden) fillCartel(current);
  try { localStorage.setItem('cf-lang', l); } catch (e) {}
}
document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

// ---------- Moteur ----------
const canvas = $('#scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { $('#nogl').hidden = false; $('#intro').hidden = true; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xEDEAE4);
const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 80);
const EYE = 1.6, X = 8, Z = 5.5, HC = 4.5;

const manager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(manager);
manager.onProgress = (u, a, b) => { const p = Math.round(a / b * 100); $('#loadbar').style.width = p + '%'; $('#pct').textContent = p + ' %'; };
manager.onLoad = () => { $('#load').style.opacity = 0; $('#loadtxt').hidden = true; $('#go').hidden = false; window.__salle.ready = true; };

// Textures procédurales
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
}
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const concrete = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#cfcac2'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { const x = rnd() * w, y = rnd() * h, r = 30 + rnd() * 160; const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const v = rnd() < .5 ? '255,255,255' : '120,112,100'; gr.addColorStop(0, `rgba(${v},${.035 + rnd() * .04})`); gr.addColorStop(1, `rgba(${v},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  const id = g.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (rnd() - .5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(id, 0, 0);
  g.strokeStyle = 'rgba(90,84,76,.22)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 1); g.lineTo(w, 1); g.moveTo(1, 0); g.lineTo(1, h); g.stroke();
}, [4, 3]);
const radial = canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,250,240,1)'); gr.addColorStop(.55, 'rgba(255,250,240,.45)'); gr.addColorStop(1, 'rgba(255,250,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const linear = canvasTex(4, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(60,52,44,.30)'); gr.addColorStop(1, 'rgba(60,52,44,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const blur = canvasTex(128, 128, (g, w, h) => { g.filter = 'blur(14px)'; g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(24, 24, w - 48, h - 48); });

// Salle
const wallMat = new THREE.MeshStandardMaterial({ color: 0xF2F0EB, roughness: .96 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * X, 2 * Z), new THREE.MeshStandardMaterial({ map: concrete, roughness: .8, metalness: 0 }));
floor.rotation.x = -Math.PI / 2; floor.name = 'floor'; scene.add(floor);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(2 * X, 2 * Z), new THREE.MeshStandardMaterial({ color: 0xF4F2EE, emissive: 0xB9B5AE, roughness: 1 }));
ceil.rotation.x = Math.PI / 2; ceil.position.y = HC; scene.add(ceil);
function wall(w, x, z, ry) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, HC), wallMat); m.position.set(x, HC / 2, z); m.rotation.y = ry; scene.add(m); }
wall(2 * X, 0, -Z, 0); wall(2 * X, 0, Z, Math.PI); wall(2 * Z, X, 0, -Math.PI / 2); wall(2 * Z, -X, 0, Math.PI / 2);
// plinthes d'ombre (occlusion douce au pied et en haut des murs)
const aoMat = new THREE.MeshBasicMaterial({ map: linear, transparent: true, depthWrite: false });
[[0, -Z, 0, 2 * X], [0, Z, Math.PI, 2 * X], [X, 0, -Math.PI / 2, 2 * Z], [-X, 0, Math.PI / 2, 2 * Z]].forEach(([x, z, ry, w]) => {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, .7), aoMat); f.rotation.set(-Math.PI / 2, 0, 0);
  const g = new THREE.Group(); g.add(f); f.position.set(0, .002, .35);
  g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  const up = new THREE.Mesh(new THREE.PlaneGeometry(w, .6), aoMat); up.position.set(0, HC - .3, .003); g.add(up);
  const lo = new THREE.Mesh(new THREE.PlaneGeometry(w, .35), aoMat); lo.position.set(0, .175, .003); lo.rotation.z = Math.PI; g.add(lo);
});
// rails d'éclairage et projecteurs
const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: .5, metalness: .3 });
const RX = X - 1.9, RZ = Z - 1.9;
[-RZ, RZ].forEach(z => { const r = new THREE.Mesh(new THREE.BoxGeometry(2 * RX + .05, .04, .05), dark); r.position.set(0, HC - .03, z); scene.add(r); });
[-RX, RX].forEach(x => { const r = new THREE.Mesh(new THREE.BoxGeometry(.05, .04, 2 * RZ + .05), dark); r.position.set(x, HC - .03, 0); scene.add(r); });
// banc
const bench = new THREE.Group();
const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, .08, .55), new THREE.MeshStandardMaterial({ color: 0xC2A27C, roughness: .65 })); seat.position.y = .44; bench.add(seat);
[-0.9, .9].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(.06, .4, .5), dark); l.position.set(x, .2, 0); bench.add(l); });
const bsh = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.1), new THREE.MeshBasicMaterial({ map: blur, transparent: true, depthWrite: false, opacity: .5 }));
bsh.rotation.x = -Math.PI / 2; bsh.position.y = .003; bench.add(bsh);
bench.position.set(0, 0, .4); scene.add(bench);

scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xCFC8BC, 1.55));
const sun = new THREE.DirectionalLight(0xFFF6EA, .9); sun.position.set(3, 8, 4); scene.add(sun);
const sun2 = new THREE.DirectionalLight(0xFFFFFF, .35); sun2.position.set(-4, 6, -3); scene.add(sun2);

// ---------- Accrochage ----------
const WALLS = [
  { ids: [5, 6, 14], L: 2 * X, p: u => [-X + u, -Z], n: [0, 1], d: [1, 0] },
  { ids: [3, 4, 7, 9], L: 2 * Z, p: u => [X, -Z + u], n: [-1, 0], d: [0, 1] },
  { ids: [8, 13, 1, 2], L: 2 * X, p: u => [X - u, Z], n: [0, -1], d: [-1, 0] },
  { ids: ['titre', 10, 11, 12], L: 2 * Z, p: u => [-X, Z - u], n: [1, 0], d: [0, -1] }
];
const works = []; const pickables = [];
function plaqueTex(o) {
  return canvasTex(512, 300, (g, w, h) => { g.fillStyle = '#fbfaf7'; g.fillRect(0, 0, w, h); g.fillStyle = '#111';
    g.font = '600 26px Inter'; g.fillText('ROMÉO MIVEKANNIN', 30, 56);
    g.font = 'italic 500 34px "Cormorant Garamond"'; wrap(g, o.title, 30, 104, w - 60, 38, 3);
    g.font = '400 22px Inter'; g.fillStyle = '#555'; g.fillText('2026 · ' + o.cm, 30, h - 30); });
}
function wrap(g, t, x, y, mw, lh, max) { const ws = t.split(' '); let line = '', n = 0;
  for (const w of ws) { const test = line ? line + ' ' + w : w; if (g.measureText(test).width > mw && line) { g.fillText(line, x, y); y += lh; line = w; if (++n >= max - 1) { } } else line = test; }
  g.fillText(line, x, y); }
function titleTex() {
  return canvasTex(1400, 560, (g, w, h) => { g.fillStyle = '#111';
    g.font = '500 54px Inter'; g.fillText('ROMÉO MIVEKANNIN', 10, 90);
    g.font = 'italic 400 150px "Cormorant Garamond"'; g.fillText('Dieu n’est', 0, 270); g.fillText('pas obligé', 0, 420);
    g.font = '400 40px Inter'; g.fillStyle = '#555'; g.fillText('05.11.2026 — 09.01.2027 · Abidjan', 10, 520); });
}

function build() {
  WALLS.forEach(W => {
    const items = W.ids.map(id => id === 'titre' ? { titre: true, w: 3.3, h: 1.32 } : O[id - 1]);
    const sum = items.reduce((s, o) => s + o.w, 0); const gap = (W.L - sum) / (items.length + 1);
    let u = gap; const ry = Math.atan2(W.n[0], W.n[1]);
    items.forEach(o => {
      const c = u + o.w / 2; const [px, pz] = W.p(c); u += o.w + gap;
      if (o.titre) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), new THREE.MeshBasicMaterial({ map: titleTex(), transparent: true, toneMapped: false }));
        m.position.set(px + W.n[0] * .004, 1.75, pz + W.n[1] * .004); m.rotation.y = ry; scene.add(m); return;
      }
      const cy = Math.max(1.6, o.h / 2 + .45);
      const g = new THREE.Group(); g.position.set(px + W.n[0] * .03, cy, pz + W.n[1] * .03); g.rotation.y = ry; scene.add(g);
      // halo de lumière sur le mur
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(o.w + 2.2, o.h + 2.0), new THREE.MeshBasicMaterial({ map: radial, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.position.set(0, .25, -.027); g.add(halo);
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(o.w * 1.12, o.h * 1.08), new THREE.MeshBasicMaterial({ map: blur, transparent: true, opacity: .55, depthWrite: false }));
      sh.position.set(.03, -.05, -.026); g.add(sh);
      const box = new THREE.Mesh(new THREE.BoxGeometry(o.w, o.h, .035), new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 1 }));
      box.position.z = -.008; g.add(box);
      const tex = loader.load(o.img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0xF4F4F4 }));
      pic.position.z = .0095; pic.userData.idx = O.indexOf(o); g.add(pic); pickables.push(pic);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(.2, .117), new THREE.MeshBasicMaterial({ map: plaqueTex(o), toneMapped: false }));
      pl.position.set(o.w / 2 + .32, 1.38 - cy, -.024); g.add(pl);
      // spot au plafond, orienté vers l'œuvre
      const spot = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, .22, 16), dark);
      const sx = THREE.MathUtils.clamp(px + W.n[0] * 1.9, -RX, RX), sz = THREE.MathUtils.clamp(pz + W.n[1] * 1.9, -RZ, RZ); spot.position.set(sx, HC - .2, sz);
      spot.lookAt(px, cy, pz); spot.rotateX(Math.PI / 2); scene.add(spot);
      works[O.indexOf(o)] = { o, g, pos: new THREE.Vector3(px, cy, pz), n: new THREE.Vector3(W.n[0], 0, W.n[1]) };
    });
  });
}

// ---------- Caméra ----------
let yaw = 0, pitch = -.02; const pos = new THREE.Vector3(0, EYE, 4.2);
let anim = null; let current = -1; let touring = false; let tourTimer = null;
function applyCam() { camera.position.copy(pos); camera.rotation.set(pitch, yaw, 0, 'YXZ'); }
function clampPos(p) { p.x = Math.max(-X + .6, Math.min(X - .6, p.x)); p.z = Math.max(-Z + .6, Math.min(Z - .6, p.z));
  if (Math.abs(p.x) < 1.45 && Math.abs(p.z - .4) < .6) { if (Math.abs(p.z - .4) > Math.abs(p.x) * .4) p.z = .4 + Math.sign(p.z - .4 || 1) * .6; else p.x = Math.sign(p.x || 1) * 1.45; } }
function viewFor(i) {
  const w = works[i], o = w.o; const vf = THREE.MathUtils.degToRad(camera.fov) / 2; const hf = Math.atan(Math.tan(vf) * camera.aspect);
  let d = Math.max((o.h * 1.18) / (2 * Math.tan(vf)), (o.w * 1.15) / (2 * Math.tan(hf)), 1.7);
  const maxd = (Math.abs(w.n.x) > .5 ? 2 * X : 2 * Z) - 1.0; d = Math.min(d, maxd);
  const p = w.pos.clone().addScaledVector(w.n, d); p.y = EYE;
  const dir = w.pos.clone().sub(p); const ty = Math.atan2(-dir.x, -dir.z); const tp = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));
  return { p, ty, tp };
}
function flyTo(i, dur = 1700, done) {
  const v = viewFor(i); let dy = v.ty - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  anim = { t0: performance.now(), dur, p0: pos.clone(), p1: v.p, y0: yaw, y1: yaw + dy, a0: pitch, a1: v.tp, done };
  current = i; showCaption(i);
}
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function showCaption(i) { const o = O[i]; $('#cap-title').textContent = o.title; $('#cap-n').textContent = (i + 1) + ' / ' + O.length; $('#caption').hidden = false; }

// ---------- Cartel ----------
function fillCartel(i) { const o = O[i];
  $('#c-img').src = o.img; $('#c-img').alt = o.title; $('#c-title').textContent = o.title;
  $('#c-med').textContent = lang === 'fr' ? o.mfr : o.men; $('#c-dim').textContent = lang === 'fr' ? o.cm : o.inch + ' (' + o.cm + ')'; }
function openCartel(i) { stopTour(); fillCartel(i); $('#askform').hidden = true; $('#askok').hidden = true; $('#askbtn').hidden = false; $('#cartel').hidden = false; $('#caption').hidden = true; }
function closeCartel() { $('#cartel').hidden = true; if (current >= 0) showCaption(current); }
$('#cclose').onclick = closeCartel;
$('#askbtn').onclick = () => { $('#askbtn').hidden = true; $('#askform').hidden = false; };
$('#ask').onsubmit = e => { e.preventDefault(); $('#askform').hidden = true; $('#askok').hidden = false; };

// ---------- Visite guidée ----------
const ORDER = []; WALLS.forEach(W => W.ids.forEach(id => { if (id !== 'titre') ORDER.push(id - 1); }));
function tourStep() { if (!touring) return; const k = ORDER.indexOf(current); const next = ORDER[(k + 1) % ORDER.length];
  flyTo(next, 2200, () => { if (touring) tourTimer = setTimeout(tourStep, 4200); }); }
function startTour() { touring = true; $('#cartel').hidden = true; $('#tour .ico').textContent = '❚❚'; $('#tour [data-k]').textContent = T[lang].pause;
  if (current < 0) { flyTo(ORDER[0], 2400, () => { if (touring) tourTimer = setTimeout(tourStep, 4200); }); } else tourStep(); }
function stopTour() { touring = false; clearTimeout(tourTimer); $('#tour .ico').textContent = '▶'; $('#tour [data-k]').textContent = T[lang].tour; }
$('#tour').onclick = () => touring ? stopTour() : startTour();
function step(s) { stopTour(); $('#cartel').hidden = true; const k = current < 0 ? (s > 0 ? -1 : 0) : ORDER.indexOf(current); flyTo(ORDER[(k + s + ORDER.length) % ORDER.length]); }
$('#next').onclick = () => step(1); $('#prev').onclick = () => step(-1);
let hintT; function hint() { const h = $('#hint'); h.textContent = touch ? T[lang].hintTouch : T[lang].hintDesk; h.hidden = false; clearTimeout(hintT); hintT = setTimeout(() => h.hidden = true, 6500); }
$('#help').onclick = hint;

// ---------- Commandes ----------
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
let down = null; const ptrs = new Map();
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; canvas.classList.add('drag'); });
canvas.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) { hover(e); return; }
  const [lx, ly] = ptrs.get(e.pointerId); const dx = e.clientX - lx, dy = e.clientY - ly; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (down) down.moved += Math.abs(dx) + Math.abs(dy);
  if (down && down.moved > 6) { if (touring) stopTour(); anim = null; const k = touch ? .005 : .0035; yaw += dx * k; pitch = Math.max(-.6, Math.min(.5, pitch + dy * k)); }
});
canvas.addEventListener('pointerup', e => { ptrs.delete(e.pointerId); canvas.classList.remove('drag');
  if (down && down.moved <= 6) click(e); down = null; });
canvas.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); down = null; });
function pick(e, objs) { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObjects(objs, false)[0]; }
function hover(e) { if (touch) return; const h = pick(e, pickables); canvas.classList.toggle('hover', !!h); }
function click(e) {
  const h = pick(e, [...pickables, floor]);
  if (!h) return;
  if (h.object === floor) { stopTour(); $('#cartel').hidden = true; const p = h.point.clone(); p.y = EYE; clampPos(p);
    anim = { t0: performance.now(), dur: 1100, p0: pos.clone(), p1: p, y0: yaw, y1: yaw, a0: pitch, a1: pitch }; return; }
  const i = h.object.userData.idx; flyTo(i, 1400); openCartel(i);
}
canvas.addEventListener('wheel', e => { e.preventDefault(); stopTour(); anim = null; const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)); pos.addScaledVector(f, -e.deltaY * .004); clampPos(pos); }, { passive: false });
const keys = {}; addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Escape') closeCartel();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) { keys[e.code] = true; e.preventDefault(); if (touring) stopTour(); anim = null; } });
addEventListener('keyup', e => { keys[e.code] = false; });

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < .8 ? 72 : 62; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (anim) { const t = Math.min(1, (now - anim.t0) / anim.dur), k = ease(t); pos.lerpVectors(anim.p0, anim.p1, k); yaw = anim.y0 + (anim.y1 - anim.y0) * k; pitch = anim.a0 + (anim.a1 - anim.a0) * k;
    if (t >= 1) { const d = anim.done; anim = null; d && d(); } }
  const f = (keys.ArrowUp || keys.KeyW ? 1 : 0) - (keys.ArrowDown || keys.KeyS ? 1 : 0); const s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0); const r = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
  if (f || s || r) { yaw += r * 1.6 * dt; const fw = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), rt = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    pos.addScaledVector(fw, f * 2.2 * dt).addScaledVector(rt, s * 2.2 * dt); clampPos(pos); }
  applyCam(); renderer.render(scene, camera); requestAnimationFrame(loop);
}

function enter(withTour) { $('#intro').classList.add('out'); setTimeout(() => $('#intro').hidden = true, 800); canvas.focus(); if (withTour) startTour(); else hint(); }
$('#enter').onclick = () => enter(false); $('#enter-tour').onclick = () => enter(true);

window.__salle = { ready: false, enter, flyTo: (i, d) => flyTo(i, d || 1), openCartel, closeCartel, startTour, stopTour, setView: (x, z, y, p) => { anim = null; pos.set(x, EYE, z); yaw = y; pitch = p; } };

setLang(lang);
Promise.all([document.fonts.load('italic 400 40px "Cormorant Garamond"'), document.fonts.load('italic 500 40px "Cormorant Garamond"'), document.fonts.load('600 20px Inter'), document.fonts.load('400 20px Inter')])
  .catch(() => {}).then(() => { build(); requestAnimationFrame(loop); });
