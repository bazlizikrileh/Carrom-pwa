# Penyelarasan Portal Carrom ↔ Portal Pingpong

Kedua-dua app berasal daripada kod yang sama (Pingpong-pwa v3.32.0). Bahagian **teras** masih sama dan pembaikan di satu app
mungkin perlu disalin ke app satu lagi. Setiap kali chat carrom atau chat pingpong membaiki bahagian teras, tulis nota ringkas
(apa, fail, fungsi, commit) dan hantar kepada chat satu lagi.

## Bahagian teras (dikongsi — semak bila berubah)
| Bahagian | Fail / fungsi |
|---|---|
| Undian kumpulan, BYE, bracket cermin & undian KO | `engine.js`: `drawGroups`, `mainSlots`, `poolSlots`, `drawBracket`, `byeReceivers`, `buildBracket` |
| Kedudukan, pemecah seri, ranking akhir | `engine.js`: `groupStandings`, `finalRanking`, `groupFixed` |
| Jadual sesi & papan/meja | `engine.js`: `planSchedule`, `sessionTime`; `live.js` |
| Firebase, peranan, PIN, pendaftaran | `cloud.js`, `firebase-config.js` |
| Notifikasi | `push.js`, Worker `pingpong-push` (diurus chat pingpong sahaja) |
| Muzik, undian beranimasi, video | `sound.js`, `draw-anim.js`, `draw-video.js`, `recap-video.js` |
| Laporan, Mod TV, bracket | `app.js`: `bracketHtml`, `rankingHtml`, `viewTV` |

## Sudah diselaraskan (20 Nov 2026)
- Bracket cermin berselang-seli (A, C, E… atas; B, D, F… bawah) — carrom `37f6f68`, pingpong v3.34.0
- Carta bracket bergaris penyambung, tempat ketiga (bersama), nota ranking ringkas — pingpong v3.35.0, carrom C1.5.0
- `finalRanking` pulangkan `[]` sebelum pertandingan tamat (elak semua peserta jadi "Johan") — carrom C1.5.4 · **pingpong: perlu disemak**

## Khusus carrom (jangan salin ke pingpong)
- Keputusan sahaja (pemenang setiap game `[1,0]/[0,1]`), tiada skor langsung
- Warna buah diundi `m.wf`, `colourOf`, siapa pukul dahulu, kad keputusan bercetak
- Handicap jenis "buah dikeluarkan dahulu" (`hcType`)
- 10 templat poster foto carrom (`carrom-poster.js`, `img/`), banner foto
- Rekod pemain (`#/rekod`)
- Trio/kuartet lalai S+S+D

## Ujian sebelum push
Uji dalam simulasi telefon (390px, `is_mobile`) — pastikan `scrollWidth` setiap halaman = lebar skrin; uji cetak laporan (kumpulan + KO + pool).
