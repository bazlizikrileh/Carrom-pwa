// Poster pendaftaran carrom (PNG 1080×1350): 6 reka bentuk bersih berasaskan foto papan carrom yang dijana (img/*.webp).
import qrcode from './vendor/qrcode.js';

const W = 1080, H = 1350;
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const COND = '"Bahnschrift", "Roboto Condensed", "Arial Narrow", ' + SANS;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const imgCache = {};
const loadImg = src => imgCache[src] || (imgCache[src] = new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));

export const STYLES = {
  malam: 'Malam kejohanan', atas: 'Papan dari atas', dekat: 'Buah dekat', kelab: 'Warna kelab', tarikh: 'Tarikh besar', klasik: 'Klasik krim',
};
export const STYLE_KEYS = Object.keys(STYLES);

// ---------- alat ----------
const F = (c, size, w = 800, fam = SANS) => { c.font = `${w} ${size}px ${fam}`; };
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
function cover(c, im, x, y, w, h, fx = .5, fy = .5) {
  if (!im) return;
  const s = Math.max(w / im.width, h / im.height), sw = w / s, sh = h / s;
  c.drawImage(im, (im.width - sw) * fx, (im.height - sh) * fy, sw, sh, x, y, w, h);
}
function wrap(c, text, maxW, maxLines = 3) {
  const words = String(text || '').split(/\s+/).filter(Boolean), lines = [];
  let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); keep[maxLines - 1] += '…'; return keep; }
  return lines;
}
// tajuk: cari saiz terbesar yang muat dalam kotak
function fitTitle(c, text, maxW, maxH, maxLines = 3, start = 150, w = 900, fam = COND, lh = .95) {
  for (let s = start; s >= 40; s -= 4) {
    F(c, s, w, fam); const ls = wrap(c, text, maxW, 9);
    if (ls.length <= maxLines && ls.length * s * lh <= maxH && ls.every(l => c.measureText(l).width <= maxW)) return { s, ls };
  }
  F(c, 40, w, fam); return { s: 40, ls: wrap(c, text, maxW, maxLines) };
}
function drawQR(c, text, x, y, size, dark = '#120c08') {
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  const n = q.getModuleCount(), cell = size / (n + 2);
  c.fillStyle = '#fff'; c.fillRect(x, y, size, size); c.fillStyle = dark;
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) c.fillRect(Math.floor(x + (k + 1) * cell), Math.floor(y + (r + 1) * cell), Math.ceil(cell), Math.ceil(cell));
}
function shade(hex, k) {   // k<0 gelapkan, k>0 cerahkan
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return hex;
  const v = [0, 2, 4].map(i => parseInt(m[1].substr(i, 2), 16)).map(x => Math.round(k < 0 ? x * (1 + k) : x + (255 - x) * k));
  return '#' + v.map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
}
const lum = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 128; const [r, g, b] = [0, 2, 4].map(i => parseInt(m[1].substr(i, 2), 16)); return r * .299 + g * .587 + b * .114; };
async function logos(c, d, x, y, h, align = 'left') {
  const ims = (await Promise.all((d.logos || []).map(loadImg))).filter(Boolean);
  const tot = ims.reduce((a, im) => a + h * im.width / im.height + 14, -14);
  let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x;
  ims.forEach(im => { const w = h * im.width / im.height; c.drawImage(im, cx, y, w, h); cx += w + 14; });
  return ims.length ? tot : 0;
}
const ctaText = d => d.status || 'DAFTAR SEKARANG';
// butiran: senarai [label, nilai]
const facts = d => [['TARIKH', d.when], ['MASA', d.time], ['TEMPAT', d.venue], ['YURAN', d.fee]].filter(x => x[1]);
const fmtLine = d => [d.format, d.hc].filter(Boolean).join(' · ');

