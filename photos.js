// Gambar pertandingan untuk laporan & video ringkasan.
// Senarai disimpan dalam t.photos = [{ id, cap, c }] (c = 1 jika ada salinan awan).
// Fail gambar: IndexedDB telefon penganjur (sentiasa) + koleksi awan carromPhotos/{tid}_{id} (jika pertandingan di awan & dibenarkan).
import * as cloud from './cloud.js';

export const MAX_PHOTOS = 12;
const DBN = 'carrom-photos', ST = 'p', LIMIT = 850000;
let _db = null;
function idb() {
  return _db || (_db = new Promise((ok, no) => {
    const r = indexedDB.open(DBN, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  }));
}
async function tx(mode, fn) {
  const db = await idb();
  return new Promise((ok, no) => { const s = db.transaction(ST, mode).objectStore(ST), r = fn(s); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
}
const key = (tid, id) => `${tid}_${id}`;
const mem = new Map();

// Kecilkan gambar ke JPEG (≤ ~850 KB teks) supaya muat satu dokumen awan
export async function shrink(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    for (const [max, q] of [[1600, 0.78], [1400, 0.72], [1200, 0.66], [1000, 0.6], [800, 0.55]]) {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.naturalWidth * k), height: Math.round(img.naturalHeight * k) });
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      const d = c.toDataURL('image/jpeg', q);
      if (d.length < LIMIT) return d;
    }
    throw new Error('besar');
  } finally { URL.revokeObjectURL(url); }
}

// Tambah gambar. Pulangkan { added, cloudFail } — cloudFail = bilangan yang hanya tersimpan di telefon ini.
export async function addPhotos(t, files, useCloud) {
  t.photos = t.photos || [];
  let added = 0, cloudFail = 0;
  for (const f of files) {
    if (t.photos.length >= MAX_PHOTOS) break;
    if (!f.type.startsWith('image/')) continue;
    const data = await shrink(f), id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await tx('readwrite', s => s.put(data, key(t.id, id)));
    mem.set(key(t.id, id), data);
    let c = 0;
    if (useCloud) { try { await cloud.savePhoto(t.id, id, data); c = 1; } catch { cloudFail++; } }
    t.photos.push({ id, cap: '', c });
    added++;
  }
  return { added, cloudFail };
}

// Muat naik semula ke awan gambar yang hanya ada di telefon ini
export async function syncPhotos(t) {
  let n = 0;
  for (const p of t.photos || []) {
    if (p.c) continue;
    const d = await tx('readonly', s => s.get(key(t.id, p.id))).catch(() => null);
    if (!d) continue;
    await cloud.savePhoto(t.id, p.id, d); p.c = 1; n++;
  }
  return n;
}

export async function getPhoto(t, id) {
  const k = key(t.id, id);
  if (mem.has(k)) return mem.get(k);
  let d = await tx('readonly', s => s.get(k)).catch(() => null);
  if (!d) {
    const p = (t.photos || []).find(x => x.id === id);
    if (p && p.c) { d = await cloud.loadPhoto(t.id, id).catch(() => null); if (d) tx('readwrite', s => s.put(d, k)).catch(() => {}); }
  }
  if (d) mem.set(k, d);
  return d;
}

export async function removePhoto(t, id) {
  const p = (t.photos || []).find(x => x.id === id);
  t.photos = (t.photos || []).filter(x => x.id !== id);
  mem.delete(key(t.id, id));
  await tx('readwrite', s => s.delete(key(t.id, id))).catch(() => {});
  if (p && p.c) await cloud.deletePhoto(t.id, id).catch(() => {});
}

// Imej sedia untuk kanvas video
export async function photoImages(t) {
  const out = [];
  for (const p of t.photos || []) {
    const d = await getPhoto(t, p.id).catch(() => null); if (!d) continue;
    const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = d; });
    if (im) out.push({ im, cap: p.cap || '' });
  }
  return out;
}
