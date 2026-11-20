# Carrom Portal (PWA)

Portal pertandingan carrom. Alamat: `https://bazlizikrileh.github.io/carrom-pwa/`
Dibina daripada Portal Pingpong (repo `Pingpong-pwa`) dan disesuaikan untuk carrom.

## Ciri carrom
- Acara: single, double pasangan pilihan, double pasangan diundi (trio/kuartet boleh dibuka kemudian; kodnya masih ada).
- **Keputusan sahaja**: rekod siapa menang setiap game, tiada skor mata. Format: 1 game atau terbaik 3 game (penganjur pilih).
- **Warna buah diundi** untuk setiap perlawanan (⚪ Putih/Coklat lwn ⚫ Hitam), dipapar dalam jadual, kad papan dan halaman keputusan; bertukar setiap game. Data: `m.wf` = pihak Putih dalam game 1; game = `[1,0]` (A menang) / `[0,1]`.
- Tiada skor langsung (jaga skor dimatikan; pautan lama dibawa ke halaman keputusan).
- Menang 3 mata, kalah 0. Pemecah seri: mata → beza perlawanan → beza game → bersemuka.
- Papan: auto 1 papan / 4 peserta (maks. 40); kumpulan 3–6 orang, sehingga 24 kumpulan.
- Poster pendaftaran 6 reka bentuk (`carrom-poster.js`) dan kad keputusan berasaskan foto papan carrom yang dijana (`img/*.webp`, skrip penjana di luar repo). Poster juara dan video ringkasan juga bertema carrom.

## Data
- Firebase sama dengan Portal Pingpong (projek `pingpong-portal`). Pertandingan carrom ditanda `sport: 'carrom'`; Portal Pingpong mengabaikannya.
- Simpanan peranti: `carrom-pwa:v1`, `carrom:*`. Topik notifikasi kelab: `club:carrom-<kelab>`.

## Kemas kini
Setiap kali fail app berubah, naikkan `VERSION` dalam `sw.js`.