function factsGrid(c, d, x, y, w, col, lab, cols = 2, val = 34) {
  const fs = facts(d), cw = w / cols; let maxY = y;
  fs.forEach(([k, v], i) => {
    const cx = x + (i % cols) * cw, cy = y + Math.floor(i / cols) * (val * 2.6);
    F(c, 20, 800, COND); c.fillStyle = lab; c.fillText(k, cx, cy);
    F(c, val, 800); c.fillStyle = col; const ls = wrap(c, v, cw - 24, 2);
    ls.forEach((l, j) => c.fillText(l, cx, cy + val * 1.15 + j * val * 1.1));
    maxY = Math.max(maxY, cy + val * 1.15 + (ls.length - 1) * val * 1.1);
  });
  return maxY;
}
function prizes(c, d, x, y, w, col, acc, size = 26, max = 3) {
  const ps = (d.prizes || []).slice(0, max); if (!ps.length) return y;
  ps.forEach((p, i) => {
    const yy = y + i * size * 1.45;
    c.fillStyle = acc; c.beginPath(); c.arc(x + size * .45, yy - size * .33, size * .45, 0, 7); c.fill();
    F(c, size * .55, 900); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(String(i + 1), x + size * .45, yy - size * .14); c.textAlign = 'left';
    F(c, size, 700); c.fillStyle = col; c.fillText(wrap(c, p, w - size * 1.4, 1)[0], x + size * 1.3, yy);
  });
  return y + ps.length * size * 1.45;
}
function qrCard(c, d, x, y, s, { bg = '#fff', fg = '#120c08', label = 'Imbas untuk daftar' } = {}) {
  c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 30; c.shadowOffsetY = 10;
  c.fillStyle = bg; rr(c, x, y, s, s + 52, 22); c.fill(); c.restore();
  drawQR(c, d.url || 'https://bazlizikrileh.github.io/', x + 14, y + 14, s - 28, fg);
  F(c, 19, 800, COND); c.fillStyle = fg; c.textAlign = 'center'; c.fillText(label.toUpperCase(), x + s / 2, y + s + 30); c.textAlign = 'left';
}
function pill(c, x, y, text, bg, fg, size = 24) {
  F(c, size, 800, COND); const w = c.measureText(text).width + size * 1.4;
  c.fillStyle = bg; rr(c, x, y, w, size * 1.8, size * .9); c.fill();
  c.fillStyle = fg; c.fillText(text, x + size * .7, y + size * 1.23); return w;
}
function grad(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; }

// ---------- reka bentuk ----------
const D = {
  // 1 · Malam kejohanan: papan sudut di bawah, tajuk besar di atas ruang gelap
  async malam(c, d, T) {
    const im = await loadImg('img/board-angle.webp');
    c.fillStyle = '#120c08'; c.fillRect(0, 0, W, H);
    cover(c, im, 0, 200, W, H - 200, .5, 1);
    c.fillStyle = grad(c, 0, 0, 0, 760, [[0, '#120c08'], [.75, 'rgba(18,12,8,.85)'], [1, 'rgba(18,12,8,0)']]); c.fillRect(0, 0, W, 760);
    c.fillStyle = grad(c, 0, H - 380, 0, H, [[0, 'rgba(10,6,4,0)'], [1, 'rgba(10,6,4,.92)']]); c.fillRect(0, H - 380, W, 380);
    await logos(c, d, 70, 64, 84);
    F(c, 22, 700); c.fillStyle = 'rgba(255,240,220,.75)'; wrap(c, (d.club || '').toUpperCase(), 600, 2).forEach((l, i) => c.fillText(l, d.logos && d.logos.length ? 70 + 100 * d.logos.length : 70, 98 + i * 28));
    pill(c, 70, 190, '● PERTANDINGAN CARROM', T.acc, '#fff', 22);
    const t = fitTitle(c, d.title.toUpperCase(), W - 140, 330, 3, 140);
    F(c, t.s, 900, COND); t.ls.forEach((l, i) => { c.fillStyle = i === t.ls.length - 1 ? T.accLight : '#fff8ee'; c.fillText(l, 66, 270 + t.s * .9 + i * t.s * .95); });
    let y = 270 + t.ls.length * t.s * .95 + 46;
    F(c, 26, 700, COND); c.fillStyle = 'rgba(255,240,220,.8)'; c.fillText(fmtLine(d).toUpperCase(), 70, y);
    // jalur butiran di bawah
    const by = H - 300;
    factsGrid(c, d, 70, by, 640, '#fff8ee', T.accLight, 2, 32);
    qrCard(c, d, W - 70 - 230, H - 70 - 282, 230, { label: ctaText(d) });
  },
  // 2 · Papan dari atas: papan berputar sedikit, kad maklumat krim di bawah
  async atas(c, d, T) {
    const im = await loadImg('img/board-top.webp');
    c.fillStyle = '#1a110b'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(W / 2, 430); c.rotate(-.12); cover(c, im, -560, -560, 1120, 1120); c.restore();
    c.fillStyle = grad(c, 0, 0, 0, 260, [[0, 'rgba(18,12,8,.85)'], [1, 'rgba(18,12,8,0)']]); c.fillRect(0, 0, W, 260);
    await logos(c, d, W / 2, 46, 80, 'center');
    // kad
    const cy = 680;
    c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 40; c.fillStyle = '#fbf3e4'; rr(c, 50, cy, W - 100, H - cy - 50, 34); c.fill(); c.restore();
    c.fillStyle = T.acc; rr(c, 50, cy, W - 100, 14, [34, 34, 0, 0]); c.fill();
    F(c, 22, 800, COND); c.fillStyle = T.accDark; c.fillText((d.clubShort || d.club || 'PERTANDINGAN CARROM').toUpperCase(), 100, cy + 70);
    const t = fitTitle(c, d.title.toUpperCase(), W - 200, 220, 2, 104);
    F(c, t.s, 900, COND); c.fillStyle = '#1d120a'; t.ls.forEach((l, i) => c.fillText(l, 96, cy + 92 + t.s * .9 + i * t.s * .95));
    let y = cy + 110 + t.ls.length * t.s * .95 + 20;
    F(c, 24, 700, COND); c.fillStyle = 'rgba(29,18,10,.65)'; c.fillText(fmtLine(d).toUpperCase(), 100, y); y += 56;
    const qs = 220, gy = factsGrid(c, d, 100, y, W - 200 - qs - 40, '#1d120a', T.accDark, 2, 30);
    prizes(c, d, 100, gy + 60, W - 200 - qs - 40, '#1d120a', T.acc, 24, 2);
    qrCard(c, d, W - 100 - qs, H - 100 - qs - 52, qs, { bg: '#fff', label: ctaText(d) });
  },
  // 3 · Buah dekat: foto buah penuh, tirai gelap pepenjuru, tajuk gergasi
  async dekat(c, d, T) {
    const im = await loadImg('img/coins-close.webp');
    cover(c, im, 0, 0, W, H, .6, .5);
    c.fillStyle = grad(c, 0, 0, W, H, [[0, 'rgba(14,9,6,.96)'], [.45, 'rgba(14,9,6,.78)'], [.75, 'rgba(14,9,6,.15)'], [1, 'rgba(14,9,6,0)']]); c.fillRect(0, 0, W, H);
    c.fillStyle = grad(c, 0, H - 420, 0, H, [[0, 'rgba(14,9,6,0)'], [1, 'rgba(14,9,6,.9)']]); c.fillRect(0, H - 420, W, 420);
    await logos(c, d, 70, 70, 84);
    c.fillStyle = T.acc; c.fillRect(70, 200, 90, 10);
    const t = fitTitle(c, d.title.toUpperCase(), 720, 480, 4, 150);
    F(c, t.s, 900, COND); t.ls.forEach((l, i) => { c.fillStyle = i % 2 ? T.accLight : '#fff8ee'; c.fillText(l, 66, 250 + t.s * .88 + i * t.s * .93); });
    let y = 250 + t.ls.length * t.s * .93 + 40;
    F(c, 25, 700, COND); c.fillStyle = 'rgba(255,240,220,.8)'; wrap(c, fmtLine(d).toUpperCase(), 640, 2).forEach(l => { c.fillText(l, 70, y); y += 34; });
    y += 30; y = factsGrid(c, d, 70, y, 620, '#fff8ee', T.accLight, 2, 32);
    prizes(c, d, 70, Math.min(y + 70, H - 200), 600, '#fff8ee', T.acc, 25, 2);
    qrCard(c, d, W - 70 - 230, H - 70 - 282, 230, { label: ctaText(d) });
  },
  // 4 · Warna kelab: blok warna kelab, papan dari atas terkeluar di kanan
  async kelab(c, d, T) {
    const im = await loadImg('img/board-top.webp');
    c.fillStyle = grad(c, 0, 0, W, H, [[0, T.c1], [1, shade(T.c1, -.45)]]); c.fillRect(0, 0, W, H);
    c.save(); c.translate(W + 40, 520); c.rotate(.2); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 60; cover(c, im, -470, -470, 940, 940); c.restore();
    c.fillStyle = grad(c, 0, 0, W * .75, 0, [[0, shade(T.c1, -.15)], [.55, shade(T.c1, -.15) + 'ee'], [1, shade(T.c1, -.15) + '00']]); c.fillRect(0, 0, W, H);
    await logos(c, d, 70, 64, 96);
    F(c, 24, 800, COND); c.fillStyle = 'rgba(255,255,255,.8)'; wrap(c, (d.club || '').toUpperCase(), 560, 2).forEach((l, i) => c.fillText(l, 70, 210 + i * 30));
    const t = fitTitle(c, d.title.toUpperCase(), 640, 420, 4, 130);
    F(c, t.s, 900, COND); t.ls.forEach((l, i) => { c.fillStyle = i === t.ls.length - 1 ? T.c2 : '#fff'; c.fillText(l, 66, 300 + t.s * .9 + i * t.s * .95); });
    let y = 300 + t.ls.length * t.s * .95 + 40;
    pill(c, 70, y - 10, fmtLine(d).toUpperCase(), 'rgba(255,255,255,.16)', '#fff', fmtLine(d).length > 44 ? 18 : 22); y += 80;
    // kad putih butiran
    const ky = Math.max(y, H - 430);
    c.fillStyle = '#ffffff'; rr(c, 50, ky, W - 100, H - ky - 50, 30); c.fill();
    const gy = factsGrid(c, d, 96, ky + 60, W - 460, '#14110d', shade(T.c1, -.2), 2, 30);
    prizes(c, d, 96, gy + 58, W - 460, '#14110d', T.c2Strong, 23, 2);
    qrCard(c, d, W - 96 - 230, ky + 40, 230, { bg: '#f4f1ec', label: ctaText(d) });
  },
  // 5 · Tarikh besar: angka tarikh gergasi, foto buah dalam bulatan
  async tarikh(c, d, T) {
    const im = await loadImg('img/coins-close.webp');
    c.fillStyle = '#f6efe3'; c.fillRect(0, 0, W, H);
    c.save(); c.beginPath(); c.arc(W - 130, 290, 300, 0, 7); c.clip(); cover(c, im, W - 430, -10, 600, 600, .55, .5); c.restore();
    c.strokeStyle = T.acc; c.lineWidth = 12; c.beginPath(); c.arc(W - 130, 290, 312, Math.PI * .5, Math.PI * 1.3); c.stroke();
    await logos(c, d, 70, 60, 84);
    const dp = d.dateParts;
    if (dp) {
      F(c, 330, 900, COND); c.fillStyle = '#1d120a'; c.fillText(dp.day, 56, 470);
      const dw = c.measureText(dp.day).width;
      F(c, 70, 900, COND); c.fillStyle = T.acc; c.fillText(dp.mon, 76 + dw, 330);
      F(c, 40, 800, COND); c.fillStyle = '#1d120a'; c.fillText(dp.year, 80 + dw, 384);
      F(c, 30, 700); c.fillStyle = 'rgba(29,18,10,.7)'; c.fillText(`${dp.wd}${d.time ? ' · ' + d.time : ''}`, 80 + dw, 432);
    }
    const t = fitTitle(c, d.title.toUpperCase(), W - 140, 280, 3, 104);
    F(c, t.s, 900, COND); c.fillStyle = '#1d120a'; t.ls.forEach((l, i) => c.fillText(l, 66, 610 + t.s * .9 + i * t.s * .95));
    let y = 610 + t.ls.length * t.s * .95 + 34;
    F(c, 24, 800, COND); c.fillStyle = T.accDark; c.fillText(fmtLine(d).toUpperCase(), 70, y); y += 30;
    c.fillStyle = '#1d120a'; c.fillRect(70, y, W - 140, 4); y += 64;
    const rest = { ...d, when: '', time: '' };
    const gy = factsGrid(c, rest, 70, y, W - 460, '#1d120a', T.accDark, 1, 34);
    prizes(c, d, 70, gy + 66, W - 460, '#1d120a', T.acc, 26, 3);
    qrCard(c, d, W - 70 - 250, H - 70 - 302, 250, { bg: '#1d120a', fg: '#1d120a', label: ctaText(d) });
    F(c, 19, 800, COND); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(ctaText(d).toUpperCase(), W - 70 - 125, H - 70 - 20); c.textAlign = 'left';
  },
  // 6 · Klasik krim: bingkai kayu seperti papan carrom, poket di penjuru
  async klasik(c, d, T) {
    const im = await loadImg('img/board-top.webp');
    // bingkai kayu: ambil tekstur dari tepi foto papan
    cover(c, im, 0, 0, W, H, .5, .5);
    c.fillStyle = 'rgba(40,20,8,.55)'; c.fillRect(0, 0, W, H);
    const f = 56; c.fillStyle = '#f7ebd4'; c.fillRect(f, f, W - 2 * f, H - 2 * f);
    c.fillStyle = '#16100c'; [[f + 44, f + 44], [W - f - 44, f + 44], [f + 44, H - f - 44], [W - f - 44, H - f - 44]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 34, 0, 7); c.fill(); });
    const CY = 600, CR = 200;
    c.strokeStyle = '#8a4a1c'; c.lineWidth = 3; c.beginPath(); c.arc(W / 2, CY, CR + 24, 0, 7); c.stroke(); c.beginPath(); c.arc(W / 2, CY, CR + 12, 0, 7); c.stroke();
    c.save(); c.beginPath(); c.arc(W / 2, CY, CR, 0, 7); c.clip(); c.drawImage(im, im.width * .36, im.height * .36, im.width * .28, im.height * .28, W / 2 - CR, CY - CR, CR * 2, CR * 2); c.restore();
    await logos(c, d, W / 2, f + 36, 72, 'center');
    F(c, 20, 800, COND); c.fillStyle = '#8a4a1c'; c.textAlign = 'center'; wrap(c, (d.club || '').toUpperCase(), W - 300, 1).forEach(l => c.fillText(l, W / 2, f + 140));
    const t = fitTitle(c, d.title.toUpperCase(), W - 240, 170, 2, 84);
    F(c, t.s, 900, COND); c.fillStyle = '#1d120a'; t.ls.forEach((l, k) => c.fillText(l, W / 2, f + 160 + t.s * .9 + k * t.s * .95));
    let y = CY + CR + 70;
    F(c, 24, 800, COND); c.fillStyle = '#8a4a1c'; c.fillText(fmtLine(d).toUpperCase(), W / 2, y);
    F(c, 38, 800); c.fillStyle = '#1d120a'; c.fillText([d.when, d.time].filter(Boolean).join(' · '), W / 2, y + 52);
    F(c, 28, 600); c.fillStyle = 'rgba(29,18,10,.75)'; c.fillText([d.venue, d.fee && 'Yuran ' + d.fee].filter(Boolean).join(' · '), W / 2, y + 96);
    if ((d.prizes || []).length) { F(c, 24, 700); c.fillStyle = '#1d120a'; c.fillText(wrap(c, '🏆 ' + d.prizes.slice(0, 2).join('  ·  '), W - 240, 1)[0], W / 2, y + 138); }
    c.textAlign = 'left';
    qrCard(c, d, W / 2 - 90, H - f - 30 - 232, 180, { bg: '#fff', label: ctaText(d) });
  },
};
export async function makeCarromPoster(d, style = 'malam') {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'); c.textBaseline = 'alphabetic';
  const c1 = css('--tb') || '#7a3e12', or = css('--or') || '#d62828';
  const T = { c1, c2: lum(or) > 140 ? or : shade(or, .35), c2Strong: or, acc: or, accLight: lum(or) > 150 ? or : shade(or, .45), accDark: lum(or) > 150 ? shade(or, -.45) : or };
  await (D[style] || D.malam)(c, d, T);
  return new Promise(res => cv.toBlob(b => res(b), 'image/png'));
}

// ---------- Kad keputusan perlawanan (1080×1350) ----------
// r: { title, club, logos, label, date, A:{name,sub,col}, B:{name,sub,col}, win:'a'|'b'|null, big:[a,b], bigLabel, games:[{side:'a'|'b', col:'w'|'k', name}], url }
export async function makeCarromResult(r) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const or = css('--or') || '#d62828', acc = lum(or) > 150 ? or : shade(or, .35);
  const im = await loadImg('img/board-angle.webp');
  c.fillStyle = '#120c08'; c.fillRect(0, 0, W, H);
  cover(c, im, 0, 300, W, H - 300, .5, 1);
  c.fillStyle = grad(c, 0, 0, 0, H, [[0, '#120c08'], [.35, 'rgba(18,12,8,.92)'], [.7, 'rgba(18,12,8,.55)'], [1, 'rgba(18,12,8,.9)']]); c.fillRect(0, 0, W, H);
  await logos(c, r, 70, 60, 76);
  F(c, 22, 800, COND); c.fillStyle = acc; c.fillText(('KEPUTUSAN · ' + (r.label || '')).toUpperCase(), 70, 196);
  const t = fitTitle(c, r.title.toUpperCase(), W - 140, 150, 2, 76);
  F(c, t.s, 900, COND); c.fillStyle = '#fff8ee'; t.ls.forEach((l, i) => c.fillText(l, 66, 220 + t.s * .9 + i * t.s * .95));
  let y = 240 + t.ls.length * t.s * .95 + 40;
  // dua kad pemain
  const card = (k, P, win) => {
    const x = 70, yy = y + k * 250, w = W - 140, h = 220;
    c.save(); c.fillStyle = win ? 'rgba(255,248,238,.96)' : 'rgba(255,248,238,.12)'; rr(c, x, yy, w, h, 28); c.fill(); c.restore();
    if (win) { c.fillStyle = acc; rr(c, x, yy, 16, h, [28, 0, 0, 28]); c.fill(); }
    // buah warna
    const cx = x + 90, cy = yy + h / 2, R = 52;
    const g = c.createRadialGradient(cx - 16, cy - 18, 6, cx, cy, R);
    if (P.col === 'w') { g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#d9c39a'); } else { g.addColorStop(0, '#5a5a62'); g.addColorStop(1, '#141416'); }
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    c.strokeStyle = P.col === 'w' ? 'rgba(140,100,50,.6)' : 'rgba(255,255,255,.25)'; c.lineWidth = 3; [.68, .4].forEach(q => { c.beginPath(); c.arc(cx, cy, R * q, 0, 7); c.stroke(); });
    const fg = win ? '#1d120a' : '#fff8ee';
    F(c, 20, 800, COND); c.fillStyle = win ? shade(acc, -.2) : 'rgba(255,240,220,.7)'; c.fillText(win ? '🏆 MENANG' : (P.col === 'w' ? 'PUTIH / COKLAT' : 'HITAM'), x + 170, yy + 62);
    F(c, 50, 900, COND); c.fillStyle = fg; wrap(c, P.name, w - 360, 2).forEach((l, i) => c.fillText(l, x + 170, yy + 120 + i * 52));
    if (P.sub) { F(c, 22, 600); c.fillStyle = win ? 'rgba(29,18,10,.6)' : 'rgba(255,240,220,.6)'; c.fillText(wrap(c, P.sub, w - 360, 1)[0], x + 170, yy + 190); }
    F(c, 110, 900, COND); c.fillStyle = win ? acc : 'rgba(255,248,238,.55)'; c.textAlign = 'right'; c.fillText(String(r.big[k]), x + w - 40, yy + 152); c.textAlign = 'left';
  };
  card(0, r.A, r.win === 'a'); card(1, r.B, r.win === 'b');
  y += 520;
  F(c, 20, 800, COND); c.fillStyle = 'rgba(255,240,220,.7)'; c.fillText((r.bigLabel || '').toUpperCase(), 70, y);
  y += 24;
  let x = 70;
  (r.games || []).forEach((gm, k) => {
    const txt = `G${k + 1} · ${gm.col === 'w' ? 'Putih' : 'Hitam'} · ${gm.name}`; F(c, 24, 800); const w0 = Math.min(W - 140, c.measureText(txt).width + 70);
    if (x + w0 > W - 70) { x = 70; y += 62; }
    c.fillStyle = 'rgba(255,248,238,.14)'; rr(c, x, y, w0, 50, 25); c.fill();
    c.fillStyle = gm.col === 'w' ? '#f4ead2' : '#141416'; c.beginPath(); c.arc(x + 26, y + 25, 12, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff8ee'; c.fillText(wrap(c, txt, w0 - 60, 1)[0], x + 48, y + 34); x += w0 + 12;
  });
  F(c, 20, 600); c.fillStyle = 'rgba(255,240,220,.6)'; c.fillText(r.date || '', 70, H - 60); c.textAlign = 'right'; c.fillText('Carrom Portal', W - 70, H - 60); c.textAlign = 'left';
  return new Promise(res => cv.toBlob(b => res(b), 'image/png'));
}
